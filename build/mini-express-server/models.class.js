"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
class ServerError extends Error {
    constructor(code, message) {
        super(message);
        this.code = 0;
        this.code = code;
    }
}
exports.ServerError = ServerError;
