import { StateToken } from '../../types'

export const TokenTypes = {
  Symbol: 'SYMBOL',
  Ignore: 'IGNORE',
  Newline: 'NEWLINE',
}

export const DefaultToken: StateToken = {
  name: 'SYMBOL',
  test: /./,
}

export const States = {
  initial: 'INITIAL',
}

export const escapedCharactersInStringLiteral = /[+.*?\-\/()[\]|{}\^]/g
