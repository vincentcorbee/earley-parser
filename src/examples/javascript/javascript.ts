import { Parser } from '../../modules/parser'
import { printAST, printChart, printParseTree } from '../../utils'
import { grammar, keywords, tokens } from './grammar'

import { source } from './source'

const comments: any[] = []

let timings = 0

const itterations = 1

for (let i = 0; i < itterations; i++) {
  const parser = new Parser()

  parser.onError = error => {
    printChart(error.chart)

    printAST('')

    printParseTree({} as any)

    console.log(error.token)
  }

  parser.lexer.addTokens(tokens)

  parser.lexer.setState('INTERFACE', lexer => {
    lexer.setTokens([
      'EXTENDS',
      {
        name: 'LCBRACE',
        test: '{',
        begin: 'TOKENBODY',
      },
      {
        name: 'LANGLEBRACKET',
        test: '<',
        begin: 'TOKENBODY',
      },
      ['LBRACK', '['],
      ['RBRACK', ']'],
      {
        name: 'IDENTIFIER',
        test: /^[$a-zA-Z]+(?:[a-zA-Z_\-]+)*/,
        guard: (match: string) => !keywords.includes(match),
      },
    ])

    lexer.ignore([/^[ \t\v\r]+/])
  })

  parser.lexer.setState('TYPE', lexer => {
    lexer.setTokens([
      {
        name: 'LCBRACE',
        test: '{',
        begin: 'TOKENBODY',
      },
      {
        name: 'LANGLEBRACKET',
        test: '<',
        begin: 'TOKENBODY',
      },
      {
        name: 'LBRACKET',
        test: '[',
        begin: 'TOKENBODY',
      },
      {
        name: 'LPAREN',
        test: '(',
        begin: 'TOKENBODY',
      },
      ['EQUAL', '='],
      ['BINOR', '|'],
      {
        name: 'STRING',
        test: /^((?:"(?:[^"\\]|(?:\\.))*")|'(?:[^'\\]|(?:\\.))*')/,
        value: str => str.slice(1, -1),
      },
      {
        name: 'IDENTIFIER',
        test: /^[$a-zA-Z]+(?:[a-zA-Z_\-]+)*/,
        guard: (match: string) => !keywords.includes(match),
      },
    ])

    lexer.ignore([/^[ \t\v\r]+/])
  })

  parser.lexer.setState('TOKENBODY', lexer => {
    lexer.setTokens([
      ['LANGLEBRACKET', '<'],
      {
        name: 'TOKEN',
        test: /^[^()[\]{}<>]+/,
        lineBreaks: true,
      },
      {
        name: 'RCBRACE',
        test: '}',
        begin: 'INITIAL',
      },
      {
        name: 'RANGLEBRACKET',
        test: '>',
        begin: 'INITIAL',
      },
    ])

    lexer.ignore([/^[ \t\v\r\n\r]+/])
  })

  parser.lexer.setState('COMMENT', lexer => {
    lexer.setTokens([
      {
        name: 'ENDCOMMENT',
        test: /^\*\//,
        begin: 'INITIAL',
        onEnter(_, value = '') {
          comments.push({
            type: 'CommentBlock',
            value,
          })
        },
        lineBreaks: true,
      },
    ])

    lexer.ignore([/^[ \t\v\r]+/])

    lexer.onError(lexer => lexer.skipToken(1))
  })

  parser.ignore([/^[ \t\v\r]+/, /^\/\/.*/]).setGrammar(grammar)

  parser.parse(source, ({ AST, time, chart, parseTree }) => {
    console.log({ time })

    timings += time

    const [script] = AST

    printParseTree(parseTree[0][0] as any)

    printAST(
      `<pre>${JSON.stringify(
        {
          type: 'File',
          script,
          comments,
        },
        null,
        2
      )}</pre>`
    )

    printChart(chart)

    parser.clearCache()

    parser.reset()

    // console.log(JSON.stringify(AST, null, 4))
  })
}

console.log(timings / itterations)
