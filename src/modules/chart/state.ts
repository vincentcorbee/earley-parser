import { ProductionRule, Productions, SemanticAction, StateInput } from '../../types'
import Token from '../lexer/token'

export class State {
  lhs: string
  left: string[]
  right: string[]
  dot: number
  from: number
  previous: State[]
  token?: Token
  action?: SemanticAction

  nextNonTerminal: null | ProductionRule

  constructor({ lhs, left, right, dot, from, action, previous, token }: StateInput) {
    this.lhs = lhs
    this.left = left
    this.right = right
    this.dot = dot
    this.from = from
    this.previous = previous ? [...previous] : []
    this.action = action
    this.token = token

    this.nextNonTerminal = null
  }

  get complete() {
    return !this.right.length
  }

  leftAsString(seperator = '') {
    return this.left.join(seperator)
  }

  rightAsString(seperator = '') {
    return this.right.join(seperator)
  }

  isLhsEqual(lhs: string) {
    return this.lhs === lhs
  }

  getTransitiveKey() {
    return `${this.lhs}${this.rightAsString()}${this.leftAsString()}`
  }

  isNullable() {
    return this.left.length === 0 && this.right.length === 0
  }

  hasRightRecursion(productions: Productions) {
    if (this.right.length > 1) return false

    if (this.right.length === 1) {
      const [symbol] = this.right

      return symbol === this.lhs && productions.has(symbol)
    }

    if (this.right.length === 0 && this.left.length > 0) {
      const symbol = this.left[this.left.length - 1]

      return symbol === this.lhs && productions.has(symbol)
    }

    if (this.left.length === 0) return productions.has(this.lhs)

    return false
  }

  expectNonTerminal(productions: Productions) {
    const [rhs] = this.right

    if (!rhs) return null

    this.nextNonTerminal = productions.get(rhs) ?? null

    return this.nextNonTerminal
  }

  expectTerminal(productions: Productions) {
    if (!productions) return false

    const [rhs] = this.right

    if (!rhs) return false

    return !productions.has(rhs)
  }

  nextTerminal(productions: Productions) {
    if (!productions) return null

    if (this.expectTerminal(productions)) return this.right[0]

    return null
  }

  addPrevious(state: State | State[]) {
    if (Array.isArray(state)) {
      this.previous.concat(state)
    } else {
      this.previous.push(state)
    }
  }

  toString(asGrammarRule = false) {
    if (asGrammarRule)
      return `${this.lhs} -> ${this.leftAsString(' ')} • ${this.rightAsString(
        ' '
      ).trim()} from (${this.from})`
    return `${this.lhs}${this.rightAsString()}${this.leftAsString()}${this.from}`
  }
}
