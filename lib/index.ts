import AppServerClass from "./AppServer";
export { ServerError, IRequest, IResponse, IMiddleware, StaticRouteMap } from "./models.class";
export { RoutesTrie } from "./RoutesTrie";

export default AppServerClass;
export const AppServer = AppServerClass;
