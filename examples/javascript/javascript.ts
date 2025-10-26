import { Parser } from '../../src/modules/parser'
import { printAST, printChart, printParseTree } from '../../src/utils'
import {
  grammar,
  initialTokens,
  interfaceTokens,
  typeTokens,
  tokenBodyTokens,
} from './grammar'

import { source } from './source'

const comments: any[] = []

let timings = 0

const parser = new Parser()

parser.lexer.addTokens(initialTokens)

parser.lexer.setState('INTERFACE', lexer => {
  lexer.setTokens(interfaceTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/, /^\/\/.*/])
})

parser.lexer.setState('TYPE', lexer => {
  lexer.setTokens(typeTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/, /^\/\/.*/])
})

parser.lexer.setState('TOKENBODY', lexer => {
  lexer.setTokens(tokenBodyTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/, /^\/\/.*/])
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

  lexer.onError(lexer => lexer.skip(1))
})

parser.ignore([/^[ \t\v\r]+/, /^\/\/.*/])

parser.setGrammar(grammar)

parser.onError = error => {
  console.log(error.previousToken, error.token)
  console.log(parser.lexer.currentState)
  printChart(error.chart, { onlyCompleted: false })

  printAST('')

  printParseTree({} as any)
}

const start = performance.now()

parser.debug = true

const test1 = `function foo (a?: number, b: number = 3): number {
  return a + b;
}`

const test2 = `type UnionType<T extends foo<a.b, b>> = "one" | "two";`

const test3 = `const foo = {
	type: 'foo'
};`

const test4 = `type Node = {
  type?: string;
};`

const test5 = `const foo: { bar: number } = {
	bar: 2
};`

const test6 = `interface Foo<T> extends I {
	baz?<B>(private a: number = 4, private b: string = 'foo'): T
}`

const test7 = `interface Foo {
  fiz: string
}`

const test8 = `
interface Foo {
  fiz: (a: string) => string
}`

const test9 = `
class Foo<T> extends Fiz implements Bar<T>, Buzz<T> {
	private foo: string = "foo";

  public bar(): string {
    return 'foo'
  }
}`

parser.parse(test9, parseTree => {
  const time = performance.now() - start

  console.dir({ time, parseTree }, { depth: null })

  // parseTree = result.parseTree

  // chart = result.chart

  const [script] = parseTree

  // printParseTree(parseTree[0][0] as any)

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

  // printChart(chart)

  // parser.clearCache()

  // parser.reset()
})
