/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, IncomingMessage, ServerResponse, createServer } from "node:http";
import * as url from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";
import { IMiddleware, IRequest, IResponse, ServerError, StaticRouteMap } from "./models.class";
import { RoutesTrie } from "./RoutesTrie";
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

  private init() {
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

  private switchRoutes(req: IncomingMessage, res: ServerResponse, body: any) {
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
      res.writeHead(this.statusCode, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    };

    newResponse.json = function (obj: any) {
      res.writeHead(this.statusCode, { "Content-Type": "application/json" });
      res.write(JSON.stringify(obj));
      res.end();
    };

    newResponse.sendFile = function (pathFile: string, contentType = "text/html") {
      const fileReader = fs.createReadStream(pathFile);
      res.writeHead(this.statusCode, { "Content-Type": contentType });
      fileReader.pipe(res);
      res.once("finish", () => {
        res.end();
      });
    };

    return { req: newRequest, res: newResponse };
  }

  listen(port = 8888, cb = null): void {
    this.port = port;
    this.httpServer?.listen(this.port, undefined, undefined, cb as any);
  }

  get(route: string, ...cbs: IMiddleware[]): void {
    this.mapGetHandlers.set(route, ...cbs);
  }

  post(route: string, ...cbs: IMiddleware[]): void {
    this.mapPostHandlers.set(route, ...cbs);
  }

  put(route: string, ...cbs: IMiddleware[]): void {
    this.mapPutHandlers.set(route, ...cbs);
  }

  delete(route: string, ...cbs: IMiddleware[]): void {
    this.mapDeleteHandlers.set(route, ...cbs);
  }

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

  private routesHandler(req: IRequest, res: IResponse, mapHandler: RoutesTrie) {
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
      res.status(code).text(error.message);
    }
  }

  getHttpServer(): Server {
    return this.httpServer as Server;
  }
  //////////////STATIC FUNCTION//////////////////////////
  handlerStatic(pathName: string, req: IRequest): boolean {
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

  getstaticMiddleware(): IMiddleware {
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
          readStream.on("error", error => {
            return res.status(404).text(error.message);
          });
          readStream.on("end", () => {
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
