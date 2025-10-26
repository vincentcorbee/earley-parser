"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printAST = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const traverse = ({ node, visitors, parent, result = '', }) => {
    const actions = visitors[node.type];
    if (actions) {
        const { enter } = actions;
        if (enter)
            return enter({ node, parent, result, visitors, traverse });
    }
    return result;
};
const printAST = (content) => {
    const result = `<div class="tree ast flex hcenter">
    ${content}
  </div>`;
    const file = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'template.html')).toString();
    node_fs_1.default.writeFileSync(node_path_1.default.resolve(__dirname, 'ast.html'), file.replace('{{root}}', result).replace('{{title}}', 'Ast'));
};
exports.printAST = printAST;
