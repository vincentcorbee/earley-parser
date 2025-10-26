import { StateInput, StateInterface } from '../../types'

export function State(this: StateInterface, stateInput: StateInput, key: string) {
  const { lhs, rhs, dot, start, action, previous, token, end, rule } = stateInput

  this.lhs = lhs
  this.rhs = rhs
  this.dot = dot
  this.start = start
  this.previous = previous
  this.action = action
  this.token = token
  this.end = end
  this.isComplete = dot === rhs.length
  this.nextSymbol = rhs[dot]
  this.rule = rule
  this.key = key
}

// State.prototype.addPrevious = function addPrevious(
//   state: StateInterface | StateInterface[]
// ) {
//   const { previous } = this

//   if (Array.isArray(state)) {
//     this.previous = previous.concat(state)
//   } else {
//     previous.push(state)
//   }
// }

// State.prototype = {
//   constructor: State,

//   leftAsString(seperator = '') {
//     let key = ''

//     const { dot, rhs } = this

//     for (let index = 0; index < dot; index++)
//       key += rhs[index] + (index !== dot - 1 ? seperator : '')

//     return key
//   },

//   rightAsString(seperator = '') {
//     let key = ''

//     const { rhs, dot } = this

//     const { length } = rhs

//     for (let index = dot; index < length; index++)
//       key += rhs[index] + (index !== length - 1 ? seperator : '')

//     return key
//   },

//   addPrevious(state: StateInterface | StateInterface[]) {
//     const { previous } = this

//     if (Array.isArray(state)) {
//       this.previous = previous.concat(state)
//     } else {
//       previous.push(state)
//     }
//   },

//   toString() {
//     const { lhs, start } = this

//     return `${lhs} -> ${this.leftAsString(' ')} • ${this.rightAsString(
//       ' '
//     ).trim()} from (${start})`
//   },
// }
