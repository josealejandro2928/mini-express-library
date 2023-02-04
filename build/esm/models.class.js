export class ServerError extends Error {
    code = 0;
    meta = [];
    constructor(code, message, meta) {
        super(message);
        this.code = code;
        this.meta = meta;
    }
}
//# sourceMappingURL=models.class.js.map