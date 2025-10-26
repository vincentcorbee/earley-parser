import { ParseTreeNode, SemanticAction } from '../../../../src/types'
import {
  BlockStatement,
  Directive,
  FunctionBody,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  Literal,
  LiteralType,
  ModuleSpecifier,
  PropertySignature,
  Pattern,
  Program,
  ReturnStatement,
  Statement,
  SwitchCase,
  SwitchStatement,
  TypeAliasDeclaration,
  TypeAnnotation,
  TypeParameter,
  TypeParameterDeclaration,
  TypeParameterInstantiation,
  TypeReference,
  UnionType,
  VariableDeclaration,
  VariableDeclarator,
  InterfaceDeclaration,
  InterfaceHeritage,
  MethodSignature,
  FunctionType,
  ClassDeclaration,
  ClassBody,
  PropertyDefinition,
} from '../types'

export const pickChild =
  (index: number): SemanticAction =>
  ({ children = [] }) =>
    children[index]

export const createProgramNode: SemanticAction = ({ start, end, children }): Program => {
  const sourceType = children?.find(child => child?.type === 'ImportDeclaration')
    ? 'module'
    : 'script'

  return {
    type: 'Program',
    sourceType,
    loc: {
      source: null,
      start,
      end,
    },
    body: children!,
  }
}

export const createImportDeclarationNode: SemanticAction = ({
  children = [],
}): ImportDeclaration => {
  const child = children.length === 3 ? children[1] : children[2]

  return {
    type: 'ImportDeclaration',
    specifiers: children[1],
    source: (child as any).local,
  }
}

export const createSwitchStatementNode: SemanticAction = ({
  children = [],
}): SwitchStatement => ({
  type: 'SwitchStatement',
  discriminant: children[0],
  cases: children[3] ? [children[3], children[4]] : [],
})

export const createReturnStatementNode: SemanticAction = ({
  children = [],
}): ReturnStatement => ({
  type: 'ReturnStatement',
  argument: children[1] || null,
})

export const createBlockStatementNode: SemanticAction = ({
  children = [],
}): BlockStatement => ({
  type: 'BlockStatement',
  body: children[1],
})

export const createArrowExpressionNode: SemanticAction = ({ children, start, end }) => ({
  type: 'ArrowFunctionExpression',
  start,
  end,
  params: children![0],
  body: children![2],
})

export const createSwitchCaseNode: SemanticAction = ({ children }): SwitchCase => ({
  type: 'SwitchCase',
  test: children![0],
  consequent: children![1],
})

export const createNewExpressionNode: SemanticAction = ({ children }) => ({
  type: 'NewExpression',
  callee: children![1],
  arguments: children![2] ? children![2].children : [],
})

export const createUnaryExpressionNode: SemanticAction = ({ type, children }) => {
  const [operator, argument] = children!

  return {
    type,
    operator: operator.value,
    argument,
    prefix: false,
  }
}

export const createUpdateExpressionNode: SemanticAction = ({ children }) => {
  const [argument, operator] = children!

  return {
    type: 'UpdateExpression',
    operator: operator.value,
    argument,
    prefix: false,
  }
}

export const createBinaryExpressionNode: SemanticAction = ({ children, ...rest }) => {
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

export const createLogicalExpressionNode: SemanticAction = ({ children }) => {
  const [left, operator, right] = children!

  if (children!.length === 1) return left

  return {
    type: 'LogicalExpression',
    operator,
    left,
    right,
  }
}

export const createLeafNode: SemanticAction = ({ children = [], type }) => {
  const { value: name, start, end } = children[0]

  return {
    type,
    start,
    end,
    name,
  }
}

export const createIdentifierNode: SemanticAction = ({ children = [] }): Identifier => {
  const { value: name } = children[0]

  return {
    type: 'Identifier',
    name,
  }
}

export const createLiteralNode: SemanticAction = ({ children = [] }): Literal => {
  const { value } = children[0]

  return {
    type: 'Literal',
    value,
  }
}

//@ts-ignore
export const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

//@ts-ignore
export const returnChildren: SemanticAction = ({ children = [] }) => [children]

export const returnValueFromNode: SemanticAction = ({ children = [] }) =>
  children[0].value

export const createNodeList: SemanticAction = ({ children = [] }): any => {
  const list = [] as any[]

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (child.value !== ',') {
      Array.isArray(child) ? list.push(...child) : list.push(child)
    }
  }

  return [list]
}

