import { LexerState, LexerToken, StateToken, Token } from '../../types'
import { escapedCharactersInStringLiteral, States, TokenTypes } from './constants'

let t = 0

export class Lexer {
  source: string

  index: number
  col: number
  line: number

  private state: LexerState
  private states: Map<string, LexerState>
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
        ignoredTokens: new Map(),
        error: undefined,
        start: 0,
        end: null,
      })
    }

    return newStates
  }

  private throwError(msg: string, line: number, col: number, index: number) {
    let errorMessage = `${msg} (line: ${line}, col: ${col}, index: ${index})`

    const source = this.source.split('\n')[line - 1]

    if (source) {
      errorMessage += `\n\n${source}\n`

      let currentCol = col

      while (currentCol) {
        errorMessage += ' '
        currentCol--
      }

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

  advanceLines(numberOfLines: number) {
    this.line += numberOfLines
    this.col = 0
  }

  reset() {
    this.states = this.getInitialStates()
    this.state = this.states.get(States.initial) as LexerState

    this.index = 0
    this.col = 0
    this.line = 1
  }

  onError(errorHandler: (lexer: Lexer) => any) {
    if (!this.state) return

    this.state.onError = errorHandler
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
    if (!this.state) return

    this.state.tokens = new Map()

    return this.addTokens(tokens)
  }

  addTokens(tokens: LexerToken[] = []): void {
    if (!this.state?.tokens) return this.setTokens(tokens)

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

      this.state?.tokens.set(stateToken.name, stateToken)
    })
  }

  ignoreTokens(ignoreRules: RegExp[]) {
    if (!this.state) return

    const newTokens = new Map()

    ignoreRules.forEach(ignoreRule =>
      newTokens.set(`IGNORE_${ignoreRule}}`, {
        name: TokenTypes.Ignore,
        test: ignoreRule,
      })
    )

    this.state.ignoredTokens = new Map(newTokens)

    this.state.tokens.forEach(token => newTokens.set(token.name, token))

    this.state.tokens = newTokens
  }

  skipToken(num: number) {
    this.index += num

    return this.readToken()
  }

  peakNextToken(tokenName?: string) {
    const curIndex = this.index
    const curLine = this.line
    const curCol = this.col
    const curState = this.state

    const token = this.readToken(tokenName)

    this.index = curIndex
    this.line = curLine
    this.col = curCol

    this.state = curState

    return token
  }

  private *getStateToken(tokenName: string) {
    const stateToken = this.state.tokens.get(tokenName)

    const ignoredTokens = this.state.ignoredTokens.values()

    const newLine = this.state.tokens.get(TokenTypes.Newline)

    if (stateToken) {
      if (newLine) yield newLine

      for (const ignoredToken of ignoredTokens) yield ignoredToken

      yield stateToken
    }

    return null
  }

  private matchToken(
    source: string,
    stateToken: StateToken
  ): [string | null, StateToken] {
    const { test, longestOf } = stateToken

    const result = source.match(test)

    if (!result) return [null, stateToken]

    const [match] = result

    if (longestOf) {
      const nextStateToken = this.state.tokens.get(longestOf)

      if (nextStateToken) {
        const nextMatch = this.matchToken(source, nextStateToken)

        if (nextMatch[0] && nextMatch[0].length > match.length) return nextMatch
      }
    }

    return [match, stateToken]
  }

  private getState(stateName: string) {
    if (stateName === 'PARENT') {
      const state = this.parentStates.pop()

      return state
    }

    this.parentStates.push(this.state)

    return this.states.get(stateName)
  }

  private getNumberOfNewLines(source: string) {
    return (source.match(/\n/g) || []).length
  }

  readToken(tokenName?: string): Token | null | void {
    const { state, source } = this

    if (!source || !state) return null

    const newSource = source.substring(this.index)

    if (newSource.length === 0) return null

    const stateTokens = tokenName ? this.getStateToken(tokenName) : state.tokens.values()

    for (const stateToken of stateTokens) {
      const [match, currentStateToken] = this.matchToken(newSource, stateToken)

      if (match) {
        const currentIndex = this.index
        const currentColomn = this.col
        const currentLine = this.line

        this.col += match.length
        this.index += match.length

        /* If line breaks is set to true, advance lines. */

        if (currentStateToken.lineBreaks)
          this.advanceLines(this.getNumberOfNewLines(match))

        /* If this an ignored token, continue reading tokens. */
        if (currentStateToken.name === TokenTypes.Ignore) return this.readToken()

        /* If the token enters a state, enter the new state if it exists. */
        if (currentStateToken.enterState) {
          const newState = this.getState(currentStateToken.enterState)

          if (!newState) return this.readToken()

          state.end = currentIndex

          this.state = newState

          if (currentStateToken.shouldConsume === false) {
            this.index = currentIndex
            this.col = currentColomn
            this.line = currentLine

            this.state.start = this.index

            return this.readToken()
          }

          this.state.start = this.index

          /* If onEnter is defined, the function can perform side effects. */
          if (
            typeof currentStateToken.onEnter === 'function' &&
            !currentStateToken.onEnter(this, source.substring(state.start, state.end))
          )
            return this.readToken()
        }

        /* When this function is set, the match is not tokenized when the function return false. */
        if (
          (typeof currentStateToken.shouldTokenize === 'function' &&
            !currentStateToken.shouldTokenize(this, match)) ||
          currentStateToken.shouldTokenize === false
        )
          return this.readToken()

        /* If there is a guard, the match is ignored and the lexical analysis fails if it returns false. */
        if (
          typeof currentStateToken.guard === 'function' &&
          !currentStateToken.guard(match)
        )
          break

        const s = performance.now()

        // const token = [
        //   currentStateToken.name,
        //   currentStateToken.value ? currentStateToken.value(match) : match,
        //   match,
        //   currentLine,
        //   currentColomn,
        //   currentIndex,
        // ]

        const token = {
          name: currentStateToken.name,
          value: currentStateToken.value ? currentStateToken.value(match) : match,
          raw: match,
          line: currentLine,
          col: currentColomn,
          index: currentIndex,
        }

        t += performance.now() - s

        console.log(t)

        return token

        // return {
        //   name: currentStateToken.name,
        //   value: currentStateToken.value ? currentStateToken.value(match) : match,
        //   raw: match,
        //   line: currentLine,
        //   col: currentColomn,
        //   index: currentIndex,
        // }
      }
    }

    /* If the state has an error handler, invoke that function else the input is rejected. */
    if (state.onError) return state.onError(this)
    else if (!tokenName)
      this.throwError(
        `Lexer: Illegal character ${newSource[0]} `,
        this.line,
        this.col,
        this.index
      )
  }
}
