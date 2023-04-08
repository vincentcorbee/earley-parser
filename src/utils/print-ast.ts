import fs from 'node:fs'
import path from 'node:path'

import { Visitors } from '../types'

const traverse = ({
  node,
  visitors,
  parent,
  result = '',
}: {
  node: any
  visitors: Visitors
  result: any
  parent?: any
}) => {
  const actions = visitors[node.type]

  if (actions) {
    const { enter } = actions

    if (enter) return enter({ node, parent, result, visitors, traverse })
  }

  return result
}

export const printAST = (content: string) => {
  const result = `<div class="tree ast flex hcenter">
    ${content}
  </div>`

  const file = fs.readFileSync(path.resolve(__dirname, 'template.html')).toString()

  fs.writeFileSync(
    path.resolve(__dirname, 'ast.html'),
    file.replace('{{root}}', result).replace('{{title}}', 'Ast')
  )
}
