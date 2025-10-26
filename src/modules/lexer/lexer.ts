import {
  LexerState,
  LexerStates,
  LexerToken,
  StateToken,
  StateTokens,
  Token,
} from '../../types'
import { escapedCharactersInStringLiteral, States, TokenTypes } from './constants'

export class Lexer {
  source: string

  index: number
  col: number
  line: number

  private state: LexerState
  private states: LexerStates
  private parentStates: LexerState[]

  constructor() {
    this.source = ''
    this.index = 0
    this.col = 0
    this.line = 1
    this.states = this.getInitialStates()
    this.state = this.states.get(States.initial) as LexerState
    this.parentStates = []
  }

  get currentState() {
    return this.state.name
  }

  advanceLines(numberOfLines: number) {
    this.line += numberOfLines
    this.col = 0
  }

  reset() {
    this.index = 0
    this.col = 0
    this.line = 1

    this.states = this.getInitialStates()
    this.state = this.states.get(States.initial) as LexerState

    this.parentStates = []
  }

  onError(errorHandler: (lexer: Lexer) => any) {
    const { state } = this

    if (!state) return

    state.onError = errorHandler
  }

  hasToken(name: string) {
    const states = this.states.values()

    for (const state of states) if (state.tokens.has(name)) return true

    return false
  }

  setState(name: string, onInit: (lexer: Lexer) => any) {
    const { states, state } = this

    const newState: LexerState = {
      name,
      tokens: new Map(),
      tokensArray: [],
      ignoredTokens: new Map(),
      onError: undefined,
      start: this.index,
      end: null,
      onInit,
    }

    this.state = newState

    onInit(this)

    states.set(name, newState)

    this.state = state
  }

  removeToken(name: string) {
    this.state?.tokens.delete(name)
  }

  setTokens(tokens: LexerToken[] = []): void {
    const { state } = this

    if (!state) return

    state.tokens = new Map()

    return this.addTokens(tokens)
  }

  addTokens(tokens: LexerToken[] = []): void {
    const { state } = this

    if (!state?.tokens) return this.setTokens(tokens)

    let tests: string[] = []

    tokens.forEach(token => {
      let stateToken: StateToken

      if (Array.isArray(token)) {
        const [name, match] = token

        const lookahead = !match ? '(?=\\b)' : ''

        stateToken = {
          name,
          test: this.createRegExpForToken(match ?? name.toLowerCase(), lookahead),
        }
      } else if (typeof token === 'string') {
        stateToken = {
          name: token,
          test: this.createRegExpForToken(token.toLowerCase(), '(?=\\b)'),
        }
      } else {
        token.test = this.createRegExpForToken(token.test)

        stateToken = token as StateToken
      }

      const source = stateToken.test.source.replace('^', '')

      tests.push(`(${source})`)

      state.tokens.set(stateToken.name, stateToken)

      state.tokensArray.push(stateToken)
    })

    const currentTest = state.test?.source ?? ''

    state.test = new RegExp(
      `${currentTest ? `${currentTest}|` : ''}${tests.join('|')}`,
      'gu'
    )
  }

  ignoreTokens(ignoreRules: (RegExp | string)[]) {
    const { state } = this

    if (!state) return

    const newTokens: StateTokens = new Map()

    const tests: string[] = []

    const tokenCount = state.ignoredTokens.size

    ignoreRules.forEach((test, i) => {
      const name = `${TokenTypes.Ignore}_${i + tokenCount}`

      const stateToken = {
        name,
        test: this.createRegExpForToken(test),
        ignore: true,
      }

      newTokens.set(name, stateToken)

      tests.push(`(${stateToken.test.source.replace('^', '')})`)
    })

    state.ignoredTokens = new Map(newTokens)

    state.tokens.forEach(token => newTokens.set(token.name, token))

    state.tokens = newTokens

    state.tokensArray = [...newTokens.values()]

    const currentTest = state.test?.source ?? ''

    state.test = new RegExp(
      `${tests.join('|')}${currentTest ? `|${currentTest}` : ''}`,
      'gu'
    )
  }

  skip(num: number) {
    this.index += num

    return this.next()
  }

  peakToken() {
    const curIndex = this.index
    const curLine = this.line
    const curCol = this.col
    const curState = this.state
    const parentStates = this.parentStates.slice()

    const token = this.next()

    this.index = curIndex
    this.line = curLine
    this.col = curCol
    this.state = curState
    this.parentStates = parentStates

    return token
  }

