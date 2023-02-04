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
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_http_1 = require("node:http");
const url = require("node:url");
const fs = require("node:fs");
const path = require("node:path");
const RoutesTrie_1 = require("./RoutesTrie");
const mime = require("mime-types");
class AppServer {
    constructor() {
        this.httpServer = null;
        this.port = 8888;
        this.mapGetHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapPostHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapPutHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapDeleteHandlers = new RoutesTrie_1.RoutesTrie();
        this.globalMiddlewares = [];
        this.staticRouteMap = {};
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
            this.writeHead(this.statusCode, { "Content-Type": "text/html" });
            this.write(data);
            this.end();
        };
        newResponse.json = function (obj) {
            this.writeHead(this.statusCode, { "Content-Type": "application/json" });
            this.write(JSON.stringify(obj));
            this.end();
        };
        newResponse.sendFile = function (pathFile, contentType = "text/html") {
            const fileReader = fs.createReadStream(pathFile);
            contentType = mime.contentType(path.extname(pathFile));
            this.writeHead(this.statusCode, { "Content-Type": contentType });
            fileReader.pipe(this);
            fileReader.once("error", error => {
                this.status(500).text(error.message);
            });
            this.once("finish", () => {
                this.end();
            });
        };
        return { req: newRequest, res: newResponse };
    }
    listen(port = 8888, cb) {
        var _a;
        this.port = port;
        (_a = this.httpServer) === null || _a === void 0 ? void 0 : _a.listen(this.port, undefined, undefined, () => {
            var _a;
            if (cb) {
                cb((_a = this.httpServer) === null || _a === void 0 ? void 0 : _a.address());
            }
        });
    }
    get(route, ...cbs) {
        this.mapGetHandlers.set(route, ...cbs);
    }
    post(route, ...cbs) {
        this.mapPostHandlers.set(route, ...cbs);
    }
    put(route, ...cbs) {
        this.mapPutHandlers.set(route, ...cbs);
    }
    delete(route, ...cbs) {
        this.mapDeleteHandlers.set(route, ...cbs);
    }
    use(route, cb = null) {
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
    // private getCompositionFromPath(pathStr = ""): string[] {
    //   return pathStr.split("/").filter(x => x != "");
    // }
    // private routeMatching(req: IRequest, mapHandler: Map<string, IMiddleware[]>): IMiddleware[] {
    //   // this return from an example pathName: /v1/user/1/visit -> ['v1','user','1','visit']
    //   const reqPathComposition = this.getCompositionFromPath(req.pathName);
    //   for (const route of mapHandler.keys()) {
    //     const routeComposition = this.getCompositionFromPath(route);
    //     if (routeComposition.length != reqPathComposition.length) continue;
    //     let match = true;
    //     const params: any = req.params;
    //     for (let i = 0; i < reqPathComposition.length; i++) {
    //       if (routeComposition[i].startsWith(":")) {
    //         // we extract the params defined in the methods as :param
    //         const param = routeComposition[i].split(":")[1];
    //         params[param] = reqPathComposition[i];
    //       } else {
    //         // if in some segment of the route there is a miss match we break with inner loop and pass to the next possible declare endpoind
    //         if (reqPathComposition[i] != routeComposition[i]) {
    //           match = false;
    //           break;
    //         }
    //       }
    //     }
    //     if (match) {
    //       // If there is a match we return the array of middleware associate to the route declaration
    //       req.params = params;
    //       return mapHandler.get(route) as IMiddleware[];
    //     }
    //   }
    //   // Not route handler found
    //   return [];
    // }
    routesHandler(req, res, mapHandler) {
        let index = 0;
        const pathName = req.pathName;
        let handlersCb = [];
        if (this.handlerStatic(pathName, req)) {
            handlersCb.push(this.getstaticMiddleware());
        }
        else {
            handlersCb = mapHandler.get(pathName, req);
        }
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
            res.status(code).text((error === null || error === void 0 ? void 0 : error.message) || error || "Error");
        }
    }
    getHttpServer() {
        return this.httpServer;
    }
    //////////////STATIC FUNCTION//////////////////////////
    handlerStatic(pathName, req) {
        let found = false;
        if (req.method != "GET")
            return false;
        for (const route in this.staticRouteMap) {
            if (pathName.startsWith(route)) {
                found = true;
                req.__DIR_STATIC_REFERENCED = this.staticRouteMap[route];
                req.__ROUTE_STATIC_REFERENCED = route;
                break;
            }
        }
        if (found)
            return true;
        return false;
    }
    setStatic(route, pathToStaticDir) {
        if (!fs.existsSync(pathToStaticDir))
            throw new Error("THe path to static directory does not exists");
        if (!fs.statSync(pathToStaticDir).isDirectory())
            throw new Error("The static path shoulb be referenced to a directory");
        this.staticRouteMap[route] = pathToStaticDir;
    }
    getstaticMiddleware() {
        return (req, res, next) => {
            var _a;
            const pathName = req.pathName;
            const staticFolder = req.__DIR_STATIC_REFERENCED;
            const route = req.__ROUTE_STATIC_REFERENCED;
            try {
                const segmentPath = (_a = pathName.split(route)) === null || _a === void 0 ? void 0 : _a[1].trim();
                const fullPath = path.join(staticFolder, segmentPath);
                fs.stat(fullPath, (error, stats) => {
                    if (error) {
                        return res.status(404).text(error.message);
                    }
                    if (stats.isDirectory()) {
                        return res.status(404).text("Not found");
                    }
                    res.writeHead(200, {
                        "Content-Type": mime.contentType(path.extname(fullPath)),
                        "Content-Length": stats.size,
                    });
                    const readStream = fs.createReadStream(fullPath);
                    readStream.pipe(res);
                    readStream.once("error", error => {
                        return res.status(404).text(error.message);
                    });
                    readStream.once("end", () => {
                        res.end();
                    });
                });
            }
            catch (e) {
                console.log("Error here");
                next(e);
            }
        };
    }
}
exports.default = AppServer;
//# sourceMappingURL=AppServer.js.map