import { Parser } from '../src'
import { EMPTY } from '../src/modules/grammar/constants'
import { GrammarRule, ParseTreeNode, SemanticAction } from '../src/types'
import { logChart } from '../src/utils'

const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

const grammarRightRecursive: GrammarRule[] = [
  {
    exp: `A : "a" A | ${EMPTY}`,
    action(node) {
      return skipNode(node)
    },
  },
]

const parser = new Parser()

const inputRightRecursive = 'aaaaaaaaa'

parser.onError = error => logChart(error.chart)

parser.setGrammar(grammarRightRecursive)

const start = performance.now()

parser.parse(inputRightRecursive, parseTree => {
  const time = performance.now() - start

  console.log({ time })

  // printParseTree(parseTree[0] as any)

  console.log(parseTree[0])

  // printChart(chart)
})
