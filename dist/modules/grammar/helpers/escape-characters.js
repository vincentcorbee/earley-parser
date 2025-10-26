"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeCharacters = void 0;
const constants_1 = require("../constants");
const escapeCharacters = (value) => value.replace(constants_1.escapedCharactersInStringLiteral, '\\$&');
exports.escapeCharacters = escapeCharacters;
