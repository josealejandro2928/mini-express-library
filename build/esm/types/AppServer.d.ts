import { IMiddleware, IRequest, IResponse, ServerError } from "./models.class";
export declare class AppServer {
    #private;
    errorHandler: ((req: IRequest, res: IResponse, error: ServerError | Error | any) => any) | undefined;
    constructor();
    listen(port?: number, cb?: null): void;
    get(route: string, ...cbs: IMiddleware[]): void;
    post(route: string, ...cbs: IMiddleware[]): void;
    put(route: string, ...cbs: IMiddleware[]): void;
    delete(route: string, ...cbs: IMiddleware[]): void;
    use(route: string | IMiddleware, cb: IMiddleware | undefined): void;
    setErrorHandler(clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any): void;
}
