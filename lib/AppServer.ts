/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Server,
  IncomingMessage,
  ServerResponse,
  createServer as createServerHttp1,
} from "node:http";
import {
  Http2Server,
  Http2ServerRequest,
  Http2ServerResponse,
  createServer as createServerHttp2,
  createSecureServer as createSecureServerHttp2,
} from "node:http2";

import * as url from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  CustomServerOptions,
  IMiddleware,
  IRequest,
  IResponse,
  ListenOptions,
  ServerError,
  StaticRouteMap,
} from "./models.class";
import { RoutesTrie } from "./RoutesTrie";
import { AddressInfo } from "node:net";
import Router from "./Router";
import { promisify } from "node:util";
const statPromisified = promisify(fs.stat);
const readdirPromisified = promisify(fs.readdir);

const mime = require("mime-types");

export default class AppServer {
  httpServer: Server<any, any> | Http2Server | undefined | null = null;
  private port = 8888;
  private mapGetHandlers: RoutesTrie = new RoutesTrie();
  private mapPostHandlers: RoutesTrie = new RoutesTrie();
  private mapPutHandlers: RoutesTrie = new RoutesTrie();
  private mapDeleteHandlers: RoutesTrie = new RoutesTrie();
  private mapPatchHandlers: RoutesTrie = new RoutesTrie();
  private globalMiddlewares: IMiddleware[] = [];
  staticRouteMap: StaticRouteMap = {};
  private opts: CustomServerOptions | undefined;

  customErrorHandler:
    | ((req: IRequest, res: IResponse, error: ServerError | Error | any) => any)
    | undefined;

  constructor(options?: CustomServerOptions) {
    this.init(options);
    this.customErrorHandler = undefined;
  }

  /**
   * This method initializes the httpServer attribute with a new HTTP server created using the createServer function from the http module.
   * This server listens for incoming requests and calls the switchRoutes.
   */
  private init(options: CustomServerOptions = {}): void {
    const basicOptions: CustomServerOptions = {
      keepAlive: true,
      connectionsCheckingInterval: 30000,
      keepAliveInitialDelay: 0,
      keepAliveTimeout: 5000,
      maxHeaderSize: 16385,
      noDelay: true,
      httpVersion: "HTTP1",
    };
    const opts: CustomServerOptions = { ...basicOptions, ...options };
    this.opts = opts;

    if (!opts.httpVersion || opts.httpVersion == "HTTP1") {
      this.httpServer = createServerHttp1(opts, this.handler.bind(this));
    } else if (opts.httpVersion == "HTTP2") {
      if (opts.key && opts.cert) {
        this.httpServer = createSecureServerHttp2(opts, this.handler.bind(this));
      } else {
        this.httpServer = createServerHttp2(opts, this.handler.bind(this));
      }
    } else {
      throw new Error("Invalid server configuration params");
    }
  }

