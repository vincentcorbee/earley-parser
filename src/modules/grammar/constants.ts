export const EMPTY = '𝜖'
export const LOOKAHEAD = 'lookahead'
export const NOT_EQUAL = '≠'
export const EQUAL = '='
export const NOT_IN_SET = '∉'
export const IN_SET = '∈'

export const characterClass = /^\[[^\]]+][*|+]?/
export const stringLiteral = /^(("([^"\\]|(\\.))*")|'([^'\\]|(\\.))*')/
export const escapedCharactersInStringLiteral = /[+.*?\-\/()[\]|]/g
export const escapedCharactersInCharacterClass =
  /(?<pre>[^A-z|0-9])(?<dash>\-)(?<post>[^A-z|0-9])/
export const lookaheadSet = new RegExp(
  `^\[lookahead [${NOT_EQUAL}${EQUAL}${NOT_IN_SET}${IN_SET}][^\]]+][*|+]?`
)
