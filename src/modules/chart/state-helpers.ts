import { StateInterface } from '../../types'

export function leftAsString(state: StateInterface, seperator = '') {
  let key = ''

  const length = state.dot

  for (let index = 0; index < length; index++)
    key += state.rhs[index] + (index !== length - 1 ? seperator : '')

  return key
}

export function rightAsString(state: StateInterface, seperator = '') {
  let key = ''

  const length = state.rhs.length

  for (let index = state.dot; index < length; index++)
    key += state.rhs[index] + (index !== length - 1 ? seperator : '')

  return key
}

export function toString(state: StateInterface) {
  return `${state.lhs} -> ${leftAsString(state, ' ')} • ${rightAsString(
    state,
    ' '
  ).trim()} start (${state.start})`
}
