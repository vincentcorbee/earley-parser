import { Parser } from '../'
import { GrammarRule, ParseTreeNode, SemanticAction, Visitors } from '../types'
import { logChart, printAST, printChart, printParseTree } from '../utils'

interface SourceLocation {
  source: string | null
  start: number
  end: number
}

type ASTNode = {
  type: string
  loc: SourceLocation | null
}

const visitors: Visitors = {
  BinaryExpression: {
    enter: ({ node, result, visitors, traverse }) => {
      return (
        result +
        `
      <div class="node flex flexcolumn">
        <span class="name">${node.type}</span>
         <div class="children">
            ${traverse({ node: node.left, result, visitors, parent: node })}
            <div class="node flex flexcolumn">
              <span class="name">${node.operator}</span>
            </div>
            ${traverse({ node: node.right, result, visitors, parent: node })}
          </div>
      </div>`
      )
    },
  },
  Number: {
    enter: ({ node, result }) => {
      return (
        result +
        `<div class="node flex flexcolumn"><span class="name">${node.value}</span></div>`
      )
    },
  },
}

const traverse = ({
  node,
  visitors,
  parent,
  result = '',
}: {
  node: any
  visitors: Visitors
  result: any
  parent?: any
}) => {
  const actions = visitors[node.type]

  if (actions) {
    const { enter } = actions

    if (enter) return enter({ node, parent, result, visitors, traverse })
  }

  return result
}

const createLeafNode: SemanticAction<ASTNode & { value: any }> = ({
  children = [],
  type,
}) => {
  const { value, start = 0, end = 0 } = children[0]

  return {
    type,
    loc: {
      source: value,
      start,
      end,
    },
    value,
  }
}

const createBinaryExpressionNode: SemanticAction<ASTNode | ParseTreeNode> = ({
  children,
  start,
  end,
}) => {
  const [left, operator, right] = children as ParseTreeNode[]

  if (children?.length === 1) return left

  return {
    type: 'BinaryExpression',
    operator: operator.value,
    left,
    right,
    loc: {
      start,
      end,
      source: null,
    },
  }
}

const grammar: GrammarRule[] = [
  {
    exp: 'Sum : Sum [+-] Product | Product',
    action: createBinaryExpressionNode,
  },
  {
    exp: 'Product : Product "*" Factor | Factor',
    action: createBinaryExpressionNode,
  },
  {
    exp: 'Factor : "(" Sum ")" | Number',
    action({ children }) {
      if (children?.length === 1) return children[0]

      if (children?.length === 3) return children[1]

      return []
    },
  } as GrammarRule,
  {
    exp: 'Number : [0-9]+',
    action: createLeafNode,
  },
]

const input = `1 + ( 2 * 3 - 4)`

const parser = new Parser()

parser.onError = error => logChart(error.chart)

parser
  .ignore([/^[ \t\v\r]+/, /^\/\/.*/])
  .setGrammar(grammar)
  .parse(input, ({ AST, time, chart, parseTree }) => {
    console.log({ time })

    printParseTree(parseTree[0][0] as any)

    printAST(traverse({ node: AST[0], visitors, result: '' }))

    printChart(chart)

    console.log(JSON.stringify(AST, null, 4))
  })
