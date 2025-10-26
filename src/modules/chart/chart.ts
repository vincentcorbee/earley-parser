import {
  ChartColumns,
  Productions,
  StateInput,
  StateInterface,
  StateSetInterface,
  Token,
} from '../../types'

import { StateSet } from './state-set'

export class Chart {
  columns: ChartColumns

  private seed: StateInterface[] | null

  constructor(public productions: Productions) {
    this.columns = []
    this.seed = null
  }

  get lastColumn() {
    const { columns } = this

    return columns[columns.length - 1]
  }

  empty() {
    const { seed } = this

    this.columns = []

    if (seed) {
      this.addStateSet(new (StateSet as any)())

      seed.forEach(state => this.add(state))
    }
  }

  setSeed(seed: StateSetInterface | null) {
    if (seed === null) {
      this.seed = seed
    } else {
      this.seed = [...seed]

      this.addStateSet(seed)
    }
  }

  add(stateLike: StateInput | StateInterface): StateInterface | null {
    const stateSet = this.columns[stateLike.end]

    return stateSet.add(stateLike)
  }

  advanceState(
    state: StateInterface,
    parentState: StateInterface
  ): StateInterface | null {
    const { columns } = this
    const { dot, lhs, start, action, previous, rhs, rule } = state
    const { end } = parentState
    const newDot = dot + 1
    const newPrevious = previous.concat(parentState)
    const stateSet = columns[end]

    return stateSet.add({
      lhs,
      rhs,
      dot: newDot,
      start,
      previous: newPrevious,
      action,
      end,
      rule,
    })
  }

  scanState(state: StateInterface, token?: Token | null): StateInterface | null {
    const { lhs, dot, start, action, end, rhs, rule } = state
    const newEnd = end + 1
    const newDot = dot + 1
    const stateSet =
      this.columns[newEnd] ?? this.addStateSet(new (StateSet as any)(token))

    state.token = token

    return stateSet.add({
      lhs,
      rhs,
      dot: newDot,
      start,
      previous: [state],
      action,
      end: newEnd,
      rule,
    })
  }

  addStateSet(stateSet: StateSetInterface) {
    this.columns.push(stateSet)

    return stateSet
  }

  forEach(callbackFn: (value: StateSetInterface, key: number) => void) {
    return this.columns.forEach(callbackFn)
  }

  reduce(
    callbackFn: (accumlator: any, value: StateSetInterface, key: number) => any,
    startValue?: any
  ) {
    return this.columns.reduce(callbackFn, startValue)
  }

  [Symbol.iterator]() {
    return this.columns.values()
  }
}