export const createObjectExpressionNode: SemanticAction = ({ children = [] }) => {
  const properties = children[1] ?? []

  return {
    type: 'ObjectExpression',
    properties,
    kind: 'init',
  }
}

export const createThisExpressionNode: SemanticAction = () => {
  return {
    type: 'ThisExpression',
  }
}
export const createVariableDeclarationNode: SemanticAction = ({
  children = [],
}): VariableDeclaration => {
  const [kind, declarations] = children

  return {
    type: 'VariableDeclaration',
    kind,
    declarations,
  }
}

export const createVariableDeclaratorNode: SemanticAction = ({
  children = [],
}): VariableDeclarator => {
  const [id] = children

  const node: VariableDeclarator = {
    type: 'VariableDeclarator',
    id,
    init: null,
  }

  if (children[1].type === 'TypeAnnotation') {
    id.typeAnnotation = children[1]

    if (children[2]) node.init = children[2]
  } else node.init = children[1]

  return node
}

/* FUNCTION BindingIdentifier TypeParameters? LPAREN FormalParameters RPAREN TypeAnnotation? LCBRACE FunctionBody RCBRACE */
export const createFunctionDeclarationNode: SemanticAction = ({
  children = [],
}): FunctionDeclaration => {
  const node: FunctionDeclaration = {
    type: 'FunctionDeclaration',
    id: children[1] as Identifier,
    params: children[3] as unknown as Pattern[],
    body: children[7] as FunctionBody,
  }

  if (children[2].value !== '(') {
    node.typeParameters = children[2]
  }

  if (children[5].value !== ')') {
    node.returnType = children[5]
  }

  if (children[6].value !== '{') {
    node.returnType = children[6]
  }

  return node
}

export const createFunctionBodyNode: SemanticAction = ({
  children = [],
}): FunctionBody => {
  return {
    type: 'BlockStatement',
    body: children as Array<Directive | Statement>,
  }
}

export const createImportSpecifierNode: SemanticAction = ({
  children = [],
}): ImportSpecifier => ({
  type: 'ImportSpecifier',
  imported: children[0],
  local: children.length > 1 ? children[2] : children[0],
})

export const createModuleSpecifierNode: SemanticAction = ({
  children = [],
}): ModuleSpecifier => ({ type: 'ModuleSpecifier', local: children[0] })

/* Types */

/* TYPE BindingIdentifier TypeParameters? EQUAL Type SEMI */
export const createTypeAliasDeclarationNode: SemanticAction = ({
  children = [],
}): TypeAliasDeclaration => {
  let typeParameters
  let typeAnnotation

  if (children.length === 6) {
    typeAnnotation = children[4]
    typeParameters = children[2]
  } else {
    typeAnnotation = children[3]
  }

  return {
    type: 'TypeAliasDeclaration',
    id: children[1],
    typeParameters,
    typeAnnotation,
  }
}
/* UnionOrIntersectionOrPrimaryType BINOR IntersectionOrPrimaryType */
export const createUnionTypeNode: SemanticAction = ({ children = [] }): UnionType => {
  return {
    type: 'UnionType',
    types: [children[0], children[2]],
  }
}

export const createLiteralTypeNode: SemanticAction = ({ children = [] }): LiteralType => {
  return {
    type: 'LiteralType',
    value: children[0].value,
  }
}

export const createTypeParameterDeclarationNode: SemanticAction = ({
  children = [],
}): TypeParameterDeclaration => {
  return {
    type: 'TypeParameterDeclaration',
    params: children[1],
  }
}

export const createTypeParameterNode: SemanticAction = ({
  children = [],
}): TypeParameter => {
  return {
    type: 'TypeParameter',
    name: children[0],
    constraint: children[1],
    default: undefined,
  }
}

export const createTypeReferenceNode: SemanticAction = ({
  children = [],
}): TypeReference => {
  const node: TypeReference = {
    type: 'TypeReference',
    typeName: children[0],
  }

  if (children.length > 1) node.typeParameters = children[1]

  return node
}

export const createTypeParameterInstantiationNode: SemanticAction = ({
  children = [],
}): TypeParameterInstantiation => {
  const params = [children[0]]

  if (children.length > 1) params.push(children[2])

  return {
    type: 'TypeParameterInstantiation',
    params,
  }
}

export const createTypeAnnotationNode: SemanticAction = ({
  children = [],
}): TypeAnnotation => {
  return {
    type: 'TypeAnnotation',
    typeAnnotation: children[1],
  }
}

