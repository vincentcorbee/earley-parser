import { Chart } from './modules/chart/chart';
import { Lexer } from './modules/lexer';
export type ParseTreeNode = {
    type: string;
    value?: any;
    children?: any[];
    start?: number;
    end?: number;
    action?: SemanticAction;
    token?: Token;
};
export type ParseTree = ParseTreeNode[];
export type ASTNode = Omit<ParseTreeNode, 'action' | 'token'>;
export type SemanticAction<T = ASTNode | ASTNode[]> = (node: ASTNode) => T;
export type SymbolActions = {
    accepts?: {
        [key: string]: boolean;
    };
};
export type Symbols = {
    [symbol: string]: SymbolActions;
};
export type GrammarRule = {
    exp: string;
    action?: SemanticAction;
    symbols?: Symbols;
};
export type NonTerminalParams = {
    value: string;
    mod?: string;
};
export type TerminalSymbol = {
    value: string;
};
export type NonTerminalSymbol = {
    value: string;
    params: NonTerminalParams[];
    optional: boolean;
};
export type CharacterClassSymbol = {
    value: string;
    test: (input: string) => boolean;
};
export type GrammarRuleSymbol = Partial<CharacterClassSymbol & TerminalSymbol & NonTerminalSymbol> & {
    value: string;
};
export type GrammarRules = GrammarRule[];
export type ProductionRule = {
    action?: SemanticAction;
    symbols?: Symbols;
    lhs: string;
    raw: string;
    rhss: string[][];
    rules: string[];
};
export type Productions = Map<string, ProductionRule>;
export type ParseError = {
    token?: Token | null;
    previousToken?: Token | null;
    chart: Chart;
    productions: Productions;
};
export type ParseResult<T = any> = Array<T>;
export type ParserCache<T> = Map<string, ParseResult<T>>;
export type TransitiveItems = Map<string, StateInterface>;
export type StateInput = {
    lhs: string;
    rhs: string[];
    dot: number;
    start: number;
    previous: StateInterface[];
    action?: SemanticAction;
    token?: Token | null;
    end: number;
    rule: string;
};
export interface StateInterface {
    lhs: string;
    rhs: string[];
    dot: number;
    start: number;
    previous: StateInterface[];
    token?: Token | null;
    action?: SemanticAction;
    end: number;
    isComplete: boolean;
    nextSymbol?: string;
    rule: string;
    key: string;
    new (stateInput: StateInput): StateInterface;
}
export interface StateSetInterface {
    states: StateInterface[];
    keys: Map<string, number>;
    token?: Token | null;
    new (token?: Token): void;
    add(stateLike: StateInterface | StateInput): StateInterface | null;
    get(key: string): StateInterface | undefined;
    forEach(callbackfn: (value: StateInterface, index: number) => void): void;
    reduce(callbackFn: (accumlator: any, value: StateInterface, key: number) => any, startValue?: any): any;
    [Symbol.iterator](): IterableIterator<StateInterface>;
}
export type StateLike = Pick<StateInput, 'lhs' | 'rhs' | 'start' | 'dot' | 'rule'>;
export type States = Map<string, StateInterface>;
export type ChartColumns = StateSetInterface[];
export type LexerToken = (Omit<StateToken, 'test'> & {
    test: string | RegExp;
}) | [string, RegExp | string] | [string] | string;
export type LexerState = {
    name: string;
    tokens: StateTokens;
    tokensArray: StateToken[];
    ignoredTokens: StateTokens;
    onError?: (lexer: Lexer) => any;
    start: number;
    end: null | number;
    onInit?: (lexer: Lexer) => any;
    test?: RegExp;
    parent?: LexerState | null;
};
export type LexerStates = Map<string, LexerState>;
export type StateTokens = Map<string, StateToken>;
export type StateToken = {
    name: string;
    test: RegExp;
    ignore?: boolean;
    lineBreaks?: boolean;
    longestOf?: string;
    value?: (match: string) => any;
    enterState?: string | ((lexer: Lexer) => string);
    shouldConsume?: boolean;
    shouldTokenize?: boolean | ((lexer: Lexer, substring?: string) => boolean);
    guard?: (substring: string) => boolean;
    onEnter?: (lexer: Lexer, substring?: string) => void | boolean;
    replaceWith?: (lexer: Lexer) => string;
};
export type Token = {
    value: any;
    raw: string;
    line: number;
    col: number;
    index: number;
    name: string;
};
export type Visitors = {
    [key: string]: Visitor;
};
export type Visitor = {
    enter: (args: {
        node: any;
        result: any;
        visitors: Visitors;
        traverse: any;
        parent: any;
    }) => string;
};
