import { Chart } from './modules/chart/chart'
import { State } from './modules/chart/state'
import { StateSet } from './modules/chart/state-set'
import { Lexer } from './modules/lexer'

export type ParseTreeNode = {
  type: string
  value?: any
  children?: ParseTreeNode[]
  start?: number
  end?: number
  action?: SemanticAction
  token?: Token
}

export type ParseTree = ParseTreeNode[]

export type ASTNode = Omit<ParseTreeNode, 'action' | 'token'>

export type SemanticAction<T = ASTNode> = (node: ASTNode) => T

export type SymbolActions = {
  accepts?: { [key: string]: boolean }
}

export type Symbols = {
  [symbol: string]: SymbolActions
}

export type GrammarRule = {
  exp: string
  action?: SemanticAction
  symbols?: Symbols
}

export type NonTerminalParams = {
  value: string
  mod?: string
}

export type TerminalSymbol = { value: string }

export type NonTerminalSymbol = {
  value: string
  params: NonTerminalParams[]
  optional: boolean
}

export type CharacterClassSymbol = {
  value: string
  test: (input: string) => boolean
}

export type GrammarRuleSymbol = Partial<
  CharacterClassSymbol & TerminalSymbol & NonTerminalSymbol
> & { value: string }

export type GrammarRules = GrammarRule[]

export type ProductionRule = {
  action?: SemanticAction
  symbols?: Symbols
  lhs: string
  raw: string
  rhs: string[][]
  rhsAsString: string[]
}

export type Productions = Map<string, ProductionRule>

export type ParseError = {
  token: Token | null
  previousToken: Token | null
  chart: Chart
  productions: Productions
}

export type ParseResult = {
  AST: any
  parseTree: ParseTree[]
  chart: Chart
}

export type ParserCache = Map<string, ParseResult>

export type TransitiveItems = Map<string, State>

export type StateInput = {
  lhs: string
  left: string[]
  right: string[]
  dot: number
  from: number
  previous?: State[]
  action?: SemanticAction
  token?: Token
  columnNumber: number
}

export type StateLike = Pick<StateInput, 'lhs' | 'left' | 'right' | 'from'>

export type States = Map<string, State>

export type ChartColumns = StateSet[]

export type LexerToken =
  | (Omit<StateToken, 'test'> & { test: string | RegExp })
  | [string, RegExp | string]
  | [string]
  | string

export type LexerState = {
  name: string
  tokens: Map<string, StateToken>
  ignoredTokens: Map<string, StateToken>
  onError?: (lexer: Lexer) => any
  start: number
  end: null | number
  onInit?: (lexer: Lexer) => any
}

export type StateToken = {
  enterState?: string
  shouldConsume?: boolean
  value?: (match: string) => any
  shouldTokenize?: boolean | ((lexer: Lexer, substring?: string) => boolean)
  guard?: (substring: string) => boolean
  name: string
  test: RegExp
  onEnter?: (lexer: Lexer, substring?: string) => void | boolean
  longestOf?: string
  lineBreaks?: boolean
}

export type Token = {
  value: any
  raw: string
  line: number
  col: number
  index: number
  name: string
}

export type Visitors = {
  [key: string]: Visitor
}

export type Visitor = {
  enter: (args: {
    node: any
    result: any
    visitors: Visitors
    traverse: any
    parent: any
  }) => string
}
