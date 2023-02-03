"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServer = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_http_1 = require("node:http");
const url = require("node:url");
const fs = require("node:fs");
class AppServer {
    constructor() {
        this.httpServer = null;
        this.port = 8888;
        this.mapGetHandlers = new Map();
        this.mapPostHandlers = new Map();
        this.mapPutHandlers = new Map();
        this.mapDeleteHandlers = new Map();
        this.globalMiddlewares = [];
        this.init();
        this.customErrorHandler = undefined;
    }
    init() {
        this.httpServer = (0, node_http_1.createServer)((req, res) => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });
            req.on("end", () => {
                this.switchRoutes(req, res, body);
            });
            req.on("error", error => {
                res.writeHead(500, { "Content-Type": "text/html" });
                res.write(error);
            });
        });
    }
    switchRoutes(req, res, body) {
        const { req: reqExtended, res: resExtended } = this.extendReqRes(req, res, body);
        if (req.method == "GET") {
            this.routesHandler(reqExtended, resExtended, this.mapGetHandlers);
        }
        else if (req.method == "POST") {
            this.routesHandler(reqExtended, resExtended, this.mapPostHandlers);
        }
        else if (req.method == "PUT") {
            this.routesHandler(reqExtended, resExtended, this.mapPutHandlers);
        }
        else if (req.method == "DELETE") {
            this.routesHandler(reqExtended, resExtended, this.mapDeleteHandlers);
        }
        else {
            resExtended.writeHead(405, { "Content-Type": "text/html" });
            resExtended.write("Not allowed");
        }
    }
    extendReqRes(req, res, body = "") {
        const parseUrl = url.parse(req.url, true);
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
            const fileReader = fs.createReadStream(pathFile);
            res.writeHead(this.statusCode, { "Content-Type": contentType });
            fileReader.pipe(res);
            res.once("finish", () => {
                res.end();
            });
        };
        return { req: newRequest, res: newResponse };
    }
    listen(port = 8888, cb = null) {
        var _a;
        this.port = port;
        (_a = this.httpServer) === null || _a === void 0 ? void 0 : _a.listen(this.port, undefined, undefined, cb);
    }
    get(route, ...cbs) {
        var _a;
        if (!this.mapGetHandlers.has(route)) {
            this.mapGetHandlers.set(route, []);
        }
        (_a = this.mapGetHandlers.get(route)) === null || _a === void 0 ? void 0 : _a.push(...cbs);
    }
    post(route, ...cbs) {
        var _a;
        if (!this.mapPostHandlers.has(route)) {
            this.mapPostHandlers.set(route, []);
        }
        (_a = this.mapPostHandlers.get(route)) === null || _a === void 0 ? void 0 : _a.push(...cbs);
    }
    put(route, ...cbs) {
        var _a;
        if (!this.mapPutHandlers.has(route)) {
            this.mapPutHandlers.set(route, []);
        }
        (_a = this.mapPutHandlers.get(route)) === null || _a === void 0 ? void 0 : _a.push(...cbs);
    }
    delete(route, ...cbs) {
        var _a;
        if (!this.mapDeleteHandlers.has(route)) {
            this.mapDeleteHandlers.set(route, []);
        }
        (_a = this.mapDeleteHandlers.get(route)) === null || _a === void 0 ? void 0 : _a.push(...cbs);
    }
    use(route, cb) {
        if (typeof route == "string") {
            if (!cb)
                throw Error("There should be a callback function");
            const executor = cb;
            // register in all maps
            this.get(route, executor);
            this.post(route, executor);
            this.put(route, executor);
            this.delete(route, executor);
        }
        if (typeof route == "function") {
            if (cb)
                throw Error("Only one registration for the global use function");
            const executor = route;
            this.globalMiddlewares.push(executor);
        }
    }
    setErrorHandler(clientErrorHandler) {
        this.customErrorHandler = clientErrorHandler;
    }
    getCompositionFromPath(pathStr = "") {
        return pathStr.split("/").filter(x => x != "");
    }
    routeMatching(req, mapHandler) {
        // this return from an example pathName: /v1/user/1/visit -> ['v1','user','1','visit']
        const reqPathComposition = this.getCompositionFromPath(req.pathName);
        for (const route of mapHandler.keys()) {
            const routeComposition = this.getCompositionFromPath(route);
            if (routeComposition.length != reqPathComposition.length)
                continue;
            let match = true;
            const params = req.params;
            for (let i = 0; i < reqPathComposition.length; i++) {
                if (routeComposition[i].startsWith(":")) {
                    // we extract the params defined in the methods as :param
                    const param = routeComposition[i].split(":")[1];
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
    }
    routesHandler(req, res, mapHandler) {
        let index = 0;
        let handlersCb = this.routeMatching(req, mapHandler);
        if (handlersCb.length == 0) {
            return res.status(404).text("Not found");
        }
        handlersCb = [...this.globalMiddlewares, ...handlersCb];
        const nextFunction = (error) => __awaiter(this, void 0, void 0, function* () {
            if (error) {
                this.errorHandler(req, res, error);
            }
            else {
                const cb = handlersCb[index++];
                try {
                    yield cb(req, res, nextFunction);
                }
                catch (error) {
                    console.log("Here there is an error");
                    this.errorHandler(req, res, error);
                }
            }
        });
        nextFunction();
    }
    errorHandler(req, res, error) {
        if (this.customErrorHandler) {
            this.customErrorHandler(req, res, error);
        }
        else {
            const code = (error === null || error === void 0 ? void 0 : error.code) && typeof (error === null || error === void 0 ? void 0 : error.code) == "number"
                ? error === null || error === void 0 ? void 0 : error.code
                : 500;
            res.status(code).text(error.message);
        }
    }
    getHttpServer() {
        return this.httpServer;
    }
}
exports.AppServer = AppServer;
//# sourceMappingURL=AppServer.js.map