  next(): Token | null {
    const { source, state, index } = this
    const { test } = state

    if (!test || !source) return null

    const { col, line } = this

    let result

    test.lastIndex = index

    while ((result = test.exec(source))) {
      const [raw, ...rest] = result

      if (result.index !== index) break

      const { length } = raw

      this.col += length
      this.index += length

      const matchedIndex = result.index

      let groupIndex = 0

      const lengthGroups = rest.length

      while (groupIndex < lengthGroups) {
        if (rest[groupIndex] !== undefined) break

        groupIndex++
      }

      const stateToken = state.tokensArray[groupIndex]

      if (!stateToken) {
        this.throwError('Lexer: Token not found', this.line, this.col, this.index)
      }

      if (stateToken.lineBreaks) this.advanceLines(this.getNumberOfNewLines(raw))

      if (stateToken.ignore) return this.next()

      const { enterState } = stateToken

      if (enterState) {
        const result = typeof enterState === 'function' ? enterState(this) : enterState
        const newState = this.getState(result)

        if (!newState) throw Error(`Lexer: State not found: ${result}`)

        const { shouldConsume } = stateToken

        state.end = this.index

        this.state = newState

        if (shouldConsume === false) {
          this.index = index
          this.col = col
          this.line = line

          this.state.start = this.index

          return this.next()
        }

        this.state.start = this.index

        const { onEnter } = stateToken
        /* If onEnter is defined, the function can perform side effects. */
        if (
          typeof onEnter === 'function' &&
          !onEnter(this, source.substring(state.start, state.end))
        )
          return this.next()
      }

      /* When this function is set, the match is not tokenized when the function return false. */
      const { shouldTokenize } = stateToken

      if (
        (typeof shouldTokenize === 'function' && !shouldTokenize(this, raw)) ||
        shouldTokenize === false
      )
        return this.next()

      const { guard } = stateToken

      /* If there is a guard, the match is ignored and the lexical analysis fails if it returns false. */
      if (typeof guard === 'function' && !guard(raw)) break

      const { value, name } = stateToken
      const tokenValue = value ? value(raw) : raw

      this.index = matchedIndex + length

      const { replaceWith } = stateToken

      return {
        name: replaceWith
          ? typeof replaceWith === 'function'
            ? replaceWith(this)
            : replaceWith
          : name,
        value: tokenValue,
        raw,
        line: this.line,
        col: this.col,
        index: matchedIndex,
      }
    }

    if (source.length === this.index) return null

    /* If the state has an error handler, invoke that function else the input is rejected. */
    if (state.onError) return state.onError(this)
    else
      this.throwError(
        `Lexer: Invalid syntax ${source[this.index]} at`,
        this.line,
        this.col,
        this.index
      )
  }

  nextToken(): Token | null {
    const { source, index, state } = this
    const newSource = source.slice(index)

    if (!newSource) return null

    const { line, col } = this
    const stateTokens = state.tokens.values()

    for (const stateToken of stateTokens) {
      const [raw, currentStateToken] = this.matchToken(newSource, stateToken)

      if (raw) {
        const { length } = raw

        this.col += length
        this.index += length

        /* If line breaks is set to true, advance lines. */
        if (currentStateToken.lineBreaks) this.advanceLines(this.getNumberOfNewLines(raw))

        /* If this an ignored token, continue reading tokens. */
        if (currentStateToken.ignore) return this.nextToken()

        const { enterState } = currentStateToken

        /* If the token enters a state, enter the new state if it exists. */
        if (enterState) {
          const newState = this.getState(
            typeof enterState === 'function' ? enterState(this) : enterState
          )

          if (!newState) return this.nextToken()

          const { shouldConsume, onEnter } = currentStateToken

          state.end = index

          this.state = newState

          if (shouldConsume === false) {
            this.index = index
            this.col = col
            this.line = line

            this.state.start = this.index

            return this.nextToken()
          }

          this.state.start = this.index

          /* If onEnter is defined, the function can perform side effects. */

          if (
            typeof onEnter === 'function' &&
            !onEnter(this, source.substring(state.start, state.end))
          )
            return this.nextToken()
        }

        /* When this function is set, the match is not tokenized when the function return false. */

        const { shouldTokenize } = currentStateToken

        if (
          (typeof shouldTokenize === 'function' && !shouldTokenize(this, raw)) ||
          shouldTokenize === false
        )
          return this.nextToken()

        const { guard } = currentStateToken
        /* If there is a guard, the match is ignored and the lexical analysis fails if it returns false. */
        if (typeof guard === 'function' && !guard(raw)) break

        const { name, value } = currentStateToken
        const tokenValue = value ? value(raw) : raw
        const token = {
          name,
          value: tokenValue,
          raw,
          line,
          col,
          index,
        }

        return token
      }
    }

    /* If the state has an error handler, invoke that function else the input is rejected. */
    if (state.onError) return state.onError(this)
    else
      this.throwError(
        `Lexer: Invalid syntax ${newSource[0]} at`,
        this.line,
        this.col,
        this.index
      )
  }

  nextGeneratedToken(): Token | null {
    return this.tokenGenerator().next().value
  }

