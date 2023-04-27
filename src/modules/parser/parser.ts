import {
  GrammarRules,
  ParseError,
  ParserCache,
  ParseResult,
  Token,
  TransitiveItems,
} from '../../types'
import { Chart } from '../chart/chart'
import { Lexer } from '../lexer'
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

  currentColumn: number

  constructor() {
    this.cache = new Map()

    this.chart = new Chart()

    this.transitiveItems = new Map()

    this.grammar = new Grammar(new Lexer())

    this.currentColumn = 0

    this.token = null

    this.previousToken = null
  }

  get lexer() {
    return this.grammar.lexer
  }

  private get productions() {
    return this.grammar.productions
  }

  private isStateInDeterministicReductionPath(state: State, fromState: State) {
    return (
      fromState.lhs === state.lhs &&
      fromState.left.join(' ') === state.left.slice(0, -1).join(' ') &&
      fromState.right[0] === state.lhs
    )
  }

  private getTopmostItemInDeterministicReductionPath(state: State, fromStates: StateSet) {
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

  private getTransitiveItem(state: State) {
    return this.transitiveItems.get(state.getTransitiveKey())
  }

  private storeTransitiveItem(state: State) {
    return this.transitiveItems.set(state.getTransitiveKey(), state)
  }

  private predict(state: State) {
    const rule = state.nextNonTerminal

    if (rule) {
      const { action, rhs, lhs } = rule

      const { columnNumber } = state

      rhs.forEach(right =>
        this.chart.addStateToStateSet({
          lhs,
          left: [],
          right,
          dot: 0,
          from: columnNumber,
          action,
          columnNumber,
        })
      )
    }
  }

  private scan(state: State) {
    const [rhs] = state.right

    if (this.token?.name === rhs || this.token?.value === rhs)
      this.chart.moveStateToNextColumn(state, this.token)
  }

  private complete(state: State) {
    const { chart, productions } = this

    const fromStates = chart.get(state.from) as StateSet

    /*
      If encounter right recursion we first check if we
      have a transitive item.

      If we don't find one, we try to find the topmost item
      in the deterministic reduction path if it exists and
      store it as a transitive item.
    */

    if (state.hasRightRecursion(productions)) {
      const transitiveItem = this.getTransitiveItem(state)

      if (transitiveItem) {
        const newState = chart.addStateToStateSet({
          lhs: transitiveItem.lhs,
          left: transitiveItem.left,
          right: transitiveItem.right,
          dot: transitiveItem.dot,
          from: transitiveItem.from,
          action: transitiveItem.action,
          previous: transitiveItem.previous,
          columnNumber: state.columnNumber,
        })

        if (newState) newState.addPrevious(state)
        else transitiveItem.previous = state.previous

        return
      }

      const topmostItem = this.getTopmostItemInDeterministicReductionPath(
        state,
        fromStates
      )

      if (topmostItem) {
        const newState = chart.advanceState(topmostItem, state)

        if (newState) {
          newState.addPrevious(state)

          this.storeTransitiveItem(newState)
        }

        return
      }
    }

    /*
      Search in the from column for states where the first symbol
      after the dot matches the left hand side of the completed state.
    */

    for (const fromState of fromStates) {
      if (state.isLhsEqualToRhs(fromState)) {
        const newState = chart.advanceState(fromState, state)

        if (newState) newState.addPrevious(state)
      }
    }
  }

  private resumeParse(): State[] | void {
    const { productions, chart } = this

    const { startRule } = chart

    if (!startRule) throw Error('No start rule defined')

    const { lexer } = this

    let { currentColumn } = this

    let stateSet: StateSet | undefined

    while ((stateSet = chart.get(currentColumn))) {
      this.previousToken = this.token || this.previousToken

      let state: State | undefined

      this.token = lexer.readToken() ?? null

      let currentRow = 0

      while ((state = stateSet?.get(currentRow))) {
        if (state.complete) {
          this.complete(state)
        } else if (state.expectTerminal(productions)) {
          this.scan(state)
        } else if (state.expectNonTerminal(productions)) {
          this.predict(state)
        } else {
          throw Error('Illegal rule')
        }

        currentRow++
      }

      this.currentColumn = currentColumn++
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

    const start = performance.now()

    this.lexer.source = source

    const state = this.resumeParse()

    if (state && state.length) {
      const { chart } = this

      const parseTree = state.map(state => createParseTree(state))

      const AST = parseTree.flatMap(parseTree => createAST(parseTree))

      this.currentColumn = 0

      const end = performance.now()

      const time = end - start

      /* Store the parse result in the cache */
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

      const { lhs, action } = startProductionRule

      startProductionRule.rhs.forEach(right => {
        stateSet.add({
          lhs,
          left: [],
          right,
          dot: 0,
          from: 0,
          columnNumber: 0,
          action,
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
