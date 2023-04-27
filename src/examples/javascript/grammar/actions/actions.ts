import { ParseTreeNode, SemanticAction } from '../../../../types'
import {
  BlockStatement,
  Directive,
  FunctionBody,
  FunctionDeclaration,
  Identifier,
  Pattern,
  Statement,
} from '../types'

export const createProgramNode: SemanticAction = ({ start, end, children: body }) => {
  const sourceType = body?.find(child => child.type === 'ImportDeclaration')
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
    body,
  }
}

export const createImportDeclarationNode: SemanticAction = ({ children = [] }) => {
  const child = children.length === 3 ? children[1] : children[2]

  return {
    type: 'ImportDeclaration',
    specifiers: children[1],
    source: (child as any).local,
  }
}

export const createSwitchStatementNode: SemanticAction = ({ children = [], type }) => ({
  type,
  discriminant: children[0],
  cases: children[3] ? [children[3], children[4]] : [],
})

export const createArrowExpressionNode: SemanticAction = ({ children, start, end }) => ({
  type: 'ArrowFunctionExpression',
  start,
  end,
  params: children![0],
  body: children![2],
})

export const createSwitchCaseNode: SemanticAction = ({ children }) => ({
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

export const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

export const returnValueFromNode: SemanticAction = ({ children = [] }) =>
  children[0].value

export const createNodeListNode: SemanticAction = ({ children = [] }) => {
  if (children.length === 0) return [[]]
  if (children.length === 1) return [children] as any
  ;(children[0] as any).push(children[2])

  return [children[0]]
}

export const createObjectExpressionNode: SemanticAction = ({ children = [] }) => {
  const properties = children[1] ?? []

  return {
    type: 'ObjectExpression',
    properties,
    kind: 'init',
  }
}

export const createFunctionDeclarationNode: SemanticAction = ({
  children = [],
}): FunctionDeclaration => {
  return {
    type: 'FunctionDeclaration',
    id: children[1] as Identifier,
    params: children[3] as unknown as Pattern[],
    body: children[6] as FunctionBody,
  }
}

export const createFunctionBodyNode: SemanticAction = ({
  children = [],
}): FunctionBody => {
  return {
    type: 'BlockStatement',
    body: children as Array<Directive | Statement>,
  }
}
