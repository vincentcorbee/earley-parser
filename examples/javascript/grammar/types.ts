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

export interface Expression extends ESTreeNode {}

export interface Pattern extends ESTreeNode {}

export interface ImportOrExportDeclaration extends ESTreeNode {}

export interface Statement extends ESTreeNode {}

export interface Identifier extends Expression, Pattern {
  type: 'Identifier'
  name: string
}

export interface Literal extends Expression {
  type: 'Literal'
  value: string | boolean | null | number | RegExp
}

export interface ThisExpression extends Expression {
  type: 'ThisExpression'
}

export interface Program extends ESTreeNode {
  type: 'Program'
  sourceType: 'script' | 'module'
  body: Array<Statement | ImportOrExportDeclaration>
}

export interface ExpressionStatement extends Statement {
  type: 'ExpressionStatement'
  expression: Expression
}

export interface Directive extends ExpressionStatement {
  expression: Literal
  directive: string
}

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

export interface VariableDeclarator extends ESTreeNode {
  type: 'VariableDeclarator'
  id: Pattern
  init: Expression | null
}

export interface VariableDeclaration extends Declaration {
  type: 'VariableDeclaration'
  declarations: VariableDeclarator[]
  kind: 'var' | 'let' | 'const'
}

export interface FunctionDeclaration extends Function, Declaration {
  type: 'FunctionDeclaration'
  id: Identifier
  typeParameters?: TypeParameterDeclaration
  returnType?: TypeAnnotation
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

export interface ReturnStatement extends Statement {
  type: 'ReturnStatement'
  argument: Expression | null
}

export interface SwitchStatement extends Statement {
  type: 'SwitchStatement'
  discriminant: Expression
  cases: Array<SwitchCase>
}

export interface SwitchCase extends ESTreeNode {
  type: 'SwitchCase'
  test: Expression | null
  consequent: Statement[]
}

export interface AssignmentPattern extends Pattern {
  type: 'AssignmentPattern'
  left: Pattern
  right: Expression
}

export interface FunctionExpression extends Function, Expression {
  type: 'FunctionExpression'
}

/* Types */

export interface TypeAnnotation extends ESTreeNode {
  type: 'TypeAnnotation'
  typeAnnotation: any
}

export interface TypeParameterDeclaration extends ESTreeNode {
  type: 'TypeParameterDeclaration'
  params: TypeParameter[]
}

export interface TypeParameter extends ESTreeNode {
  type: 'TypeParameter'
  name: Identifier
  constraint?: any
  default?: any
}

export interface TypeAliasDeclaration extends ESTreeNode {
  type: 'TypeAliasDeclaration'
  id: Identifier
  typeAnnotation: TypeAnnotation
  typeParameters?: TypeParameterDeclaration
}

export interface UnionType extends ESTreeNode {
  type: 'UnionType'
  types: any[]
}

export interface LiteralType extends ESTreeNode {
  type: 'LiteralType'
  value: string | number | boolean
}

export interface TypeReference extends ESTreeNode {
  type: 'TypeReference'
  typeName: Identifier
  typeParameters?: TypeParameterInstantiation
}

export interface TypeParameterInstantiation extends ESTreeNode {
  type: 'TypeParameterInstantiation'
  params: any[]
}

export interface PropertySignature extends ESTreeNode {
  type: 'PropertySignature'
  key: Identifier
  typeAnnotation: any
  optional: boolean
}

export interface InterfaceBody extends ESTreeNode {
  type: 'InterfaceBody'
  body: any[]
}

export interface InterfaceHeritage extends ESTreeNode {
  type: 'InterfaceHeritage'
  expression: any
}

export interface InterfaceDeclaration extends ESTreeNode {
  type: 'InterfaceDeclaration'
  id: Identifier
  body: InterfaceBody
  typeParameters?: TypeParameterDeclaration
  extends?: InterfaceHeritage[]
}

export interface MethodSignature extends ESTreeNode {
  type: 'MethodSignature'
  key: Identifier
  computed: boolean
  typeParameters?: TypeParameterDeclaration
  params: any[]
  returnType?: any
  kind: 'method' | 'get' | 'set'
  optional?: boolean
}

export interface FunctionType extends ESTreeNode {
  type: 'FunctionType'
  params: Identifier[]
  returnType: TypeAnnotation
  typeParameters?: TypeParameterDeclaration
}

export interface ClassImplements extends ESTreeNode {
  type: 'ClassImplements'
  expression: Identifier
  typeParameters?: TypeParameterInstantiation
}

/* Classes */

export interface Class extends ESTreeNode {
  id: Identifier | null
  superClass: Expression | null
  body: ClassBody
}

export interface ClassBody extends ESTreeNode {
  type: 'ClassBody'
  body: Array<MethodDefinition>
}

export interface MethodDefinition extends ESTreeNode {
  type: 'MethodDefinition'
  key: Expression
  value: FunctionExpression
  kind: 'constructor' | 'method' | 'get' | 'set'
  computed: boolean
  static: boolean
}

export interface ClassDeclaration extends Class, Declaration {
  type: 'ClassDeclaration'
  id: Identifier
  typeParameters?: TypeParameterDeclaration
  implements?: Array<ClassImplements>
}

export interface ClassExpression extends Class, Expression {
  type: 'ClassExpression'
}

export interface MetaProperty extends Expression {
  type: 'MetaProperty'
  meta: Identifier
  property: Identifier
}

export interface PropertyDefinition extends ESTreeNode {
  type: 'PropertyDefinition'
  key: Expression | PrivateIdentifier
  value: Expression | null
  computed: boolean
  static: boolean
  typeAnnotation?: TypeAnnotation
  readonly: boolean
  accessibility: 'public' | 'private' | 'protected'
}

export interface PrivateIdentifier extends ESTreeNode {
  type: 'PrivateIdentifier'
  name: string
}
