/// <reference types="node" />
import { Server } from "node:http";
import { IMiddleware, IRequest, IResponse, ServerError, StaticRouteMap } from "./models.class";
export default class AppServer {
    httpServer: Server<any, any> | undefined | null;
    private port;
    private mapGetHandlers;
    private mapPostHandlers;
    private mapPutHandlers;
    private mapDeleteHandlers;
    private globalMiddlewares;
    staticRouteMap: StaticRouteMap;
    customErrorHandler: ((req: IRequest, res: IResponse, error: ServerError | Error | any) => any) | undefined;
    constructor();
    private init;
    private switchRoutes;
    private extendReqRes;
    listen(port?: number, cb?: null): void;
    get(route: string, ...cbs: IMiddleware[]): void;
    post(route: string, ...cbs: IMiddleware[]): void;
    put(route: string, ...cbs: IMiddleware[]): void;
    delete(route: string, ...cbs: IMiddleware[]): void;
    use(route: string | IMiddleware, cb?: IMiddleware | undefined | null): void;
    setErrorHandler(clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any): void;
    private routesHandler;
    private errorHandler;
    getHttpServer(): Server;
    handlerStatic(pathName: string, req: IRequest): boolean;
    setStatic(route: string, pathToStaticDir: string): void;
    getstaticMiddleware(): IMiddleware;
}
