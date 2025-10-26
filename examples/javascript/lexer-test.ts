import { Lexer } from '../../src/modules/lexer'
import { initialTokens, interfaceTokens, tokenBodyTokens, typeTokens } from './grammar'

import { source } from './source'

const lexer = new Lexer()

lexer.setTokens(initialTokens)

lexer.setState('INTERFACE', lexer => {
  lexer.setTokens(interfaceTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/])
})

lexer.setState('TYPE', lexer => {
  lexer.setTokens(typeTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/])
})

lexer.setState('TOKENBODY', lexer => {
  lexer.setTokens(tokenBodyTokens)

  lexer.ignoreTokens([/^[ \t\v\r]+/])
})

lexer.ignoreTokens([/^[ \t\v\r]+/, /^\/\/.*/])

const test = `type Number<T> = number;`
const test4 = `type UnionType<T extends foo<a.b, b>> = "one" | "two";`

const test2 = `const foo = {
	type: 'foo'
}`

const test3 = `type Node<number> = {
  number: number;
};`

const test5 = `const foo: { bar: number } = {
	bar: 2
};`

lexer.source = test5

let token
const s = performance.now()

while ((token = lexer.next())) {
  console.log('====================')
  console.log(token, lexer.currentState)
  console.log('====================')
}

console.log(performance.now() - s, token)
