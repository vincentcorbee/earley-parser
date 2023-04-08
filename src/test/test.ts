import { Parser } from '../'
import { GrammarRule, LexerToken, ParseTreeNode, SemanticAction } from '../types'
import { logChart } from '../utils'

interface SourceLocation {
  source: string | null
  start: number
  end: number
}

type ASTNode = {
  type: string
  loc: SourceLocation | null
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

const skipNode: SemanticAction<ParseTreeNode[]> = ({ children = [] }) => children

const returnValueFromNode: SemanticAction<ASTNode> = ({ children = [] }) =>
  children[0].value

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

const grammarWithLookahead = [
  {
    exp: `LookaheadExample :
        "n" [lookahead ∉ { 1, 3, 5, 7, 9 }] DecimalDigits
      | DecimalDigit [lookahead ∉ DecimalDigit]`,
  },
  {
    exp: `DecimalDigits :
        DecimalDigit
      | DecimalDigits DecimalDigit`,
  },
  {
    exp: `DecimalDigit : [0-9]`,
  },
]

const grammarExpression = [
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

      return null
    },
  },
  {
    exp: 'Number : [0-9]+',
    action: createLeafNode,
  },
] as GrammarRule[]

const tokens = [
  {
    name: 'BEGINCOMMENT',
    reg: /^\/\*/,
    begin: 'COMMENT',
  },
  {
    name: 'NEWLINE',
    reg: /^[\n\r]/,
    cb: lexer => {
      lexer.skipLines(1)
      // If set to true newlines are tokenized and used for automated semicolon insertion
      return false
    },
  },
] as LexerToken[]

const comments: { type: string; value: string }[] = []

const parser = new Parser()

parser.lexer.ignore([/^[ \t\v\r]+/, /^\/\/.*/])

parser.lexer.setState('COMMENT', lexer => {
  lexer.setTokens([
    {
      name: 'ENDCOMMENT',
      reg: /^\*\//,
      begin: 'INITIAL',
      cb(lexer, value = '') {
        const numberOfLines = (value.match(/\n/g) || []).length

        comments.push({
          type: 'CommentBlock',
          value,
        })

        lexer.skipLines(numberOfLines)
      },
    },
  ])

  lexer.ignore([/^[ \t\v\r]+/])
  lexer.onError(lexer => lexer.skip(1))
})

parser.setGrammar(grammarExpression)

parser.lexer.addTokens(tokens as any)

parser.onError = error => {
  logChart(error.chart)
}

const inputExpression = `1+(2*3-4)`

parser.parse(inputExpression, ({ AST, chart, time, parseTree }) => {
  // logChart(chart, { onlyCompleted: false })

  console.log({ time })

  // console.dir(parseTree, { depth: null })

  console.dir(AST, { depth: null })
})

const testArray = () => {
  const start = performance.now()

  let array: number[] = []

  for (let i = 0; i < 100; i++) {
    array[i] = i
  }

  for (let i = 0; i < 30; i++) {
    array.find(entry => entry === 4 + i)
  }

  const end = performance.now()

  console.log('array', end - start)
}

const testMap = () => {
  const start = performance.now()

  let map = new Map()

  for (let i = 0; i < 100; i++) {
    map.set(i, i)
  }

  for (let i = 0; i < 30; i++) {
    map.has(4 + i)
  }

  const end = performance.now()

  console.log('map', end - start)
}

// testArray()

// testMap()
