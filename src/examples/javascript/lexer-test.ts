import { Lexer } from '../../modules/lexer'
import { tokens } from './grammar'

import { source } from './source'

const lexer = new Lexer()

lexer.setTokens(tokens)

lexer.ignoreTokens([/^[ \t\v\r]+/, /^\/\/.*/])

lexer.source = source

let token
const s = performance.now()

while ((token = lexer.readToken())) {
  // console.log(token)
}

console.log(performance.now() - s, token)
