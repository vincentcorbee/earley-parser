"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printParseTree = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const printParseTree = (rootNode) => {
    const createTree = (node) => {
        let html = '<div class="node flex flexcolumn">';
        const { children } = node;
        const value = node.value || node.type;
        if (value !== undefined)
            html += `<span class="name">${value}</span>`;
        if (children) {
            html += `
      <div class="children flex">
        ${children.reduce((acc, child) => acc + createTree(child), '')}
      </div>
      `;
        }
        return html + '</div>';
    };
    const result = `
  <div class="tree ast flex">
    ${createTree(rootNode)}
  </div>`;
    const file = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'template.html')).toString();
    node_fs_1.default.writeFileSync(node_path_1.default.resolve(__dirname, 'parse-tree.html'), file.replace('{{root}}', result).replace('{{title}}', 'Parse tree'));
};
exports.printParseTree = printParseTree;
