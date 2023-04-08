import { GrammarRules, ParseError, ParseResult } from '../../types'
import { Chart } from '../chart/chart'
import { Lexer, Token } from '../lexer'
import { State, StateSet } from '../chart'
import { createAST, createParseTree } from './helpers'
import { Grammar } from '../grammar'

export class Parser {
  private chart: Chart
  private grammar: Grammar

  private cache: Map<string, ParseResult>
  private transitiveItems: Map<string, State>

  private index: number

  constructor() {
    this.cache = new Map()
    this.chart = new Chart()
    this.index = 0
    this.transitiveItems = new Map()
    this.grammar = new Grammar(new Lexer())
  }

  private get productions() {
    return this.grammar.productions
  }

  private predict(state: State, from: number) {
    const rule = state.nextNonTerminal

    if (rule) {
      const { action, rhs, lhs } = rule

      rhs.forEach(right =>
        this.chart.addStateToStateSet(
          {
            lhs,
            left: [],
            right,
            dot: 0,
            from,
            action,
          },
          from
        )
      )
    }
  }

  private scan(token: Token | null | void, state: State, index: number) {
    const [rhs] = state.right

    if (token && rhs === token.name) {
      const { lhs, left, dot, from, action } = state

      const newState = this.chart.addStateToStateSet(
        {
          lhs,
          left: [...left, rhs],
          dot: dot + 1,
          right: state.right.slice(1),
          from,
          action,
          previous: [state],
        },
        index + 1
      )

      if (newState) state.token = token
    }
  }

  private complete(state: State, index: number) {
    const { chart, productions } = this

    const transitiveItem = this.transitiveItems.get(state.getTransitiveKey())

    const fromStates = chart.get(state.from) as StateSet

    if (transitiveItem) {
      const newState = chart.addStateToStateSet(
        {
          lhs: transitiveItem.lhs,
          left: transitiveItem.left,
          right: transitiveItem.right,
          dot: transitiveItem.dot,
          from: transitiveItem.from,
          action: transitiveItem.action,
          previous: transitiveItem.previous,
        },
        index
      )

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

        const newState = chart.addStateToStateSet(
          {
            lhs,
            left: [...left, right[0]],
            right: right.slice(1) || [],
            dot: dot + 1,
            from,
            action,
            previous,
          },
          index
        )

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
        const newState = chart.addStateToStateSet(
          {
            lhs,
            left: [...fromLeft, firstRhs],
            right: fromRight.slice(1) || [],
            dot: dot + 1,
            from,
            action,
            previous,
          },
          index
        )

        if (newState) newState.addPrevious(state)
      }
    }
  }

  private resumeParse(): State[] | void {
    const { productions, chart } = this
    const { startRule } = chart

    if (!startRule) return

    const lexer = this.lexer

    let prevToken = null
    let token = null

    let index = this.index

    while (chart.get(index)) {
      prevToken = token || prevToken

      token = lexer.readToken()

      const states = chart.get(index)

      if (!states) break

      for (const state of states) {
        if (state.complete) {
          this.complete(state, index)
        } else if (state.expectTerminal(productions)) {
          this.scan(token, state, index)
        } else if (state.expectNonTerminal(productions)) {
          this.predict(state, index)
        } else {
          throw Error('Illegal rule')
        }
      }

      this.index = index++
    }

    if (token)
      return this.onError({
        prevToken,
        token,
        chart,
        productions,
      })

    const finishedState = chart.getFinishedState()

    if (finishedState.length) return finishedState

    return this.onError({
      token: null,
      prevToken,
      chart,
      productions,
    })
  }

  get lexer() {
    return this.grammar.lexer
  }

  parse(source: string, cb: (result: ParseResult) => void) {
    const cachedParse = this.cache.get(source)

    if (cachedParse) return cb(cachedParse)

    const start = performance.now()

    this.lexer.setSource(source)

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

      return cb({ chart, AST, parseTree, time })
    }
  }

  onError(error: ParseError) {
    const { prevToken } = error

    if (prevToken)
      throw SyntaxError(
        `Parsing Error token: ${prevToken.value} (line: ${prevToken.line}, col: ${prevToken.col}) of input stream`
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
          action: startProductionRule.action,
        })
      })

      chart.setSeed(stateSet)
    }

    return this
  }

  reset() {
    this.index = 0

    this.chart.empty()
    this.lexer.reset()
  }

  clearCache() {
    this.cache = new Map()
  }
}
