import { StateInput, StateInterface, StateSetInterface, Token } from '../../types'
import { State } from './state'

export function StateSet(this: StateSetInterface, token?: Token | null) {
  this.states = []
  this.token = token
  this.keys = new Map<string, number>()
}

StateSet.prototype = {
  constructor: StateSet,

  add(stateInput: StateInput): StateInterface | null {
    const { dot, start, rule } = stateInput
    const { keys, states } = this
    const key = rule + '-' + dot + '-' + start

    if (keys.has(key)) return null

    const state = new (State as any)(stateInput, key)

    keys.set(key, states.length)

    states.push(state)

    return state as StateInterface
  },

  get(key: string) {
    const { states, keys } = this

    const index = keys.get(key)

    if (index === undefined) return

    return states[index]
  },

  forEach(callbackfn: (value: StateInterface, index: number) => void) {
    return this.states.forEach(callbackfn)
  },

  reduce(
    callbackFn: (accumlator: any, value: StateInterface, key: number) => any,
    startValue?: any
  ) {
    return this.states.reduce(callbackFn, startValue)
  },

  [Symbol.iterator]() {
    const { states } = this

    return states.values()
  },
}
