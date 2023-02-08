/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Server } from "node:http";
import { IMiddleware, IRequest, IResponse, ListenOptions, ServerError, StaticRouteMap } from "./models.class";
import { AddressInfo } from "node:net";
import { ServerOptions } from "node:https";
import Router from "./Router";
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
    constructor(options?: ServerOptions);
    /**
     * This method initializes the httpServer attribute with a new HTTP server created using the createServer function from the http module.
     * This server listens for incoming requests and calls the switchRoutes.
     */
    private init;
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
    private switchRoutes;
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
    private extendReqRes;
    processReqResBasedOnClientHeaders(req: IRequest, res: IResponse): void;
    /**
     *
     * @param port The number of the port for listening
     * @param cb A callback function that will be called once the server starts successfully
     * This method starts the HTTP server and listens for incoming requests on the specified port. The default port is 8888.
     */
    listen(port?: number, cb?: (address: string | AddressInfo | undefined | null) => void | null | undefined, opts?: ListenOptions): void;
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
    get(route: string, ...cbs: IMiddleware[]): void;
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
    post(route: string, ...cbs: IMiddleware[]): void;
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
    put(route: string, ...cbs: IMiddleware[]): void;
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
    delete(route: string, ...cbs: IMiddleware[]): void;
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
       import { IRequest } from 'mini-express-server';
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
    use(route: string | IMiddleware, cb?: IMiddleware | Router | undefined | null): void;
    setErrorHandler(clientErrorHandler: (req: IRequest, res: IResponse, error: ServerError | Error | any) => any): void;
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
    private routesHandler;
    private errorHandler;
    getHttpServer(): Server;
    private handlerStatic;
    setStatic(route: string, pathToStaticDir: string): void;
    private getstaticMiddleware;
}
