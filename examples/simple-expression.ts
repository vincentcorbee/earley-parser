import { Parser } from '../src'
import { GrammarRule, ParseTreeNode, SemanticAction, Visitors } from '../src/types'
import { logChart, printAST, printChart } from '../src/utils'

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
    exp: 'Sum : Sum plus_minus Product | Product',
    action: createBinaryExpressionNode,
  },
  {
    exp: 'Product : Product mul Factor | Factor',
    action: createBinaryExpressionNode,
  },
  {
    exp: 'Factor : l_paren Sum r_paren | Number',
    action({ children }) {
      if (children?.length === 1) return children[0]

      if (children?.length === 3) return children[1]

      return []
    },
  } as GrammarRule,
  {
    exp: 'Number : number',
    action: createLeafNode,
  },
]

const input = `1+(2*3-49)`

const parser = new Parser()

parser.lexer.setTokens([
  {
    name: 'number',
    test: /^[0-9]+/,
  },
  {
    name: 'plus_minus',
    test: /^[+-]/,
  },
  {
    name: 'mul',
    test: '*',
  },
  {
    name: 'l_paren',
    test: '(',
  },
  {
    name: 'r_paren',
    test: ')',
  },
])

parser.onError = error => {
  logChart(error.chart)

  printChart(error.chart)
}

// parser.ignore([/^[ \t\v\r]+/, /^\/\/.*/])
parser.setGrammar(grammar)

parser.parse(input, parseTree => {
  printAST(traverse({ node: parseTree[0], visitors, result: '' }))

  console.log(JSON.stringify(parseTree, null, 2))
})
