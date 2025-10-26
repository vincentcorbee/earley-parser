"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapedCharactersInStringLiteral = exports.States = exports.DefaultToken = exports.TokenTypes = void 0;
exports.TokenTypes = {
    Symbol: 'SYMBOL',
    Ignore: 'IGNORE',
    Newline: 'NEWLINE',
};
exports.DefaultToken = {
    name: 'SYMBOL',
    test: /./,
};
exports.States = {
    initial: 'INITIAL',
};
exports.escapedCharactersInStringLiteral = /[+.*?\/()[\]|{}\^]/g;
