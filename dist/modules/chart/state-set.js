"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSet = StateSet;
const state_1 = require("./state");
function StateSet(token) {
    this.states = [];
    this.token = token;
    this.keys = new Map();
}
StateSet.prototype = {
    constructor: StateSet,
    add(stateInput) {
        const { dot, start, rule } = stateInput;
        const { keys, states } = this;
        const key = rule + '-' + dot + '-' + start;
        if (keys.has(key))
            return null;
        const state = new state_1.State(stateInput, key);
        keys.set(key, states.length);
        states.push(state);
        return state;
    },
    get(key) {
        const { states, keys } = this;
        const index = keys.get(key);
        if (index === undefined)
            return;
        return states[index];
    },
    forEach(callbackfn) {
        return this.states.forEach(callbackfn);
    },
    reduce(callbackFn, startValue) {
        return this.states.reduce(callbackFn, startValue);
    },
    [Symbol.iterator]() {
        const { states } = this;
        return states.values();
    },
};
