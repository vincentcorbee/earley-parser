import { ParseTree, ParseTreeNode } from '../../../types'

export const createASTNode = (node: ParseTreeNode): any => {
  const { action, value, type, children = [], start = 0, end = 0 } = node

  // Perform sematic action on node
  if (typeof action === 'function') {
    const ASTNode = action({
      type,
      children: children.flatMap(createASTNode),
      start,
      end,
    })

    return ASTNode ?? []
  }

  return {
    type,
    value,
    children,
    start,
    end,
  }
}

export const createAST = (parseTree: ParseTree) => parseTree.flatMap(createASTNode)