  handler(req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) {
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
  private switchRoutes(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
    body: any
  ): void {
    const { req: reqExtended, res: resExtended } = this.extendReqRes(req, res, body);
    this.processReqResBasedOnClientHeaders(reqExtended, resExtended);
    if (req.method == "GET" || req.method == "HEAD") {
      this.routesHandler(reqExtended, resExtended, this.mapGetHandlers);
    } else if (req.method == "POST" || req.method == "HEAD") {
      this.routesHandler(reqExtended, resExtended, this.mapPostHandlers);
    } else if (req.method == "PUT" || req.method == "HEAD") {
      this.routesHandler(reqExtended, resExtended, this.mapPutHandlers);
    } else if (req.method == "DELETE" || req.method == "HEAD") {
      this.routesHandler(reqExtended, resExtended, this.mapDeleteHandlers);
    } else if (req.method == "PATCH" || req.method == "HEAD") {
      this.routesHandler(reqExtended, resExtended, this.mapPatchHandlers);
    } else {
      this.errorHandler(
        reqExtended,
        resExtended,
        new ServerError(405, "Not allowed", [
          "The allowed methods are: 'GET','POST','PUT','DELETE','PATCH','HEAD'",
        ])
      );
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
  private extendReqRes(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
    body: any = ""
  ): { req: IRequest; res: IResponse } {
    const parseUrl = url.parse(req.url as string, true);
    const newRequest: IRequest = req as IRequest;
    newRequest.body = body;
    newRequest.query = parseUrl.query as any;
    newRequest.params = {};
    newRequest.pathName = parseUrl.pathname as string;
    newRequest.hostName = parseUrl.hostname as string;
    newRequest.context = {};

    const newResponse: IResponse = res as IResponse;

    newResponse.status = function (statusCode: number) {
      this.statusCode = statusCode;
      return this;
    };
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const appServerInstance: AppServer = this;
    newResponse.text = function (data: string) {
      data = data.toString();
      this.writeHead(this.statusCode, { "Content-Type": "text/html" });
      this.write(data);
      this.end();
    };

    newResponse.send = function (data: any) {
      let dataStr = "";
      if (typeof data == "object") {
        try {
          dataStr = JSON.stringify(data, null, 2);
          this.writeHead(this.statusCode, { "Content-Type": "application/json" });
        } catch (e: any) {
          throw new ServerError(400, e?.message);
        }
      } else {
        dataStr = data.toString();
        this.writeHead(this.statusCode, { "Content-Type": "text/html" });
      }
      this.write(dataStr);
      this.end();
    };

    newResponse.json = function (obj: any) {
      let dataStr = "";
      try {
        dataStr = JSON.stringify(obj, null, 2);
      } catch (e: any) {
        throw new ServerError(400, e?.message);
      }
      this.writeHead(this.statusCode, { "Content-Type": "application/json" });
      this.write(dataStr);
      this.end();
    };

    newResponse.sendFile = function (pathFile: string) {
      const fileReader = fs.createReadStream(pathFile);
      const contentType = mime.contentType(path.extname(pathFile));
      fileReader.pipe(this);

      const errorHandler = (error: any) => {
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

  processReqResBasedOnClientHeaders(req: IRequest, res: IResponse): void {
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
  listen(
    port = 8888,
    cb?: (address: string | AddressInfo | undefined | null) => void | null | undefined,
    opts?: ListenOptions
  ) {
    this.port = port;
    const basicOptions: ListenOptions = { hostname: "::" };
    if (opts) {
      opts = { ...basicOptions, ...opts };
    } else {
      opts = basicOptions;
    }

    this.httpServer?.listen(this.port, opts.hostname, opts.backlog, () => {
      if (cb) {
        (this.httpServer as Server).keepAliveTimeout = this.opts?.keepAliveTimeout || 10000; // 10 seconds
        const addressInf: any = this.httpServer?.address() || {};
        addressInf["httpVersion"] = this.opts?.httpVersion;
        cb(addressInf);
      }
    }) as Server<any, any>;
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
  get(route: string, ...cbs: IMiddleware[]): void {
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
  post(route: string, ...cbs: IMiddleware[]): void {
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
  put(route: string, ...cbs: IMiddleware[]): void {
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
  delete(route: string, ...cbs: IMiddleware[]): void {
    this.mapDeleteHandlers.set(route, ...cbs);
  }

  patch(route: string, ...cbs: IMiddleware[]): void {
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
  use(route: string | IMiddleware, cb: IMiddleware | Router | undefined | null = null) {
    if (typeof route == "string") {
      if (!cb) throw Error("There should be a callback function or a router instance");
      const executor: IMiddleware | Router = cb;
      // register in all maps
      if (executor instanceof Router) {
        executor.insertRouterIntoAppServer(route, this);
      } else {
        this.get(route, executor);
        this.post(route, executor);
        this.put(route, executor);
        this.delete(route, executor);
      }
    }
    if (typeof route == "function") {
      if (cb) throw Error("Only one registration for the global use function");
      const executor: IMiddleware = route;
      this.globalMiddlewares.push(executor);
    }
  }

  setErrorHandler(
    clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any
  ) {
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
  public routesHandler(req: IRequest, res: IResponse, mapHandler: RoutesTrie): void {
    let index = 0;
    const pathName = req.pathName;
    let handlersCb: IMiddleware[] = [];
    if (this.handlerStatic(pathName, req)) {
      handlersCb.push(this.getStaticMiddleware());
    } else {
      handlersCb = mapHandler.get(pathName, req);
    }

    if (handlersCb.length == 0) {
      const error = new ServerError(404, "Not Found");
      this.errorHandler(req, res, error);
      return;
    }
    if (this.globalMiddlewares.length) {
      handlersCb = [...this.globalMiddlewares, ...handlersCb];
    }

    const nextFunction = async (error?: any) => {
      if (error) {
        this.errorHandler(req, res, error);
      } else {
        let result: any;
        try {
          if (index >= handlersCb.length)
            throw new ServerError(
              400,
              "Invalid use of chain of middlewares, the last cannot call function next to execute the next one."
            );
          const cb: IMiddleware = handlersCb[index++];
          if (!cb) throw new ServerError(400, "The function to process is undefined");

          result = cb(req, res, nextFunction);
          if (result && typeof result.then === "function") {
            result.then(null, (e: any) => this.errorHandler(req, res, e));
          }
        } catch (error: any) {
          this.errorHandler(req, res, error);
        }
      }
    };
    nextFunction();
  }

  private errorHandler(req: IRequest, res: IResponse, error: ServerError | Error) {
    if (this.customErrorHandler) {
      this.customErrorHandler(req, res, error);
    } else {
      const code =
        (error as any)?.code && typeof (error as any)?.code == "number"
          ? (error as any)?.code
          : 500;
      res.status(code).text(error?.message || (error as any) || "Error");
    }
  }

  getHttpServer(): Server {
    return this.httpServer as Server;
  }
  //////////////STATIC FUNCTION//////////////////////////
  private handlerStatic(pathName: string, req: IRequest): boolean {
    let found = false;
    if (req.method != "GET" && req.method != "HEAD") return false;
    for (const route in this.staticRouteMap) {
      if (pathName.startsWith(route)) {
        found = true;
        (req as any).__DIR_STATIC_REFERENCED = this.staticRouteMap[route];
        (req as any).__ROUTE_STATIC_REFERENCED = route;
        break;
      }
    }
    if (found) return true;
    return false;
  }

  setStatic(route: string, pathToStaticDir: string) {
    if (!fs.existsSync(pathToStaticDir))
      throw new Error("THe path to static directory does not exists");
    if (!fs.statSync(pathToStaticDir).isDirectory())
      throw new Error("The static path should be referenced to a directory");
    this.staticRouteMap[route] = pathToStaticDir;
  }

  private getStaticMiddleware(): IMiddleware {
    return async (req: IRequest, res: IResponse, next) => {
      const pathName: string = req.pathName;
      const staticFolder: string = (req as any).__DIR_STATIC_REFERENCED;
      const route: string = (req as any).__ROUTE_STATIC_REFERENCED;
      try {
        const segmentPath = pathName.substring(route.length);
        let fullPath = path.join(staticFolder, segmentPath);
        let stats = await statPromisified(fullPath);

        if (stats.isDirectory()) {
          const files: string[] = (await readdirPromisified(fullPath)) || [];
          const indexFile = files.find(f => f.startsWith("index."));
          if (!indexFile) {
            throw new ServerError(404, "Not allowed directories files");
          }
          fullPath = path.join(fullPath, indexFile);
          stats = await statPromisified(fullPath);
        }
        const readStream = fs.createReadStream(fullPath);
        readStream.pipe(res);

        const errorHandling = (error: any) => {
          const serverError = new ServerError(404, error.message, []);
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
      } catch (e: any) {
        if (e?.code == "ENOENT") {
          e.code = 404;
        }
        (next as any)(e);
      }
    };
  }
}
