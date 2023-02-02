import http, { Server, IncomingMessage, ServerResponse } from "node:http";
import url from "node:url";
import fs from "node:fs";
import { IMiddleware, IRequest, IResponse, ServerError } from "./models.class";

export class AppServer {
  #httpServer: Server<any, any> | undefined | null = null;
  #port = 8888;
  #mapGetHandlers = new Map<string, IMiddleware[]>();
  errorHandler:
    | ((req: IRequest, res: IResponse, error: ServerError | Error | any) => any)
    | undefined;
  constructor() {
    this.#init();
    this.errorHandler = undefined;
  }
  #init() {
    this.#httpServer = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      let body = "";
      req.on("data", (chunk: any) => {
        body += chunk;
      });
      req.on("end", () => {
        this.#switchRoutes(req, res, body);
      });
      req.on("error", error => {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.write(error);
      });
    });
  }

  #switchRoutes(req: IncomingMessage, res: ServerResponse, body: any) {
    const { req: reqExtended, res: resExtended } = this.#extendReqRes(req, res, body);
    if (req.method == "GET") {
      this.#getRoutesHandler(reqExtended, resExtended);
    } else {
      resExtended.writeHead(405, { "Content-Type": "text/html" });
      resExtended.write("Not allowed");
    }
  }

  #extendReqRes(
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
    this.#port = port;
    this.#httpServer?.listen(this.#port, undefined, undefined, cb as any);
  }

  get(route: string, ...cbs: IMiddleware[]): void {
    if (!this.#mapGetHandlers.has(route)) {
      this.#mapGetHandlers.set(route, []);
    }
    this.#mapGetHandlers.get(route)?.push(...cbs);
  }

  #getCompositionFromPath(pathStr = ""): string[] {
    return pathStr.split("/").filter(x => x != "");
  }

  #routeMatching(req: IRequest, mapHandler: Map<string, IMiddleware[]> = new Map()): IMiddleware[] {
    // this return from an example pathName: /v1/user/1/visit -> ['v1','user','1','visit']
    const reqPathComposition = this.#getCompositionFromPath(req.pathName);

    for (let route of mapHandler.keys()) {
      const routeComposition = this.#getCompositionFromPath(route);
      if (routeComposition.length != reqPathComposition.length) continue;
      let match = true;
      let params: any = req.params;
      for (let i = 0; i < reqPathComposition.length; i++) {
        if (routeComposition[i].startsWith(":")) {
          // we extract the params defined in the methods as :param
          let param = routeComposition[i].split(":")[1];
          params[param] = reqPathComposition[i];
        } else {
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
        return mapHandler.get(route) as IMiddleware[];
      }
    }
    // Not route handler found
    return [];
  }

  #getRoutesHandler(req: IRequest, res: IResponse) {
    let index = 0;
    let handlersCb: IMiddleware[] = this.#routeMatching(req, this.#mapGetHandlers);
    if (handlersCb.length == 0) {
      return res.status(400).text("Not found");
    }
    let nextFunction = async (error?: any) => {
      if (error) {
        this.#errorHandler(req, res, error);
      } else {
        const cb: IMiddleware = handlersCb[index++];
        try {
          await cb(req, res, nextFunction);
        } catch (error: any) {
          console.log("Here there is an error");
          this.#errorHandler(req, res, error);
        }
        // Promise.resolve(cb(req, res, nextFunction)).catch(error => {
        //   console.log("Here there is an error");
        //   this.#errorHandler(req, res, error);
        // });
      }
    };
    nextFunction();
  }

  setErrorHandler(
    clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any
  ) {
    this.errorHandler = clientErrorHandler;
  }

  #errorHandler(req: IRequest, res: IResponse, error: ServerError | Error) {
    if (this.errorHandler) {
      this.errorHandler(req, res, error);
    } else {
      let code =
        (error as any)?.code && typeof (error as any)?.code == "number"
          ? (error as any)?.code
          : 500;
      res.status(code).text(error.message);
    }
  }
}
