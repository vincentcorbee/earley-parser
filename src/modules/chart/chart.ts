import {
  ChartColumns,
  ProductionRule,
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

  constructor(
    public productions: Productions,
    public startRule: ProductionRule | null = null
  ) {
    this.columns = []

    this.seed = null
  }

  empty() {
    this.columns = []

    if (this.seed) this.seed.forEach(state => this.addStateToStateSet(state))
  }

  setSeed(seed: StateSetInterface | null) {
    if (seed === null) {
      this.seed = seed
    } else {
      this.seed = [...seed.values()]

      this.addStateSet(seed)
    }
  }

  get size() {
    return this.columns.length
  }

  addStateToStateSet(stateLike: StateInput | StateInterface, token?: Token | null) {
    const stateSet = this.getStateSet(stateLike.end) ?? this.addStateSet()

    if (token && !stateSet.token) stateSet.token = token

    return stateSet.add(stateLike)
  }

  advanceState(state: StateInterface, parentState: StateInterface) {
    const { dot, lhs, start, action, previous, rhs, rule } = state

    const { end } = parentState

    const newState = this.addStateToStateSet({
      lhs,
      rhs,
      dot: dot + 1,
      start,
      previous,
      action,
      end,
      rule,
    })

    if (newState) newState.addPrevious(parentState)

    return newState
  }

  moveStateToNextColumn(state: StateInterface, token: Token | null) {
    const { lhs, dot, start, action, end, rhs, rule } = state

    const newState = this.addStateToStateSet(
      {
        lhs,
        rhs,
        dot: dot + 1,
        start,
        previous: [state],
        action,
        end: end + 1,
        rule,
      },
      token
    )

    if (newState) state.token = token

    return newState
  }

  addStateSet(stateSet: StateSetInterface = new (StateSet as any)(), index?: number) {
    if (index !== undefined && !this.getStateSet(index)) this.columns[index] = stateSet
    else this.columns.push(stateSet)

    return stateSet
  }

  getStateSet(index: number) {
    return this.columns[index]
  }

  setStartRule(productionRule: ProductionRule) {
    this.startRule = productionRule
  }

  getFinishedStates() {
    const lastColumn = this.columns[this.size - 1]
    const startRule = this.startRule

    const finishedStates: StateInterface[] = []

    if (!lastColumn || !startRule) return []

    const { rhss, lhs, rules } = startRule

    rhss.forEach((rhs, index) => {
      const state = lastColumn.get({
        lhs,
        start: 0,
        dot: rhs.length,
        rhs,
        rule: rules[index],
      })

      if (state?.complete) finishedStates.push(state)
    })

    return finishedStates
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
