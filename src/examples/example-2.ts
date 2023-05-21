import { Parser } from '..'
import { LexerToken } from '../types'
import { printChart, printParseTree } from '../utils'

const tokens = [
  {
    name: 'NEWLINE',
    test: /^[\n\r]/,
    shouldTokenize: false,
    lineBreaks: true,
  },
  ['DoubleQuotedString', /^"[^"]*"/],
  ['SingleQuotedString', /^'[^']*'/],
] as LexerToken[]

const parser = new Parser()

parser.lexer.ignoreTokens([/^[ \t\v\r]+/])

parser.lexer.addTokens(tokens as any)

parser.setGrammar([
  {
    exp: `Program :
        Statements`,
  },
  {
    exp: `Statements :
        StatementItem
      | Statements StatementItem`,
  },
  {
    exp: `StatementItem :
        Statement
      | Declaration`,
  },
  {
    exp: `Statement :
      | ExpressionStatement ";"
      | BlockStatement`,
  },
  {
    exp: `Declaration :
        FunctionDeclaration
      | LexicalDeclaration`,
  },
  {
    exp: `LexicalDeclaration :
        LetOrConst BindingList ";"`,
  },
  {
    exp: `LetOrConst :
        "let"
      | "const"`,
  },
  {
    exp: `BindingList :
        LexicalBinding
      | BindingList "," LexicalBinding`,
  },
  {
    exp: `LexicalBinding :
        BindingIdentifer Initializer?`,
  },
  {
    exp: `BindingIdentifer :
        Identifier`,
  },
  {
    exp: `BlockStatement :
        "{" Statements? "}"`,
  },
  {
    exp: `Initializer :
        "=" AssignmentExpression`,
  },
  {
    exp: `ExpressionStatement :
        Expression`,
  },
  {
    exp: `Expression :
        AssignmentExpression
      | Expression "," AssignmentExpression`,
  },
  {
    exp: `EqualityExpression :
        AdditiveExpression
      | EqualityExpression "==" AdditiveExpression`,
  },
  {
    exp: `AssignmentExpression :
        ConditionalExpression
      | LeftHandSideExpression
      | LeftHandSideExpression "=" AssignmentExpression`,
  },
  {
    exp: `ConditionalExpression :
        EqualityExpression
      | EqualityExpression "?" AssignmentExpression ":" AssignmentExpression`,
  },
  {
    exp: `AdditiveExpression :
        MultiplicativeExpression
      | AdditiveExpression [+-] MultiplicativeExpression`,
  },
  {
    exp: `MultiplicativeExpression :
        LeftHandSideExpression
      | MultiplicativeExpression [*/%] LeftHandSideExpression`,
  },
  {
    exp: `LeftHandSideExpression :
        CallExpression
      | MemberExpression`,
  },
  {
    exp: `CallExpression :
        CoverCallExpression`,
  },
  {
    exp: `CoverCallExpression :
        MemberExpression Arguments`,
  },
  {
    exp: `MemberExpression :
        PrimaryExpression`,
  },
  {
    exp: `Arguments :
        "(" ArgumentList ")"`,
  },
  {
    exp: `ArgumentList :
        AssignmentExpression
      | ArgumentList "," AssignmentExpression`,
  },
  {
    exp: `PrimaryExpression :
        Identifier
      | Literal
      | ObjectLiteral
      | CoverParenthesizedExpression`,
  },
  {
    exp: `CoverParenthesizedExpression :
        "(" Expression? ")"`,
  },
  {
    exp: `Literal :
        NumericLiteral
      | StringLiteral`,
  },
  {
    exp: `NumericLiteral :
        Integers "." Integers
      | Integers`,
  },
  {
    exp: `StringLiteral :
        DoubleQuotedString
      | SingleQuotedString`,
  },
  {
    exp: `ObjectLiteral :
        "{" ObjectProperties? "}"`,
  },
  {
    exp: `ObjectProperties :
        ObjectProperty
      | ObjectProperties "," ObjectProperty`,
  },
  {
    exp: `ObjectProperty :
        Identifier ":" AssignmentExpression`,
  },
  {
    exp: `Integers :
        [0-9]+`,
  },
  {
    exp: `Identifier :
        IdentifierStart IdentifierPart?`,
  },
  {
    exp: `IdentifierStart :
        [$A-z]+`,
  },
  {
    exp: `IdentifierPart :
        [A-z0-9_-]*`,
  },
])

parser.onError = error => {
  console.log(error.token)

  printChart(error.chart)
}

const input = `
  const a = 0.1;
  const b = 0.2;

  const c = "Double quoted";
  const d = 'Single quoted';

  const object = {
    one: 1,
    two: 2,
    three: 3
  };

  const f = 1 / (2 + 2) * 3 / 4;

  foo(a, b);

  const g = a ? "a" : "b";
`

const start = performance.now()

parser.parse(input, ({ chart, parseTree }) => {
  const time = performance.now() - start

  printChart(chart)

  printParseTree(parseTree[0] as any)

  console.log({ time })

  let b = 1 + 2 == 3
})
