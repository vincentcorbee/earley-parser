import { Parser } from '../src'
import { LexerToken } from '../src/types'

const input = `(def square (a) (b * c))`

const tokens: LexerToken[] = [
  {
    name: 'NEWLINE',
    test: /^[\n\r]/,
    shouldTokenize: false,
    lineBreaks: true,
  },
]

const parser = new Parser()

parser.lexer.addTokens(tokens as any)

parser.setGrammar([
  {
    exp: `list : "(" list_items ")"`,
    action(node) {
      const children = node.children!

      return {
        name: 'list',
        type: 'list',
        children: children,
      }
    },
  },
  {
    exp: `list_items : s_expression | list_items s_expression`,
    action(node) {
      return node.children
    },
  },
  {
    exp: `s_expression :
        atomic_symbol
      | list`,
    action({ children = [] }) {
      return children
    },
  },
  {
    exp: `atomic_symbol :
        empty
      | letter
      | number
      | "*"`,
    action(node) {
      const children = node.children!

      return children[0]
    },
  },
  {
    exp: `letter : [A-z]+`,
    action({ children = [], type }) {
      const { value: name, start, end } = children[0]

      return {
        type,
        start,
        end,
        name,
      }
    },
  },
  {
    exp: `number : [0-9]+`,
    action({ children = [], type }) {
      const { value: name, start, end } = children[0]

      return {
        type,
        start,
        end,
        name,
      }
    },
  },
  {
    exp: `empty : " "`,
    action({ children = [], type }) {
      const { value: name, start, end } = children[0]

      return {
        type,
        start,
        end,
        name,
      }
    },
  },
])

parser.onError = error => {
  console.log(error.token)
}

parser.parse(input, parseTree => {
  console.dir(parseTree, { depth: null })
})
