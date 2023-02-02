"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AppServer_instances, _AppServer_httpServer, _AppServer_port, _AppServer_mapGetHandlers, _AppServer_init, _AppServer_switchRoutes, _AppServer_extendReqRes, _AppServer_getCompositionFromPath, _AppServer_routeMatching, _AppServer_getRoutesHandler, _AppServer_errorHandler;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServer = void 0;
const node_http_1 = __importDefault(require("node:http"));
const node_url_1 = __importDefault(require("node:url"));
const node_fs_1 = __importDefault(require("node:fs"));
class AppServer {
    constructor() {
        _AppServer_instances.add(this);
        _AppServer_httpServer.set(this, null);
        _AppServer_port.set(this, 8888);
        _AppServer_mapGetHandlers.set(this, new Map());
        __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_init).call(this);
        this.errorHandler = undefined;
    }
    listen(port = 8888, cb = null) {
        var _a;
        __classPrivateFieldSet(this, _AppServer_port, port, "f");
        (_a = __classPrivateFieldGet(this, _AppServer_httpServer, "f")) === null || _a === void 0 ? void 0 : _a.listen(__classPrivateFieldGet(this, _AppServer_port, "f"), undefined, undefined, cb);
    }
    get(route, ...cbs) {
        var _a;
        if (!__classPrivateFieldGet(this, _AppServer_mapGetHandlers, "f").has(route)) {
            __classPrivateFieldGet(this, _AppServer_mapGetHandlers, "f").set(route, []);
        }
        (_a = __classPrivateFieldGet(this, _AppServer_mapGetHandlers, "f").get(route)) === null || _a === void 0 ? void 0 : _a.push(...cbs);
    }
    setErrorHandler(clientErrorHandler) {
        this.errorHandler = clientErrorHandler;
    }
}
exports.AppServer = AppServer;
_AppServer_httpServer = new WeakMap(), _AppServer_port = new WeakMap(), _AppServer_mapGetHandlers = new WeakMap(), _AppServer_instances = new WeakSet(), _AppServer_init = function _AppServer_init() {
    __classPrivateFieldSet(this, _AppServer_httpServer, node_http_1.default.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", () => {
            __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_switchRoutes).call(this, req, res, body);
        });
        req.on("error", error => {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.write(error);
        });
    }), "f");
}, _AppServer_switchRoutes = function _AppServer_switchRoutes(req, res, body) {
    const { req: reqExtended, res: resExtended } = __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_extendReqRes).call(this, req, res, body);
    if (req.method == "GET") {
        __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_getRoutesHandler).call(this, reqExtended, resExtended);
    }
    else {
        resExtended.writeHead(405, { "Content-Type": "text/html" });
        resExtended.write("Not allowed");
    }
}, _AppServer_extendReqRes = function _AppServer_extendReqRes(req, res, body = "") {
    const parseUrl = node_url_1.default.parse(req.url, true);
    const newRequest = req;
    newRequest.body = body;
    newRequest.query = parseUrl.query;
    newRequest.params = {};
    newRequest.pathName = parseUrl.pathname;
    newRequest.hostName = parseUrl.hostname;
    newRequest.context = {};
    const newResponse = res;
    newResponse.status = function (statusCode) {
        this.statusCode = statusCode;
        return this;
    };
    newResponse.text = function (data) {
        res.writeHead(this.statusCode, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
    };
    newResponse.json = function (obj) {
        res.writeHead(this.statusCode, { "Content-Type": "application/json" });
        res.write(JSON.stringify(obj));
        res.end();
    };
    newResponse.sendFile = function (pathFile, contentType = "text/html") {
        const fileReader = node_fs_1.default.createReadStream(pathFile);
        res.writeHead(this.statusCode, { "Content-Type": contentType });
        fileReader.pipe(res);
        res.once("finish", () => {
            res.end();
        });
    };
    return { req: newRequest, res: newResponse };
}, _AppServer_getCompositionFromPath = function _AppServer_getCompositionFromPath(pathStr = "") {
    return pathStr.split("/").filter(x => x != "");
}, _AppServer_routeMatching = function _AppServer_routeMatching(req, mapHandler = new Map()) {
    // this return from an example pathName: /v1/user/1/visit -> ['v1','user','1','visit']
    const reqPathComposition = __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_getCompositionFromPath).call(this, req.pathName);
    for (let route of mapHandler.keys()) {
        const routeComposition = __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_getCompositionFromPath).call(this, route);
        if (routeComposition.length != reqPathComposition.length)
            continue;
        let match = true;
        let params = req.params;
        for (let i = 0; i < reqPathComposition.length; i++) {
            if (routeComposition[i].startsWith(":")) {
                // we extract the params defined in the methods as :param
                let param = routeComposition[i].split(":")[1];
                params[param] = reqPathComposition[i];
            }
            else {
                // if in some segment of the route there is a miss match we break with inner loop and pass to the next possible declare endpoind
                if (reqPathComposition[i] != routeComposition[i]) {
                    match = false;
                    break;
                }
            }
        }
        if (match) {
            // If there is a match we return the array of middleware associate to the route declaration
            req.params = params;
            return mapHandler.get(route);
        }
    }
    // Not route handler found
    return [];
}, _AppServer_getRoutesHandler = function _AppServer_getRoutesHandler(req, res) {
    let index = 0;
    let handlersCb = __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_routeMatching).call(this, req, __classPrivateFieldGet(this, _AppServer_mapGetHandlers, "f"));
    if (handlersCb.length == 0) {
        return res.status(400).text("Not found");
    }
    let nextFunction = (error) => {
        if (error) {
            __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_errorHandler).call(this, req, res, error);
        }
        else {
            const cb = handlersCb[index++];
            Promise.resolve(cb(req, res, nextFunction)).catch(error => {
                __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_errorHandler).call(this, req, res, error);
            });
        }
    };
    nextFunction();
}, _AppServer_errorHandler = function _AppServer_errorHandler(req, res, error) {
    if (this.errorHandler) {
        __classPrivateFieldGet(this, _AppServer_instances, "m", _AppServer_errorHandler).call(this, req, res, error);
    }
    else {
        let code = (error === null || error === void 0 ? void 0 : error.code) && typeof (error === null || error === void 0 ? void 0 : error.code) == "number" ? error === null || error === void 0 ? void 0 : error.code : 500;
        res.status(code).text(error.message);
    }
};
