import { Parser } from '..'
import { LexerToken } from '../types'
import { printChart, printParseTree } from '../utils'

const tokens = [
  {
    name: 'NEWLINE',
    test: /^[\n\r]/,
  },
] as LexerToken[]

const parser = new Parser()

parser.lexer.ignore([/^[ \t\v\r]+/])

parser.setGrammar([
  {
    exp: `Programm ::=
        Statements`,
  },
  {
    exp: `Statements ::=
        Statement
      | Statements StatementItem`,
  },
  {
    exp: `StatementItem ::=
        Statement
      | Declaration`,
  },
  {
    exp: `Statement ::=
        VariableStatement`,
  },
  {
    exp: `VariableStatement ::=
        Identifier Initializer?`,
  },
  {
    exp: `Initializer ::=
        "=" AssignmentExpression`,
  },
  {
    exp: `AssignmentExpression ::=
        NumericLiteral`,
  },
  {
    exp: `Identifier ::=
        IdentifierStart IdentifierPart?`,
  },
  {
    exp: `IdentifierStart ::=
        [$A-z]+`,
  },
  {
    exp: `IdentifierPart ::=
        [A-z0-9_-]*`,
  },
  {
    exp: `NumericLiteral ::=
        Integers "." Integers
      | Integers`,
  },
  {
    exp: `Integers ::=
        [0-9]+`,
  },
])

parser.lexer.addTokens(tokens as any)

parser.onError = error => {
  console.log(error.token)

  printChart(error.chart)
}

const inputExpression = `a = 0.1`

parser.parse(inputExpression, ({ chart, time, parseTree }) => {
  printChart(chart)

  printParseTree(parseTree[0][0] as any)

  console.log({ time })
})
