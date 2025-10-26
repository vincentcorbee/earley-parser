"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParametersSymbol = void 0;
const constants_1 = require("../constants");
const getParametersSymbol = (parameters) => parameters
    ? parameters.replace(constants_1.regExpBrackets, '').trim().split(constants_1.regExpSeperatorParameters)
    : [];
exports.getParametersSymbol = getParametersSymbol;
