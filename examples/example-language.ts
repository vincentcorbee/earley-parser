import { Parser } from '../src'
import { LexerToken } from '../src/types'
import { printChart, printParseTree } from '../src/utils'

// const input = `
//   const decimal = 0.1;

//   const tuple: [string, string] = ['a', 'b'];

//   const doubleQuotedString = "I'm a String";
//   const singleQuotedString = 'Me too';

//   func calculate(a: number, b: number) => a + b

//   const object: {
//     one: number;
//     two: number;
//     three: number;
//   } = {
//     one: 1,
//     two: 2,
//     three: 3
//   };

//   {
//     let blockScoped: string | undefined;

//     blockScoped = 'foo';
//   }

//   const result = 1 / (2 + 2) * 3 / 4;

//   const calculation = calculate(1, 2);

//   const isTrue = true ? true : false;

//   class MyClass {
//     constructor() {

//     }
//   }
// `

const input = `
  class MyClass {
    private count: number;

    constructor() {}

    calculate(a: number, b: number): number {
      return a + b;
    }
  }
`

const tokens: LexerToken[] = [
  {
    name: 'NEWLINE',
    test: /^[\n\r]/,
    shouldTokenize: false,
    lineBreaks: true,
  },
  ['double_quote_string', /^"[^"]*"/],
  ['single_quoted_string', /^'[^']*'/],
]

const parser = new Parser()

parser.lexer.ignoreTokens([/^[ \t\v\r]+/])

parser.lexer.addTokens(tokens)

