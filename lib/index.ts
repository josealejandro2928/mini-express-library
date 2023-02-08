import AppServerClass from "./AppServer";
export { ServerError, IRequest, IResponse, IMiddleware, StaticRouteMap } from "./models.class";
export { RoutesTrie } from "./RoutesTrie";
import RouterClass from "./Router";
export default AppServerClass;
export const AppServer = AppServerClass;
export const Router = RouterClass;