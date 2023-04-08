import http, { ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { getArgs } from '@digitalbranch/get-args'

const { port = 9875 } = getArgs('--')

const sendTemplate = (templateName: string, response: ServerResponse) =>
  fs.createReadStream(path.resolve(__dirname, templateName)).pipe(response)

const server = new http.Server((request, response) => {
  const { method, url = '' } = request

  if (method === 'GET') {
    if (url.endsWith('ast')) return sendTemplate('ast.html', response)

    if (url.endsWith('parse-tree')) return sendTemplate('parse-tree.html', response)

    if (url.endsWith('chart')) return sendTemplate('chart.html', response)

    response.statusCode = 404

    response.end('Not found')
  }
})

server.listen(port, () => console.log(`Server listening on port: ${port}`))
