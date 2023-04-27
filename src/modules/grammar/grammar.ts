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
import {
  defaultAction,
  escapeCharacters,
  escapeCharactersInCharacterClass,
  getParametersSymbol,
  splitExpression,
} from './helpers'
import { removeLeftHandSide } from './helpers/remove-left-hand-side'

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

  private getSymbol(value: string): GrammarRuleSymbol | null {
    if (!value) return null

    if (value === EMPTY) return null

    let characterClassMatch = value.match(regExpcharacterClass)

    if (characterClassMatch) {
      const [, symbol, optional] = characterClassMatch

      this.lexer.addTokens([
        [symbol, new RegExp(`^${escapeCharactersInCharacterClass(symbol)}`)],
      ])

      return { value: symbol, optional: Boolean(optional) }
    }

    let stringLiteralMatch = value.match(regExpstringLiteral)

    if (stringLiteralMatch) {
      const [, symbol, optional] = stringLiteralMatch

      this.lexer.addTokens([
        [symbol, new RegExp(`^${escapeCharacters(symbol.slice(1, -1))}`)],
      ])

      return { value: symbol, optional: Boolean(optional) }
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

  setGrammar(grammarRules: GrammarRules) {
    const { productions } = this

    this.lexer.removeToken('SYMBOL')

    grammarRules.forEach(({ exp, action = defaultAction }) => {
      const leftHandSide = exp.match(regExpLeftHandSide)

      if (leftHandSide) {
        const [leftHandSideMatch, lhs, parameters = ''] = leftHandSide

        if (!productions.has(lhs)) {
          const rhss = splitExpression(
            removeLeftHandSide(exp, leftHandSideMatch),
            '|'
          ).reduce((acc, expression) => {
            const symbols = splitExpression(expression.trim()).flatMap(
              part => this.getSymbol(part) ?? []
            )

            /*
              Expand optional symbols into extra right hand sides
            */

            const optionalSymbols = new Map()

            for (let i = 0; i < symbols.length; i++) {
              const symbol = symbols[i]

              if (symbol.optional) {
                acc.push([...symbols.slice(0, i), ...symbols.slice(i + 1)])

                optionalSymbols.set(i, true)
              }
            }

            acc.push(symbols)

            if (optionalSymbols.size > 1) {
              acc.push(symbols.filter((_, i) => !optionalSymbols.has(i)))
            }

            return acc
          }, [] as GrammarRuleSymbol[][])

          const lhsWithParams = [lhs, ...getParametersSymbol(parameters)]

          while (lhsWithParams.length) {
            const joinedLhsWithParam = lhsWithParams.join('_')

            const expandedRhs = rhss.map(rhs =>
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
              lhs: joinedLhsWithParam,
              raw: exp,
              rhs: expandedRhs,
            }

            // if (lhs === 'SingleNameBinding') console.log(production)

            // if (lhs === 'LexicalBinding') console.log(production)

            productions.set(joinedLhsWithParam, production)

            lhsWithParams.pop()
          }

          if (!this.startGrammarRule) this.startGrammarRule = lhs
        }
      } else throw new Error(`Incorrect grammar rule: ${exp}`)
    })
  }
}
