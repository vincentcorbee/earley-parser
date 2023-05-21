import {
  StateInput,
  StateInterface,
  StateLike,
  StateSetInterface,
  Token,
} from '../../types'
import { State } from './state'

export function StateSet(this: StateSetInterface, token: Token | null = null) {
  this.states = []
  this.token = token
  this.keys = new Map<string, number>()
}

StateSet.prototype = {
  constructor: StateSet,
  entries() {
    return this.states.entries()
  },

  values() {
    return this.states.values()
  },

  getKey(stateLike: StateInterface | StateLike) {
    const { dot, start, rule } = stateLike

    return `${rule}-${dot}-${start}`
  },

  add(stateLike: StateInterface | StateInput) {
    const key = this.getKey(stateLike)

    const { keys, states } = this

    if (keys.has(key)) return null

    const state = stateLike instanceof State ? stateLike : new (State as any)(stateLike)

    keys.set(key, states.length)

    states.push(state)

    return state
  },

  has(stateLike: StateInterface | StateLike) {
    return this.keys.has(this.getKey(stateLike))
  },

  get(identifier: StateInterface | StateLike | number) {
    const { states, keys } = this

    if (typeof identifier === 'number') return states[identifier]

    const key = this.getKey(identifier)

    const index = keys.get(key)

    if (index === undefined) return

    return states[index]
  },

  forEach(callbackfn: (value: StateInterface, index: number) => void) {
    return this.states.forEach(callbackfn)
  },

  find(
    callbackfn: (
      state: StateInterface,
      index: number,
      states: StateInterface[]
    ) => boolean
  ) {
    return this.states.find(callbackfn)
  },

  reduce(
    callbackFn: (accumlator: any, value: StateInterface, key: number) => any,
    startValue?: any
  ) {
    return this.states.reduce(callbackFn, startValue)
  },

  [Symbol.iterator]() {
    return this.states.values()
  },
}

// export class StateSet {
//   private states: StateInterface[]

//   private keys = new Map<string, number>()

//   token: Token | null

//   constructor(token?: Token) {
//     this.states = []
//     this.token = token ?? null
//   }

//   entries() {
//     return this.states.entries()
//   }

//   values() {
//     return this.states.values()
//   }

//   getKey(stateLike: StateInterface | StateLike) {
//     let key = `${stateLike.lhs}::left[`

//     const lengthLeft = stateLike.dot

//     for (let index = 0; index < lengthLeft; index++) key += stateLike.rhs[index]

//     key += ']right['

//     const lengthRight = stateLike.rhs.length

//     for (let index = stateLike.dot; index < lengthRight; index++)
//       key += stateLike.rhs[index]

//     key += `]${stateLike.from}`

//     return key
//   }

//   add(stateLike: StateInterface | StateInput) {
//     const key = this.getKey(stateLike)

//     if (this.keys.has(key)) return null

//     const state = stateLike instanceof State ? stateLike : new (State as any)(stateLike)

//     this.keys.set(key, this.states.length)

//     this.states.push(state)

//     return state
//   }

//   has(stateLike: StateInterface | StateLike) {
//     return this.keys.has(this.getKey(stateLike))
//   }

//   get(identifier: StateInterface | StateLike | number) {
//     if (typeof identifier === 'number') return this.states[identifier]

//     const key = this.getKey(identifier)

//     const index = this.keys.get(key)

//     if (index === undefined) return

//     return this.states[index]
//   }

//   forEach(callbackfn: (value: StateInterface, index: number) => void) {
//     return this.states.forEach(callbackfn)
//   }

//   find(
//     callbackfn: (
//       state: StateInterface,
//       index: number,
//       states: StateInterface[]
//     ) => boolean
//   ) {
//     return this.states.find(callbackfn)
//   }

//   reduce(
//     callbackFn: (accumlator: any, value: StateInterface, key: number) => any,
//     startValue?: any
//   ) {
//     return this.states.reduce(callbackFn, startValue)
//   }

//   [Symbol.iterator]() {
//     return this.states.values()
//   }
// }
