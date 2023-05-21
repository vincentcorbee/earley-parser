import {
  GrammarRules,
  ParseError,
  ParserCache,
  ParseResult,
  StateInterface,
  StateSetInterface,
  Token,
  TransitiveItems,
} from '../../types'
import { Chart } from '../chart/chart'
import { Lexer } from '../lexer'
import { StateSet } from '../chart'
import { Grammar } from '../grammar'
import { createParseTree2 } from './helpers/create-parse-tree-2'
// import { createAST, createParseTree } from './helpers'

let t = 0

export class Parser {
  private cache: ParserCache

  private chart: Chart

  private grammar: Grammar

  private transitiveItems: TransitiveItems

  private token: Token | null

  private previousToken: Token | null

  currentColumn: number

  constructor() {
    this.cache = new Map()

    this.transitiveItems = new Map()

    this.grammar = new Grammar(new Lexer())

    this.chart = new Chart(this.grammar.productions)

    this.currentColumn = 0

    this.token = null

    this.previousToken = null
  }

  get lexer() {
    return this.grammar.lexer
  }

  private readToken() {
    // const s = performance.now()
    this.previousToken = this.token

    this.token = this.lexer.readToken() ?? null

    // t += performance.now() - s
  }

  private get productions() {
    return this.grammar.productions
  }

  private isStateInDeterministicReductionPath(
    state: StateInterface,
    fromState: StateInterface
  ) {
    return (
      fromState.lhs === state.lhs &&
      fromState.nextSymbol === state.lhs &&
      // fromState.leftAsString(' ') === state.left.slice(0, -1).join(' ')
      fromState.rule === state.rule
    )
  }

  private getTopmostStateInDeterministicReductionPath(
    state: StateInterface,
    fromStates: StateSetInterface
  ) {
    const foundFromStates = []

    for (const fromState of fromStates) {
      if (this.isStateInDeterministicReductionPath(state, fromState)) {
        if (foundFromStates.length === 1) break
        else foundFromStates.push(fromState)
      }
    }

    /* There should be just one state */

    if (foundFromStates.length === 1) return foundFromStates[0]

    return null
  }

  private getTransitiveState(state: StateInterface) {
    return this.transitiveItems.get(state.getTransitiveKey())
  }

  private storeTransitiveItem(state: StateInterface) {
    return this.transitiveItems.set(state.getTransitiveKey(), state)
  }

  private doesSymbolAcceptToken(state: StateInterface) {
    // const { token } = this

    // if (!token) return false

    const symbols = this.productions.get(state.lhs)?.symbols

    if (!symbols) return false

    const { nextSymbol } = state

    const accepts = symbols[nextSymbol!]?.accepts

    if (accepts && accepts[this.token!.name]) return true

    return false
  }

  private predict(state: StateInterface) {
    const { nextProductionRule } = state

    if (nextProductionRule) {
      const { action, rhss, lhs, rules } = nextProductionRule

      const { end } = state

      rhss.forEach((rhs, i) =>
        this.chart.addStateToStateSet({
          lhs,
          rhs,
          dot: 0,
          start: end,
          action,
          end,
          rule: rules[i],
        })
      )
    }
  }

  private scan(state: StateInterface) {
    const rhs = state.nextSymbol

    const { token } = this

    if (
      token?.name === rhs ||
      token?.value === rhs
      // || this.doesSymbolAcceptToken(state)
    )
      this.chart.moveStateToNextColumn(state, token)
  }

