import { IMiddleware } from "./models.class";
import AppServer from "./AppServer";

export default class Router {
  private mapGetHandlers: Map<string, IMiddleware[]> = new Map<string, IMiddleware[]>();
  private mapPostHandlers: Map<string, IMiddleware[]> = new Map<string, IMiddleware[]>();
  private mapPutHandlers: Map<string, IMiddleware[]> = new Map<string, IMiddleware[]>();
  private mapDeleteHandlers: Map<string, IMiddleware[]> = new Map<string, IMiddleware[]>();
  private mapPatchHandlers: Map<string, IMiddleware[]> = new Map<string, IMiddleware[]>();

  get(route: string, ...cbs: IMiddleware[]): void {
    if (!route.startsWith("/")) throw new Error('The route must start with "/"');
    const handlers: IMiddleware[] = this.mapGetHandlers.get(route) || [];
    handlers.push(...cbs);
    this.mapGetHandlers.set(route, handlers);
  }

  post(route: string, ...cbs: IMiddleware[]): void {
    if (!route.startsWith("/")) throw new Error('The route must start with "/"');
    const handlers: IMiddleware[] = this.mapPostHandlers.get(route) || [];
    handlers.push(...cbs);
    this.mapPostHandlers.set(route, handlers);
  }

  put(route: string, ...cbs: IMiddleware[]): void {
    if (!route.startsWith("/")) throw new Error('The route must start with "/"');
    const handlers: IMiddleware[] = this.mapPutHandlers.get(route) || [];
    handlers.push(...cbs);
    this.mapPutHandlers.set(route, handlers);
  }

  delete(route: string, ...cbs: IMiddleware[]): void {
    if (!route.startsWith("/")) throw new Error('The route must start with "/"');
    const handlers: IMiddleware[] = this.mapDeleteHandlers.get(route) || [];
    handlers.push(...cbs);
    this.mapDeleteHandlers.set(route, handlers);
  }

  patch(route: string, ...cbs: IMiddleware[]): void {
    if (!route.startsWith("/")) throw new Error('The route must start with "/"');
    const handlers: IMiddleware[] = this.mapPatchHandlers.get(route) || [];
    handlers.push(...cbs);
    this.mapPatchHandlers.set(route, handlers);
  }

  use(...args: any[]) {
    if (typeof args[0] == "string") {
      for (let i = 1; i < args.length; i++) {
        if (typeof args[i] != "function") throw new Error("The executors must be callables");
      }
      const route: string = args[0];
      const cbs = args.slice(1);
      this.get(route, ...cbs);
      this.post(route, ...cbs);
      this.put(route, ...cbs);
      this.delete(route, ...cbs);
      this.patch(route, ...cbs);
    } else {
      for (let i = 0; i < args.length; i++) {
        if (typeof args[i] != "function") throw new Error("The executors must be callables");
      }
      for (const key of this.mapGetHandlers.keys()) {
        this.mapGetHandlers.get(key)?.push(...args);
      }
      for (const key of this.mapPostHandlers.keys()) {
        this.mapPostHandlers.get(key)?.push(...args);
      }
      for (const key of this.mapPutHandlers.keys()) {
        this.mapPutHandlers.get(key)?.push(...args);
      }
      for (const key of this.mapDeleteHandlers.keys()) {
        this.mapDeleteHandlers.get(key)?.push(...args);
      }
      for (const key of this.mapPatchHandlers.keys()) {
        this.mapPatchHandlers.get(key)?.push(...args);
      }
    }
  }

  insertRouterIntoAppServer(route: string, appServer: AppServer) {
    for (const keySegment of this.mapGetHandlers.keys()) {
      const newRoute = route + "/" + keySegment;
      const cbs: IMiddleware[] = this.mapGetHandlers.get(keySegment) || [];
      appServer.get(newRoute, ...cbs);
    }
    for (const keySegment of this.mapPostHandlers.keys()) {
      const newRoute = route + "/" + keySegment;
      const cbs: IMiddleware[] = this.mapPostHandlers.get(keySegment) || [];
      appServer.post(newRoute, ...cbs);
    }
    for (const keySegment of this.mapPutHandlers.keys()) {
      const newRoute = route + "/" + keySegment;
      const cbs: IMiddleware[] = this.mapPutHandlers.get(keySegment) || [];
      appServer.put(newRoute, ...cbs);
    }
    for (const keySegment of this.mapDeleteHandlers.keys()) {
      const newRoute = route + "/" + keySegment;
      const cbs: IMiddleware[] = this.mapDeleteHandlers.get(keySegment) || [];
      appServer.delete(newRoute, ...cbs);
    }
    for (const keySegment of this.mapPatchHandlers.keys()) {
      const newRoute = route + "/" + keySegment;
      const cbs: IMiddleware[] = this.mapPatchHandlers.get(keySegment) || [];
      appServer.patch(newRoute, ...cbs);
    }
  }
}
