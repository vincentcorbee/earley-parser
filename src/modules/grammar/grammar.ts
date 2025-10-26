import {
  GrammarRules,
  GrammarRuleSymbol,
  NonTerminalSymbol,
  Productions,
} from '../../types'
import { Lexer } from '../lexer'
import {
  regExpcharacterClass,
  EMPTY,
  regExpLeftHandSide,
  regExpNonTerminal,
  regExpstringLiteral,
} from './constants'
import { escapeCharacters, getParametersSymbol, splitExpression } from './helpers'
import { removeLeftHandSide } from './helpers/remove-left-hand-side'

function expandOptionalSymbols(symbols: GrammarRuleSymbol[]) {
  const results: GrammarRuleSymbol[][] = []

  function backtrack(index: number, currentArray: GrammarRuleSymbol[]) {
    if (index === symbols.length) {
      results.push(currentArray.slice())

      return results
    }

    const symbol = symbols[index]

    if (symbol.optional) {
      backtrack(index + 1, currentArray)

      currentArray.push(symbol)

      backtrack(index + 1, currentArray)

      currentArray.pop()
    } else {
      currentArray.push(symbol)

      backtrack(index + 1, currentArray)

      currentArray.pop()
    }
  }

  backtrack(0, [])

  return results
}

export class Grammar {
  productions: Productions
  startGrammarRule?: string

  constructor(public lexer: Lexer) {
    this.productions = new Map()
  }

  get startProductionRule() {
    if (!this.startGrammarRule) return undefined

    return this.productions.get(this.startGrammarRule)
  }

  setGrammar(grammarRules: GrammarRules) {
    const { productions } = this

    grammarRules.forEach(({ exp, action, symbols }) => {
      const leftHandSide = exp.match(regExpLeftHandSide)

      if (leftHandSide) {
        const [leftHandSideMatch, lhs, parameters = ''] = leftHandSide

        if (!productions.has(lhs)) {
          const rhss = splitExpression(
            removeLeftHandSide(exp, leftHandSideMatch),
            '|'
          ).reduce((acc, expression) => {
            const symbols = this.getSymbols(expression)
            /*
              Expand optional symbols into extra right hand sides
            */
            return acc.concat(expandOptionalSymbols(symbols))
          }, [] as GrammarRuleSymbol[][])

          const lhsWithParams = [lhs, ...getParametersSymbol(parameters)]

          while (lhsWithParams.length) {
            const joinedLhsWithParam = lhsWithParams.join('_')

            const expandedRhss = rhss.map(rhs =>
              rhs.flatMap(({ value, params = [] }) =>
                params.reduce((acc, param) => {
                  if (param.mod === '?')
                    return lhsWithParams.includes(param.value)
                      ? `${acc}_${param.value}`
                      : acc

                  return `${acc}_${param.value}`
                }, value)
              )
            )

            const production = {
              action,
              symbols,
              lhs: joinedLhsWithParam,
              raw: exp,
              rhss: expandedRhss,
              rules: expandedRhss.map(rhs => `${joinedLhsWithParam}->${rhs.join(' ')}`),
            }

            productions.set(joinedLhsWithParam, production)

            lhsWithParams.pop()
          }

          if (!this.startGrammarRule) this.startGrammarRule = lhs
        }
      } else throw new Error(`Incorrect grammar rule: ${exp}`)
    })
  }

  private getSymbol(value: string): GrammarRuleSymbol | null {
    if (!value) return null

    if (value === EMPTY) return null

    let characterClassMatch = value.match(regExpcharacterClass)

    if (characterClassMatch) {
      const [, symbol, optional] = characterClassMatch

      this.lexer.addTokens([[symbol, new RegExp(`^${symbol}`)]])

      return { value: symbol, optional: Boolean(optional) }
    }

    let stringLiteralMatch = value.match(regExpstringLiteral)

    if (stringLiteralMatch) {
      const [, symbol, optional] = stringLiteralMatch

      const value = symbol.slice(1, -1)

      this.lexer.addTokens([[symbol, new RegExp(`^${escapeCharacters(value)}`)]])

      return { value, optional: Boolean(optional) }
    }

    if (this.lexer.hasToken(value)) return { value }

    return this.getNonTerminal(value)
  }

  private getNonTerminal(value: string): NonTerminalSymbol {
    const match = value.match(regExpNonTerminal)

    if (!match) return { value, params: [], optional: false }

    const [, nonTerminal, parameters = '', optional] = match

    const params = parameters
      ? getParametersSymbol(parameters).map(param => {
          if (param.includes('?'))
            return {
              value: param.replace('?', '').trim(),
              mod: '?',
            }

          return { value: param.trim() }
        })
      : []

    return { value: nonTerminal, params, optional: Boolean(optional) }
  }

  private getSymbols(expression: string) {
    return splitExpression(expression.trim()).flatMap(part => this.getSymbol(part) ?? [])
  }
}
