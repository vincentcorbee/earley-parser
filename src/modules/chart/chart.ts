import { ChartColumns, ProductionRule, StateInput, States } from '../../types'
import { State } from './state'

import { StateSet } from './state-set'

export class Chart {
  columns: ChartColumns
  startRule: ProductionRule | null

  private seed: States | null

  constructor(startRule: ProductionRule | null = null) {
    this.columns = new Map()

    this.startRule = startRule

    this.seed = null
  }

  empty() {
    this.columns = new Map()
  }

  setSeed(stateSet: StateSet) {
    this.seed = new Map(stateSet.entries())

    this.addStateSet(stateSet)
  }

  get size() {
    return this.columns.size
  }

  addStateToStateSet(stateLike: StateInput | State, index: number) {
    const stateSet = this.get(index) ?? this.addStateSet()

    return stateSet.add(stateLike)
  }

  addStateSet(stateSet: StateSet = new StateSet(), index?: number) {
    if (index !== undefined && !this.get(index)) this.columns.set(index, stateSet)
    else this.columns.set(this.size, stateSet)

    return stateSet
  }

  get(index: number) {
    return this.columns.get(index)
  }

  setStartRule(productionRule: ProductionRule) {
    this.startRule = productionRule
  }

  getFinishedState() {
    const lastColumn = this.getLastColumn()
    const startRule = this.startRule

    if (!lastColumn || !startRule) return []

    // console.dir(this.columns, { depth: null })

    for (const right of startRule.rhs) {
      const state = lastColumn.get({
        right,
        lhs: startRule.lhs,
        from: 0,
        left: [],
      })

      // console.dir(state, { depth: null })

      if (state && state.complete) return [state]
    }

    return []
  }

  getLastColumn() {
    return this.columns.get(this.size - 1)
  }

  forEach(callbackFn: (value: StateSet, key: number) => void) {
    return this.columns.forEach(callbackFn)
  }

  reduce(
    callbackFn: (accumlator: any, value: StateSet, key: number) => any,
    startValue?: any
  ) {
    let index = 0

    for (const stateSet of this) {
      startValue = callbackFn(startValue, stateSet, index)

      index++
    }

    return startValue
  }

  *[Symbol.iterator]() {
    const columns = this.columns.values()

    for (const column of columns) yield column
  }
}
