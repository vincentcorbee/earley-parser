import fs from 'node:fs'
import path from 'node:path'

import { Chart } from '../modules/chart'

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
              if (options.onlyCompleted ? state.complete : true) {
                return (
                  acc +
                  `<div class="row${state.complete ? ' is--completed' : ''}">
                ${state.lhs} → ${state.leftAsString(
                    ' '
                  )} <span class='dot'>•</span> ${state.rightAsString(' ')} \t\t from (${
                    state.start
                  })
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
