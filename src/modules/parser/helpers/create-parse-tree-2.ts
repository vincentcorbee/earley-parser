import { ParseTreeNode, StateInterface, Token } from '../../../types'
import { INTERMEDIATE, COMPLETED, SCANNED } from '../constants'

const getLengthOfTokenValue = (token: Token) =>
  typeof token.value === 'string' ? token.value.length : token.value.toString().length

/*
  Convert states into a parse tree
*/

export const createParseTree2 = (
  state: StateInterface,
  parentNode: ParseTreeNode | null = null,
  previousToken: Token | null = null,
  end: number[] = []
): any => {
  const { token, complete, lhs: type, action, previous } = state

  const stateType = complete ? COMPLETED : token !== undefined ? SCANNED : INTERMEDIATE

  const node: ParseTreeNode = {
    type,
    start: 0,
    end: 0,
  }

  const children = parentNode?.children

  if (token) {
    node.start = token.index
    node.end = node.start + getLengthOfTokenValue(token)

    node.value = token?.value

    if (parentNode) parentNode.start = node.start

    end.push(node.end!)
  } else if (previousToken) {
    node.end = previousToken.index
  }

  if (stateType !== SCANNED) node.children = []

  if (complete) parentNode = node

  previousToken = token || previousToken

  const length = previous.length

  let index = 0

  while (index < length)
    createParseTree2(previous[index++], parentNode, previousToken, end)

  /* The nodes end will be the end or the first entry in the end array */
  node.end = node.end || end[end.length - 1]

  if (parentNode?.children && children) {
    const childNodes = complete && action ? action(node) : node

    if (Array.isArray(childNodes)) children.push(...(childNodes as any))
    else children.push(childNodes)
  } else if (complete && action) {
    return action(node)
  }

  return node
}
