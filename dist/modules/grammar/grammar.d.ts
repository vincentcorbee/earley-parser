import { GrammarRules, Productions } from '../../types';
import { Lexer } from '../lexer';
export declare class Grammar {
    lexer: Lexer;
    productions: Productions;
    startGrammarRule?: string;
    constructor(lexer: Lexer);
    get startProductionRule(): import("../../types").ProductionRule | undefined;
    setGrammar(grammarRules: GrammarRules): void;
    private getSymbol;
    private getNonTerminal;
    private getSymbols;
}
