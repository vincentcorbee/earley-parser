import { StateInput, StateLike, Token } from '../../types'
import { State } from './state'

export class StateSet {
  private states: State[]

  private keys = new Map<string, number>()

  token: Token | null

  constructor(token?: Token) {
    this.states = []
    this.token = token ?? null
  }

  entries() {
    return this.states.entries()
  }

  values() {
    return this.states.values()
  }

  getKey(stateLike: State | StateLike) {
    let key = `${stateLike.lhs}::left[`

    const lengthLeft = stateLike.left.length

    for (let index = 0; index < lengthLeft; index++) key += stateLike.left[index]

    key += ']right['

    const lengthRight = stateLike.right.length

    for (let index = 0; index < lengthRight; index++) key += stateLike.right[index]

    key += `]${stateLike.from}`

    return key
  }

  add(stateLike: State | StateInput) {
    const key = this.getKey(stateLike)

    if (this.keys.has(key)) return null

    const state = stateLike instanceof State ? stateLike : new State(stateLike)

    this.keys.set(key, this.states.length)

    this.states.push(state)

    return state
  }

  has(stateLike: State | StateLike) {
    return this.keys.has(this.getKey(stateLike))
  }

  get(identifier: State | StateLike | number) {
    if (typeof identifier === 'number') return this.states[identifier]

    const key = this.getKey(identifier)

    const index = this.keys.get(key)

    if (index === undefined) return

    return this.states[index]
  }

  forEach(callbackfn: (value: State, index: number) => void) {
    return this.states.forEach(callbackfn)
  }

  find(callbackfn: (state: State, index: number, states: State[]) => boolean) {
    return this.states.find(callbackfn)
  }

  reduce(
    callbackFn: (accumlator: any, value: State, key: number) => any,
    startValue?: any
  ) {
    return this.states.reduce(callbackFn, startValue)
  }

  [Symbol.iterator]() {
    return this.states.values()
  }
}
