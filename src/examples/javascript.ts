import { ASI } from '../modules/asi'
import { EMPTY } from '../modules/grammar/constants'
import { Parser } from '../modules/parser'
import { GrammarRules, LexerToken, ParseTreeNode, SemanticAction } from '../types'
import { printAST, printChart, printParseTree } from '../utils'

const createSwitchStatementNode: SemanticAction = ({ children = [], type }) => ({
  type,
  discriminant: children[0],
  cases: children[3] ? [children[3], children[4]] : [],
})

const createArrowExpressionNode: SemanticAction = ({ children, start, end }) => ({
  type: 'ArrowFunctionExpression',
  start,
  end,
  params: children![0],
  body: children![2],
})

const createSwitchCaseNode: SemanticAction = ({ children }) => ({
  type: 'SwitchCase',
  test: children![0],
  consequent: children![1],
})

const createNewExpressionNode: SemanticAction = ({ children }) => ({
  type: 'NewExpression',
  callee: children![1],
  arguments: children![2] ? children![2].children : [],
})

const createUnaryExpressionNode: SemanticAction = ({ type, children }) => {
  const [operator, argument] = children!

  return {
    type,
    operator: operator.value,
    argument,
    prefix: false,
  }
}

const createUpdateExpressionNode: SemanticAction = ({ children }) => {
  const [argument, operator] = children!

  return {
    type: 'UpdateExpression',
    operator: operator.value,
    argument,
    prefix: false,
  }
}

const createBinaryExpressionNode: SemanticAction = ({ children, ...rest }) => {
  const [left, operator, right] = children!

  if (children!.length === 1) return left

  if (children!.length === 2) return createUpdateExpressionNode({ children, ...rest })

  return {
    type: 'BinaryExpression',
    operator: operator.value,
    left,
    right,
  }
}

const createLogicalExpressionNode: SemanticAction = ({ children }) => {
  const [left, operator, right] = children!

  if (children!.length === 1) return left

  return {
    type: 'LogicalExpression',
    operator,
    left,
    right,
  }
}

const createLeafNode: SemanticAction = ({ children = [], type }) => {
  const { value: name, start, end } = children[0]

  return {
    type,
    start,
    end,
    name,
  }
}

const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

const returnValueFromNode: SemanticAction = ({ children = [] }) => children[0].value

const createNodeList: SemanticAction = ({ children = [] }) => {
  if (children.length === 0) return [[]]
  if (children.length === 1) return [children] as any
  ;(children[0] as any).push(children[2])

  return [children[0]]
}

const keywords = [
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]

