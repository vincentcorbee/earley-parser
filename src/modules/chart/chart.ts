import { ChartColumns, ProductionRule, StateInput, Token } from '../../types'
import { State } from './state'

import { StateSet } from './state-set'

export class Chart {
  columns: ChartColumns
  startRule: ProductionRule | null

  private seed: State[] | null

  constructor(startRule: ProductionRule | null = null) {
    this.columns = []

    this.startRule = startRule

    this.seed = null
  }

  empty() {
    this.columns = []

    if (this.seed) this.seed.forEach(state => this.addStateToStateSet(state))
  }

  setSeed(seed: StateSet | null) {
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

  addStateToStateSet(stateLike: StateInput | State) {
    const stateSet = this.get(stateLike.columnNumber) ?? this.addStateSet()

    return stateSet.add(stateLike)
  }

  advanceState(state: State, parentState: State) {
    const { right, left, dot, lhs, from, action, previous } = state

    const { columnNumber } = parentState

    const [firstRhs] = right

    return this.addStateToStateSet({
      lhs,
      left: [...left, firstRhs],
      right: right.slice(1) || [],
      dot: dot + 1,
      from,
      action,
      previous,
      columnNumber,
    })
  }

  moveStateToNextColumn(state: State, token: Token | null) {
    const {
      lhs,
      left,
      dot,
      from,
      action,
      columnNumber,
      right: [rhs],
    } = state

    const newState = this.addStateToStateSet({
      lhs,
      left: [...left, rhs],
      dot: dot + 1,
      right: state.right.slice(1),
      from,
      action,
      previous: [state],
      columnNumber: columnNumber + 1,
    })

    if (newState) state.token = token

    return newState
  }

  addStateSet(stateSet: StateSet = new StateSet(), index?: number) {
    if (index !== undefined && !this.get(index)) this.columns[index] = stateSet
    else this.columns.push(stateSet)

    return stateSet
  }

  get(index: number) {
    return this.columns[index]
  }

  setStartRule(productionRule: ProductionRule) {
    this.startRule = productionRule
  }

  getFinishedStates() {
    const lastColumn = this.getLastColumn()
    const startRule = this.startRule

    const finishedStates: State[] = []

    if (!lastColumn || !startRule) return []

    for (const right of startRule.rhs) {
      const state = lastColumn.get({
        right: [],
        lhs: startRule.lhs,
        from: 0,
        left: right,
      })

      if (state?.complete) finishedStates.push(state)
    }

    return finishedStates
  }

  getLastColumn() {
    return this.columns[this.size - 1]
  }

  forEach(callbackFn: (value: StateSet, key: number) => void) {
    return this.columns.forEach(callbackFn)
  }

  reduce(
    callbackFn: (accumlator: any, value: StateSet, key: number) => any,
    startValue?: any
  ) {
    return this.columns.reduce(callbackFn, startValue)
  }

  [Symbol.iterator]() {
    return this.columns.values()
  }
}
