export interface SourceLocation {
  source: string | null
  start?: number
  end?: number
}

export interface Position {
  line: number
  column: number
}

export interface ESTreeNode {
  type: string
  loc?: SourceLocation | null
  start?: number
  end?: number
}

export interface Identifier extends Expression, Pattern {
  type: 'Identifier'
  name: string
}

export interface Literal extends Expression {
  type: 'Literal'
  value: string | boolean | null | number | RegExp
}

export interface Program extends ESTreeNode {
  type: 'Program'
  sourceType: 'script' | 'module'
  body: Array<Statement | ImportOrExportDeclaration>
}

export interface Statement extends ESTreeNode {}

export interface ExpressionStatement extends Statement {
  type: 'ExpressionStatement'
  expression: Expression
}

export interface Directive extends ExpressionStatement {
  expression: Literal
  directive: string
}

export interface Expression extends ESTreeNode {}

export interface Pattern extends ESTreeNode {}

export interface ImportOrExportDeclaration extends ESTreeNode {}

export interface ModuleSpecifier extends ESTreeNode {
  local: Identifier
}

export interface ImportDeclaration extends ImportOrExportDeclaration {
  type: 'ImportDeclaration'
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>
  source: Literal
}

export interface ImportDefaultSpecifier extends ModuleSpecifier {
  type: 'ImportDefaultSpecifier'
}

export interface ImportNamespaceSpecifier extends ModuleSpecifier {
  type: 'ImportNamespaceSpecifier'
}

export interface ImportSpecifier extends ModuleSpecifier {
  type: 'ImportSpecifier'
  imported: Identifier
}

export interface ObjectExpression extends Expression {
  type: 'ObjectExpression'
  properties: Array<Property>
}

export interface Property extends ESTreeNode {
  type: 'Property'
  key: Literal | Identifier
  value: Expression
  kind: 'init' | 'get' | 'set'
}

export interface Declaration extends Statement {}

export interface FunctionDeclaration extends Function, Declaration {
  type: 'FunctionDeclaration'
  id: Identifier
}

export interface Function extends ESTreeNode {
  id: Identifier | null
  params: Array<Pattern>
  body: FunctionBody
}

export interface FunctionBody extends BlockStatement {
  body: Array<Directive | Statement>
}

export interface BlockStatement extends Statement {
  type: 'BlockStatement'
  body: Array<Statement>
}
