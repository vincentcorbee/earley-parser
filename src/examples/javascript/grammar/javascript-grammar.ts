import { EMPTY } from '../../../modules/grammar/constants'
import { GrammarRules } from '../../../types'
import {
  createArrowExpressionNode,
  createBinaryExpressionNode,
  createFunctionBodyNode,
  createFunctionDeclarationNode,
  createImportDeclarationNode,
  createLeafNode,
  createLogicalExpressionNode,
  createNewExpressionNode,
  createNodeListNode,
  createObjectExpressionNode,
  createProgramNode,
  createSwitchCaseNode,
  createSwitchStatementNode,
  createUnaryExpressionNode,
  createUpdateExpressionNode,
  returnValueFromNode,
  skipNode,
} from './actions'

export const grammar = [
  /* Program */
  {
    exp: `Program :
         Script
       | Module `,
    action: createProgramNode,
  },

  /* Scripts and Modules */

  /* Scripts */
  {
    exp: `Script : ScriptBody?`,
    action: skipNode,
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
      | StatementListItem`,
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
    action: createObjectExpressionNode,
  },
  {
    exp: `FieldList :
        LiteralField
      | FieldList COMMA LiteralField`,
    action: createNodeListNode,
  },
  {
    exp: `LiteralField :
        Identifier COLON AssignmentExpression`,
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
    action: createNodeListNode,
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
    action: createNodeListNode,
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
    exp: `Declaration :
        HoistableDeclaration
      | ClassDeclaration
      | LexicalDeclaration
      | TypeDeclaration
      | InterfaceDeclaration
      | TypeAliasDeclaration`,
    action: skipNode,
  },
  {
    exp: `HoistableDeclaration :
        FunctionDeclaration`,
    action: skipNode,
  },
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
        CASE Expression COLON
      | DEFAULT COLON`,
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
    exp: `LexicalDeclaration : LetOrConst BindingList SEMI`,
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
    action: createNodeListNode,
  },
  {
    exp: `LexicalBinding :
        BindingIdentifier TypeAnnotation? Initializer?
      | BindingPattern TypeAnnotation? Initializer`,
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
    action: createNodeListNode,
  },
  {
    exp: `VariableDeclaration :
        BindingIdentifier TypeAnnotation? Initializer?
      | BindingPattern TypeAnnotation? Initializer`,
    action: ({ children = [] }) => ({
      type: 'VariableDeclarator',
      id: children[0],
      init: children[1] || null,
    }),
  },
  {
    exp: `Initializer :
      EQUAL AssignmentExpression`,
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
      | LogicalOrExpression TENARY AssignmentExpression COLON AssignmentExpression`,
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
      | RelationalExpression LANGLEBRACKET ShiftExpression
      | RelationalExpression RANGLEBRACKET ShiftExpression
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
    symbols: {
      IDENTIFIER: { accepts: { TYPE: true, INTERFACE: true } },
    },
  },
  {
    exp: 'IdentifierName : Identifier',
    action: skipNode,
  },
  {
    exp: `BindingIdentifier : Identifier`,
    action: skipNode,
  },
  {
    exp: `IdentifierReference : Identifier`,
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
    exp: `FunctionDeclaration :
        FUNCTION BindingIdentifier TypeParameters? LPAREN FormalParameters RPAREN TypeAnnotation? LCBRACE FunctionBody RCBRACE`,
    action: createFunctionDeclarationNode,
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
    exp: `FunctionBody :
        FunctionStatementList`,
    action: createFunctionBodyNode,
  },
  {
    exp: 'FunctionStatementList : StatementList?',
    action: skipNode,
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
    exp: `CoverParenthesizedExpressionAndArrowParameterList :
      ArrowFormalParameters`,
    action: skipNode,
  },
  {
    exp: `ArrowFormalParameters :
      LPAREN StrictFormalParameters RPAREN`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `StrictFormalParameters :
      FormalParameters`,
    action: skipNode,
  },
  {
    exp: `FormalParameters :
        ${EMPTY}
      | FunctionRestParameter
      | FormalParameterList
      | FormalParameterList COMMA
      | FormalParameterList COMMA FunctionRestParameter`,
    action: skipNode,
  },
  {
    exp: `FormalParameterList :
        FormalParameter
      | FormalParameterList COMMA FormalParameter`,
    action: skipNode,
  },
  {
    exp: `FunctionRestParameter :
      BindingRestElement`,
    action: skipNode,
  },
  {
    exp: `BindingRestElement :
        "..." BindingIdentifier`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `FormalParameter :
        BindingElement`,
    action: skipNode,
  },
  {
    exp: `BindingElement :
        SingleNameBinding`,
    action: skipNode,
  },
  {
    exp: `SingleNameBinding :
        BindingIdentifier TypeAnnotation? Initializer?
      | BindingIdentifier TENARY TypeAnnotation?`,
    action: skipNode,
  },

  /* Imports */
  {
    exp: `ImportDeclaration :
        IMPORT ImportClause FromClause SEMI
      | IMPORT ModuleSpecifier SEMI
      | IMPORT TYPE ImportClause FromClause SEMI`,
    action: createImportDeclarationNode,
  },
  {
    exp: `ImportClause :
        ImportedDefaultBinding
      | NameSpaceImport
      | NamedImports
      | ImportedDefaultBinding COMMA NameSpaceImport
      | ImportedDefaultBinding COMMA NamedImports`,
    action: ({ children = [] }) =>
      children.length === 1 ? children : [[children[0], children[2]]],
  },
  {
    exp: `ImportedDefaultBinding :
        ImportedBinding`,
    action: ({ children = [] }) => ({
      type: 'ImportDefaultSpecifier',
      local: children[0],
    }),
  },
  {
    exp: `NameSpaceImport :
        MULTIPLY AS ImportedBinding`,
    action: ({ children = [] }) => ({
      type: 'ImportNamespaceSpecifier',
      local: children[2],
    }),
  },
  {
    exp: `NamedImports :
        LCBRACE RCBRACE
      | LCBRACE ImportsList RCBRACE
      | LCBRACE ImportsList COMMA RCBRACE`,
    action: ({ children = [] }) => (children.length > 2 ? [children[1]] : []),
  },
  {
    exp: `FromClause :
        FROM ModuleSpecifier`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `ImportsList :
        ImportSpecifier
      | ImportsList COMMA ImportSpecifier`,
    action: ({ children = [] }) =>
      children.length === 1 ? [children[0]] : [[children[0], children[2]]],
  },
  {
    exp: `ImportSpecifier :
        ImportedBinding
      | IdentifierName AS ImportedBinding
      | TYPE ImportedBinding
      | TYPE ModuleExportName AS ImportedBinding`,
    action: ({ children = [], type }) => {
      return {
        type,
        imported: children[0],
        local: children.length > 1 ? children[2] : children[0],
      }
    },
  },
  {
    exp: `ModuleSpecifier :
        StringLiteral`,
    action: ({ children = [], type }) => ({ type, local: children[0] }),
  },
  {
    exp: `ImportedBinding :
        BindingIdentifier`,
    action: skipNode,
  },

  /* TypeScript */

  /* Types */

  {
    exp: `TypeParameters :
        LANGLEBRACKET TypeParameterList RANGLEBRACKET`,
  },
  {
    exp: `TypeParameterList :
        TypeParameter
      | TypeParameterList COMMA TypeParameter`,
  },
  {
    exp: `TypeParameter :
        BindingIdentifier Constraint?`,
  },
  {
    exp: `Constraint :
        EXTENDS Type`,
  },
  {
    exp: `TypeArguments :
        LANGLEBRACKET TypeArgumentList RANGLEBRACKET`,
  },
  {
    exp: `TypeArgumentList:
        TypeArgument
      | TypeArgumentList COMMA TypeArgument`,
  },
  {
    exp: `TypeArgument:
        Type`,
  },
  {
    exp: `Type:
        UnionOrIntersectionOrPrimaryType
      | FunctionType
      | ConstructorType`,
  },
  {
    exp: `UnionOrIntersectionOrPrimaryType:
        UnionType
      | IntersectionOrPrimaryType`,
  },
  {
    exp: `IntersectionOrPrimaryType:
        IntersectionType
      | PrimaryType`,
  },
  {
    exp: `PrimaryType:
        ParenthesizedType
      | PredefinedType
      | TypeReference
      | ObjectType
      | ArrayType
      | TupleType
      | TypeQuery
      | ThisType
      | StringLiteral
      | NULL`,
  },
  {
    exp: `ParenthesizedType:
        LPAREN Type RPAREN`,
  },
  {
    exp: `PredefinedType:
        "any"
      | "number"
      | "boolean"
      | "string"
      | "symbol"
      | "void"`,
  },
  {
    exp: `TypeReference:
      TypeName TypeArguments?`,
  },
  {
    exp: `TypeName:
        IdentifierReference
      | NamespaceName DOT IdentifierReference`,
  },
  {
    exp: `NamespaceName:
        IdentifierReference
      | NamespaceName DOT IdentifierReference`,
  },
  {
    exp: `ObjectType:
        LCBRACE TypeBody? RCBRACE`,
  },
  {
    exp: `TypeBody:
        TypeMemberList SEMI?
      | TypeMemberList COMMA?`,
  },
  {
    exp: `TypeMemberList:
        TypeMember
      | TypeMemberList SEMI TypeMember
      | TypeMemberList COMMA TypeMember`,
  },
  {
    exp: `TypeMember:
        PropertySignature
      | CallSignature
      | ConstructSignature
      | IndexSignature
      | MethodSignature`,
  },
  {
    exp: `ArrayType:
        PrimaryType LBRACK RBRACK`,
  },
  {
    exp: `TupleType:
        LBRACK TupleElementTypes RBRACK`,
  },
  {
    exp: `TupleElementTypes:
        TupleElementType
      | TupleElementTypes COMMA TupleElementType`,
  },
  {
    exp: `TupleElementType:
        Type`,
  },
  {
    exp: `UnionType:
        UnionOrIntersectionOrPrimaryType BINOR IntersectionOrPrimaryType`,
  },
  {
    exp: `IntersectionType:
        IntersectionOrPrimaryType BINAND PrimaryType`,
  },
  {
    exp: `FunctionType:
        TypeParameters? LPAREN ParameterList? RPAREN ARROW Type`,
  },
  {
    exp: `ConstructorType:
        NEW TypeParameters? LPAREN ParameterList? RPAREN ARROW Type`,
  },
  {
    exp: `TypeQuery:
      TYPEOF TypeQueryExpression`,
  },
  {
    exp: `TypeQueryExpression:
        IdentifierReference
      | TypeQueryExpression DOT IdentifierName`,
  },
  {
    exp: `ThisType:
        THIS`,
  },
  {
    exp: `PropertySignature:
        PropertyName TENARY? TypeAnnotation?`,
  },
  {
    exp: `PropertyName:
        IdentifierName
      | StringLiteral
      | NumericLiteral`,
  },
  {
    exp: `TypeAnnotation:
        COLON Type`,
  },
  {
    exp: `CallSignature:
        TypeParameters? LPAREN ParameterList? RPAREN TypeAnnotation?`,
  },
  {
    exp: `ParameterList:
        RequiredParameterList
      | OptionalParameterList
      | RestParameter
      | RequiredParameterList COMMA OptionalParameterList
      | RequiredParameterList COMMA RestParameter
      | OptionalParameterList COMMA RestParameter
      | RequiredParameterList COMMA OptionalParameterList COMMA RestParameter`,
  },
  {
    exp: `RequiredParameterList:
        RequiredParameter
      | RequiredParameterList COMMA RequiredParameter`,
  },
  {
    exp: `RequiredParameter:
        AccessibilityModifier? BindingIdentifierOrPattern TypeAnnotation?
      | BindingIdentifier COLON StringLiteral`,
  },
  {
    exp: `AccessibilityModifier:
        PUBLIC
      | PRIVATE
      | PROTECTED`,
  },
  {
    exp: `BindingIdentifierOrPattern:
        BindingIdentifier
      | BindingPattern`,
  },
  {
    exp: `OptionalParameterList:
        OptionalParameter
      | OptionalParameterList COMMA OptionalParameter`,
  },
  {
    exp: `OptionalParameter:
        AccessibilityModifier? BindingIdentifierOrPattern TENARY TypeAnnotation?
      | AccessibilityModifier? BindingIdentifierOrPattern TypeAnnotation? Initializer
      | BindingIdentifier TENARY COLON StringLiteral`,
  },
  {
    exp: `RestParameter:
        REST BindingIdentifier TypeAnnotation?`,
  },
  {
    exp: `ConstructSignature:
        NEW TypeParameters? LPAREN ParameterList? RPAREN TypeAnnotation?`,
  },
  {
    exp: `IndexSignature:
        LBRACK BindingIdentifier : "string" RBRACK TypeAnnotation
      | LBRACK BindingIdentifier : "number" RBRACK TypeAnnotation`,
    symbols: {
      string: { accepts: { IDENTIFIER: true } },
      number: { accepts: { IDENTIFIER: true } },
    },
  },
  {
    exp: `MethodSignature:
        PropertyName TENARY? CallSignature`,
  },
  {
    exp: `TypeAliasDeclaration:
        TYPE BindingIdentifier TypeParameters? EQUAL Type SEMI`,
  },
  {
    exp: `InterfaceDeclaration:
        INTERFACE BindingIdentifier TypeParameters? InterfaceExtendsClause? ObjectType`,
  },
  {
    exp: `InterfaceExtendsClause:
        EXTENDS ClassOrInterfaceTypeList`,
  },
  {
    exp: `ClassOrInterfaceTypeList:
        ClassOrInterfaceType
      | ClassOrInterfaceTypeList COMMA ClassOrInterfaceType`,
  },
  {
    exp: `ClassOrInterfaceType:
        TypeReference`,
  },
] as GrammarRules
