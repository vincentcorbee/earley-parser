"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grammar = void 0;
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
const remove_left_hand_side_1 = require("./helpers/remove-left-hand-side");
function expandOptionalSymbols(symbols) {
    const results = [];
    function backtrack(index, currentArray) {
        if (index === symbols.length) {
            results.push(currentArray.slice());
            return results;
        }
        const symbol = symbols[index];
        if (symbol.optional) {
            backtrack(index + 1, currentArray);
            currentArray.push(symbol);
            backtrack(index + 1, currentArray);
            currentArray.pop();
        }
        else {
            currentArray.push(symbol);
            backtrack(index + 1, currentArray);
            currentArray.pop();
        }
    }
    backtrack(0, []);
    return results;
}
class Grammar {
    lexer;
    productions;
    startGrammarRule;
    constructor(lexer) {
        this.lexer = lexer;
        this.productions = new Map();
    }
    get startProductionRule() {
        if (!this.startGrammarRule)
            return undefined;
        return this.productions.get(this.startGrammarRule);
    }
    setGrammar(grammarRules) {
        const { productions } = this;
        grammarRules.forEach(({ exp, action, symbols }) => {
            const leftHandSide = exp.match(constants_1.regExpLeftHandSide);
            if (leftHandSide) {
                const [leftHandSideMatch, lhs, parameters = ''] = leftHandSide;
                if (!productions.has(lhs)) {
                    const rhss = (0, helpers_1.splitExpression)((0, remove_left_hand_side_1.removeLeftHandSide)(exp, leftHandSideMatch), '|').reduce((acc, expression) => {
                        const symbols = this.getSymbols(expression);
                        /*
                          Expand optional symbols into extra right hand sides
                        */
                        return acc.concat(expandOptionalSymbols(symbols));
                    }, []);
                    const lhsWithParams = [lhs, ...(0, helpers_1.getParametersSymbol)(parameters)];
                    while (lhsWithParams.length) {
                        const joinedLhsWithParam = lhsWithParams.join('_');
                        const expandedRhss = rhss.map(rhs => rhs.flatMap(({ value, params = [] }) => params.reduce((acc, param) => {
                            if (param.mod === '?')
                                return lhsWithParams.includes(param.value)
                                    ? `${acc}_${param.value}`
                                    : acc;
                            return `${acc}_${param.value}`;
                        }, value)));
                        const production = {
                            action,
                            symbols,
                            lhs: joinedLhsWithParam,
                            raw: exp,
                            rhss: expandedRhss,
                            rules: expandedRhss.map(rhs => `${joinedLhsWithParam}->${rhs.join(' ')}`),
                        };
                        productions.set(joinedLhsWithParam, production);
                        lhsWithParams.pop();
                    }
                    if (!this.startGrammarRule)
                        this.startGrammarRule = lhs;
                }
            }
            else
                throw new Error(`Incorrect grammar rule: ${exp}`);
        });
    }
    getSymbol(value) {
        if (!value)
            return null;
        if (value === constants_1.EMPTY)
            return null;
        let characterClassMatch = value.match(constants_1.regExpcharacterClass);
        if (characterClassMatch) {
            const [, symbol, optional] = characterClassMatch;
            this.lexer.addTokens([[symbol, new RegExp(`^${symbol}`)]]);
            return { value: symbol, optional: Boolean(optional) };
        }
        let stringLiteralMatch = value.match(constants_1.regExpstringLiteral);
        if (stringLiteralMatch) {
            const [, symbol, optional] = stringLiteralMatch;
            const value = symbol.slice(1, -1);
            this.lexer.addTokens([[symbol, new RegExp(`^${(0, helpers_1.escapeCharacters)(value)}`)]]);
            return { value, optional: Boolean(optional) };
        }
        if (this.lexer.hasToken(value))
            return { value };
        return this.getNonTerminal(value);
    }
    getNonTerminal(value) {
        const match = value.match(constants_1.regExpNonTerminal);
        if (!match)
            return { value, params: [], optional: false };
        const [, nonTerminal, parameters = '', optional] = match;
        const params = parameters
            ? (0, helpers_1.getParametersSymbol)(parameters).map(param => {
                if (param.includes('?'))
                    return {
                        value: param.replace('?', '').trim(),
                        mod: '?',
                    };
                return { value: param.trim() };
            })
            : [];
        return { value: nonTerminal, params, optional: Boolean(optional) };
    }
    getSymbols(expression) {
        return (0, helpers_1.splitExpression)(expression.trim()).flatMap(part => this.getSymbol(part) ?? []);
    }
}
exports.Grammar = Grammar;
