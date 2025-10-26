"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logChart = void 0;
const chart_1 = require("../modules/chart");
const getWhitespace = (line, maxLength) => {
    const lineLength = line.replace(/\x1b\[[0-9]*m/g, '').length;
    let diff = maxLength + 5 - lineLength;
    let whitespace = '';
    while (diff > 0) {
        whitespace += ' ';
        diff--;
    }
    return whitespace;
};
const logChart = (chart, options = {}) => {
    const log = [];
    let maxLength = 0;
    chart.forEach((stateSet, i) => {
        const column = [`\x1b[33m==== ${i} ====\x1b[m`, []];
        const rules = column[1];
        stateSet.forEach(state => {
            if (options.onlyCompleted ? state.isComplete : true) {
                const rule = `${state.isComplete ? '\x1b[32m' : ''}${state.lhs} ->${state.dot > 0 ? ' ' : ''}${(0, chart_1.leftAsString)(state, ' ')} \x1b[1;31m•\x1b[m ${(0, chart_1.rightAsString)(state, ' ')}`;
                const ruleLength = rule.replace(/\x1b\[[0-9]*m/g, '').length;
                maxLength = ruleLength > maxLength ? ruleLength : maxLength;
                rules.push([rule.trim(), `from (${state.start})\x1b[m`]);
            }
        });
        log.push(column);
    });
    log.forEach(column => {
        const [columnNumber, rules] = column;
        console.log(columnNumber);
        rules.forEach(rule => {
            const [line, from] = rule;
            console.log(`${line}${getWhitespace(line, maxLength)}${from}`);
        });
    });
};
exports.logChart = logChart;
