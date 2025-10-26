import {
  GrammarRules,
  ParseError,
  ParserCache,
  ParseResult,
  ProductionRule,
  Productions,
  StateInterface,
  StateSetInterface,
  Token,
  TransitiveItems,
} from '../../types'
import { Chart } from '../chart/chart'
import { Lexer } from '../lexer'
import { StateSet } from '../chart'
import { Grammar } from '../grammar'
import { createParseTree } from './helpers'

function getTransitiveKey(state: StateInterface) {
  return `${state.rule}-${state.dot}`
}

function isStateInDeterministicReductionPath(
  { lhs, rule }: StateInterface,
  { lhs: fromLhs, nextSymbol, rule: fromRule }: StateInterface
) {
  return fromLhs === lhs && nextSymbol === lhs && fromRule === rule
}

function getTopmostStateInDeterministicReductionPath(
  state: StateInterface,
  fromStates: StateSetInterface
) {
  const foundFromStates = []

  for (const fromState of fromStates) {
    if (isStateInDeterministicReductionPath(state, fromState)) {
      if (foundFromStates.length === 1) break
      else foundFromStates.push(fromState)
    }
  }

  /* There should be just one state */

  if (foundFromStates.length === 1) return foundFromStates[0]

  return null
}

function isRightRecursive({ rhs, dot, lhs, nextSymbol, isComplete }: StateInterface) {
  /* Is complete */
  if (isComplete && dot > 0) return rhs[dot - 1] === lhs

  /* Is last symbol */
  if (rhs.length - dot === 1) return nextSymbol === lhs

  return false
}

function getFinishedStates({ rhss, rules }: ProductionRule, { lastColumn }: Chart) {
  if (!lastColumn) return []

  return rhss.flatMap((rhs, index) => {
    const key = rules[index] + '-' + rhs.length + '-0'
    const state = lastColumn.get(key)

    return state?.isComplete ? state : []
  })
}

function doesSymbolAcceptToken(
  state: StateInterface,
  { name, value }: Token,
  productions: Productions
) {
  const symbols = productions.get(state.lhs)?.symbols

  if (!symbols) return false

  const { nextSymbol } = state
  const accepts = symbols[nextSymbol!]?.accepts

  if (!accepts) return false

  if (accepts[name] && name === value) return true

  return false
}

function complete(state: StateInterface, chart: Chart, transitiveItems: TransitiveItems) {
  const startStates = chart.columns[state.start] as StateSetInterface

  /*
    If we encounter right recursion we first check if we
    have a transitive state.

    If we don't find one, we try to find the topmost item
    in the deterministic reduction path if it exists and
    store it as a transitive item.
  */

  if (isRightRecursive(state)) {
    const transitiveState = transitiveItems.get(getTransitiveKey(state))

    if (transitiveState) {
      const { lhs, rhs, dot, start, action, previous } = transitiveState

      const { end, rule } = state

      const newState = chart.add({
        lhs,
        rhs,
        dot,
        start,
        action,
        previous: previous.concat(state),
        end,
        rule,
      })

      if (!newState) transitiveState.previous = state.previous

      return
    }

    const topmostState = getTopmostStateInDeterministicReductionPath(state, startStates)

    if (topmostState) {
      const newState = chart.advanceState(topmostState, state)

      newState && transitiveItems.set(getTransitiveKey(newState), newState)

      return
    }
  }

  /*
    Search in the from column for states where the first symbol
    after the dot matches the left hand side of the completed state.
  */

  const { lhs } = state

  for (const startState of startStates) {
    const { nextSymbol } = startState

    lhs === nextSymbol && chart.advanceState(startState, state)
  }
}

function predict(
  { end, nextSymbol }: StateInterface,
  stateSet: StateSetInterface,
  productions: Productions
) {
  const { action, rhss, lhs, rules } = productions.get(nextSymbol!) as ProductionRule

  rhss.forEach((rhs, i) =>
    stateSet.add({
      lhs,
      rhs,
      dot: 0,
      start: end,
      previous: [],
      action,
      end,
      rule: rules[i],
    })
  )
}

function scan(
  state: StateInterface,
  token: Token | undefined | null,
  chart: Chart,
  productions: Productions
) {
  const { nextSymbol } = state

  if (
    token?.name === nextSymbol ||
    token?.value === nextSymbol ||
    //`"${token?.value}"` === nextSymbol
    (token && doesSymbolAcceptToken(state, token, productions))
  )
    return chart.scanState(state, token)
}

export class Parser<T> {
  private cache: ParserCache<T>
  private chart: Chart
  private grammar: Grammar
  private transitiveItems: TransitiveItems
  private productions: Productions

  lexer: Lexer
  currentColumn: number
  startRule?: ProductionRule
  debug: boolean

  constructor() {
    this.cache = new Map()
    this.transitiveItems = new Map()
    this.grammar = new Grammar(new Lexer())
    this.chart = new Chart(this.grammar.productions)
    this.currentColumn = 0
    this.lexer = this.grammar.lexer
    this.productions = this.grammar.productions
    this.debug = false
  }

  parse(source: string, callback: (result: ParseResult<T>) => any) {
    const { cache, lexer } = this
    const cachedResult = cache.get(source)

    /* If we have cached the result, return the cached parse result */
    if (cachedResult) return callback(cachedResult)

    lexer.source = source

    const states = this.resumeParse()

    if (states) {
      const parseTree = states.map(state => createParseTree(state))

      /* Store the parse result in the cache */
      cache.set(lexer.source, parseTree)

      return callback(parseTree)
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
      this.startRule = startProductionRule

      const stateSet = new (StateSet as any)()

      const { lhs, action, rules } = startProductionRule

      startProductionRule.rhss.forEach((rhs, i) => {
        stateSet.add({
          lhs,
          rhs,
          dot: 0,
          start: 0,
          end: 0,
          action,
          previous: [],
          rule: rules[i],
        })
      })

      chart.setSeed(stateSet)
    }

    return this
  }

  reset() {
    this.transitiveItems = new Map()
    this.chart.empty()
    this.currentColumn = 0
    this.lexer.reset()
  }

  clearCache() {
    this.cache = new Map()
  }

  private resumeParse(): StateInterface[] | void {
    const { productions, chart, lexer, transitiveItems, startRule } = this
    const { columns } = chart

    let stateSet: StateSetInterface | undefined
    let state: StateInterface | undefined
    let token: Token | null | undefined
    let previousToken: Token | null | undefined

    while ((stateSet = columns[this.currentColumn++])) {
      const { states } = stateSet

      previousToken = token

      token = lexer.next()

      let currentRow = 0

      while ((state = states[currentRow++])) {
        if (state.isComplete) complete(state, chart, transitiveItems)
        else if (productions.has(state.nextSymbol!)) predict(state, stateSet, productions)
        else scan(state, token, chart, productions)
      }
    }

    const finishedStates = !token ? getFinishedStates(startRule!, chart) : []

    /*
      If there are finished states return them
      else an error is thrown because the input is not recognized by our grammar.
    */
    if (finishedStates.length) return finishedStates

    if (
      this.onError({
        previousToken,
        token,
        chart,
        productions,
      })
    ) {
      return this.resumeParse()
    }
  }
}
