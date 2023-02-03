/// <reference types="node" />
import { Server } from "node:http";
import { IMiddleware, IRequest, IResponse, ServerError } from "./models.class";
export declare class AppServer {
    private httpServer;
    private port;
    private mapGetHandlers;
    private mapPostHandlers;
    private mapPutHandlers;
    private mapDeleteHandlers;
    private globalMiddlewares;
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
    use(route: string | IMiddleware, cb: IMiddleware | undefined): void;
    setErrorHandler(clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any): void;
    private getCompositionFromPath;
    private routeMatching;
    private routesHandler;
    private errorHandler;
    getHttpServer(): Server;
}
