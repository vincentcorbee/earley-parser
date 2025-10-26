"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const get_args_1 = require("@digitalbranch/get-args");
const { port = 9875 } = (0, get_args_1.getArgs)('--');
const sendTemplate = (templateName, response) => node_fs_1.default.createReadStream(node_path_1.default.resolve(__dirname, templateName)).pipe(response);
const server = new node_http_1.default.Server((request, response) => {
    const { method, url = '' } = request;
    if (method === 'GET') {
        if (url.endsWith('ast'))
            return sendTemplate('ast.html', response);
        if (url.endsWith('parse-tree'))
            return sendTemplate('parse-tree.html', response);
        if (url.endsWith('chart'))
            return sendTemplate('chart.html', response);
        if (url === '/') {
            response.statusCode = 301;
            response.setHeader('Location', '/parse-tree');
            response.end();
            return;
        }
        response.statusCode = 404;
        response.end('Not found');
    }
});
server.listen(port, () => console.log(`Server listening on port: ${port}`));
