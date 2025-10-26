"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printChart = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const chart_1 = require("../modules/chart");
const printChart = (chart, options = {}) => {
    const html = `<div class="table">
    <div class="body flex">
      ${chart.reduce((acc, stateSet, index) => acc +
        `<div class="col">
            <div class="row">${index} ${stateSet.token ? `${stateSet.token?.value} ${stateSet.token?.name}` : ''} </div>
            ${stateSet.reduce((acc, state) => {
            if (options.onlyCompleted ? state.isComplete : true) {
                return (acc +
                    `<div class="row${state.isComplete ? ' is--completed' : ''}">
                ${state.lhs} → ${(0, chart_1.leftAsString)(state, ' ')} <span class='dot'>•</span> ${(0, chart_1.rightAsString)(state, ' ')} \t\t start (${state.start})
                </div>`);
            }
            return acc;
        }, '')}
          </div>`, '')}
    </div>
  </div>`;
    const file = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'template.html')).toString();
    node_fs_1.default.writeFileSync(node_path_1.default.resolve(__dirname, 'chart.html'), file.replace('{{root}}', html).replace('{{title}}', 'Chart'));
};
exports.printChart = printChart;
