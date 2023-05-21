import { ProductionRule, Productions, SemanticAction, Token } from '../../types'

export type State = {
  lhs: string
  rhs: string[]
  dot: number
  from: number
  previous: State[]
  token?: Token | null
  action?: SemanticAction
  columnNumber: number
  complete: boolean
  nextNonTerminal: null | ProductionRule
}

export type PartialState = {
  lhs: string
  rhs: string[]
  dot: number
  from: number
  previous?: State[]
  action?: SemanticAction
  token?: Token
  columnNumber: number
  complete?: boolean
  nextNonTerminal?: null | ProductionRule
}

export function isComplete(state: State) {
  return state.dot === state.rhs.length
}

export function leftAsString(state: State, seperator = '') {
  let key = ''

  const length = state.dot

  for (let index = 0; index < length; index++)
    key += state.rhs[index] + (index !== length - 1 ? seperator : '')

  return key
}

export function rightAsString(state: State, seperator = '') {
  let key = ''

  const length = state.rhs.length

  for (let index = state.dot; index < length; index++)
    key += state.rhs[index] + (index !== length - 1 ? seperator : '')

  return key
}

export function isLhsEqualToRhs(a: State, b: State) {
  return a.lhs === b.rhs[b.dot]
}

export function getTransitiveKey(state: State) {
  return `${state.lhs}${rightAsString(state)}${leftAsString(state)}`
}

export function hasRightRecursion(state: State, productions: Productions) {
  if (state.rhs.length - state.dot > 1) return false

  const { dot, rhs, lhs } = state

  if (dot < rhs.length - 1) {
    const symbol = rhs[dot]

    return symbol === lhs && productions.has(symbol)
  }

  if (dot === 0 && rhs.length > 0) {
    const symbol = rhs[rhs.length - 1]

    return symbol === lhs && productions.has(symbol)
  }

  if (dot === 0) return productions.has(lhs)

  return false
}

export function expectNonTerminal(state: State, productions: Productions) {
  const symbol = state.rhs[state.dot]

  if (!symbol) return null

  state.nextNonTerminal = productions.get(symbol) ?? null

  return state.nextNonTerminal
}

export function expectTerminal(state: State, productions: Productions) {
  if (!productions) return false

  const symbol = state.rhs[state.dot]

  if (!symbol) return false

  return !productions.has(symbol)
}

export function addPrevious(state: State, previous: State | State[]) {
  if (Array.isArray(previous)) {
    state.previous = state.previous.concat(previous)
  } else {
    state.previous.push(previous)
  }
}

export function toString(state: State) {
  return `${state.lhs} -> ${leftAsString(state, ' ')} • ${rightAsString(
    state,
    ' '
  ).trim()} from (${state.from})`
}
