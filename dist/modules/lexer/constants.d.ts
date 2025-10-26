import { StateToken } from '../../types';
export declare const TokenTypes: {
    Symbol: string;
    Ignore: string;
    Newline: string;
};
export declare const DefaultToken: StateToken;
export declare const States: {
    initial: string;
};
export declare const escapedCharactersInStringLiteral: RegExp;
