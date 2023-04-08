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
            <div class="row">${index}</div>
            ${stateSet.reduce((acc: string, state) => {
              if (options.onlyCompleted ? state.complete : true) {
                return (
                  acc +
                  `<div class="row${state.complete ? ' is--completed' : ''}">
                ${state.lhs} → ${state.left.join(
                    ' '
                  )} <span class='dot'>•</span> ${state.right.join(' ')} \t\t from (${
                    state.from
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
