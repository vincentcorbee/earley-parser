import { escapedCharactersInCharacterClass } from '../constants'

export const escapeCharactersInCharacterClass = (value: string) =>
  value.replace(escapedCharactersInCharacterClass, '$<pre>\\$<dash>$<post>')
