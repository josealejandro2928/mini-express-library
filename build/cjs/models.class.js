"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
class ServerError extends Error {
    constructor(code, message, meta) {
        super(message);
        this.code = 0;
        this.meta = [];
        this.code = code;
        this.meta = meta;
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=models.class.js.map