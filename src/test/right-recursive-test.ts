import { Parser } from '../'
import { EMPTY } from '../modules/grammar/constants'
import { GrammarRule, ParseTreeNode, SemanticAction } from '../types'
import { logChart } from '../utils'

const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

const grammarRightRecursive: GrammarRule[] = [
  {
    exp: `A : "a" A | ${EMPTY}`,
    action(node) {
      if (!node.children?.length) return [] as any
      return skipNode(node)
    },
  },
]

const parser = new Parser()

const inputRightRecursive = 'aaaaaaaaa'

parser.onError = error => logChart(error.chart)

parser.setGrammar(grammarRightRecursive).parse(inputRightRecursive, ({ AST, time }) => {
  console.log({ time })

  console.dir(AST, { depth: null })
})
