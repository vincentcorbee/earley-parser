"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitExpression = void 0;
const splitExpression = (expression, separator = ' ') => {
    const parts = [];
    let start = 0;
    let previousChar = '';
    let isInString = false;
    let isInClass = false;
    let canSplit = true;
    let isInDoubleQuotedString = false;
    let isInSingleQuotedString = false;
    for (let index = 0, end = expression.length - 1; index <= end; index++) {
        const currentChar = expression[index];
        if (currentChar === '"' && !isInClass) {
            if (!isInString) {
                isInDoubleQuotedString = true;
                isInString = true;
            }
            else if (isInDoubleQuotedString) {
                isInDoubleQuotedString = false;
                isInString = false;
            }
        }
        if (currentChar === "'" && !isInClass) {
            if (!isInString) {
                isInSingleQuotedString = true;
                isInString = true;
            }
            else if (isInSingleQuotedString) {
                isInSingleQuotedString = false;
                isInString = false;
            }
        }
        if (currentChar === '[' && !isInString)
            isInClass = true;
        if (currentChar === ']')
            isInClass = false;
        canSplit = !isInString && !isInClass;
        if (currentChar === separator && canSplit) {
            parts.push(expression.substring(start, index));
            start = index + 1;
        }
        if (index === end)
            parts.push(expression.substring(start, index + 1).trim());
        previousChar = currentChar;
    }
    return parts;
};
exports.splitExpression = splitExpression;
