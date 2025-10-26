"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLeftHandSide = void 0;
const constants_1 = require("../constants");
const removeLeftHandSide = (expression, leftHandSide) => expression
    .replace(leftHandSide, '')
    /* Remove the left hand right hand seperator */
    .replace(constants_1.regExpLeftHandRightHandSeperator, '')
    .trim();
exports.removeLeftHandSide = removeLeftHandSide;
