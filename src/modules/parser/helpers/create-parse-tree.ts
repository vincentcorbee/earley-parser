import { ParseTree, ParseTreeNode, Token } from '../../../types'
import { State } from '../../chart'
import { INTERMEDIATE, SYMBOL, TERMINAL } from '../constants'

const getLengthOfTokenValue = (token: Token) =>
  typeof token.value === 'string' ? token.value.length : token.value.toString().length

/*
  Convert states into a parse tree
*/

let start = 0

export const createParseTree = (
  state: State,
  parentNode: ParseTreeNode | null = null,
  previousToken: Token | null = null,
  tree: ParseTree = [],
  end: number[] = []
) => {
  const { token, complete, lhs: type, action, previous } = state

  const stateType = complete ? SYMBOL : token !== undefined ? TERMINAL : INTERMEDIATE

  const node: ParseTreeNode = {
    type,
    start: 0,
    end: 0,
  }

  let newPreviousToken = previousToken

  if (token) {
    node.token = token
    node.start = token.index

    node.end = node.start + getLengthOfTokenValue(token)

    start = node.start

    end.push(node.end ?? 0)

    newPreviousToken = token
  } else if (previousToken) {
    node.end = previousToken.index
  }

  /*
    Only set the action when the state is completed.
  */
  if (complete) node.action = action

  if (stateType === TERMINAL) node.value = token?.value

  if (stateType !== TERMINAL) node.children = []

  /*
    If we have a parent node with children, we add it
    else we add it to the tree.
  */
  if (parentNode?.children) parentNode.children.push(node)
  else tree.push(node)

  parentNode = stateType === SYMBOL ? node : parentNode

  let index = previous.length

  while (index) {
    createParseTree(previous[index - 1], parentNode, newPreviousToken, tree, end)

    index--
  }

  /* The nodes end will be the end or the first entry in the end array */
  node.end = node.end || end[0]

  /* The nodes start will be the start or the start passed from the function call */
  node.start = node.start || start

  /*
    Because we are going backwards we need to reverse the children to get the correct order
  */
  if (node.children && node.children.length > 1) node.children.reverse()

  return tree
}
