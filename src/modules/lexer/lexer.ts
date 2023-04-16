import { LexerState, LexerToken } from '../../types'
import { DefaultToken, States, TokenTypes } from './constants'
import Token from './token'

export class Lexer {
  source: string

  index: number
  col: number
  line: number

  private state: LexerState
  private states: Map<string, LexerState>

  constructor() {
    this.source = ''

    this.index = 0
    this.col = 0
    this.line = 1

    this.states = this.getInitialStates()
    this.state = this.states.get(States.initial) as LexerState
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
        tokens: new Map([[DefaultToken.name, DefaultToken]]),
        ignoredTokens: new Map(),
        error: undefined,
        start: 0,
        end: null,
      })
    }

    return newStates
  }

  private throwError(msg: string, line: number, col: number) {
    throw new Error(`${msg} (line: ${line}, col: ${col})`)
  }

  skipLines(numberOfLines: number) {
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
      if (Array.isArray(token)) {
        const [name, reg] = token
        const test = reg || name.toLowerCase()

        this.state?.tokens.set(name, {
          name,
          reg: typeof test === 'string' ? new RegExp(`^${test}(?= )`) : test,
        })
      } else {
        if (typeof token.reg === 'string') token.reg = new RegExp(`^${token.reg}`)

        this.state?.tokens.set(token.name, token)
      }
    })
  }

  ignore(ignoreRules: RegExp[]) {
    if (!this.state) return

    const newTokens = new Map()

    ignoreRules.forEach(ignoreRule =>
      newTokens.set(`IGNORE_${ignoreRule}}`, {
        name: TokenTypes.Ignore,
        reg: ignoreRule,
      })
    )

    this.state.ignoredTokens = new Map(newTokens)

    this.state.tokens.forEach(token => newTokens.set(token.name, token))

    this.state.tokens = newTokens
  }

  skip(num: number) {
    this.index += num

    return this.readToken()
  }

  peak(tokenName?: string) {
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

  readToken(tokenName?: string): Token | null | void {
    const { state, states, source } = this

    if (!source || !state) return null

    const newSource = source.substring(this.index)

    if (newSource.length === 0) return null

    const stateTokens = tokenName ? this.getStateToken(tokenName) : state.tokens.values()

    for (const stateToken of stateTokens) {
      const { reg } = stateToken

      const result = newSource.match(reg)

      if (result) {
        const [match] = result

        const currentIndex = this.index
        const currentColomn = this.col
        const currentLine = this.line

        this.col += match.length
        this.index += match.length

        /* If this an ignored token, continue reading tokens. */
        if (stateToken.name === TokenTypes.Ignore) return this.readToken()

        /* When this function is set, the match is not tokenized when the function return false. */
        if (
          typeof stateToken.shouldTokenize === 'function' &&
          !stateToken.shouldTokenize(this, match)
        )
          return this.readToken()

        /* If there is a guard, the match is ignored if it returns false*/
        if (typeof stateToken.guard === 'function' && !stateToken.guard(match)) break

        /* If the token has a begin, enter the new state if it exists. */
        if (stateToken.begin) {
          const newState = states.get(stateToken.begin)

          if (!newState) return this.readToken()

          newState.start = this.index

          state.end = currentIndex

          this.state = newState

          /* If onEnter is defined, the function can perform side effects. */
          if (typeof stateToken.onEnter === 'function')
            stateToken.onEnter(this, source.substring(state.start, state.end))

          return this.readToken()
        }

        return new Token(
          stateToken.name,
          stateToken.value ? stateToken.value(match) : match,
          currentLine,
          currentColomn,
          currentIndex
        )
      }
    }

    /* If the state has an error handler, invoke that function else the input is rejected */
    if (state.onError) return state.onError(this)
    else if (!tokenName)
      this.throwError(`Lexer: Illegal character ${newSource[0]} `, this.line, this.col)
  }
}