const types = [
  {
    exp: `TypeAnnotation :
      ":" Type`,
  },
  {
    exp: `Type :
        UnionType`,
  },
  {
    exp: `UnionType :
        PrimaryType
      | UnionType "|" IntersectionType`,
  },
  {
    exp: `IntersectionType :
        UnionType
      | IntersectionType "&" PrimaryType`,
  },
  {
    exp: `PrimaryType :
      PredefinedType
    | ObjectType
    | ArrayType
    | TupleType
    | TypeReference`,
  },
  {
    exp: `ArrayType :
        PrimaryType "[" "]"`,
  },
  {
    exp: `TupleType :
        "[" TupleList "]"`,
  },
  {
    exp: `TupleList :
        TupleItem
      | TupleList "," TupleItem`,
  },
  {
    exp: `TupleItem :
        Type`,
  },
  {
    exp: `TypeReference :
        Identifier TypeParameters?`,
  },
  {
    exp: `ObjectType :
        "{" TypeBody? "}"`,
  },
  {
    exp: `TypeBody :
        TypeMemberList ";"
      | TypeMemberList ","`,
  },
  {
    exp: `TypeMemberList :
        TypeMember
      | TypeMemberList ";" TypeMember
      | TypeMemberList "," TypeMember`,
  },
  {
    exp: `TypeMember :
        PropertySignature
      | CallSignature`,
  },
  {
    exp: `PropertySignature :
        PropertyName "?"? TypeAnnotation`,
  },
  {
    exp: `CallSignature:
        TypeParameters? "(" ParameterList? ")" TypeAnnotation?`,
  },
  {
    exp: `ParameterList :
        RequiredParameterList`,
  },
  {
    exp: `RequiredParameterList :
        RequiredParameter
      | RequiredParameterList "," RequiredParameter`,
  },
  {
    exp: `RequiredParameter :
        AccessibiltyModifier? BindingIdentifier`,
  },
  {
    exp: `PropertyName :
        Identifier`,
  },
  {
    exp: `PredefinedType :
      "string"
    | "number"
    | "null"
    | "undefined"
    | "void"
    | "this"
    | "any"
    | "unknown"`,
  },
  {
    exp: `TypeParameters :
      "<" TypeParametersList? ">"`,
  },

  {
    exp: `TypeParameterList :
      TypeParameter
    | TypeParameterList "," TypeParameter`,
  },
  {
    exp: `TypeParameter : Type`,
  },
]

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
      | BlockStatement
      | EmptyStatement
      | ReturnStatement`,
  },
  {
    exp: `EmptyStatement :
      ";"`,
  },
  {
    exp: `ReturnStatement :
        "return" ";"
      | "return" Expression ";"`,
  },
  {
    exp: `Declaration :
        FunctionDeclaration
      | ClassDeclaration
      | LexicalDeclaration`,
  },
  ...types,

  {
    exp: `ClassDeclaration :
        "class" BindingIdentifier ClassTail`,
  },
  {
    exp: `ClassTail :
        ClassHeritage? ImplementsClause? "{" ClassBody? "}"`,
  },
  {
    exp: `ClassHeritage :
        "extends" TypeReference`,
  },
  {
    exp: `ClassBody :
        ClassBodyElements`,
  },
  {
    exp: `ClassBodyElements :
        ClassBodyElement
      | ClassBodyElements ClassBodyElement`,
  },
  {
    exp: `ClassBodyElement :
        PropertyMemberDeclaration
      | ConstructorDeclaration`,
  },
  {
    exp: `PropertyMemberDeclaration :
        MemberVariableDeclaration
      | MemberFunctionDeclaration`,
  },
  {
    exp: `MemberVariableDeclaration :
      AccessibiltyModifier? "static"?  BindingIdentifier Initializer? ";"`,
  },
  {
    exp: `MemberFunctionDeclaration :
      AccessibiltyModifier? "static"? BindingIdentifier CallSignature "{" FunctionBody "}"`,
  },
  {
    exp: `ConstructorDeclaration :
      AccessibiltyModifier? "constructor" CallSignature "{" FunctionBody "}"`,
  },
  {
    exp: `AccessibiltyModifier :
        "public"
      | "private"`,
  },
  {
    exp: `FunctionDeclaration :
        "func" TypeParameters?  BindingIdentifier FunctionParameters "=>" ArrowFunctionBody`,
  },
  {
    exp: `ArrowFunctionBody :
        AssignmentExpression
      | "{" FunctionBody "}"`,
  },
  {
    exp: `FunctionBody :
        Statements?`,
  },
  {
    exp: `FunctionParameters :
      "(" FunctionParametersList? ")"`,
  },
  {
    exp: `FunctionParametersList :
        BindingList`,
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
        BindingIdentifier Initializer?`,
  },
  {
    exp: `BindingIdentifier :
        Identifier TypeAnnotation?`,
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
        "(" ArgumentList? ")"`,
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
      | ArrayLiteral
      | CoverParenthesizedExpression`,
  },
  {
    exp: `CoverParenthesizedExpression :
        "(" Expression? ")"`,
  },
  {
    exp: `Literal :
        NumericLiteral
      | StringLiteral
      | Boolean
      | This
      | Undefined
      | Null`,
  },
  { exp: `This : "this"` },
  { exp: `Undefined : "undefined"` },
  { exp: `Null : "null"` },
  {
    exp: `Boolean :
        "true"
      | "false"`,
  },
  {
    exp: `NumericLiteral :
        Integers "." Integers
      | Integers`,
  },
  {
    exp: `StringLiteral :
        double_quote_string
      | single_quoted_string`,
  },
  {
    exp: `ArrayLiteral :
        "[" ElementList? "]"`,
  },
  {
    exp: `ElementList :
        ElementListItem
      | ElementList "," ElementListItem`,
  },
  {
    exp: `ElementListItem :
        AssignmentExpression`,
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
        [A-z0-9_-]+`,
  },
])

parser.onError = error => {
  console.log(error.token)

  printChart(error.chart)
}

const start = performance.now()

parser.parse(input, parseTree => {
  const time = performance.now() - start

  //printChart(chart)

  printParseTree(parseTree[0] as any)

  console.dir({ time, parseTree }, { depth: null })
})
