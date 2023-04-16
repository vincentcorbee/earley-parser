import { Productions, StateInput, StateLike, States } from '../../types'
import { State } from './state'

export class StateSet {
  private states: States

  constructor() {
    this.states = new Map()
  }

  entries() {
    return this.states.entries()
  }

  getKey(stateLike: State | StateLike) {
    if (stateLike instanceof State) return stateLike.toString()

    let key = stateLike.lhs

    for (let index = 0; index < stateLike.right.length; index++)
      key += stateLike.right[index]

    for (let index = 0; index < stateLike.left.length; index++)
      key += stateLike.left[index]

    key += stateLike.from

    return key
  }

  add(stateLike: State | StateInput) {
    const key = this.getKey(stateLike)

    if (this.states.has(key)) return null

    const state = stateLike instanceof State ? stateLike : new State(stateLike)

    this.states.set(key, state)

    return state
  }

  has(stateLike: State | StateLike) {
    return this.states.has(this.getKey(stateLike))
  }

  get(stateLike: State | StateLike) {
    const key = this.getKey(stateLike)

    return this.states.get(key)
  }

  forEach(callbackfn: (value: State, key: string) => void) {
    return this.states.forEach(callbackfn)
  }

  getAllStatesWithTerminal(productions: Productions) {
    const result = []

    let index = 0

    for (const state of this) {
      if (state.expectTerminal(productions)) result.push(state)

      index++
    }

    return result
  }

  find(callbackfn: (state: State, index: number, states: States) => boolean) {
    let index = 0

    for (const state of this) {
      if (!!callbackfn(state, index, this.states)) return state

      index++
    }

    return undefined
  }

  reduce(
    callbackFn: (accumlator: any, value: State, key: number) => any,
    startValue?: any
  ) {
    let index = 0

    for (const state of this) {
      startValue = callbackFn(startValue, state, index)

      index++
    }

    return startValue
  }

  [Symbol.iterator]() {
    return this.states.values()
  }
}
