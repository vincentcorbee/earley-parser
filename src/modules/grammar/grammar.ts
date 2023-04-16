import {
  GrammarRules,
  GrammarRuleSymbol,
  NonTerminalSymbol,
  Productions,
} from '../../types'
import { Lexer } from '../lexer'
import { characterClass, EMPTY, stringLiteral } from './constants'
import {
  defaultAction,
  escapeCharacters,
  escapeCharactersInCharacterClass,
} from './helpers'

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
    const match = value.match(/([a-zA-Z_]+)(\[[a-zA-Z, _?~]+\])?(\?)?/)

    if (!match) return { value, params: [], optional: false }

    const [, nonTerminal, parameters = '', optional] = match

    const params = parameters
      ? parameters
          .replace(/\[|\]/g, '')
          .trim()
          .split(/\s*,\s*/)
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

  setGrammar(grammarRules: GrammarRules) {
    const { productions } = this

    this.lexer.removeToken('SYMBOL')

    const splitExpression = (expression: string) => {
      const parts = []

      let start = 0

      let previousChar = ''

      let canSplit = true

      for (let index = 0, end = expression.length - 1; index <= end; index++) {
        const currentChar = expression[index]

        if (currentChar === '[' && previousChar && previousChar !== ' ') canSplit = false

        if (currentChar === ']') canSplit = true

        if (currentChar === ' ' && canSplit) {
          parts.push(expression.substring(start, index))

          start = index + 1
        }

        if (index === end) parts.push(expression.substring(start, index + 1))

        previousChar = currentChar
      }

      return parts
    }

    grammarRules.forEach(({ exp, action = defaultAction }) => {
      const leftHandSide = exp.match(/([a-zA-Z_]+)(\[[a-zA-Z, _~]+\])? *(?=:)/)

      if (leftHandSide) {
        const [match, lhs, parameters = ''] = leftHandSide

        if (!productions.has(lhs)) {
          const rhss = exp
            .replace(match, '')
            /* Remove the left hand right hand seperator */
            .replace(/^\s*:\s*/, '')
            /* Split on vertical bar */
            .split(/^\|\s+|\s+\|\s+/g)
            .reduce((acc, expression) => {
              const symbols = splitExpression(expression).flatMap(
                part => this.getSymbol(part) ?? []
              )

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

            const raw = expandedRhs.reduce(
              (acc, part, i) =>
                acc + `${part.join(' ')}${expandedRhs[i + 1] ? ' | ' : ''}`,
              `${lhs} : `
            )

            const production = {
              action,
              lhs: joinedLhsWithParam,
              raw,
              rhs: expandedRhs,
            }

            productions.set(joinedLhsWithParam, production)

            lhsWithParams.pop()
          }

          if (!this.startGrammarRule) this.startGrammarRule = lhs
        }
      } else throw new Error(`Incorrect grammar rule: ${exp}`)
    })
  }
}
