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
const node_http2_1 = require("node:http2");
const url = require("node:url");
const fs = require("node:fs");
const path = require("node:path");
const models_class_1 = require("./models.class");
const RoutesTrie_1 = require("./RoutesTrie");
const Router_1 = require("./Router");
const node_util_1 = require("node:util");
const statPromisified = (0, node_util_1.promisify)(fs.stat);
const readdirPromisified = (0, node_util_1.promisify)(fs.readdir);
const mime = require("mime-types");
class AppServer {
    constructor(options) {
        this.httpServer = null;
        this.port = 8888;
        this.mapGetHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapPostHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapPutHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapDeleteHandlers = new RoutesTrie_1.RoutesTrie();
        this.mapPatchHandlers = new RoutesTrie_1.RoutesTrie();
        this.globalMiddlewares = [];
        this.staticRouteMap = {};
        this.init(options);
        this.customErrorHandler = undefined;
    }
    /**
     * This method initializes the httpServer attribute with a new HTTP server created using the createServer function from the http module.
     * This server listens for incoming requests and calls the switchRoutes.
     */
    init(options = {}) {
        const basicOptions = {
            keepAlive: true,
            connectionsCheckingInterval: 30000,
            keepAliveInitialDelay: 0,
            keepAliveTimeout: 5000,
            maxHeaderSize: 16385,
            noDelay: true,
            httpVersion: "HTTP1",
        };
        const opts = Object.assign(Object.assign({}, basicOptions), options);
        this.opts = opts;
        if (!opts.httpVersion || opts.httpVersion == "HTTP1") {
            this.httpServer = (0, node_http_1.createServer)(opts, this.handler.bind(this));
        }
        else if (opts.httpVersion == "HTTP2") {
            if (opts.key && opts.cert) {
                this.httpServer = (0, node_http2_1.createSecureServer)(opts, this.handler.bind(this));
            }
            else {
                this.httpServer = (0, node_http2_1.createServer)(opts, this.handler.bind(this));
            }
        }
        else {
            throw new Error("Invalid server configuration params");
        }
    }
    handler(req, res) {
        this.switchRoutes(req, res, null);
    }
    /**
     *
     * @param req  Instance of the IncomingMessage class
     * @param res  Instance of the ServerResponse class
     * @param body Which is the data received in the request.
     * This method is called when a request is received by the httpServer.The method first
     * extends the req and res objects to include additional properties, and then calls the appropriate
     * route handler based on the method of the request (e.g. GET, POST, PUT, DELETE). If the method is not one of these four,
     * a "Method Not Allowed" error is returned.
     */
    switchRoutes(req, res, body) {
        const { req: reqExtended, res: resExtended } = this.extendReqRes(req, res, body);
        this.processReqResBasedOnClientHeaders(reqExtended, resExtended);
        if (req.method == "GET" || req.method == "HEAD") {
            this.routesHandler(reqExtended, resExtended, this.mapGetHandlers);
        }
        else if (req.method == "POST" || req.method == "HEAD") {
            this.routesHandler(reqExtended, resExtended, this.mapPostHandlers);
        }
        else if (req.method == "PUT" || req.method == "HEAD") {
            this.routesHandler(reqExtended, resExtended, this.mapPutHandlers);
        }
        else if (req.method == "DELETE" || req.method == "HEAD") {
            this.routesHandler(reqExtended, resExtended, this.mapDeleteHandlers);
        }
        else if (req.method == "PATCH" || req.method == "HEAD") {
            this.routesHandler(reqExtended, resExtended, this.mapPatchHandlers);
        }
        else {
            this.errorHandler(reqExtended, resExtended, new models_class_1.ServerError(405, "Not allowed", [
                "The allowed methods are: 'GET','POST','PUT','DELETE','PATCH','HEAD'",
            ]));
        }
    }
    /**
     *
     * @param req  Instance of the IncomingMessage class
     * @param res  Instance of the ServerResponse class
     * @param body Which is the data received in the request.
     * @returns { req: IRequest; res: IResponse }
     * This method extends the req and res objects with additional properties and methods.
     * The extended req object includes properties for the request body, query parameters, path name, host name, and context.
     * The extended res object includes methods for setting the status code, returning text or JSON data, or sending a file.
     */
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
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const appServerInstance = this;
        newResponse.text = function (data) {
            data = data.toString();
            this.writeHead(this.statusCode, { "Content-Type": "text/html" });
            this.write(data);
            this.end();
        };
        newResponse.send = function (data) {
            let dataStr = "";
            if (typeof data == "object") {
                try {
                    dataStr = JSON.stringify(data, null, 2);
                    this.writeHead(this.statusCode, { "Content-Type": "application/json" });
                }
                catch (e) {
                    throw new models_class_1.ServerError(400, e === null || e === void 0 ? void 0 : e.message);
                }
            }
            else {
                dataStr = data.toString();
                this.writeHead(this.statusCode, { "Content-Type": "text/html" });
            }
            this.write(dataStr);
            this.end();
        };
        newResponse.json = function (obj) {
            let dataStr = "";
            try {
                dataStr = JSON.stringify(obj, null, 2);
            }
            catch (e) {
                throw new models_class_1.ServerError(400, e === null || e === void 0 ? void 0 : e.message);
            }
            this.writeHead(this.statusCode, { "Content-Type": "application/json" });
            this.write(dataStr);
            this.end();
        };
        newResponse.sendFile = function (pathFile) {
            const fileReader = fs.createReadStream(pathFile);
            const contentType = mime.contentType(path.extname(pathFile));
            fileReader.pipe(this);
            const errorHandler = (error) => {
                appServerInstance.errorHandler(newRequest, this, error);
            };
            fileReader.once("ready", () => {
                this.writeHead(this.statusCode, { "Content-Type": contentType });
            });
            fileReader.once("error", errorHandler);
            this.once("finish", () => {
                fileReader.removeListener("error", errorHandler);
                this.end();
            });
        };
        return { req: newRequest, res: newResponse };
    }
    processReqResBasedOnClientHeaders(req, res) {
        const headers = req.headers;
        const connection = headers.connection;
        if (connection && connection.toLowerCase() == "keep-alive") {
            req.socket.setKeepAlive(true, 30 * 1000); // 30 seconds
        }
    }
    /**
     *
     * @param port The number of the port for listening
     * @param cb A callback function that will be called once the server starts successfully
     * This method starts the HTTP server and listens for incoming requests on the specified port. The default port is 8888.
     */
    listen(port = 8888, cb, opts) {
        var _a;
        this.port = port;
        const basicOptions = { hostname: "::" };
        if (opts) {
            opts = Object.assign(Object.assign({}, basicOptions), opts);
        }
        else {
            opts = basicOptions;
        }
        (_a = this.httpServer) === null || _a === void 0 ? void 0 : _a.listen(this.port, opts.hostname, opts.backlog, () => {
            var _a, _b, _c;
            if (cb) {
                this.httpServer.keepAliveTimeout = ((_a = this.opts) === null || _a === void 0 ? void 0 : _a.keepAliveTimeout) || 10000; // 10 seconds
                const addressInf = ((_b = this.httpServer) === null || _b === void 0 ? void 0 : _b.address()) || {};
                addressInf["httpVersion"] = (_c = this.opts) === null || _c === void 0 ? void 0 : _c.httpVersion;
                cb(addressInf);
            }
        });
    }
    /**
     *
     * @param route String that specifies the path for the route
     * @param cbs The list of middleware functions of type IMiddleware.
     *
     * This method maps a GET request route to one or more middleware functions. The middleware functions will be called in order for each GET request that matches the specified route.
     * ```TypeScript
      import AppServer, { IRequest, IResponse } from 'mini-express-server';
      const app: AppServer = new AppServer();
      const port: number = +(process?.env?.PORT || 1234);
      
      app.get('/', (req: IRequest, res: IResponse) => {
        console.log('Hello World');
        return res.status(200).text('Hola mundo');
      });
      
      app.listen(port, (address: any) => {
        console.log('Server listening on: ', address);
      });
  ```
     */
    get(route, ...cbs) {
        this.mapGetHandlers.set(route, ...cbs);
    }
    /**
     *
     * @param route String that specifies the path for the route
     * @param cbs The list of middleware functions of type IMiddleware.
     * This method maps a POST request route to one or more middleware functions. The middleware functions will be called in order for each POST request that matches the specified route.
     * ```TypeScript
      import AppServer, { IRequest, IResponse } from 'mini-express-server';
      const app: AppServer = new AppServer();
      const port: number = +(process?.env?.PORT || 1234);
      
      let users:any[] = [];
  
      app.post('/api/user', (req: IRequest, res: IResponse) => {
        console.log(req.body)
        const user = {...JSON.parse(req.body),id:users.length + 1}
        users.push(user);
        return res.status(200).json(user);
      });
      
      app.listen(port, (address: any) => {
        console.log('Server listening on: ', address);
      });
  ```
     */
    post(route, ...cbs) {
        this.mapPostHandlers.set(route, ...cbs);
    }
    /**
     *
     * @param route String that specifies the path for the route
     * @param cbs The list of middleware functions of type IMiddleware.
     * This method maps a PUT request route to one or more middleware functions. The middleware functions will be called in order for each PUT request that matches the specified route.
     * ```TypeScript
      import AppServer, { IRequest, IResponse,ServerError } from 'mini-express-server';
      const app: AppServer = new AppServer();
      const port: number = +(process?.env?.PORT || 1234);
      
      let users:any[] = [];
      
      app.put('/api/user/:id', (req: IRequest, res: IResponse) => {
        console.log(req.body)
        const newUserData = JSON.parse(req.body)
        let user = users.find((u)=>u.id == req.params.id)
        if(!user) throw new ServerError(404, "User not found with the id=" + req.params.id)
        user = {...user,...newUserData}
        users.push(user);
        return res.status(200).json(user);
      });
      
      app.listen(port, (address: any) => {
        console.log('Server listening on: ', address);
      });
  ```
     */
    put(route, ...cbs) {
        this.mapPutHandlers.set(route, ...cbs);
    }
    /**
     *
     * @param route String that specifies the path for the route
     * @param cbs The list of middleware functions of type IMiddleware.
     * This method maps a DELETE request route to one or more middleware functions. The middleware functions will be called in order for each DELETE request that matches the specified route.
     * ```TypeScript
      import AppServer, { IRequest, IResponse,ServerError } from 'mini-express-server';
      import { ServerError } from 'mini-express-server';
  const app: AppServer = new AppServer();
      const port: number = +(process?.env?.PORT || 1234);
      
      let users:any[] = [];
      
      app.delete('/api/user/:id', (req: IRequest, res: IResponse) => {
        let user = users.find((u)=>u.id == req.params.id);
        if(!user) throw new ServerError(404, "User not found with the id=" + req.params.id);
        users = users.filter((u)=>u.id != req.params.id);
        return res.status(200).json({status:"OK"});
      });
      
      app.listen(port, (address: any) => {
        console.log('Server listening on: ', address);
      });
  ```
     */
    delete(route, ...cbs) {
        this.mapDeleteHandlers.set(route, ...cbs);
    }
    patch(route, ...cbs) {
        this.mapPatchHandlers.set(route, ...cbs);
    }
    /**
     *
     * @param route string | IMiddleware
     * @param cb IMiddleware | undefined | null
     *
     * This method allows the user to add a middleware to the middleware stack.
     * The middleware function is called in the order it was added.
     *
     * You can create a global middleware for a specific path:
     * ```Typescript
     * ...
      app.use("/api/user/:id",(req: IRequest, res: IResponse, next)=>{
        console.log("THe user to access has id: ", req.params.id);
        next();
      })
      ...
     * ```
      Or a global one that it will be called for every endpoint
     
     * ```Typescript
     *...
      app.use((req: IRequest, res: IResponse, next)=>{
        try {
            let bodyJson = JSON.parse(req.body);
            req.body = bodyJson;
            next();
          } catch (e) {
            next(new Error("The parsing to json fails"))
          }
      })
      ...
      Or to bind a path to a Router
      ...
      const userRouter   = require("./routes/user.js")
      app.use("/user",userRouter)
      ...
     * ```
  
     */
    use(route, cb = null) {
        if (typeof route == "string") {
            if (!cb)
                throw Error("There should be a callback function or a router instance");
            const executor = cb;
            // register in all maps
            if (executor instanceof Router_1.default) {
                executor.insertRouterIntoAppServer(route, this);
            }
            else {
                this.get(route, executor);
                this.post(route, executor);
                this.put(route, executor);
                this.delete(route, executor);
            }
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
    /**
     *
     * @param req  Instance of the IncomingMessage class
     * @param res  Instance of the ServerResponse class
     * @param mapHandler Instance of the RoutesTrie class.
     * @returns void
     * This method is called by the switchRoutes method to handle the routing of a request. The method first checks
     * if there is a static route for the path name of the request, and if so, serves the file for that route.
     * If there is no static route, it looks for a matching route in the routeMap object and calls the corresponding handler function for that route.
     * If there is no matching route, a "Not Found" error is returned.
     */
    routesHandler(req, res, mapHandler) {
        let index = 0;
        const pathName = req.pathName;
        let handlersCb = [];
        if (this.handlerStatic(pathName, req)) {
            handlersCb.push(this.getStaticMiddleware());
        }
        else {
            handlersCb = mapHandler.get(pathName, req);
        }
        if (handlersCb.length == 0) {
            const error = new models_class_1.ServerError(404, "Not Found");
            this.errorHandler(req, res, error);
            return;
        }
        if (this.globalMiddlewares.length) {
            handlersCb = [...this.globalMiddlewares, ...handlersCb];
        }
        const nextFunction = (error) => __awaiter(this, void 0, void 0, function* () {
            if (error) {
                this.errorHandler(req, res, error);
            }
            else {
                let result;
                try {
                    if (index >= handlersCb.length)
                        throw new models_class_1.ServerError(400, "Invalid use of chain of middlewares, the last cannot call function next to execute the next one.");
                    const cb = handlersCb[index++];
                    if (!cb)
                        throw new models_class_1.ServerError(400, "The function to process is undefined");
                    result = cb(req, res, nextFunction);
                    if (result && typeof result.then === "function") {
                        result.then(null, (e) => this.errorHandler(req, res, e));
                    }
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
        if (req.method != "GET" && req.method != "HEAD")
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
            throw new Error("The static path should be referenced to a directory");
        this.staticRouteMap[route] = pathToStaticDir;
    }
    getStaticMiddleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const pathName = req.pathName;
            const staticFolder = req.__DIR_STATIC_REFERENCED;
            const route = req.__ROUTE_STATIC_REFERENCED;
            try {
                const segmentPath = pathName.substring(route.length);
                let fullPath = path.join(staticFolder, segmentPath);
                let stats = yield statPromisified(fullPath);
                if (stats.isDirectory()) {
                    const files = (yield readdirPromisified(fullPath)) || [];
                    const indexFile = files.find(f => f.startsWith("index."));
                    if (!indexFile) {
                        throw new models_class_1.ServerError(404, "Not allowed directories files");
                    }
                    fullPath = path.join(fullPath, indexFile);
                    stats = yield statPromisified(fullPath);
                }
                const readStream = fs.createReadStream(fullPath);
                readStream.pipe(res);
                const errorHandling = (error) => {
                    const serverError = new models_class_1.ServerError(404, error.message, []);
                    this.errorHandler(req, res, serverError);
                };
                readStream.once("ready", () => {
                    res.writeHead(200, {
                        "Content-Type": mime.contentType(path.extname(fullPath)),
                        "Content-Length": stats.size,
                    });
                });
                readStream.once("error", errorHandling);
                readStream.once("end", () => {
                    readStream.removeListener("error", errorHandling);
                    res.end();
                });
            }
            catch (e) {
                if ((e === null || e === void 0 ? void 0 : e.code) == "ENOENT") {
                    e.code = 404;
                }
                next(e);
            }
        });
    }
}
exports.default = AppServer;
//# sourceMappingURL=AppServer.js.map