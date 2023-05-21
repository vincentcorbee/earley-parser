import { Parser } from '../../modules/parser'
import { printAST, printChart, printParseTree } from '../../utils'
import { grammar, keywords, tokens } from './grammar'

import { source } from './source'

const comments: any[] = []

let timings = 0

const itterations = 1

let parseTree: any

let chart: any

for (let i = 0; i < itterations; i++) {
  const parser = new Parser()

  parser.lexer.addTokens(tokens)

  parser.lexer.setState('INTERFACE', lexer => {
    lexer.setTokens([
      'EXTENDS',
      {
        name: 'LCBRACE',
        test: '{',
        enterState: 'TOKENBODY',
      },
      {
        name: 'RCBRACE',
        test: '}',
        enterState: 'PARENT',
      },
      {
        name: 'LANGLEBRACKET',
        test: '<',
        enterState: 'TOKENBODY',
      },
      {
        name: 'RANGLEBRACKET',
        test: '>',
        enterState: 'TOKENBODY',
      },
      ['LBRACK', '['],
      ['RBRACK', ']'],
      {
        name: 'IDENTIFIER',
        test: /^[$a-zA-Z]+(?:[a-zA-Z_\-]+)*/,
        guard: (match: string) => !keywords.includes(match),
      },
    ])

    lexer.ignoreTokens([/^[ \t\v\r]+/])
  })

  parser.lexer.setState('TYPE', lexer => {
    lexer.setTokens([
      {
        name: 'NEWLINE',
        test: /^[\n]/,
        lineBreaks: true,
        shouldTokenize: false,
      },
      {
        name: 'LCBRACE',
        test: '{',
        enterState: 'TOKENBODY',
      },
      {
        name: 'LANGLEBRACKET',
        test: '<',
        enterState: 'TOKENBODY',
      },
      {
        name: 'LBRACKET',
        test: '[',
        enterState: 'TOKENBODY',
      },
      {
        name: 'LPAREN',
        test: '(',
        enterState: 'TOKENBODY',
      },
      ['EQUAL', '='],
      ['BINOR', '|'],
      {
        name: 'SEMI',
        test: ';',
        enterState: 'PARENT',
      },
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

    lexer.ignoreTokens([/^[ \t\v\r]+/])
  })

  parser.lexer.setState('TOKENBODY', lexer => {
    lexer.setTokens([
      {
        name: 'NEWLINE',
        test: /^[\n]/,
        lineBreaks: true,
        shouldTokenize: false,
      },
      'NULL',
      ['OTHER_PUNCTUATOR', /^[|:;=]/],
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
      {
        name: 'RCBRACE',
        test: '}',
        enterState: 'PARENT',
        shouldConsume: false,
      },
      {
        name: 'LANGLEBRACKET',
        test: '<',
        // enterState: 'PARENT',
      },
      {
        name: 'RANGLEBRACKET',
        test: '>',
        enterState: 'PARENT',
      },
    ])

    lexer.ignoreTokens([/^[ \t\v\r]+/])
  })

  parser.lexer.setState('COMMENT', lexer => {
    lexer.setTokens([
      {
        name: 'ENDCOMMENT',
        test: /^\*\//,
        enterState: 'INITIAL',
        onEnter(_, value = '') {
          comments.push({
            type: 'CommentBlock',
            value,
          })
        },
        lineBreaks: true,
      },
    ])

    lexer.ignoreTokens([/^[ \t\v\r]+/])

    lexer.onError(lexer => lexer.skipToken(1))
  })

  parser.ignore([/^[ \t\v\r]+/, /^\/\/.*/])

  parser.setGrammar(grammar)

  parser.onError = error => {
    printChart(error.chart, { onlyCompleted: false })

    printAST('')

    printParseTree({} as any)
  }

  const start = performance.now()

  parser.parse(source, result => {
    const time = performance.now() - start

    timings += time

    console.log({ time })

    // parseTree = result.parseTree

    // chart = result.chart

    // const [script] = AST

    // printParseTree(parseTree[0][0] as any)

    // printAST(
    //   `<pre>${JSON.stringify(
    //     {
    //       type: 'File',
    //       script,
    //       comments,
    //     },
    //     null,
    //     2
    //   )}</pre>`
    // )

    // printChart(chart)

    parser.clearCache()

    parser.reset()
  })
}

// printChart(chart)
// printParseTree(parseTree)

console.log({ avg: timings / itterations })
