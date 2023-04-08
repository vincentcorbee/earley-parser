import { Chart } from '../modules/chart/chart'

const getWhitespace = (line: string, maxLength: number) => {
  const lineLength = line.replace(/\x1b\[[0-9]*m/g, '').length

  let diff = maxLength + 5 - lineLength
  let whitespace = ''

  while (diff > 0) {
    whitespace += ' '

    diff--
  }

  return whitespace
}

export const logChart = (chart: Chart, options: { onlyCompleted?: boolean } = {}) => {
  const log: [string, string[][]][] = []

  let maxLength = 0

  chart.forEach((stateSet, i) => {
    const column: [string, string[][]] = [`\x1b[33m==== ${i} ====\x1b[m`, []]
    const rules = column[1]

    stateSet.forEach(state => {
      if (options.onlyCompleted ? state.complete : true) {
        const rule = `${state.complete ? '\x1b[32m' : ''}${state.lhs} ->${
          state.left.length ? ' ' : ''
        }${state.left.join(' ')} \x1b[1;31m•\x1b[m ${state.right.join(' ')}`

        const ruleLength = rule.replace(/\x1b\[[0-9]*m/g, '').length

        maxLength = ruleLength > maxLength ? ruleLength : maxLength

        rules.push([rule.trim(), `from (${state.from})\x1b[m`])
      }
    })

    log.push(column)
  })

  log.forEach(column => {
    const [columnNumber, rules] = column

    console.log(columnNumber)

    rules.forEach(rule => {
      const [line, from] = rule

      console.log(`${line}${getWhitespace(line, maxLength)}${from}`)
    })
  })
}
