"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const chart_1 = require("../chart/chart");
const lexer_1 = require("../lexer");
const chart_2 = require("../chart");
const grammar_1 = require("../grammar");
const helpers_1 = require("./helpers");
function getTransitiveKey(state) {
    return `${state.rule}-${state.dot}`;
}
function isStateInDeterministicReductionPath({ lhs, rule }, { lhs: fromLhs, nextSymbol, rule: fromRule }) {
    return fromLhs === lhs && nextSymbol === lhs && fromRule === rule;
}
function getTopmostStateInDeterministicReductionPath(state, fromStates) {
    const foundFromStates = [];
    for (const fromState of fromStates) {
        if (isStateInDeterministicReductionPath(state, fromState)) {
            if (foundFromStates.length === 1)
                break;
            else
                foundFromStates.push(fromState);
        }
    }
    /* There should be just one state */
    if (foundFromStates.length === 1)
        return foundFromStates[0];
    return null;
}
function isRightRecursive({ rhs, dot, lhs, nextSymbol, isComplete }) {
    /* Is complete */
    if (isComplete && dot > 0)
        return rhs[dot - 1] === lhs;
    /* Is last symbol */
    if (rhs.length - dot === 1)
        return nextSymbol === lhs;
    return false;
}
function getFinishedStates({ rhss, rules }, { lastColumn }) {
    if (!lastColumn)
        return [];
    return rhss.flatMap((rhs, index) => {
        const key = rules[index] + '-' + rhs.length + '-0';
        const state = lastColumn.get(key);
        return state?.isComplete ? state : [];
    });
}
function doesSymbolAcceptToken(state, { name, value }, productions) {
    const symbols = productions.get(state.lhs)?.symbols;
    if (!symbols)
        return false;
    const { nextSymbol } = state;
    const accepts = symbols[nextSymbol]?.accepts;
    if (!accepts)
        return false;
    if (accepts[name] && name === value)
        return true;
    return false;
}
function complete(state, chart, transitiveItems) {
    const startStates = chart.columns[state.start];
    /*
      If we encounter right recursion we first check if we
      have a transitive state.
  
      If we don't find one, we try to find the topmost item
      in the deterministic reduction path if it exists and
      store it as a transitive item.
    */
    if (isRightRecursive(state)) {
        const transitiveState = transitiveItems.get(getTransitiveKey(state));
        if (transitiveState) {
            const { lhs, rhs, dot, start, action, previous } = transitiveState;
            const { end, rule } = state;
            const newState = chart.add({
                lhs,
                rhs,
                dot,
                start,
                action,
                previous: previous.concat(state),
                end,
                rule,
            });
            if (!newState)
                transitiveState.previous = state.previous;
            return;
        }
        const topmostState = getTopmostStateInDeterministicReductionPath(state, startStates);
        if (topmostState) {
            const newState = chart.advanceState(topmostState, state);
            newState && transitiveItems.set(getTransitiveKey(newState), newState);
            return;
        }
    }
    /*
      Search in the from column for states where the first symbol
      after the dot matches the left hand side of the completed state.
    */
    const { lhs } = state;
    for (const startState of startStates) {
        const { nextSymbol } = startState;
        lhs === nextSymbol && chart.advanceState(startState, state);
    }
}
function predict({ end, nextSymbol }, stateSet, productions) {
    const { action, rhss, lhs, rules } = productions.get(nextSymbol);
    rhss.forEach((rhs, i) => stateSet.add({
        lhs,
        rhs,
        dot: 0,
        start: end,
        previous: [],
        action,
        end,
        rule: rules[i],
    }));
}
function scan(state, token, chart, productions) {
    const { nextSymbol } = state;
    if (token?.name === nextSymbol ||
        token?.value === nextSymbol ||
        //`"${token?.value}"` === nextSymbol
        (token && doesSymbolAcceptToken(state, token, productions)))
        return chart.scanState(state, token);
}
class Parser {
    cache;
    chart;
    grammar;
    transitiveItems;
    productions;
    lexer;
    currentColumn;
    startRule;
    debug;
    constructor() {
        this.cache = new Map();
        this.transitiveItems = new Map();
        this.grammar = new grammar_1.Grammar(new lexer_1.Lexer());
        this.chart = new chart_1.Chart(this.grammar.productions);
        this.currentColumn = 0;
        this.lexer = this.grammar.lexer;
        this.productions = this.grammar.productions;
        this.debug = false;
    }
    parse(source, callback) {
        const { cache, lexer } = this;
        const cachedResult = cache.get(source);
        /* If we have cached the result, return the cached parse result */
        if (cachedResult)
            return callback(cachedResult);
        lexer.source = source;
        const states = this.resumeParse();
        if (states) {
            const parseTree = states.map(state => (0, helpers_1.createParseTree)(state));
            /* Store the parse result in the cache */
            cache.set(lexer.source, parseTree);
            return callback(parseTree);
        }
    }
    onError(error) {
        const { previousToken } = error;
        if (previousToken)
            throw SyntaxError(`Parsing Error token: ${previousToken.value} (line: ${previousToken.line}, col: ${previousToken.col}) of input stream`);
        throw Error('Unknown parsing error');
    }
    ignore(ignoreRules) {
        this.lexer.ignoreTokens(ignoreRules);
        return this;
    }
    setGrammar(grammarRules) {
        const { chart, grammar } = this;
        grammar.setGrammar(grammarRules);
        const { startProductionRule } = grammar;
        if (startProductionRule) {
            this.startRule = startProductionRule;
            const stateSet = new chart_2.StateSet();
            const { lhs, action, rules } = startProductionRule;
            startProductionRule.rhss.forEach((rhs, i) => {
                stateSet.add({
                    lhs,
                    rhs,
                    dot: 0,
                    start: 0,
                    end: 0,
                    action,
                    previous: [],
                    rule: rules[i],
                });
            });
            chart.setSeed(stateSet);
        }
        return this;
    }
    reset() {
        this.transitiveItems = new Map();
        this.chart.empty();
        this.currentColumn = 0;
        this.lexer.reset();
    }
    clearCache() {
        this.cache = new Map();
    }
    resumeParse() {
        const { productions, chart, lexer, transitiveItems, startRule } = this;
        const { columns } = chart;
        let stateSet;
        let state;
        let token;
        let previousToken;
        while ((stateSet = columns[this.currentColumn++])) {
            const { states } = stateSet;
            previousToken = token;
            token = lexer.next();
            let currentRow = 0;
            while ((state = states[currentRow++])) {
                if (state.isComplete)
                    complete(state, chart, transitiveItems);
                else if (productions.has(state.nextSymbol))
                    predict(state, stateSet, productions);
                else
                    scan(state, token, chart, productions);
            }
        }
        const finishedStates = !token ? getFinishedStates(startRule, chart) : [];
        /*
          If there are finished states return them
          else an error is thrown because the input is not recognized by our grammar.
        */
        if (finishedStates.length)
            return finishedStates;
        if (this.onError({
            previousToken,
            token,
            chart,
            productions,
        })) {
            return this.resumeParse();
        }
    }
}
exports.Parser = Parser;
