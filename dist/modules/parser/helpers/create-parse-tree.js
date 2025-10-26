"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParseTree = void 0;
const getLengthOfTokenValue = ({ value }) => typeof value === 'string' ? value.length : value ? value.toString().length : 0;
/*
  Convert states into a parse tree
*/
const createParseTree = ({ token, isComplete, lhs: type, action, previous }, parentNode = null, previousToken = null, end = []) => {
    const node = {
        type,
        start: 0,
        end: 0,
    };
    const children = parentNode?.children;
    if (token) {
        node.start = token.index;
        node.end = node.start + getLengthOfTokenValue(token);
        node.value = token?.value;
        if (parentNode)
            parentNode.start = node.start;
        end.push(node.end);
    }
    else if (previousToken) {
        node.end = previousToken.index;
    }
    if (!token)
        node.children = [];
    if (isComplete)
        parentNode = node;
    previousToken = token || previousToken;
    const { length } = previous;
    let index = 0;
    while (index < length)
        (0, exports.createParseTree)(previous[index++], parentNode, previousToken, end);
    /* The nodes end will be the end or the first entry in the end array */
    node.end = node.end || end[end.length - 1];
    if (children) {
        const childNodes = isComplete && action ? action(node) : node;
        if (Array.isArray(childNodes))
            children.push(...childNodes);
        else
            children.push(childNodes);
    }
    else if (isComplete && action) {
        return action(node);
    }
    return node;
};
exports.createParseTree = createParseTree;
