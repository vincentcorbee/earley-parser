import { EMPTY } from '../../../src/modules/grammar/constants'
import { GrammarRules } from '../../../src/types'
import {
  createArrowExpressionNode,
  createBinaryExpressionNode,
  createBlockStatementNode,
  createFunctionBodyNode,
  createFunctionDeclarationNode,
  createIdentifierNode,
  createImportDeclarationNode,
  createImportSpecifierNode,
  createLiteralNode,
  createLiteralTypeNode,
  createLogicalExpressionNode,
  createModuleSpecifierNode,
  createNewExpressionNode,
  createNodeList,
  createObjectExpressionNode,
  createPropertySignatureNode,
  createProgramNode,
  createReturnStatementNode,
  createSwitchCaseNode,
  createSwitchStatementNode,
  createThisExpressionNode,
  createTypeAliasDeclarationNode,
  createTypeAnnotationNode,
  createTypeParameterDeclarationNode,
  createTypeParameterInstantiationNode,
  createTypeParameterNode,
  createTypeReferenceNode,
  createUnaryExpressionNode,
  createUnionTypeNode,
  createUpdateExpressionNode,
  createVariableDeclarationNode,
  createVariableDeclaratorNode,
  pickChild,
  returnChildren,
  returnValueFromNode,
  skipNode,
  createInterfaceDeclarationNode,
  createInterfaceHeritageNode,
  createMethodSignatureNode,
  createFunctionTypeNode,
  createClassDeclarationNode,
  createClassBodyNode,
  createPropertyDefinitionNode,
} from './actions'

