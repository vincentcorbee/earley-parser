export const EMPTY = '𝜖'
export const LOOKAHEAD = 'lookahead'
export const NOT_EQUAL = '≠'
export const EQUAL = '='
export const NOT_IN_SET = '∉'
export const IN_SET = '∈'

export const regExpcharacterClass = /^(\[[^\]]+][*|+]?)(\?)?/
export const regExpstringLiteral = /^((?:"(?:[^"\\]|[.])*")|(?:'(?:[^'\\]|[.])*'))(\?)?/
export const escapedCharactersInStringLiteral = /[+.*?\/()[\]|{}]/g

export const lookaheadSet = new RegExp(
  `^\[lookahead [${NOT_EQUAL}${EQUAL}${NOT_IN_SET}${IN_SET}][^\]]+][*|+]?`
)
export const regExpLeftHandSide = /([a-zA-Z_]+)(\[[a-zA-Z, _~]+\])? *(?=:)/
export const regExpNonTerminal = /([a-zA-Z_]+)(\[[a-zA-Z, _?~]+\])?(\?)?/
export const regExpLeftHandRightHandSeperator = /^\s*:\s*/
export const regExpSeperatorParameters = /\s*,\s*/
export const regExpBrackets = /\[|\]/g
