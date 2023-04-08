import { LexerState, LexerToken } from '../../types'
import { DEFAULT_TOKEN } from './constants'
import Token from './token'

export class Lexer {
  source: string

  private index: number
  private col: number
  private line: number
  private state: LexerState
  private states: Map<string, LexerState>

  constructor() {
    this.source = ''
    this.index = 0
    this.col = 0
    this.line = 1
    this.states = this.getInitialStates()
    this.state = this.states.get('INITIAL') as LexerState
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

        if (newState.fn) newState.fn(this)

        newStates.set(state.name, newState)
      })
    } else {
      newStates.set('INITIAL', {
        name: 'INITIAL',
        tokens: new Map([[DEFAULT_TOKEN.name, DEFAULT_TOKEN]]),
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
    this.state = this.states.get('INITIAL') as LexerState
    this.index = 0
    this.col = 0
    this.line = 1
  }

  onError(fn: (lexer: Lexer) => any) {
    if (!this.state) return

    this.state.error = fn
  }

  hasToken(name: string) {
    const states = this.states.values()

    for (const state of states) {
      if (state.tokens.has(name)) return true
    }

    return false
  }

  setState(name: string, fn: (lexer: Lexer) => any) {
    const { states, state } = this

    const newState: LexerState = {
      name,
      tokens: new Map(),
      ignoredTokens: new Map(),
      error: undefined,
      start: this.index,
      end: null,
      fn,
    }

    this.state = newState

    fn(this)

    states.set(name, newState)

    this.state = state
  }

  setSource(source: string) {
    this.source = source
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
        name: 'IGNORE',
        reg: ignoreRule,
      })
    )

    this.state.tokens.forEach(token => newTokens.set(token.name, token))

    this.state.tokens = newTokens
  }

  skip(num: number) {
    this.index += num

    return this.readToken()
  }

  peak() {
    const curIndex = this.index
    const curLine = this.line
    const curCol = this.col
    const curState = this.state
    const token = this.readToken()

    this.index = curIndex
    this.line = curLine
    this.col = curCol

    this.state = curState

    return token
  }

  readToken(): Token | null | void {
    const { state, states, source } = this

    if (!source || !state) return null

    const str = source.substring(this.index)

    if (str.length === 0) return null

    const stateTokens = state.tokens.values()

    for (const stateToken of stateTokens) {
      const { reg } = stateToken
      const result = str.match(reg)

      if (result) {
        const [match] = result

        const curIndex = this.index
        const curCol = this.col
        const curLine = this.line

        this.col += match.length
        this.index += match.length

        if (stateToken.name === 'IGNORE') return this.readToken()

        if (stateToken.name === 'NEWLINE') {
          if (typeof stateToken.cb !== 'function') {
            this.line += 1
            this.col = 0

            return this.readToken()
          } else if (typeof stateToken.cb === 'function' && !stateToken.cb(this)) {
            return this.readToken()
          }
        }

        /* If the token has a begin, enter the new state if it exists. */

        if (stateToken.begin) {
          const newState = states.get(stateToken.begin)

          if (!newState) return this.readToken()

          newState.start = this.index

          state.end = curIndex

          this.state = newState

          if (typeof stateToken.cb === 'function')
            stateToken.cb(this, source.substring(state.start, state.end))

          return this.readToken()
        }

        return new Token(
          stateToken.name,
          stateToken.value ? stateToken.value(match) : match,
          curLine,
          curCol,
          curIndex
        )
      }
    }

    if (state.error) return state.error(this)
    else this.throwError(`Lexer: Illegal character ${str[0]} `, this.line, this.col)
  }
}