const tokens = [
  {
    name: 'BEGINCOMMENT',
    reg: /^\/\*/,
    begin: 'COMMENT',
  },
  {
    name: 'NEWLINE',
    reg: /^[\n\r]/,
    shouldTokenize: lexer => {
      const nextToken = lexer.peak()

      lexer.skipLines(1)

      /*
        If set to true newlines are tokenized and used for automated semicolon insertion.
      */

      return nextToken && nextToken.name === 'NEWLINE' ? false : true
    },
  },
  ['SEMI', /^;/],
  ['THIS'],
  {
    name: 'NULL',
    reg: /^null/,
    value: () => null,
  },
  ['FALSE'],
  ['TRUE'],
  {
    name: 'NUMBER',
    reg: /^[0-9]+(?:\.?[0-9]+)*/,
    value: parseFloat,
  },
  {
    name: 'STRING',
    reg: /^((?:"(?:[^"\\]|(?:\\.))*")|'(?:[^'\\]|(?:\\.))*')/,
    value: str => str.slice(1, -1),
  },
  ['SWITCH'],
  ['CASE'],
  ['DEFAULT'],
  ['NEW'],
  ['TRY'],
  ['CATCH'],
  ['FINALLY'],
  ['THROW'],
  ['DO'],
  ['WHILE'],
  ['FUNCTION'],
  ['RETURN'],
  ['BREAK'],
  ['CONTINUE'],
  ['VOID'],
  ['AS'],
  ['FROM'],
  ['DELETE'],
  ['COMMA', /^,/],
  ['DOT', /^\./],
  ['PERIOD', /^\:/],
  ['CONST'],
  ['LET'],
  ['VAR'],
  ['IF'],
  ['ELSE'],
  ['FOR'],
  ['IN'],
  ['OF'],
  ['TYPEOF'],
  ['INSTANCEOF'],
  ['IMPORT'],
  {
    name: 'IDENTIFIER',
    reg: /^[$a-zA-Z]+(?:[a-zA-Z_\-]+)*/,
    onEnter: (_lexer, match: string) => !keywords.includes(match),
  },

  // ['IDENTIFIER', new RegExp(`^(?!(${keywords.join('|')})\b)[$a-zA-Z]+(?:[a-zA-Z_\-]+)*`)],
  ['PLUSIS', /^\+=/],
  ['MULTIPLY', /^\*/],
  ['DIVIDE', /^\//],
  ['INCREMENT', /^\+{2}/],
  ['MODULUS', /^\%/],
  ['PLUS', /^\+/],
  ['DECREMENT', /^\-{2}/],
  ['MINUS', /^\-/],
  ['TENARY', /^\?/],
  ['ARROW', /^=>/],
  ['NOTSTRICTEQUAL', /^\!==/],
  ['STRICTEQUAL', /^===/],
  ['EQUALEQUAL', /^==/],
  ['NOTEQUAL', /^\!=/],
  ['LOGNOT', /^\!/],
  ['EQUAL', /^=/],
  ['LT', /^</],
  ['LTEQ', /^<=/],
  ['GT', /^>/],
  ['GTEQ', /^>=/],
  ['LOGOR', /^\|{2}/],
  ['XLOGOR', /^\^/],
  ['LOGAND', /^&{2}/],
  ['BINOR', /^\|{1}/],
  ['NOT', /^~/],
  ['BINAND', /^&{1}/],
  ['LPAREN', /^\(/],
  ['RPAREN', /^\)/],
  ['LCBRACE', /^\{/],
  ['RCBRACE', /^\}/],
  ['LBRACK', /^\[/],
  ['RBRACK', /^\]/],
] as LexerToken[]

const grammar = [
  /* Program */
  {
    exp: `Program :
         Script
       | Module `,
    action: ({ type, children: body, start, end }) => ({
      type,
      start,
      end,
      body,
      directives: [],
    }),
  },

  /* Scripts and Modules */

  /* Scripts */
  {
    exp: `Script : ScriptBody?`,
    action: ({ type, children: body, start, end }) => ({
      type,
      start,
      end,
      body,
      directives: [],
    }),
  },
  {
    exp: `ScriptBody : StatementList`,
    action: skipNode,
  },
  /* Modules */
  {
    exp: `Module : ModuleBody?`,
    action: skipNode,
  },
  {
    exp: `ModuleBody : ModuleItemList`,
    action: skipNode,
  },
  {
    exp: `ModuleItemList :
        ModuleItem
      | ModuleItemList ModuleItem`,
    action: skipNode,
  },
  {
    exp: `ModuleItem :
        ImportDeclaration
      | ExportDeclaration
      | StatementListItem[Await]`,
    action: skipNode,
  },
  {
    exp: `ModuleExportName :
        IdentifierName
      | StringLiteral`,
    action: skipNode,
  },
  /* Expressions */

  /* Primary Expressions */
  {
    exp: `PrimaryExpression :
        SimpleExpression
      | ObjectLiteral
      | FunctionExpression`,
    action: skipNode,
  },
  {
    exp: `SimpleExpression :
        This
      | Null
      | Boolean
      | StringLiteral
      | Number
      | Identifier
      | ParenthesizedExpression
      | ArrayLiteral`,
    action: skipNode,
  },
  {
    exp: 'ParenthesizedExpression : LPAREN Expression RPAREN',
    action: ({ children = [] }) => children[1],
  },
  /* Function Expressions */
  {
    exp: `FunctionExpression :
        AnonymousFunction
      | FunctionDeclaration`,
    action: ({ children = [] }) => {
      children[0].type = 'FunctionExpression'

      return children
    },
  },
  /* Object literals */
  {
    exp: `ObjectLiteral :
        LCBRACE RCBRACE
      | LCBRACE FieldList RCBRACE`,
    action: ({ type, children = [] }) => ({
      type,
      properties: children.length === 2 ? [] : children[1],
    }),
  },
  {
    exp: `FieldList :
        LiteralField
      | FieldList COMMA LiteralField`,
    action: createNodeList,
  },
  {
    exp: `LiteralField :
        Identifier PERIOD AssignmentExpression`,
    action: ({ children = [] }) => ({
      type: 'Property',
      key: children[0],
      value: children[2],
      kind: 'init',
    }),
  },
  /* Array literals  */
  {
    exp: `ArrayLiteral :
        LBRACK RBRACK
      | LBRACK ElementList RBRACK`,
    action: ({ children = [] }) => ({
      type: 'ArrayExpression',
      elements: children.length === 2 ? [] : children[1],
    }),
  },
  {
    exp: `ElementList :
        LiteralElement
      | ElementList COMMA LiteralElement`,
    action: createNodeList,
  },
  {
    exp: 'LiteralElement : AssignmentExpression',
    action: skipNode,
  },
  /* Left-Side expression */
  {
    exp: `LeftSideExpression :
        CallExpression
      | ShortNewExpression`,
    action: skipNode,
  },
  {
    exp: `ShortNewExpression :
        NEW ShortNewSubexpression`,
    action: createNewExpressionNode,
  },
  {
    exp: `FullNewExpression :
        NEW FullNewSubexpression Arguments`,
    action: createNewExpressionNode,
  },
  {
    exp: `ShortNewSubexpression :
        FullNewSubexpression
      | ShortNewExpression`,
    action: skipNode,
  },
  {
    exp: `FullNewSubexpression :
        PrimaryExpression
      | FullNewExpression
      | FullNewSubexpression MemberOperator`,
    action: ({ children = [] }) => {
      if (children.length === 1) return children

      return {
        type: 'MemberExpression',
        propery: (children[1] as any).property,
        object: children[0],
        computed: (children[1] as any).computed,
      }
    },
  },
  {
    exp: `CallExpression :
        PrimaryExpression
      | FullNewExpression
      | CallExpression Arguments
      | CallExpression MemberOperator`,
    action: ({ children = [] }) => {
      if (children.length === 1) return children

      if (children[1].type === 'MemberOperator') {
        return {
          type: 'MemberExpression',
          propery: (children[1] as any).property,
          object: children[0],
          computed: (children[1] as any).computed,
        }
      }

      if (children[1].type === 'Arguments') {
        return {
          type: 'CallExpression',
          callee: children[0],
          arguments: children[1].children,
        }
      }

      return children[1]
    },
  },
  {
    exp: `MemberOperator :
        LBRACK Expression RBRACK
      | DOT Identifier`,
    action: ({ type, children = [] }) => ({
      type,
      property: children[1],
      computed: children.length === 3,
    }),
  },
  {
    exp: `Arguments :
        LPAREN RPAREN
      | LPAREN ArgumentList RPAREN`,
    action: ({ type, children = [] }) => ({
      type,
      children: children.length === 3 ? children[1] : [],
    }),
  },
  {
    exp: `ArgumentList :
        AssignmentExpression
      | ArgumentList COMMA AssignmentExpression`,
    action: createNodeList,
  },
  /* Postfix Operators */
  {
    exp: `PostfixExpression :
        LeftSideExpression
      | LeftSideExpression INCREMENT
      | LeftSideExpression DECREMENT`,
    action: ({ children = [], ...rest }) => {
      if (children.length === 2)
        return createUpdateExpressionNode({
          children: [children[0], children[1]],
          ...rest,
        })

      return children
    },
  },
  /* Statements */
  {
    exp: `StatementList[Yield, Await, Return] :
        StatementListItem[?Yield, ?Await, ?Return]
      | StatementList[?Yield, ?Await, ?Return] StatementListItem[?Yield, ?Await, ?Return]`,
    action: skipNode,
  },
  {
    exp: `StatementListItem[Yield, Await, Return] :
        Statement[?Yield, ?Await, ?Return]
      | Declaration[?Yield, ?Await]`,
    action: skipNode,
  },
  {
    exp: `Statement :
        EmptyStatement
      | ExpressionStatement OptSemi
      | VariableStatement OptSemi
      | Block
      | IfStatement
      | SwitchStatement
      | DoWhileStatement OptSemi
      | WhileStatement
      | ForStatement
      | ContinueStatement OptSemi
      | BreakStatement OptSemi
      | ReturnStatement OptSemi,
      | ThrowStatement OptSemi
      | TryStatement`,
    action: skipNode,
  },
  /* Empty Statement */
  {
    exp: 'EmptyStatement : SEMI',
    action: ({ type }) => ({ type }),
  },
  {
    exp: `ExpressionStatement :
        Expression`,
    action: ({ type, children = [], start, end }) => ({
      type,
      start,
      end,
      expression: children[0],
    }),
  },
  {
    exp: 'OptSemi : SEMI',
    action: () => null,
  },
  /* Block Statement*/
  {
    exp: `Block :
        LCBRACE BlockStatements RCBRACE`,
    action: ({ children = [] }) => ({
      type: 'BlockStatement',
      body: children[1],
    }),
  },
  {
    exp: `BlockStatements :
        ${EMPTY}
      | BlockStatementsPrefix`,
    action: ({ children }) => [children],
  },
  {
    exp: `BlockStatementsPrefix :
        Statement
      | BlockStatementsPrefix Statement`,
    action: skipNode,
  },
  /* Return Statement */
  {
    exp: 'ReturnStatement : RETURN OptionalExpression',
    action: ({ type, children = [], start, end }) => ({
      type,
      start,
      end,
      argument: children[1],
    }),
  },
  /* Continue and Break Statements */
  {
    exp: `BreakStatement :
        BREAK OptionalLabel`,
    action: ({ type, children = [] }) => ({ type, label: children[1] || null }),
  },
  {
    exp: `ContinueStatement :
        CONTINUE OptionalLabel`,
    action: ({ type, children = [] }) => ({ type, label: children[1] || null }),
  },
  {
    exp: `OptionalLabel :
        ${EMPTY}
      | Identifier`,
    action: skipNode,
  },
  /* For Statements */
  {
    exp: `ForStatement :
        FOR LPAREN ForInitializer SEMI OptionalExpression SEMI OptionalExpression RPAREN Statement
      | FOR LPAREN ForInBinding IN Expression RPAREN Statement`,
    action: ({ type, children = [] }) => {
      if (children.length === 9) {
        return {
          type,
          init: children[2],
          test: children[4],
          update: children[6],
          body: children[8],
        }
      }

      return {
        type: 'ForInStatement',
        left: children[2],
        right: children[4],
        body: children[6],
      }
    },
  },
  {
    exp: `ForInitializer :
        ${EMPTY}
      | Expression
      | VAR VariableDeclarationList
      | LetOrConst VariableDeclarationList`,
    action({ children = [], ...rest }) {
      if (children.length === 2) {
        return {
          type: 'VariableDeclaration',
          declarations: [children[1]],
          kind: returnValueFromNode({ children, ...rest }),
        }
      }

      return children
    },
  },
  {
    exp: `ForInBinding :
        LeftSideExpression
      | VAR VariableDeclaration
      | LetOrConst VariableDeclaration`,
    action({ children = [], ...rest }) {
      if (children.length === 2) {
        return {
          type: 'VariableDeclaration',
          declarations: [children[1]],
          kind: returnValueFromNode({ children, ...rest }),
        }
      }

      return children
    },
  },
  /* Switch Statement */
  {
    exp: `SwitchStatement :
        SWITCH ParenthesizedExpression LCBRACE RCBRACE
      | SWITCH ParenthesizedExpression LCBRACE CaseGroups LastCaseGroup RCBRACE`,
    action: createSwitchStatementNode,
  },
  {
    exp: `CaseGroups :
        ${EMPTY}
      | CaseGroups CaseGroup`,
    action: skipNode,
  },
  {
    exp: `CaseGroup :
        CaseGuards BlockStatementsPrefix`,
    action: createSwitchCaseNode,
  },
  {
    exp: `LastCaseGroup :
        CaseGuards BlockStatements`,
    action: createSwitchCaseNode,
  },
  {
    exp: `CaseGuards :
        CaseGuard
      | CaseGuards CaseGuard`,
    action: skipNode,
  },
  {
    exp: `CaseGuard :
        CASE Expression PERIOD
      | DEFAULT PERIOD`,
    action: ({ children = [] }) => (children.length === 3 ? children[1] : [null]),
  },
  /* Do-While Statement */
  {
    exp: `DoWhileStatement :
        DO Statement WHILE ParenthesizedExpression`,
    action: ({ children = [], type }) => ({
      type,
      body: children[1],
      test: children[3],
    }),
  },
  /* While Statement */
  {
    exp: `WhileStatement :
        WHILE ParenthesizedExpression Statement`,
    action: ({ children = [], type }) => ({
      type,
      body: children[2],
      test: children[1],
    }),
  },
  /* If Statement */
  {
    exp: `IfStatement :
        IF ParenthesizedExpression Statement
      | IF ParenthesizedExpression Statement ELSE Statement`,
    action: ({ type, children = [] }) => ({
      type,
      test: children[1],
      consequent: children[2],
      alternate: children.length === 5 ? children[4] : null,
    }),
  },
  {
    exp: `LexicalDeclaration : LetOrConst BindingList`,
    action: ({ children = [], ...rest }) => ({
      type: 'VariableDeclaration',
      declarations: children[1],
      kind: returnValueFromNode({ children, ...rest }),
    }),
  },
  {
    exp: `LetOrConst :
        LET
      | CONST`,
  },
  {
    exp: `BindingList :
        LexicalBinding
      | BindingList COMMA LexicalBinding`,
    action: createNodeList,
  },
  {
    exp: `LexicalBinding :
        BindingIdentifier Initializer?
      | BindingPattern Initializer`,
    action: ({ children = [] }) => ({
      type: 'VariableDeclarator',
      id: children[0],
      init: children[1] || null,
    }),
  },
  {
    exp: 'VariableStatement : VAR VariableDeclarationList',
    action: ({ children = [], ...rest }) => ({
      type: 'VariableDeclaration',
      declarations: children[1],
      kind: returnValueFromNode({ children, ...rest }),
    }),
  },
  {
    exp: `VariableDeclarationList :
        VariableDeclaration
      | VariableDeclarationList COMMA VariableDeclaration`,
    action: createNodeList,
  },
  {
    exp: `VariableDeclaration : BindingIdentifier Initializer?`,
    action: ({ children = [] }) => ({
      type: 'VariableDeclarator',
      id: children[0],
      init: children[1] || null,
    }),
  },
  {
    exp: 'Initializer : EQUAL AssignmentExpression',
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `TryStatement :
        TRY Block Catch
      | TRY Block Finally
      | TRY Block Catch Finally`,
    action: ({ type, children = [] }) => {
      const hasCatchClause = children[2].type === 'CatchClause'

      return {
        type,
        block: children[1],
        handler: hasCatchClause ? children[2] : null,
        finalizer: (hasCatchClause ? children[3] : children[2]) || null,
      }
    },
  },
  {
    exp: `Catch :
        CATCH LPAREN IdentifierName RPAREN Block`,
    action: ({ children = [] }) => ({
      type: 'CatchClause',
      param: children[2],
      body: children[4],
    }),
  },
  {
    exp: `Finally :
        FINALLY Block`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `ThrowStatement :
        THROW Expression`,
    action: ({ type, children = [] }) => ({
      type,
      argument: children[1],
    }),
  },
  {
    exp: `Expression :
        AssignmentExpression
      | SequenceExpression`,
    action: skipNode,
  },
  {
    exp: `SequenceExpression :
        Expression COMMA AssignmentExpression`,
    action: ({ children = [] }) => ({
      type: 'SequenceExpression',
      expressions: [children[0], children[2]],
    }),
  },
  {
    exp: `OptionalExpression :
        Expression
      | ${EMPTY}`,
    action: skipNode,
  },
  {
    exp: `AssignmentExpression :
        ConditionalExpression
      | ArrowFunction
      | LeftSideExpression EQUAL AssignmentExpression
      | LeftSideExpression CompoundAssignment AssignmentExpression`,
    action({ type, children = [], start, end }) {
      const [left, operator, right] = children

      if (children.length === 1) return left

      return {
        type,
        operator,
        left,
        right,
        start,
        end,
      }
    },
  },
  {
    exp: `CompoundAssignment :
        "*="
      | "/="
      | "%="
      | "+="
      | "-="
      | "<<="
      | ">>="
      | ">>>="
      | "&="
      | "^="
      | "|="`,
    action: returnValueFromNode,
  },
  {
    exp: `ConditionalExpression :
        LogicalOrExpression
      | LogicalOrExpression TENARY AssignmentExpression PERIOD AssignmentExpression`,
    action({ type, children = [] }) {
      if (children.length === 1) return children[0]

      return {
        type,
        test: children[0],
        alternate: children[2],
        consequence: children[4],
      }
    },
  },
  {
    exp: `LogicalOrExpression :
        LogicalAndExpression
      | LogicalOrExpression LOGOR LogicalAndExpression`,
    action: createLogicalExpressionNode,
  },
  {
    exp: `LogicalAndExpression :
        BitwiseOrExpression
      | LogicalAndExpression LOGAND BitwiseOrExpression`,
    action: createLogicalExpressionNode,
  },
  {
    exp: `BitwiseOrExpression :
        BitwiseXorExpression
      | BitwiseOrExpression BINOR BitwiseXorExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `BitwiseXorExpression :
        BitwiseAndExpression
      | BitwiseXorExpression XOR BitwiseAndExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `BitwiseAndExpression :
        EqualityExpression
      | BitwiseAndExpression BINAND EqualityExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `EqualityExpression :
        RelationalExpression
      | EqualityExpression EQUALEQUAL RelationalExpression
      | EqualityExpression NOTEQUAL RelationalExpression
      | EqualityExpression STRICTEQUAL RelationalExpression
      | EqualityExpression NOTSTRICTEQUAL RelationalExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `RelationalExpression :
        ShiftExpression
      | RelationalExpression LT ShiftExpression
      | RelationalExpression GT ShiftExpression
      | RelationalExpression LTEQ ShiftExpression
      | RelationalExpression GTEQ ShiftExpression
      | RelationalExpression INSTANCEOF ShiftExpression
      | RelationalExpression IN ShiftExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `ShiftExpression :
        AdditiveExpression
      | ShiftExpression "<<" AdditiveExpression
      | ShiftExpression ">>" AdditiveExpression
      | ShiftExpression ">>>" AdditiveExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `AdditiveExpression :
        MultiplicativeExpression
      | AdditiveExpression PLUS MultiplicativeExpression
      | AdditiveExpression MINUS MultiplicativeExpression`,
    action: createBinaryExpressionNode,
  },
  {
    exp: `MultiplicativeExpression :
        UnaryExpression
      | MultiplicativeExpression MULTIPLY UnaryExpression
      | MultiplicativeExpression MODULUS UnaryExpression`,
    action: skipNode,
  },
  {
    exp: `UnaryExpression :
        PostfixExpression
      | DELETE LeftSideExpression
      | VOID UnaryExpression
      | TYPEOF UnaryExpression
      | INCREMENT LeftSideExpression
      | DECREMENT LeftSideExpression
      | PLUS UnaryExpression
      | MINUS UnaryExpression
      | NOT UnaryExpression
      | LOGNOT UnaryExpression`,
    action: node => {
      if (node.children?.length === 1) return skipNode(node)

      const { children = [], ...rest } = node

      if (['++', '--'].includes(children[0].value))
        return createUpdateExpressionNode({
          children: [children[1], children[0]],
          ...rest,
        })

      return createUnaryExpressionNode(node)
    },
  },
  {
    exp: 'Identifier : IDENTIFIER',
    action: createLeafNode,
  },
  {
    exp: 'IdentifierName : Identifier',
    action: createLeafNode,
  },
  {
    exp: `BindingIdentifier : Identifier`,
    action: skipNode,
  },
  {
    exp: 'Number : NUMBER',
    action: createLeafNode,
  },
  {
    exp: 'StringLiteral : STRING',
    action: createLeafNode,
  },
  {
    exp: 'Null : NULL',
    action: createLeafNode,
  },
  {
    exp: 'This : THIS',
    action: createLeafNode,
  },
  {
    exp: 'Boolean : TRUE | FALSE',
    action: createLeafNode,
  },
  /* Function Declaration */
  {
    exp: 'FunctionDeclaration : FUNCTION Identifier FormalParametersListAndBody',
    action: ({ type, children = [] }) => ({
      type,
      id: children[1],
      params: children[2],
      body: children[3],
    }),
  },
  {
    exp: 'AnonymousFunction : FUNCTION FormalParametersListAndBody',
    action: ({ type, children = [] }) => ({
      type,
      id: null,
      params: children[1],
      body: children[2],
    }),
  },
  {
    exp: 'FormalParametersListAndBody : LPAREN FormalParameterList RPAREN LCBRACE FunctionBody RCBRACE',
    action: ({ children = [] }) => [
      children[1],
      {
        type: 'BlockStatement',
        body: children[4],
      },
    ],
  },
  {
    exp: 'FunctionBody : SourceElements',
    action: ({ children = [] }) => (children.length ? [children] : [[]]),
  },
  {
    exp: `ArrowFunction : ArrowParameters ARROW ConciseBody`,
    action: createArrowExpressionNode,
  },
  {
    exp: `ArrowParameters :
        BindingIdentifier
     |  CoverParenthesizedExpressionAndArrowParameterList`,
    action: skipNode,
  },
  {
    exp: `ConciseBody :
        AssignmentExpression
      | LCBRACE FunctionBody RCBRACE`,
    action: ({ children = [], start, end }) =>
      children.length === 1
        ? children[0]
        : {
            type: 'BlockStatement',
            start,
            end,
            body: children[1],
          },
  },
  {
    exp: `CoverParenthesizedExpressionAndArrowParameterList : ArrowFormalParameters`,
    action: skipNode,
  },
  {
    exp: `ArrowFormalParameters : LPAREN StrictFormalParameters RPAREN`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `StrictFormalParameters : FormalParameters`,
    action: skipNode,
  },
  {
    exp: `FormalParameters :
        ${EMPTY}
      | FormalParameterList`,
    action: skipNode,
  },
  {
    exp: `FormalParameterList :
        ${EMPTY}
      | Identifier
      | FormalParameterList COMMA Identifier`,
    action: createNodeList,
  },
  /* Imports */
  {
    exp: `ImportDeclaration :
        IMPORT ImportClause FromClause SEMI
      | IMPORT ModuleSpecifier SEMI`,
  },
  {
    exp: `ImportClause :
        ImportedDefaultBinding
      | NameSpaceImport
      | NamedImports
      | ImportedDefaultBinding COMMA NameSpaceImport
      | ImportedDefaultBinding COMMA NamedImports`,
  },
  {
    exp: `ImportedDefaultBinding :
        ImportedBinding`,
  },
  {
    exp: `NameSpaceImport :
        MULTIPLY AS ImportedBinding`,
  },
  {
    exp: `NamedImports :
        LCBRACE RCBRACE
      | LCBRACE ImportsList RCBRACE
      | LCBRACE ImportsList COMMA RCBRACE`,
  },
  {
    exp: `FromClause :
        FROM ModuleSpecifier`,
  },
  {
    exp: `ImportsList :
        ImportSpecifier
      | ImportsList COMMA ImportSpecifier`,
  },
  {
    exp: `ImportSpecifier :
        ImportedBinding
      | IdentifierName AS ImportedBinding`,
  },
  {
    exp: `ModuleSpecifier :
        StringLiteral`,
  },
  {
    exp: `ImportedBinding :
        BindingIdentifier`,
  },
] as GrammarRules

const input = `
import { foo } from "./foo";
`

const comments: any[] = []

const parser = new Parser()

parser.onError = error => {
  try {
    return ASI(parser, error)
  } catch (ASIError) {
    printChart(error.chart)
  }
}

parser.lexer.addTokens(tokens)

parser.lexer.setState('COMMENT', lexer => {
  lexer.setTokens([
    {
      name: 'ENDCOMMENT',
      reg: /^\*\//,
      begin: 'INITIAL',
      onEnter(lexer, value = '') {
        const numberOfLines = (value.match(/\n/g) || []).length

        comments.push({
          type: 'CommentBlock',
          value,
        })

        lexer.skipLines(numberOfLines)
      },
    },
  ])

  lexer.ignore([/^[ \t\v\r]+/])
  lexer.onError(lexer => lexer.skip(1))
})

parser
  .ignore([/^[ \t\v\r]+/, /^\/\/.*/])
  .setGrammar(grammar)
  .parse(input, ({ AST, time, chart, parseTree }) => {
    console.log({ time })

    const [script] = AST

    printParseTree(parseTree[0][0] as any)

    printAST(
      `<pre>${JSON.stringify(
        {
          type: 'File',
          script,
          comments,
        },
        null,
        2
      )}</pre>`
    )

    printChart(chart)

    // console.log(JSON.stringify(AST, null, 4))
  })
