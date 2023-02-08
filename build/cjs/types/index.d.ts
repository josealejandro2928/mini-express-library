import AppServerClass from "./AppServer";
export { ServerError, IRequest, IResponse, IMiddleware, StaticRouteMap } from "./models.class";
export { RoutesTrie } from "./RoutesTrie";
import RouterClass from "./Router";
export default AppServerClass;
export declare const AppServer: typeof AppServerClass;
export declare const Router: typeof RouterClass;
