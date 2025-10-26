import { LexerToken } from '../../../src/types'
import { keywords } from './keywords'

const IdentifierToken: LexerToken = {
  name: 'IDENTIFIER',
  test: /^[$_\p{ID_Start}]+[$_\p{ID_Continue}]*/u,
  guard: (match: string) => !keywords.includes(match),
}
const StringToken: LexerToken = {
  name: 'STRING',
  test: /^(?:(?:"(?:[^"\\]|(?:\\.))*")|'(?:[^'\\]|(?:\\.))*')/,
}
const NumberToken: LexerToken = {
  name: 'NUMBER',
  test: /^[0-9]+(?:\.?[0-9]+)*/,
}
const NewlineToken: LexerToken = {
  name: 'NEWLINE',
  test: /^[\n\r]/,
  lineBreaks: true,
  /*
    If set to true newlines are tokenized.
  */
  shouldTokenize: false,
}
const SemiToken: LexerToken = ['SEMI', ';']
const CommaToken: LexerToken = ['COMMA', ',']
const DotToken: LexerToken = ['DOT', '.']
const ColonToken: LexerToken = ['COLON', ':']
const BinOrToken: LexerToken = ['BINOR', '|']
const TenaryToken: LexerToken = ['TENARY', '?']
const LParen: LexerToken = ['LPAREN', '(']
const RParen: LexerToken = ['RPAREN', ')']
const EqualToken: LexerToken = ['EQUAL', '=']
const ArrowToken: LexerToken = ['ARROW', '=>']

const PrivateKeywordToken: LexerToken = ['PRIVATE']

const NumberTypeToken: LexerToken = {
  name: 'NUMBER_TYPE',
  test: 'number',
  replaceWith: lexer => {
    const nextToken = lexer.peakToken()?.name

    if (
      nextToken === 'COLON' ||
      nextToken === 'LANGLEBRACKET' ||
      nextToken === 'RANGLEBRACKET'
    ) {
      return 'IDENTIFIER'
    }

    return 'NUMBER_TYPE'
  },
}

export const initialTokens: LexerToken[] = [
  {
    name: 'BEGINCOMMENT',
    test: /^\/\*/,
    enterState: 'COMMENT',
  },
  NewlineToken,
  {
    name: 'NULL',
    test: /^null/,
  },
  NumberToken,
  StringToken,
  {
    name: 'INTERFACE',
    test: 'interface',
    enterState: lexer =>
      lexer.peakToken()?.name === 'IDENTIFIER' ? 'INTERFACE' : 'PARENT',
    replaceWith: lexer =>
      lexer.currentState === 'INTERFACE' ? 'INTERFACE' : 'IDENTIFIER',
  },
  {
    name: 'TYPE',
    test: 'type',
    enterState: lexer => (lexer.peakToken()?.name === 'IDENTIFIER' ? 'TYPE' : 'PARENT'),
    replaceWith: lexer => (lexer.currentState === 'TYPE' ? 'TYPE' : 'IDENTIFIER'),
  },
  'THIS',
  'FALSE',
  'TRUE',
  'SWITCH',
  'CASE',
  'DEFAULT',
  'NEW',
  'TRY',
  'CATCH',
  'FINALLY',
  'THROW',
  'DO',
  'WHILE',
  'FUNCTION',
  'RETURN',
  'BREAK',
  'CONTINUE',
  'VOID',
  'AS',
  'FROM',
  'DELETE',
  'CONST',
  'LET',
  'VAR',
  'IF',
  'ELSE',
  'FOR',
  'IN',
  'OF',
  'TYPEOF',
  'INSTANCEOF',
  'IMPORT',
  'EXTENDS',
  'PUBLIC',
  'PROTECTED',
  'PRIVATE',
  'OVERRIDE',
  'ABSCTRACT',
  'GET',
  'SET',
  'IMPLEMENTS',
  'ASSERTS',
  'IS',
  'READONLY',
  'KEYOF',
  'UNIQUE',
  'INFER',
  'CLASS',
  IdentifierToken,
  SemiToken,
  CommaToken,
  ['REST', '...'],
  DotToken,
  ['DOUBLECOLON', '::'],
  ColonToken,
  ['PLUSIS', '+='],
  ['MULTIPLY', '*'],
  ['DIVIDE', '/'],
  ['INCREMENT', '++'],
  ['MODULUS', '%'],
  ['PLUS', '+'],
  ['DECREMENT', '--'],
  ['MINUS', '-'],
  TenaryToken,
  ArrowToken,
  ['NOTSTRICTEQUAL', '!=='],
  ['STRICTEQUAL', '==='],
  ['EQUALEQUAL', '=='],
  ['NOTEQUAL', '!='],
  ['LOGNOT', '!'],
  EqualToken,
  ['LANGLEBRACKET', '<'],
  ['LTEQ', '<='],
  ['RANGLEBRACKET', '>'],
  ['GTEQ', '>='],
  ['LOGOR', '||'],
  ['XLOGOR', '^'],
  ['LOGAND', '&&'],
  BinOrToken,
  ['NOT', '~'],
  ['BINAND', '&'],
  LParen,
  RParen,
  ['LCBRACE', '{'],
  ['RCBRACE', '}'],
  ['LBRACK', '['],
  ['RBRACK', ']'],
]

export const interfaceTokens: LexerToken[] = [
  'EXTENDS',
  SemiToken,
  NewlineToken,
  PrivateKeywordToken,
  {
    name: 'LCBRACE',
    test: '{',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RCBRACE',
    test: '}',
    enterState: 'PARENT',
  },
  {
    name: 'LANGLEBRACKET',
    test: '<',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RANGLEBRACKET',
    test: '>',
    enterState: 'TOKENBODY',
  },
  ['LBRACK', '['],
  ['RBRACK', ']'],
  TenaryToken,
  IdentifierToken,
]

export const typeTokens: LexerToken[] = [
  'EXTENDS',
  NewlineToken,
  {
    name: 'LCBRACE',
    test: '{',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RCBRACE',
    test: '}',
    enterState: 'PARENT',
  },
  {
    name: 'LANGLEBRACKET',
    test: '<',
    enterState: 'TOKENBODY',
  },
  {
    name: 'LBRACKET',
    test: '[',
    enterState: 'TOKENBODY',
  },
  {
    name: 'LPAREN',
    test: '(',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RPAREN',
    test: ')',
  },
  ['EQUAL', '='],
  BinOrToken,
  {
    name: 'SEMI',
    test: ';',
    enterState: 'PARENT',
  },
  StringToken,
  IdentifierToken,
]

export const tokenBodyTokens: LexerToken[] = [
  'EXTENDS',
  NewlineToken,
  'NULL',
  ColonToken,
  DotToken,
  CommaToken,
  SemiToken,
  BinOrToken,
  StringToken,
  TenaryToken,
  NumberTypeToken,
  NumberToken,
  PrivateKeywordToken,
  IdentifierToken,
  LParen,
  RParen,
  ArrowToken,
  EqualToken,
  {
    name: 'LCBRACE',
    test: '{',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RCBRACE',
    test: '}',
    enterState: 'PARENT',
    shouldConsume: false,
  },
  {
    name: 'LANGLEBRACKET',
    test: '<',
    enterState: 'TOKENBODY',
  },
  {
    name: 'RANGLEBRACKET',
    test: '>',
    enterState: 'PARENT',
  },
]
