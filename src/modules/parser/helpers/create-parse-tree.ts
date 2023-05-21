import { ParseTree, ParseTreeNode, StateInterface, Token } from '../../../types'
import { INTERMEDIATE, COMPLETED, SCANNED } from '../constants'

const getLengthOfTokenValue = (token: Token) =>
  typeof token.value === 'string' ? token.value.length : token.value.toString().length

/*
  Convert states into a parse tree
*/

let start = 0

export const createParseTree = (
  state: StateInterface,
  parentNode: ParseTreeNode | null = null,
  previousToken: Token | null = null,
  tree: ParseTree = [],
  end: number[] = [],
  index?: number
) => {
  const { token, complete, lhs: type, action, previous } = state

  const stateType = complete ? COMPLETED : token !== undefined ? SCANNED : INTERMEDIATE

  const node: ParseTreeNode = {
    type,
    start: 0,
    end: 0,
  }

  if (token) {
    node.token = token
    node.start = token.index
    node.end = node.start + getLengthOfTokenValue(token)

    node.value = token?.value

    start = node.start

    end.push(node.end ?? 0)
  } else if (previousToken) {
    node.end = previousToken.index
  }

  /*
    Only set the action when the state is completed.
  */
  if (complete) node.action = action

  if (stateType !== SCANNED) node.children = []

  /*
    If we have a parent node with children, we add it
    else we add it to the tree.
  */
  if (parentNode?.children) parentNode?.children.push(node)
  else tree.push(node)

  let newParentNode = parentNode

  if (complete) newParentNode = node

  previousToken = token || previousToken

  const length = previous.length

  let currentIndex = previous.length

  while (currentIndex) {
    createParseTree(
      previous[currentIndex - 1],
      newParentNode,
      previousToken,
      tree,
      end,
      length - currentIndex
    )

    currentIndex--
  }

  /* The nodes end will be the end or the first entry in the end array */
  node.end = node.end || end[0]

  /* The nodes start will be the start or the start passed from the function call */
  node.start = node.start || start

  /*
    Because we are going backwards we need to reverse the children to get the correct order
  */
  if (node.children && node.children.length > 1) node.children.reverse()

  // if (complete && action) {
  //   if (!index) tree[0] = action(node)

  //   if (index && parentNode?.children) parentNode.children[index] = action(node)
  // }

  // console.log(JSON.stringify(node, null, 2))

  return tree
}
