import { ParseError } from '../../types'
import { Parser } from '../parser'

const Tokens = {
  NEWLINE: 'NEWLINE',
  RCBRACE: 'RCBRACE',
  LCBRACE: 'LCBRACE',
  RPAREN: 'RPAREN',
  SEMI: 'SEMI',
}

const SEMI = ';'
const RCBRACE = '}'

// ASI RULES
// 1. A semicolon is inserted before, when a Line terminator or "}" is encountered that is not allowed by the grammar.
// 2. A semicolon is inserted at the end, when the end of the input stream of tokens is detected and the parser is unable to parse the single input stream as a complete program.
// 3. A semicolon is inserted at the end, when a statement with restricted productions in the grammar is followed by a line terminator.

export const ASI = (parser: Parser, error: ParseError) => {
  const { token, previousToken, chart } = error

  const { lexer } = parser

  const optSemi = chart
    .getLastColumn()
    ?.find(state => state.lhs === 'OptSemi' && !state.complete)

  // console.log(previousToken, token, lexer.source, optSemi)

  if (token) {
    if (!previousToken) {
      if (token.name === Tokens.NEWLINE) {
        return true
      } else {
        throw SyntaxError(`Unexpected token ${token.value} (${token.line}:${token.col})`)
      }
    } else if (
      previousToken.name === Tokens.NEWLINE ||
      previousToken.name === Tokens.RCBRACE
    ) {
      if (optSemi && lexer.source[previousToken.index - 1] !== SEMI) {
        const { index, col, line } = previousToken

        lexer.source =
          lexer.source.substring(0, index) + SEMI + lexer.source.substring(index)

        lexer.index = index
        lexer.col = col
        lexer.line = line
      } else {
        lexer.index = token.index
        lexer.col = token.col
        lexer.line = token.line
      }

      parser.currentColumn = parser.currentColumn
        ? parser.currentColumn - 2
        : parser.currentColumn

      return true
    } else if (
      (previousToken.name === Tokens.LCBRACE || previousToken.name === Tokens.SEMI) &&
      token.name === Tokens.NEWLINE
    ) {
      return true
    } else {
      throw SyntaxError(
        `Unexpected token ${previousToken.value} (${previousToken.line}:${previousToken.col})`
      )
    }
  } else {
    const index = lexer.source.length - 1
    const prevSymbol = lexer.source[index]

    if (optSemi && lexer.source[index - 1] !== SEMI && prevSymbol === RCBRACE) {
      lexer.source = lexer.source.substring(0, index - 1) + SEMI + RCBRACE

      lexer.index = lexer.source.length - 2
      parser.currentColumn = parser.currentColumn
        ? parser.currentColumn - 2
        : parser.currentColumn

      return true
    } else if (optSemi && prevSymbol !== SEMI) {
      lexer.source = lexer.source + SEMI

      lexer.index = lexer.source.length - 1
      parser.currentColumn = parser.currentColumn
        ? parser.currentColumn - 2
        : parser.currentColumn

      return true
    } else if (previousToken) {
      throw SyntaxError(
        `Unexpected token ${previousToken.value} (${previousToken.line}:${previousToken.col})`
      )
    } else {
      throw SyntaxError(`Unexpected end of input`)
    }
  }
}