export const grammar = [
  /* Program */
  {
    exp: `Program :
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
    action: createNodeList,
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
  {
    exp: `GetAccessor :
        GET PropertyName LPAREN RPAREN TypeAnnotation? LCBRACE FunctionBody RCBRACE`,
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
    action: createBlockStatementNode,
  },
  {
    exp: `BlockStatements :
        ${EMPTY}
      | BlockStatementsPrefix`,
    action: returnChildren,
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
    action: createReturnStatementNode,
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
    action: createVariableDeclarationNode,
  },
  {
    exp: `LetOrConst :
        LET
      | CONST`,
    action: returnValueFromNode,
  },
  {
    exp: `BindingList :
        LexicalBinding
      | BindingList COMMA LexicalBinding`,
    action: createNodeList,
  },
  {
    exp: `LexicalBinding :
        BindingIdentifier TypeAnnotation? Initializer?
      | BindingPattern TypeAnnotation? Initializer`,
    action: createVariableDeclaratorNode,
  },
  {
    exp: 'VariableStatement : VAR VariableDeclarationList',
    action: createVariableDeclarationNode,
  },
  {
    exp: `VariableDeclarationList :
        VariableDeclaration
      | VariableDeclarationList COMMA VariableDeclaration`,
    action: createNodeList,
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
    symbols: {
      IDENTIFIER: { accepts: { TYPE: true, INTERFACE: true } },
    },
    action: createIdentifierNode,
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
    action: skipNode,
  },
  {
    exp: 'Number : NUMBER',
    action: createLiteralNode,
  },
  {
    exp: 'StringLiteral : STRING',
    action: createLiteralNode,
  },
  {
    exp: 'Null : NULL',
    action: createLiteralNode,
  },
  {
    exp: 'This : THIS',
    action: createThisExpressionNode,
  },
  {
    exp: 'Boolean : TRUE | FALSE',
    action: createLiteralNode,
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
    action: ({ children = [] }) =>
      children.length === 1
        ? children[0]
        : {
            type: 'BlockStatement',
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
    action: pickChild(1),
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
    action: ({ children = [] }) => {
      if (children.length === 0) return []

      if (children.length === 1) return children

      if (children.length === 2) return children[0]

      return [children[0], children[2]]
    },
  },
  {
    exp: `FormalParameterList :
        FormalParameter
      | FormalParameterList COMMA FormalParameter`,
    action: ({ children = [] }) =>
      children.length === 1 ? [children[0]] : [[children[0], children[2]]],
  },
  {
    exp: `FunctionRestParameter :
      BindingRestElement`,
    action: skipNode,
  },
  {
    exp: `BindingRestElement :
        "..." BindingIdentifier`,
    action: pickChild(1),
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
      | BindingIdentifier TENARY? TypeAnnotation`,
    action: ({ children = [] }) => {
      const [bindingIdentifier, second, third] = children

      const { length } = children

      if (length === 1) return bindingIdentifier

      let typeAnnotation
      let initializer
      let optional = false

      if (length === 3) {
        if (second.type === 'TypeAnnotation') {
          typeAnnotation = second
          initializer = third
        } else {
          optional = true
          typeAnnotation = third
        }
      } else if (second.type === 'TypeAnnotation') {
        typeAnnotation = second
      } else if (second.value === '?') {
        optional = true
      } else {
        initializer = second
      }

      if (typeAnnotation) bindingIdentifier.typeAnnotation = typeAnnotation

      if (!initializer) {
        bindingIdentifier.optional = optional

        return bindingIdentifier
      }

      return {
        type: 'AssignmentPattern',
        left: bindingIdentifier,
        right: initializer,
      }
    },
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
    action: createNodeList,
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
    action: createNodeList,
  },
  {
    exp: `ImportSpecifier :
        ImportedBinding
      | IdentifierName AS ImportedBinding
      | TYPE ImportedBinding
      | TYPE ModuleExportName AS ImportedBinding`,
    action: createImportSpecifierNode,
  },
  {
    exp: `ModuleSpecifier :
        StringLiteral`,
    action: createModuleSpecifierNode,
  },
  {
    exp: `ImportedBinding :
        BindingIdentifier`,
    action: skipNode,
  },

  /* Destructuring binding patters */
  {
    exp: `BindingPattern :
        ObjectBindingPattern
        ArrayBindingPattern`,
  },

  {
    exp: `ObjectBindingPattern :
        LCBRACE RCRBRACE
      | LCBRACE BindingPropertyList RCBRACE
      | LCBRACE BindingPropertyList COMMA RCRBRACE`,
  },

  /* Class */

  {
    exp: `ClassDeclaration :
        CLASS BindingIdentifier TypeParameters? ClassTail`,
    action: createClassDeclarationNode,
  },
  {
    exp: `ClassTail :
        ClassHeritage? ImplementsClause? LCBRACE ClassBody? RCBRACE`,
    action: ({ children = [] }) => {
      const [firstChild, secondChild] = children
      const { length } = children
      let superClass
      let implementsClause
      let body

      if (firstChild.type === 'ClassHeritage') {
        superClass = firstChild.children[1]
      } else if (Array.isArray(firstChild)) {
        implementsClause = firstChild
      }

      if (Array.isArray(secondChild)) {
        implementsClause = secondChild
      }

      if (length === 5) body = children[3]
      else if (length === 4) body = children[2]
      else if (length === 3) body = children[1]

      return {
        superClass,
        implementsClause,
        body,
      }
    },
  },
  {
    exp: `ClassHeritage :
        EXTENDS TypeReference`,
  },
  {
    exp: `ClassBody :
        ClassBodyElements`,
    action: createClassBodyNode,
  },
  {
    exp: `ClassBodyElements :
        ClassBodyElement
      | ClassBodyElements ClassBodyElement`,
    action: createNodeList,
  },
  {
    exp: `ClassBodyElement :
        PropertyMemberDeclaration
      | ConstructorDeclaration`,
    action: skipNode,
  },
  {
    exp: `PropertyMemberDeclaration :
        MemberVariableDeclaration
      | MemberFunctionDeclaration`,
    action: skipNode,
  },
  {
    exp: `MemberVariableDeclaration :
      AccessibilityModifier? STATIC? PropertySignature Initializer? SEMI`,
    action: createPropertyDefinitionNode,
  },
  {
    exp: `MemberFunctionDeclaration :
        AccessibilityModifier? STATIC? PropertySignature CallSignature LCBRACE FunctionBody RCBRACE
      | AccessibilityModifier? STATIC? PropertyName CallSignature SEMI`,
  },
  {
    exp: `ConstructorDeclaration :
      AccessibilityModifier? CONSTRUCTOR CallSignature LCBRACE FunctionBody RCBRACE`,
  },
  {
    exp: `ImplementsClause :
      IMPLEMENTS ClassOrInterfaceTypeList`,
    action({ children = [] }) {
      return [
        children[1].map((child: any) => {
          const { typeName, typeParameters } = child

          return {
            type: 'ClassImplements',
            expression: typeName,
            typeParameters,
          }
        }),
      ]
    },
  },

  /* TypeScript */

  /* Types */

  {
    exp: `TypeParameters :
        LANGLEBRACKET TypeParameterList RANGLEBRACKET`,
    action: createTypeParameterDeclarationNode,
  },
  {
    exp: `TypeParameterList :
        TypeParameter
      | TypeParameterList COMMA TypeParameter`,
    action: createNodeList,
  },
  {
    exp: `TypeParameter :
        BindingIdentifier Constraint?`,
    action: createTypeParameterNode,
  },
  {
    exp: `Constraint :
        EXTENDS Type`,
    action: ({ children = [] }) => children[1],
  },
  {
    exp: `TypeArguments :
        LANGLEBRACKET TypeArgumentList RANGLEBRACKET`,
    action: ({ children = [] }) => [children[1]],
  },
  {
    exp: `TypeArgumentList :
        TypeArgument
      | TypeArgumentList COMMA TypeArgument`,
    action: createNodeList,
  },
  {
    exp: `TypeArgument :
        Type`,
    action: skipNode,
  },
  {
    exp: `Type :
        UnionOrIntersectionOrPrimaryType
      | FunctionType
      | ConstructorType`,
    action: skipNode,
  },
  {
    exp: `UnionOrIntersectionOrPrimaryType :
        UnionType
      | IntersectionOrPrimaryType`,
    action: skipNode,
  },
  {
    exp: `IntersectionOrPrimaryType :
        IntersectionType
      | PrimaryType`,
    action: skipNode,
  },
  {
    exp: `PrimaryType :
        ParenthesizedType
      | PredefinedType
      | TypeReference
      | ObjectType
      | ArrayType
      | TupleType
      | TypeQuery
      | ThisType
      | LiteralType
      | NULL`,
    action: skipNode,
  },
  {
    exp: `ParenthesizedType :
        LPAREN Type RPAREN`,
  },
  {
    exp: `LiteralType :
        StringLiteral | Number | Boolean`,
    action: createLiteralTypeNode,
  },
  {
    exp: `PredefinedType :
        "any"
      | "number"
      | "boolean"
      | "string"
      | "symbol"
      | "void"
      | "null"
      | "never"
      | "undefined"`,
    symbols: {
      any: { accepts: { IDENTIFIER: true } },
      string: { accepts: { IDENTIFIER: true } },
      number: { accepts: { IDENTIFIER: true } },
      boolean: { accepts: { IDENTIFIER: true } },
      symbol: { accepts: { IDENTIFIER: true } },
      void: { accepts: { IDENTIFIER: true } },
      null: { accepts: { IDENTIFIER: true } },
      never: { accepts: { IDENTIFIER: true } },
      undefined: { accepts: { IDENTIFIER: true } },
    },
    action: ({ children = [] }) => {
      const { value } = children[0]

      return {
        type: `${value[0].toUpperCase()}${value.slice(1)}Keyword`,
      }
    },
  },
  {
    exp: `TypeReference :
      TypeName TypeArguments?`,
    action: createTypeReferenceNode,
  },
  {
    exp: `TypeName :
        IdentifierReference
      | NamespaceName DOT IdentifierReference`,
    action: ({ children = [] }) => {
      if (children.length === 1) return children[0]

      return {
        type: 'QualifiedName',
        left: children[0],
        right: children[2],
      }
    },
  },
  {
    exp: `NamespaceName :
        IdentifierReference
      | NamespaceName DOT IdentifierReference`,
    action: ({ children = [] }) => {
      if (children.length === 1) return children[0]

      return {
        type: 'QualifiedName',
        left: children[0],
        right: children[2],
      }
    },
  },
  {
    exp: `ObjectType :
        LCBRACE TypeBody? RCBRACE`,
    action: ({ children = [] }) => {
      return {
        type: 'TypeLiteral',
        members: children[1] ? [children[1]] : [],
      }
    },
  },
  {
    exp: `TypeBody :
        TypeMemberList SEMI?
      | TypeMemberList COMMA?`,
    action: pickChild(0),
  },
  {
    exp: `TypeMemberList :
        TypeMember
      | TypeMemberList SEMI TypeMember
      | TypeMemberList COMMA TypeMember`,
    action: createNodeList,
  },
  {
    exp: `TypeMember :
        PropertySignature
      | CallSignature
      | ConstructSignature
      | IndexSignature
      | MethodSignature`,
    action: skipNode,
  },
  {
    exp: `ArrayType :
        PrimaryType LBRACK RBRACK`,
  },
  {
    exp: `TupleType :
        LBRACK TupleElementTypes RBRACK`,
  },
  {
    exp: `TupleElementTypes :
        TupleElementType
      | TupleElementTypes COMMA TupleElementType`,
  },
  {
    exp: `TupleElementType:
        Type`,
  },
  {
    exp: `UnionType :
        UnionOrIntersectionOrPrimaryType BINOR IntersectionOrPrimaryType`,
    action: createUnionTypeNode,
  },
  {
    exp: `IntersectionType :
        IntersectionOrPrimaryType BINAND PrimaryType`,
  },
  {
    exp: `FunctionType :
        TypeParameters? LPAREN ParameterList? RPAREN ARROW Type`,
    action: createFunctionTypeNode,
  },
  {
    exp: `ConstructorType :
        NEW TypeParameters? LPAREN ParameterList? RPAREN ARROW Type`,
  },
  {
    exp: `TypeQuery:
      TYPEOF TypeQueryExpression`,
  },
  {
    exp: `TypeQueryExpression :
        IdentifierReference
      | TypeQueryExpression DOT IdentifierName`,
  },
  {
    exp: `ThisType:
        THIS`,
  },
  {
    exp: `PropertySignature :
        PropertyName TENARY? TypeAnnotation`,
    action: createPropertySignatureNode,
  },
  {
    exp: `PropertyName :
        IdentifierName
      | StringLiteral
      | NumericLiteral`,
    action: skipNode,
  },
  {
    exp: `TypeAnnotation :
        COLON Type`,
    action: createTypeAnnotationNode,
  },
  {
    exp: `CallSignature :
        TypeParameters? LPAREN ParameterList? RPAREN TypeAnnotation?`,
    action: ({ children = [] }) => {
      let params
      let returnType
      let typeParameters

      if (children[0].type === 'TypeParameterDeclaration') typeParameters = children[0]

      if (children.length === 5) {
        params = children[2]
        returnType = children[4]
      }

      if (children[1].type === 'ParameterList') params = children[1].children
      if (children[2].type === 'ParameterList') params = children[2].children
      if (children[3].type === 'TypeAnnotation') returnType = children[3]

      return {
        params,
        returnType,
        typeParameters,
      }
    },
  },
  {
    exp: `ParameterList :
        RequiredParameterList
      | OptionalParameterList
      | RestParameter
      | RequiredParameterList COMMA OptionalParameterList
      | RequiredParameterList COMMA RestParameter
      | OptionalParameterList COMMA RestParameter
      | RequiredParameterList COMMA OptionalParameterList COMMA RestParameter`,
    action: node => {
      const params = createNodeList(node)

      return {
        type: 'ParameterList',
        children: params,
      }
    },
  },
  {
    exp: `RequiredParameterList :
        RequiredParameter
      | RequiredParameterList COMMA RequiredParameter`,
    action: createNodeList,
  },
  {
    exp: `RequiredParameter :
        AccessibilityModifier? BindingIdentifierOrPattern TypeAnnotation?
      | BindingIdentifier COLON StringLiteral`,
    action: ({ children = [] }) => {
      const [first] = children

      if (first.type === 'AccessibilityModifier') {
        const parameter = children[1]

        if (children[2]) parameter.typeAnnotation = children[2]

        return {
          type: 'ParameterProperty',
          accessibility: first.children[0].value,
          parameter,
          readonly: undefined,
          static: undefined,
          export: undefined,
        }
      }

      if (children.length === 3) first.typeAnnotation = children[2]

      if (children.length === 2) first.typeAnnotation = children[1]

      return first
    },
  },
  {
    exp: `AccessibilityModifier :
        "public"
      | PRIVATE
      | "protected"`,
    symbols: {
      public: { accepts: { IDENTIFIER: true } },
      protected: { accepts: { IDENTIFIER: true } },
    },
  },
  {
    exp: `BindingIdentifierOrPattern :
        BindingIdentifier
      | BindingPattern`,
    action: skipNode,
  },
  {
    exp: `OptionalParameterList :
        OptionalParameter
      | OptionalParameterList COMMA OptionalParameter`,
    action: createNodeList,
  },
  {
    exp: `OptionalParameter :
        AccessibilityModifier? BindingIdentifierOrPattern TENARY TypeAnnotation?
      | AccessibilityModifier? BindingIdentifierOrPattern TypeAnnotation? Initializer
      | BindingIdentifier TENARY COLON StringLiteral`,
    action: ({ children = [] }) => {
      const [firstChild, secondChild, thirdChild, fourthChild] = children

      if (firstChild.type === 'AccessibilityModifier') {
        let parameter

        if (thirdChild.value !== '?') {
          const left = secondChild

          parameter = {
            type: 'AssignmentPattern',
            left,
            right: undefined,
          }
          if (thirdChild.type === 'TypeAnnotation') {
            left.typeAnnotation = thirdChild
            parameter.right = fourthChild
          } else parameter.right = thirdChild
        } else {
          parameter = firstChild
        }

        return {
          type: 'ParameterProperty',
          accessibility: firstChild.children[0].value,
          parameter,
          readonly: false,
          static: false,
          export: undefined,
        }
      }

      if (children.length === 4) {
        firstChild.optional = true
        firstChild.typeAnnotation = fourthChild
      }

      if (secondChild.value === '?') {
        firstChild.optional = true
        firstChild.typeAnnotation = thirdChild
      } else {
        let right
        if (secondChild.type === 'TypeAnnotation') {
          firstChild.typeAnnotation = secondChild
          right = thirdChild
        } else {
          right = secondChild
        }

        return {
          type: 'AssignmentPattern',
          left: firstChild,
          right,
        }
      }

      return firstChild
    },
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
    action: createMethodSignatureNode,
  },
  {
    exp: `TypeAliasDeclaration :
        TYPE BindingIdentifier TypeParameters? EQUAL Type SEMI`,
    action: createTypeAliasDeclarationNode,
  },
  {
    exp: `InterfaceDeclaration :
        INTERFACE BindingIdentifier TypeParameters? InterfaceExtendsClause? ObjectType`,
    action: createInterfaceDeclarationNode,
  },
  {
    exp: `InterfaceExtendsClause :
        EXTENDS ClassOrInterfaceTypeList`,
    action: createInterfaceHeritageNode,
  },
  {
    exp: `ClassOrInterfaceTypeList :
        ClassOrInterfaceType
      | ClassOrInterfaceTypeList COMMA ClassOrInterfaceType`,
    action: createNodeList,
  },
  {
    exp: `ClassOrInterfaceType :
        TypeReference`,
    action: skipNode,
  },
] as GrammarRules
