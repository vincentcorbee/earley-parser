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

export type SemanticAction<T = ParseTreeNode> = (node: ParseTreeNode) => T

export type GrammarRule = {
  exp: string
  action?: SemanticAction
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
  lhs: string
  raw: string
  rhs: string[][]
}

export type Productions = Map<string, ProductionRule>

export type ParseError = {
  token: Token | null
  prevToken: Token | null
  chart: Chart
  productions: Productions
}

export type ParseResult = {
  AST: any
  parseTree: ParseTree[]
  chart: Chart
  time: number
}

export type Token = {
  value: string
  line: number
  col: number
  index: number
  name: string
}

export type StateToken = {
  begin?: string
  value?: (match: string) => string
  name: string
  reg: RegExp
  cb?: (lexer: Lexer, substring?: string) => any
}

export type LexerToken = StateToken | [string, RegExp] | [string]

export type LexerState = {
  name: string
  tokens: Map<string, StateToken>
  ignoredTokens: Map<string, StateToken>
  error?: (lexer: Lexer) => any
  start: number
  end: null | number
  fn?: (lexer: Lexer) => any
}

export type StateInput = {
  lhs: string
  left: string[]
  right: string[]
  dot: number
  from: number
  previous?: State[]
  action?: SemanticAction
  token?: Token
}

export type StateLike = Pick<StateInput, 'lhs' | 'left' | 'right' | 'from'>

export type States = Map<string, State>

export type ChartColumns = Map<number, StateSet>

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
