"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesTrie = void 0;
class RoutesTrie {
    constructor() {
        this.tree = { isFinal: false };
    }
    set(route, ...cbs) {
        const parts = route.split("/").filter(x => x != "");
        let pivot = this.tree;
        for (const part of parts) {
            if (!(part in pivot)) {
                const node = { isFinal: false };
                pivot[part] = node;
            }
            pivot = pivot[part];
        }
        pivot.isFinal = true;
        const handlers = pivot.cbs || [];
        handlers.push(...cbs);
        pivot.cbs = handlers;
    }
    has(route) {
        const parts = route.split("/").filter(x => x != "");
        let pivot = this.tree;
        for (const part of parts) {
            if (!(part in pivot)) {
                return false;
            }
            pivot = pivot[part];
        }
        return pivot.isFinal;
    }
    get(route, req) {
        const params = {};
        const parts = route.split("/").filter(x => x != "");
        let pivot = this.tree;
        let match = null;
        for (const part of parts) {
            match = null;
            if ("*" in pivot) {
                match = "*";
                pivot = pivot[match];
                break;
            }
            for (const key in pivot) {
                if (key == "isFinal" || key == "cbs")
                    continue;
                if (key.startsWith(":")) {
                    const param = key.split(":")[1];
                    params[param] = part;
                    match = key;
                    break;
                }
                if (key == part) {
                    match = key;
                    break;
                }
            }
            if (!match)
                return [];
            pivot = pivot[match];
        }
        if (!pivot.isFinal && match !== "*")
            return [];
        req.params = params;
        if (parts.length == 0 && pivot["*"]) {
            return pivot["*"].cbs || [];
        }
        return pivot.cbs;
    }
}
exports.RoutesTrie = RoutesTrie;
//# sourceMappingURL=RoutesTrie.js.map