"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAST = exports.createASTNode = void 0;
const createASTNode = (node) => {
    const { action, value, type, children = [], start = 0, end = 0 } = node;
    /*
      Perform action on node
    */
    if (typeof action === 'function') {
        const ASTNode = action({
            type,
            children: children.flatMap(exports.createASTNode),
            start,
            end,
        });
        return ASTNode ?? [];
    }
    return {
        type,
        value,
        children,
        start,
        end,
    };
};
exports.createASTNode = createASTNode;
const createAST = (parseTree) => parseTree.flatMap(exports.createASTNode);
exports.createAST = createAST;