  private complete(state: StateInterface) {
    const { chart, productions } = this

    const fromStates = chart.getStateSet(state.start) as StateSetInterface

    /*
      If encounter right recursion we first check if we
      have a transitive state.

      If we don't find one, we try to find the topmost item
      in the deterministic reduction path if it exists and
      store it as a transitive item.
    */

    if (state.hasRightRecursion(productions)) {
      const transitiveState = this.getTransitiveState(state)

      if (transitiveState) {
        const { lhs, rhs, dot, start, action, previous } = transitiveState

        const { end, rule } = state

        const newState = chart.addStateToStateSet({
          lhs,
          rhs,
          dot,
          start,
          action,
          previous,
          end,
          rule,
        })

        if (newState) newState.addPrevious(state)
        else transitiveState.previous = state.previous

        return
      }

      const topmostState = this.getTopmostStateInDeterministicReductionPath(
        state,
        fromStates
      )

      if (topmostState) {
        const newState = chart.advanceState(topmostState, state)

        if (newState) this.storeTransitiveItem(newState)

        return
      }
    }

    /*
      Search in the from column for states where the first symbol
      after the dot matches the left hand side of the completed state.
    */

    for (const fromState of fromStates) {
      if (state.isLhsEqualToRhs(fromState)) chart.advanceState(fromState, state)
    }
  }

  private resumeParse(): StateInterface[] | void {
    const { productions, chart } = this

    const { startRule } = chart

    if (!startRule) throw Error('No start rule defined')

    let stateSet: StateSetInterface | undefined

    let state: StateInterface | undefined

    while ((stateSet = chart.getStateSet(this.currentColumn++))) {
      this.readToken()

      let currentRow = 0

      while ((state = stateSet?.get(currentRow++))) {
        if (state.complete) {
          this.complete(state)
        } else if (state.expectTerminal(productions)) {
          this.scan(state)
        } else if (state.expectNonTerminal(productions)) {
          this.predict(state)
        } else {
          throw Error('Illegal rule')
        }
      }
    }

    if (this.token) {
      if (
        this.onError({
          previousToken: this.previousToken,
          token: this.token,
          chart,
          productions,
        })
      )
        return this.resumeParse()

      return
    }

    const finishedStates = chart.getFinishedStates()

    /*
      If there are finished states return them
      else an error is thrown because the input is not recognized by our grammar.
    */
    if (finishedStates.length) return finishedStates

    if (
      this.onError({
        previousToken: this.previousToken,
        token: this.token,
        chart,
        productions,
      })
    )
      return this.resumeParse()
  }

  parse(source: string, callback: (result: ParseResult) => void) {
    const cachedParse = this.cache.get(source)

    /* If we have cached the result, return the cached parse result */
    if (cachedParse) return callback(cachedParse)

    this.lexer.source = source

    const states = this.resumeParse()

    if (states) {
      const { chart } = this

      const parseTree = states.map(state => createParseTree2(state))

      // const parseTree2 = states.map(state => createParseTree(state))

      // const AST2 = parseTree2.flatMap(parseTree => createAST(parseTree))

      // console.dir(AST2, { depth: 3 })

      // const AST: any = parseTree

      // console.log({ token: t })

      const result = {
        // AST,
        parseTree,
        chart,
      }

      /* Store the parse result in the cache */
      this.cache.set(this.lexer.source, result)

      return callback(result)
    }
  }

  onError(error: ParseError): boolean | void {
    const { previousToken } = error

    if (previousToken)
      throw SyntaxError(
        `Parsing Error token: ${previousToken.value} (line: ${previousToken.line}, col: ${previousToken.col}) of input stream`
      )

    throw Error('Unknown parsing error')
  }

  ignore(ignoreRules: RegExp[]) {
    this.lexer.ignoreTokens(ignoreRules)

    return this
  }

  setGrammar(grammarRules: GrammarRules) {
    const { chart, grammar } = this

    grammar.setGrammar(grammarRules)

    const { startProductionRule } = grammar

    if (startProductionRule) {
      chart.setStartRule(startProductionRule)

      const stateSet = new (StateSet as any)()

      const { lhs, action, rules } = startProductionRule

      startProductionRule.rhss.forEach((right, i) => {
        stateSet.add({
          lhs,
          rhs: right,
          dot: 0,
          start: 0,
          end: 0,
          action,
          rule: rules[i],
        })
      })

      chart.setSeed(stateSet)
    }

    return this
  }

  reset() {
    this.currentColumn = 0

    this.token = null

    this.previousToken = null

    this.chart.empty()

    this.lexer.reset()
  }

  clearCache() {
    this.cache = new Map()
  }
}
