/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, IncomingMessage, ServerResponse, createServer } from "node:http";
import * as url from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";
import { IMiddleware, IRequest, IResponse, ServerError, StaticRouteMap } from "./models.class";
import { RoutesTrie } from "./RoutesTrie";
import { AddressInfo } from "node:net";
const mime = require("mime-types");

export default class AppServer {
  httpServer: Server<any, any> | undefined | null = null;
  private port = 8888;
  private mapGetHandlers: RoutesTrie = new RoutesTrie();
  private mapPostHandlers: RoutesTrie = new RoutesTrie();
  private mapPutHandlers: RoutesTrie = new RoutesTrie();
  private mapDeleteHandlers: RoutesTrie = new RoutesTrie();
  private globalMiddlewares: IMiddleware[] = [];
  staticRouteMap: StaticRouteMap = {};

  customErrorHandler:
    | ((req: IRequest, res: IResponse, error: ServerError | Error | any) => any)
    | undefined;

  constructor() {
    this.init();
    this.customErrorHandler = undefined;
  }

  /**
   * This method initializes the httpServer attribute with a new HTTP server created using the createServer function from the http module.
   * This server listens for incoming requests and calls the switchRoutes.
   */
  private init(): void {
    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      let body = "";
      req.on("data", (chunk: any) => {
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
  private switchRoutes(req: IncomingMessage, res: ServerResponse, body: any): void {
    const { req: reqExtended, res: resExtended } = this.extendReqRes(req, res, body);
    if (req.method == "GET") {
      this.routesHandler(reqExtended, resExtended, this.mapGetHandlers);
    } else if (req.method == "POST") {
      this.routesHandler(reqExtended, resExtended, this.mapPostHandlers);
    } else if (req.method == "PUT") {
      this.routesHandler(reqExtended, resExtended, this.mapPutHandlers);
    } else if (req.method == "DELETE") {
      this.routesHandler(reqExtended, resExtended, this.mapDeleteHandlers);
    } else {
      resExtended.writeHead(405, { "Content-Type": "text/html" });
      resExtended.write("Not allowed");
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
    req: IncomingMessage,
    res: ServerResponse,
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
    newResponse.text = function (data: string) {
      this.writeHead(this.statusCode, { "Content-Type": "text/html" });
      this.write(data);
      this.end();
    };

    newResponse.json = function (obj: any) {
      this.writeHead(this.statusCode, { "Content-Type": "application/json" });
      this.write(JSON.stringify(obj));
      this.end();
    };

    newResponse.sendFile = function (pathFile: string, contentType = "text/html") {
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

  /**
   *
   * @param port The number of the port for listening
   * @param cb A callback function that will be called once the server starts successfully
   * This method starts the HTTP server and listens for incoming requests on the specified port. The default port is 8888.
   */
  listen(
    port = 8888,
    cb?: (address: string | AddressInfo | undefined | null) => void | null | undefined
  ) {
    this.port = port;

    this.httpServer?.listen(this.port, undefined, undefined, () => {
      if (cb) {
        cb(this.httpServer?.address());
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

  /**
   * 
   * @param route string | IMiddleware
   * @param cb IMiddleware | undefined | null
   * 
   * This method allows the user to add a middleware to the middleware stack. 
   * The middleware function is called in the order it was added.
   * 
   * You can create a global middleware for a especific path:
   * ```Typescript
   * import AppServer, { IRequest, IResponse,ServerError } from 'mini-express-server';
     const app: AppServer = new AppServer();
     const port: number = +(process?.env?.PORT || 1234);
    
    let users:any[] = [];

    app.use("/api/user/:id",(req: IRequest, res: IResponse, next)=>{
      console.log("THe user to access has id: ", req.params.id);
      next();
    })
    
    app.delete('/api/user/:id', (req: IRequest, res: IResponse) => {
      let user = users.find((u)=>u.id == req.params.id);
      if(!user) throw new ServerError(404, "User not found with the id=" + req.params.id);
      users = users.filter((u)=>u.id != req.params.id);
      return res.status(200).json({status:"OK"});
    });
    
    app.listen(port, (address: any) => {
      console.log('Server listening on: ', address);
    });
   * ```
    Or a global one that it will be called for every endpoind
   
    * ```Typescript
   * import AppServer, { IRequest, IResponse,ServerError } from 'mini-express-server';
     const app: AppServer = new AppServer();
     const port: number = +(process?.env?.PORT || 1234);
    
    let users:any[] = [];

    app.use((req: IRequest, res: IResponse, next)=>{
      try {
            let bodyJson = JSON.parse(req.body);
            req.body = bodyJson;
            next();
        } catch (e) {
          next(new Error("The parsing to json fails"))
        } 
    })
    
    app.delete('/api/user/:id', (req: IRequest, res: IResponse) => {
      let user = users.find((u)=>u.id == req.params.id);
      if(!user) throw new ServerError(404, "User not found with the id=" + req.params.id);
      users = users.filter((u)=>u.id != req.params.id);
      return res.status(200).json({status:"OK"});
    });
    
    app.listen(port, (address: any) => {
      console.log('Server listening on: ', address);
    });
   * ```

   */
  use(route: string | IMiddleware, cb: IMiddleware | undefined | null = null) {
    if (typeof route == "string") {
      if (!cb) throw Error("There should be a callback function");
      const executor: IMiddleware = cb;
      // register in all maps
      this.get(route, executor);
      this.post(route, executor);
      this.put(route, executor);
      this.delete(route, executor);
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
  private routesHandler(req: IRequest, res: IResponse, mapHandler: RoutesTrie): void {
    let index = 0;
    const pathName = req.pathName;
    let handlersCb: IMiddleware[] = [];
    if (this.handlerStatic(pathName, req)) {
      handlersCb.push(this.getstaticMiddleware());
    } else {
      handlersCb = mapHandler.get(pathName, req);
    }

    if (handlersCb.length == 0) {
      return res.status(404).text("Not found");
    }
    handlersCb = [...this.globalMiddlewares, ...handlersCb];
    const nextFunction = async (error?: any) => {
      if (error) {
        this.errorHandler(req, res, error);
      } else {
        const cb: IMiddleware = handlersCb[index++];
        try {
          await cb(req, res, nextFunction);
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
    if (req.method != "GET") return false;
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
      throw new Error("The static path shoulb be referenced to a directory");
    this.staticRouteMap[route] = pathToStaticDir;
  }

  private getstaticMiddleware(): IMiddleware {
    return (req: IRequest, res: IResponse, next) => {
      const pathName: string = req.pathName;
      const staticFolder: string = (req as any).__DIR_STATIC_REFERENCED;
      const route: string = (req as any).__ROUTE_STATIC_REFERENCED;
      try {
        const segmentPath = pathName.split(route)?.[1].trim();
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
      } catch (e) {
        console.log("Error here");
        (next as any)(e);
      }
    };
  }
}
