import {
  GrammarRules,
  GrammarRuleSymbol,
  NonTerminalSymbol,
  Productions,
} from '../../types'
import { Lexer } from '../lexer'
import { defaultAction } from '../parser/helpers'
import { characterClass, EMPTY, stringLiteral } from './constants'
import { escapeCharacters, escapeCharactersInCharacterClass } from './helpers'

export class Grammar {
  productions: Productions
  startGrammarRule?: string

  constructor(public lexer: Lexer) {
    this.productions = new Map()
  }

  private getSymbol(value: string): GrammarRuleSymbol | null {
    if (!value) return null

    if (value === EMPTY) return null

    if (characterClass.test(value)) {
      this.lexer.addTokens([
        [value, new RegExp(`^${escapeCharactersInCharacterClass(value)}`)],
      ])

      return { value }
    }

    if (stringLiteral.test(value)) {
      this.lexer.addTokens([
        [value, new RegExp(`^${escapeCharacters(value.slice(1, -1))}`)],
      ])

      return { value }
    }

    if (this.lexer.hasToken(value)) return { value }

    return this.getNonTerminal(value)
  }

  private getNonTerminal(value: string): NonTerminalSymbol {
    const match = value.match(/([a-zA-Z_]+)(\[[a-zA-Z, _?]+\])?(\?)?/)

    if (!match) return { value, params: [], optional: false }

    const [, nonTerminal, parameters = '', optional] = match

    const params = parameters
      ? parameters
          .replace(/\[|\]/g, '')
          .split(',')
          .map(param => {
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

  get startProductionRule() {
    if (!this.startGrammarRule) return undefined

    return this.productions.get(this.startGrammarRule)
  }

  setGrammar(grammarRules: GrammarRules) {
    const { productions, lexer } = this

    this.lexer.removeToken('SYMBOL')

    grammarRules.forEach(({ exp, action = defaultAction }) => {
      const result = exp.match(/([a-zA-Z_]+)(\[[a-zA-Z, _]+\])? *(?=:)/)

      /*
        The splitting of the rhs breaks when there are pipe | tokens
      */
      if (result) {
        const [match, lhs, parameters = ''] = result

        if (!productions.has(lhs)) {
          const rhss = exp
            .replace(match, '')
            .replace(/^\s*:\s*/, '')
            .split(/^\|\s+|\s+\|\s+/g)
            .reduce((acc, expression) => {
              const symbols = expression
                .split(' ')
                .flatMap(part => this.getSymbol(part) ?? [])

              let hasOpt = false

              /*
                Expand optional symbols into extra right hand sides
              */
              symbols.forEach((symbol, i) => {
                const { optional } = symbol

                if (optional) {
                  acc.push([...symbols])

                  symbols.splice(i, 1)

                  acc.push([...symbols])

                  hasOpt = true
                }
              })

              if (!hasOpt) acc.push(symbols)

              return acc
            }, [] as GrammarRuleSymbol[][])

          const lhsWithParams = [
            lhs,
            ...(parameters
              ? parameters
                  .replace(/\[|\]/g, '')
                  .trim()
                  .split(/\s*,\s*/)
              : []),
          ]

          while (lhsWithParams.length) {
            const lhsWithParam = lhsWithParams.join('_')

            const expandedRhs = rhss.map(rhs =>
              rhs.flatMap(({ value, params = [] }) =>
                params.reduce((acc, param) => {
                  if (param.mod === '?')
                    return acc + lhsWithParams.includes(param.value)
                      ? `_${param.value}`
                      : ''

                  return acc + `_${param.value}`
                }, value)
              )
            )

            const raw = expandedRhs.reduce(
              (acc, part, i) =>
                acc + `${part.join(' ')}${expandedRhs[i + 1] ? ' | ' : ''}`,
              `${lhs} : `
            )

            const production = {
              action,
              lhs: lhsWithParam,
              raw,
              rhs: expandedRhs,
            }

            productions.set(lhsWithParam, production)

            lhsWithParams.pop()
          }

          if (!this.startGrammarRule) this.startGrammarRule = lhs
        }
      } else throw new Error(`Incorrect grammar rule: ${exp}`)
    })
  }
}
