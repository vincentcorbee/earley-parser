import { Chart } from './modules/chart/chart'
import { StateSet } from './modules/chart/state-set'
import { Lexer } from './modules/lexer'

export type ParseTreeNode = {
  type: string
  value?: any
  children?: any[]
  start?: number
  end?: number
  action?: SemanticAction
  token?: Token
}

export type ParseTree = ParseTreeNode[]

export type ASTNode = Omit<ParseTreeNode, 'action' | 'token'>

export type SemanticAction<T = ASTNode | ASTNode[]> = (node: ASTNode) => T

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
  action: SemanticAction
  symbols?: Symbols
  lhs: string
  raw: string
  rhss: string[][]
  rules: string[]
}

export type Productions = Map<string, ProductionRule>

export type ParseError = {
  token: Token | null
  previousToken: Token | null
  chart: Chart
  productions: Productions
}

export type ParseResult = {
  AST?: any
  parseTree: any
  chart: Chart
}

export type ParserCache = Map<string, ParseResult>

export type TransitiveItems = Map<string, StateInterface>

export type StateInput = {
  lhs: string
  rhs: string[]
  dot: number
  start: number
  previous?: StateInterface[]
  action?: SemanticAction
  token?: Token
  end: number
  rule: string
}

export interface StateInterface {
  lhs: string
  rhs: string[]
  dot: number
  start: number
  previous: StateInterface[]
  token?: Token | null
  action?: SemanticAction
  end: number
  complete: boolean
  nextProductionRule: null | ProductionRule
  nextSymbol?: string
  rule: string

  new (stateInput: StateInput): StateInterface

  get left(): string[]

  leftAsString(seperator: string): string

  rightAsString(seperator: string): string

  isLhsEqualToRhs(state: StateInterface): boolean

  getTransitiveKey(): string

  hasRightRecursion(productions: Productions): boolean

  expectNonTerminal(productions: Productions): string | null

  expectTerminal(productions: Productions): boolean

  addPrevious(state: StateInterface | StateInterface[]): void

  toString(): string
}

export interface StateSetInterface {
  states: StateInterface[]

  keys: Map<string, number>

  token: Token | null

  new (token?: Token): void

  entries(): IterableIterator<[number, StateInterface]>

  values(): IterableIterator<StateInterface>

  getKey(stateLike: StateInterface | StateLike): string

  add(stateLike: StateInterface | StateInput, productions?: Productions): StateInterface

  has(stateLike: StateInterface | StateLike): boolean

  get(identifier: StateInterface | StateLike | number): StateInterface | undefined

  forEach(callbackfn: (value: StateInterface, index: number) => void): void

  find(
    callbackfn: (
      state: StateInterface,
      index: number,
      states: StateInterface[]
    ) => boolean
  ): StateInterface | undefined

  reduce(
    callbackFn: (accumlator: any, value: StateInterface, key: number) => any,
    startValue?: any
  ): any

  [Symbol.iterator](): IterableIterator<StateInterface>
}

export type StateLike = Pick<StateInput, 'lhs' | 'rhs' | 'start' | 'dot' | 'rule'>

export type States = Map<string, StateInterface>

export type ChartColumns = StateSetInterface[]

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

// export type Token = [
//   value: any,
//   raw: string,
//   line: number,
//   col: number,
//   index: number,
//   name: string
// ]

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
