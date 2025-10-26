"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leftAsString = leftAsString;
exports.rightAsString = rightAsString;
exports.toString = toString;
function leftAsString(state, seperator = '') {
    let key = '';
    const length = state.dot;
    for (let index = 0; index < length; index++)
        key += state.rhs[index] + (index !== length - 1 ? seperator : '');
    return key;
}
function rightAsString(state, seperator = '') {
    let key = '';
    const length = state.rhs.length;
    for (let index = state.dot; index < length; index++)
        key += state.rhs[index] + (index !== length - 1 ? seperator : '');
    return key;
}
function toString(state) {
    return `${state.lhs} -> ${leftAsString(state, ' ')} • ${rightAsString(state, ' ').trim()} start (${state.start})`;
}
