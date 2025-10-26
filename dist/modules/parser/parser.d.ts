import { GrammarRules, ParseError, ParseResult, ProductionRule } from '../../types';
import { Lexer } from '../lexer';
export declare class Parser<T> {
    private cache;
    private chart;
    private grammar;
    private transitiveItems;
    private productions;
    lexer: Lexer;
    currentColumn: number;
    startRule?: ProductionRule;
    debug: boolean;
    constructor();
    parse(source: string, callback: (result: ParseResult<T>) => any): any;
    onError(error: ParseError): boolean | void;
    ignore(ignoreRules: RegExp[]): this;
    setGrammar(grammarRules: GrammarRules): this;
    reset(): void;
    clearCache(): void;
    private resumeParse;
}
