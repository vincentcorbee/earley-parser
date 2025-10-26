"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chart = void 0;
const state_set_1 = require("./state-set");
class Chart {
    productions;
    columns;
    seed;
    constructor(productions) {
        this.productions = productions;
        this.columns = [];
        this.seed = null;
    }
    get lastColumn() {
        const { columns } = this;
        return columns[columns.length - 1];
    }
    empty() {
        const { seed } = this;
        this.columns = [];
        if (seed) {
            this.addStateSet(new state_set_1.StateSet());
            seed.forEach(state => this.add(state));
        }
    }
    setSeed(seed) {
        if (seed === null) {
            this.seed = seed;
        }
        else {
            this.seed = [...seed];
            this.addStateSet(seed);
        }
    }
    add(stateLike) {
        const stateSet = this.columns[stateLike.end];
        return stateSet.add(stateLike);
    }
    advanceState(state, parentState) {
        const { columns } = this;
        const { dot, lhs, start, action, previous, rhs, rule } = state;
        const { end } = parentState;
        const newDot = dot + 1;
        const newPrevious = previous.concat(parentState);
        const stateSet = columns[end];
        return stateSet.add({
            lhs,
            rhs,
            dot: newDot,
            start,
            previous: newPrevious,
            action,
            end,
            rule,
        });
    }
    scanState(state, token) {
        const { lhs, dot, start, action, end, rhs, rule } = state;
        const newEnd = end + 1;
        const newDot = dot + 1;
        const stateSet = this.columns[newEnd] ?? this.addStateSet(new state_set_1.StateSet(token));
        state.token = token;
        return stateSet.add({
            lhs,
            rhs,
            dot: newDot,
            start,
            previous: [state],
            action,
            end: newEnd,
            rule,
        });
    }
    addStateSet(stateSet) {
        this.columns.push(stateSet);
        return stateSet;
    }
    forEach(callbackFn) {
        return this.columns.forEach(callbackFn);
    }
    reduce(callbackFn, startValue) {
        return this.columns.reduce(callbackFn, startValue);
    }
    [Symbol.iterator]() {
        return this.columns.values();
    }
}
exports.Chart = Chart;