  *tokenGenerator() {
    const { source, state, index } = this
    const { test } = state

    if (!test || !source) return null

    const { col, line } = this

    let result

    test.lastIndex = index

    while ((result = test.exec(source))) {
      const [raw, ...rest] = result
      const { length } = raw

      this.col += length
      this.index += length

      const matchedIndex = result.index

      // const groups = Object.entries(result.groups!)

      let groupIndex = 0

      // let group: [string, string | undefined]

      const lengthGroups = rest.length

      // let name

      while (groupIndex < lengthGroups) {
        if (rest[groupIndex] !== undefined) break

        groupIndex++
      }

      // while ((group = groups[groupIndex++])) {
      //   if (group[1] !== undefined) {
      //     name = group[0]

      //     break
      //   }
      // }

      // if (!name) break

      // const stateToken = state.tokens.get(name) as StateToken

      const stateToken = state.tokensArray[groupIndex] as StateToken

      if (!stateToken) {
        this.throwError('Lexer: Token not found', this.line, this.col, this.index)
      }

      if (stateToken.lineBreaks) this.advanceLines(this.getNumberOfNewLines(raw))

      if (stateToken.ignore) return this.nextGeneratedToken()

      const { enterState } = stateToken

      if (enterState) {
        const newState = this.getState(
          typeof enterState === 'function' ? enterState(this) : enterState
        )

        if (!newState) return this.nextGeneratedToken()

        const { shouldConsume, onEnter } = stateToken

        state.end = this.index

        this.state = newState

        if (shouldConsume === false) {
          this.index = index
          this.col = col
          this.line = line

          this.state.start = this.index

          return this.nextGeneratedToken()
        }

        this.state.start = this.index

        /* If onEnter is defined, the function can perform side effects. */

        if (
          typeof onEnter === 'function' &&
          !onEnter(this, source.substring(state.start, state.end))
        )
          return this.nextGeneratedToken()
      }

      /* When this function is set, the match is not tokenized when the function return false. */

      const { shouldTokenize } = stateToken

      if (
        (typeof shouldTokenize === 'function' && !shouldTokenize(this, raw)) ||
        shouldTokenize === false
      )
        return this.nextGeneratedToken()

      const { guard } = stateToken

      /* If there is a guard, the match is ignored and the lexical analysis fails if it returns false. */
      if (typeof guard === 'function' && !guard(raw)) break

      const { value, name } = stateToken

      const tokenValue = value ? value(raw) : raw

      this.index = matchedIndex + length

      const token = {
        name,
        value: tokenValue,
        raw,
        line: this.line,
        col: this.col,
        index: matchedIndex,
      }

      yield token as Token
    }

    if (source.length === this.index) return null

    /* If the state has an error handler, invoke that function else the input is rejected. */
    if (state.onError) return state.onError(this)
    else
      this.throwError(
        `Lexer: Invalid syntax ${source[this.index]} at`,
        this.line,
        this.col,
        this.index
      )
  }

  [Symbol.iterator]() {
    return this.tokenGenerator()
  }

  private getInitialStates() {
    const { states } = this
    const newStates = new Map()

    if (states?.size) {
      states.forEach(state => {
        const newState = {
          ...state,
          start: 0,
          end: null,
        }

        if (newState.onInit) newState.onInit(this)

        newStates.set(state.name, newState)
      })
    } else {
      newStates.set(States.initial, {
        name: States.initial,
        tokens: new Map(),
        tokensArray: [],
        ignoredTokens: new Map(),
        error: undefined,
        start: 0,
        end: null,
      })
    }

    return newStates
  }

  private throwError(
    errorMessage: string,
    line: number,
    col: number,
    index: number
  ): never {
    const source = this.source.split('\n')[line - 1]
    const indicator = `${line}:${col}:${index}  `

    if (source) {
      errorMessage += `\n\n${indicator}${source}\n`

      let currentCol = col + indicator.length

      while (currentCol--) errorMessage += ' '

      errorMessage += '^'
    }

    throw new Error(errorMessage)
  }

  private escapeCharactersInStringLiteral(input: string) {
    return input.replace(escapedCharactersInStringLiteral, '\\$&')
  }

  private createRegExpForToken(input: string | RegExp, lookahead = '') {
    if (typeof input === 'string')
      return new RegExp(`^${this.escapeCharactersInStringLiteral(input)}${lookahead}`)

    return input
  }

  private matchToken(
    source: string,
    stateToken: StateToken
  ): [string | null, StateToken] {
    const { test } = stateToken

    const result = source.match(test)

    if (!result) return [result, stateToken]

    const [raw] = result

    const { longestOf } = stateToken

    if (longestOf) {
      const { state } = this

      const nextStateToken = state.tokens.get(longestOf)

      if (nextStateToken) {
        const nextMatch = this.matchToken(source, nextStateToken)

        const [rawNextMatch] = nextMatch

        if (rawNextMatch && rawNextMatch.length > raw.length) return nextMatch
      }
    }

    return [raw, stateToken]
  }

  private getState(stateName: string) {
    const { parentStates, state, states } = this

    if (stateName === 'PARENT') return parentStates.pop() || states.get('INITIAL')

    parentStates.push(state)

    return states.get(stateName)
  }

  private getNumberOfNewLines(source: string) {
    return (source.match(/\n/g) || []).length
  }
}
