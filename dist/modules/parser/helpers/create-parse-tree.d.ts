import { ParseTreeNode, StateInterface, Token } from '../../../types';
export declare const createParseTree: ({ token, isComplete, lhs: type, action, previous }: StateInterface, parentNode?: ParseTreeNode | null, previousToken?: Token | null, end?: number[]) => any;
