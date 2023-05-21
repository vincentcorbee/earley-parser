import { Productions, StateInput, StateInterface } from '../../types'

export function State(this: StateInterface, stateInput: StateInput) {
  const { lhs, rhs, dot, start, action, previous, token, end, rule } = stateInput

  this.lhs = lhs
  this.rhs = rhs
  this.dot = dot
  this.start = start
  this.previous = previous ? previous.slice() : []
  this.action = action
  this.token = token
  this.end = end
  this.complete = dot === rhs.length
  this.nextSymbol = rhs[dot]
  this.rule = rule
}

State.prototype = {
  constructor: State,

  get left() {
    return this.rhs.slice(0, this.dot)
  },

  leftAsString(seperator = '') {
    let key = ''

    const { dot, rhs } = this

    // return rhs.slice(0, dot).join(seperator)

    for (let index = 0; index < dot; index++)
      key += rhs[index] + (index !== dot - 1 ? seperator : '')

    return key
  },

  rightAsString(seperator = '') {
    let key = ''

    const { rhs, dot } = this

    // return rhs.slice(dot).join(seperator)

    const { length } = rhs

    for (let index = dot; index < length; index++)
      key += rhs[index] + (index !== length - 1 ? seperator : '')

    return key
  },

  isLhsEqualToRhs(state: StateInterface) {
    return this.lhs === state.nextSymbol
  },

  getTransitiveKey() {
    return `${this.rule}-${this.dot}-${this.from}`
  },

  hasRightRecursion(productions: Productions) {
    const { rhs, dot, lhs, nextSymbol, complete } = this

    /* Is complete */
    if (complete && dot > 0) return rhs[dot - 1] === lhs

    /* Is last symbol */
    if (rhs.length - dot === 1) return nextSymbol === lhs

    // if (lengthRhs - dot > 1) return false

    // if (dot === 0) return productions.has(lhs)

    return false
  },

  expectNonTerminal(productions: Productions) {
    return (this.nextProductionRule = productions.get(this.nextSymbol))
  },

  expectTerminal(productions: Productions) {
    return !productions.has(this.nextSymbol)
  },

  addPrevious(state: StateInterface | StateInterface[]) {
    const { previous } = this

    if (Array.isArray(state)) {
      this.previous = previous.concat(state)
    } else {
      previous.push(state)
    }
  },

  toString() {
    const { lhs, start } = this

    return `${lhs} -> ${this.leftAsString(' ')} • ${this.rightAsString(
      ' '
    ).trim()} from (${start})`
  },
}
