import {
  GrammarRules,
  ParseError,
  ParserCache,
  ParseResult,
  TransitiveItems,
} from '../../types'
import { Chart } from '../chart/chart'
import { Lexer, Token } from '../lexer'
import { State, StateSet } from '../chart'
import { createAST, createParseTree } from './helpers'
import { Grammar } from '../grammar'

export class Parser {
  private cache: ParserCache

  private chart: Chart

  private grammar: Grammar

  private transitiveItems: TransitiveItems

  private token: Token | null

  private previousToken: Token | null

  /* The current column in the chart */
  index: number

  constructor() {
    this.cache = new Map()

    this.chart = new Chart()

    this.transitiveItems = new Map()

    this.grammar = new Grammar(new Lexer())

    this.index = 0

    this.token = null

    this.previousToken = null
  }

  get lexer() {
    return this.grammar.lexer
  }

  private get productions() {
    return this.grammar.productions
  }

  private predict(state: State) {
    const rule = state.nextNonTerminal

    if (rule) {
      const { action, rhs, lhs } = rule

      const { index } = state

      rhs.forEach(right =>
        this.chart.addStateToStateSet({
          lhs,
          left: [],
          right,
          dot: 0,
          from: index,
          action,
          index,
        })
      )
    }
  }

  private scan(state: State) {
    const [rhs] = state.right

    if (this.token?.name === rhs) {
      const { lhs, left, dot, from, action, index } = state

      const newState = this.chart.addStateToStateSet({
        lhs,
        left: [...left, rhs],
        dot: dot + 1,
        right: state.right.slice(1),
        from,
        action,
        previous: [state],
        index: index + 1,
      })

      if (newState) state.token = this.token
    }
  }

  private complete(state: State) {
    const { chart, productions } = this

    const { index } = state

    const transitiveItem = this.transitiveItems.get(state.getTransitiveKey())

    const fromStates = chart.get(state.from) as StateSet

    if (transitiveItem) {
      const newState = chart.addStateToStateSet({
        lhs: transitiveItem.lhs,
        left: transitiveItem.left,
        right: transitiveItem.right,
        dot: transitiveItem.dot,
        from: transitiveItem.from,
        action: transitiveItem.action,
        previous: transitiveItem.previous,
        index,
      })

      if (newState) newState.addPrevious(state)
      else transitiveItem.previous = state.previous

      return
    }

    if (state.hasRightRecursion(productions)) {
      const foundFromStates = []

      for (const fromState of fromStates) {
        const { right, left, lhs } = fromState

        if (
          lhs === state.lhs &&
          left.join(' ') === state.left.slice(0, -1).join(' ') &&
          right[0] === state.lhs
        )
          foundFromStates.push(fromState)

        if (foundFromStates.length > 1) break
      }

      /* There should be just one state */

      if (foundFromStates.length === 1) {
        const { right, left, dot, lhs, from, action, previous } = foundFromStates[0]

        const newState = chart.addStateToStateSet({
          lhs,
          left: [...left, right[0]],
          right: right.slice(1) || [],
          dot: dot + 1,
          from,
          action,
          previous,
          index,
        })

        if (newState) {
          newState.addPrevious(state)

          this.transitiveItems.set(newState.getTransitiveKey(), newState)
        }

        return
      }
    }

    for (const fromState of fromStates) {
      const {
        right: fromRight,
        left: fromLeft,
        dot,
        lhs,
        from,
        action,
        previous,
      } = fromState

      const [firstRhs] = fromRight

      if (state.isLhsEqual(firstRhs)) {
        const newState = chart.addStateToStateSet({
          lhs,
          left: [...fromLeft, firstRhs],
          right: fromRight.slice(1) || [],
          dot: dot + 1,
          from,
          action,
          previous,
          index,
        })

        if (newState) newState.addPrevious(state)
      }
    }
  }

  private resumeParse(): State[] | void {
    const { productions, chart } = this

    const { startRule } = chart

    if (!startRule) throw Error('No start rule defined')

    const { lexer } = this

    let { index } = this

    let stateSet: StateSet | undefined

    while ((stateSet = chart.get(index))) {
      this.previousToken = this.token || this.previousToken

      this.token = lexer.readToken() ?? null

      for (const state of stateSet) {
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

      this.index = index++
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

    const finishedState = chart.getFinishedState()

    /* If we have finished states return them else we throw an error since the input is not recognized by our grammar. */
    if (finishedState.length) return finishedState

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

    if (cachedParse) return callback(cachedParse)

    const start = performance.now()

    this.lexer.source = source

    const state = this.resumeParse()

    if (state && state.length) {
      const { chart } = this

      const parseTree = state.map(state => createParseTree(state))

      const AST = parseTree.flatMap(parseTree => createAST(parseTree))

      this.index = 0

      const end = performance.now()

      const time = end - start

      this.cache.set(this.lexer.source, {
        AST,
        parseTree,
        chart,
        time,
      })

      return callback({ chart, AST, parseTree, time })
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
    this.lexer.ignore(ignoreRules)

    return this
  }

  setGrammar(grammarRules: GrammarRules) {
    const { chart, grammar } = this

    grammar.setGrammar(grammarRules)

    const { startProductionRule } = grammar

    if (startProductionRule) {
      chart.setStartRule(startProductionRule)

      const stateSet = new StateSet()

      startProductionRule.rhs.forEach(right => {
        stateSet.add({
          lhs: startProductionRule.lhs,
          left: [],
          right,
          dot: 0,
          from: 0,
          index: 0,
          action: startProductionRule.action,
        })
      })

      chart.setSeed(stateSet)
    }

    return this
  }

  reset() {
    this.index = 0

    this.token = null

    this.previousToken = null

    this.chart.empty()

    this.lexer.reset()
  }

  clearCache() {
    this.cache = new Map()
  }
}