export const createPropertySignatureNode: SemanticAction = ({
  children = [],
}): PropertySignature => {
  const [key] = children

  let optional = false
  let typeAnnotation = null

  if (children.length === 3) {
    optional = true
    typeAnnotation = children[2]
  } else if (children[1].value === '?') {
    optional = true
  } else {
    typeAnnotation = children[1]
  }

  return {
    type: 'PropertySignature',
    key,
    typeAnnotation,
    optional,
  }
}

/* INTERFACE BindingIdentifier TypeParameters? InterfaceExtendsClause? ObjectType */
export const createInterfaceDeclarationNode: SemanticAction = ({
  children = [],
}): InterfaceDeclaration => {
  const id = children[1]

  let typeParameters
  let extendsClause
  let objectType

  if (children.length === 5) {
    typeParameters = children[2]
    extendsClause = children[3]
    objectType = children[4]
  }

  if (children.length === 4) {
    objectType = children[3]

    if (children[2].type === 'TypeParameterDeclaration') typeParameters = children[2]
    if (children[2].type === 'InterfaceExtendsClause') extendsClause = children[2]
  }

  if (children.length === 3) {
    objectType = children[2]
  }

  return {
    type: 'InterfaceDeclaration',
    id,
    body: {
      type: 'InterfaceBody',
      body: objectType.members,
    },
    typeParameters,
    extends: extendsClause,
  }
}

export const createInterfaceHeritageNode: SemanticAction = ({
  children = [],
}): InterfaceHeritage => {
  return {
    type: 'InterfaceHeritage',
    expression: children[1],
  }
}

/* PropertyName TENARY? CallSignature */
export const createMethodSignatureNode: SemanticAction = ({
  children = [],
}): MethodSignature => {
  const [key] = children

  let optional = false
  let callSignature

  if (children.length === 3) {
    optional = true
    callSignature = children[2]
  } else {
    callSignature = children[1]
  }

  const { params, returnType, typeParameters } = callSignature

  return {
    type: 'MethodSignature',
    key,
    computed: false,
    kind: 'method',
    params,
    returnType,
    optional,
    typeParameters,
  }
}

/* TypeParameters? LPAREN ParameterList? RPAREN ARROW Type */
export const createFunctionTypeNode: SemanticAction = ({
  children = [],
}): FunctionType => {
  const { length } = children

  let typeParameters
  let params = []
  let returnType

  if (children[0].type === 'TypeParameters') typeParameters = children[0]

  if (length === 6) {
    params = children[2].children
    returnType = children[5]
  }

  if (length === 5) {
    returnType = children[4]

    if (!typeParameters) params = children[1].children
  }

  return {
    type: 'FunctionType',
    params,
    returnType,
    typeParameters,
  }
}
/* CLASS BindingIdentifier TypeParameters? ClassTail */
export const createClassDeclarationNode: SemanticAction = ({
  children = [],
}): ClassDeclaration => {
  const id = children[1]
  let typeParameters
  let tail

  if (children.length === 4) {
    typeParameters = children[2]
    tail = children[3]
  } else {
    tail = children[2]
  }

  const { superClass, body, implementsClause } = tail

  return {
    type: 'ClassDeclaration',
    id,
    superClass,
    body,
    typeParameters,
    implements: implementsClause,
  }
}

export const createClassBodyNode: SemanticAction = ({ children = [] }): ClassBody => {
  return {
    type: 'ClassBody',
    body: children[0],
  }
}

export const createPropertyDefinitionNode: SemanticAction = ({
  children = [],
}): PropertyDefinition => {
  const [firstChild, secondChild, thirdChild, fourthChild] = children

  let accessibility, isStatic, propertySignature, value

  if (firstChild.type === 'AccessibilityModifier') {
    accessibility = firstChild.children[0].value

    if (secondChild.value === 'static') {
      isStatic = secondChild
      propertySignature = thirdChild

      if (fourthChild && fourthChild.value !== ';') value = fourthChild
    } else {
      propertySignature = secondChild
      if (thirdChild && thirdChild.value !== ';') value = thirdChild
    }
  } else if (firstChild.value === 'static') {
    isStatic = firstChild
    propertySignature = secondChild
    if (thirdChild && thirdChild.value !== ';') value = thirdChild
  } else {
    propertySignature = firstChild
    if (secondChild.value !== ';') value = secondChild
  }

  const { typeAnnotation, key } = propertySignature

  return {
    type: 'PropertyDefinition',
    key,
    value,
    computed: false,
    static: isStatic ?? false,
    typeAnnotation,
    readonly: false,
    accessibility: accessibility,
  }
}
