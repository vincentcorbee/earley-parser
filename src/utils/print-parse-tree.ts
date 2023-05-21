import fs from 'node:fs'
import path from 'node:path'

import { ParseTreeNode } from '../types'

export const printParseTree = (rootNode: ParseTreeNode) => {
  const createTree = (node: ParseTreeNode) => {
    let html = '<div class="node flex flexcolumn">'

    const { children } = node

    const value = node.value || node.type

    if (value !== undefined) html += `<span class="name">${value}</span>`

    if (children) {
      html += `
      <div class="children flex">
        ${children.reduce((acc, child) => acc + createTree(child), '')}
      </div>
      `
    }

    return html + '</div>'
  }

  const result = `
  <div class="tree ast flex">
    ${createTree(rootNode)}
  </div>`

  const file = fs.readFileSync(path.resolve(__dirname, 'template.html')).toString()

  fs.writeFileSync(
    path.resolve(__dirname, 'parse-tree.html'),
    file.replace('{{root}}', result).replace('{{title}}', 'Parse tree')
  )
}
