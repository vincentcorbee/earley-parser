import { ParseTree, ParseTreeNode } from '../../../types'

export const createASTNode = (node: ParseTreeNode): any => {
  const { action, value, type, children, start = 0, end = 0 } = node

  // Perform sematic action on node
  if (typeof action === 'function') {
    let ASTNode

    if (children) {
      ASTNode = action({
        type,
        children: children.flatMap(child => createASTNode(child)),
        start,
        end,
      })
    } else ASTNode = action({ type, value, start, end })

    if (ASTNode === null) return []

    return ASTNode
  } else {
    return {
      type,
      value,
      children,
      start,
      end,
    }
  }
}

export const createAST = (parseTree: ParseTree) => parseTree.flatMap(createASTNode)
