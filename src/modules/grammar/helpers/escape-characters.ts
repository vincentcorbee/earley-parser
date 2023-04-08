import { escapedCharactersInStringLiteral } from '../constants'

export const escapeCharacters = (value: string) =>
  value.replace(escapedCharactersInStringLiteral, '\\$&')
