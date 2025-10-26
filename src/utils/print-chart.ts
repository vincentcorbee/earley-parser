import fs from 'node:fs'
import path from 'node:path'

import { Chart, leftAsString, rightAsString } from '../modules/chart'

export const printChart = (chart: Chart, options: { onlyCompleted?: boolean } = {}) => {
  const html = `<div class="table">
    <div class="body flex">
      ${chart.reduce(
        (acc: string, stateSet, index) =>
          acc +
          `<div class="col">
            <div class="row">${index} ${
            stateSet.token ? `${stateSet.token?.value} ${stateSet.token?.name}` : ''
          } </div>
            ${stateSet.reduce((acc: string, state) => {
              if (options.onlyCompleted ? state.isComplete : true) {
                return (
                  acc +
                  `<div class="row${state.isComplete ? ' is--completed' : ''}">
                ${state.lhs} → ${leftAsString(
                    state,
                    ' '
                  )} <span class='dot'>•</span> ${rightAsString(
                    state,
                    ' '
                  )} \t\t start (${state.start})
                </div>`
                )
              }
              return acc
            }, '')}
          </div>`,
        ''
      )}
    </div>
  </div>`

  const file = fs.readFileSync(path.resolve(__dirname, 'template.html')).toString()

  fs.writeFileSync(
    path.resolve(__dirname, 'chart.html'),
    file.replace('{{root}}', html).replace('{{title}}', 'Chart')
  )
}
