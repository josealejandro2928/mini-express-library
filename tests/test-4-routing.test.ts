/* eslint-disable @typescript-eslint/no-explicit-any */
import AppServer from "../lib/index";
import Router from "../lib/Router";
describe("Routing behavior with the AppServer Class", () => {
  let appServer: AppServer;
  beforeEach(() => {
    appServer = new AppServer();
  });

  afterEach(() => {
    appServer.getHttpServer().close();
  });

  const flushPromises = () => new Promise(setImmediate);

  test("it should route correctrly with the use of 'use'", () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      on: jest.fn(),
      body: "Example body",
      params: {},
      query: {},
      headers: {},
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    };
    const middleware1Get = jest.fn().mockImplementation((req, res, next) => next());
    const middleware2Get = jest.fn();
    const globalMidd = jest.fn().mockImplementation((req, res, next) => next());

    appServer.use(globalMidd);
    appServer.get("/api", middleware1Get, middleware2Get);

    appServer["switchRoutes"](req as any, res as any, "");
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(globalMidd).toBeCalledTimes(1);
  });

  test("it should route correctly with the use of 'use'", () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      on: jest.fn(),
      body: "Example body",
      params: {},
      query: {},
      headers: {},
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    };
    const middleware1Get = jest.fn();
    const middleware2Get = jest.fn();
    const globalMidd = jest.fn().mockImplementation((req, res, next) => next());
    const apiMidd = jest.fn().mockImplementation((req, res, next) => {
      req.userId = req.params.param;
      next();
    });

    appServer.use(globalMidd);
    appServer.use("/api/:param", apiMidd);
    appServer.get("/api", middleware1Get);
    appServer.get("/api/:param", middleware2Get);

    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(1);
    expect(apiMidd).toBeCalledTimes(0);
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(0);
    expect((req as any).userId).toBe(undefined);

    req.url = "/api/1";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(2);
    expect(apiMidd).toBeCalledTimes(1);
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(req.params).toEqual({ param: "1" });
    expect((req as any).userId).toBe("1");
  });
});
describe("Routing behavior with the AppServer Class", () => {
  let appServer: AppServer;
  let routerApi: Router;
  let routerHome: Router;
  beforeEach(() => {
    appServer = new AppServer();
    routerApi = new Router();
    routerHome = new Router();
  });

  afterEach(() => {
    appServer?.httpServer?.close();
  });

  const flushPromises = () => new Promise(setImmediate);

  test("it should route correctly with the use of a Router instance", () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      on: jest.fn(),
      body: "Example body",
      params: {},
      query: {},
      headers: {},
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    };
    const globalMidd = jest.fn().mockImplementation((req, res, next) => next());
    const middleware1Api = jest.fn().mockImplementation((req, res, next) => next());
    const middleware1Home = jest.fn().mockImplementation((req, res, next) => next());

    appServer.use(globalMidd);
    appServer.use("/api", middleware1Api);
    appServer.use("/home", middleware1Home);

    //////////////Routing Api//////////////////////////
    const getApiMidd = jest.fn();
    const getApiAllMidd = jest.fn();
    const postApiMidd = jest.fn();
    const putApiMidd = jest.fn();

    routerApi.get("/", getApiAllMidd);
    routerApi.get("/:id", getApiMidd);
    routerApi.post("/", postApiMidd);
    routerApi.put("/:id", putApiMidd);

    //////////////Routing Home//////////////////////////
    const getHomeMidd = jest.fn();
    const getHomeAllMidd = jest.fn();
    const postHomeMidd = jest.fn();
    const putHomeMidd = jest.fn();

    routerHome.get("/", getHomeAllMidd);
    routerHome.get("/:id", getHomeMidd);
    routerHome.post("/", postHomeMidd);
    routerHome.put("/:id", putHomeMidd);
    //////////////////////////////////////////////
    appServer.use("/api", routerApi);
    appServer.use("/home", routerHome);
    ///////////////////////////////////////////////////
    expect(routerApi["mapGetHandlers"].size).toEqual(2);
    expect(routerApi["mapPostHandlers"].size).toEqual(1);
    expect(routerApi["mapPutHandlers"].size).toEqual(1);
    expect(routerApi["mapDeleteHandlers"].size).toEqual(0);
    ////////////////////////////////////////////////////
    req.url = "/api";
    req.method = "GET";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(1);
    expect(middleware1Api).toBeCalledTimes(1);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(0);
    expect(postApiMidd).toBeCalledTimes(0);
    expect(putApiMidd).toBeCalledTimes(0);
    expect(getHomeAllMidd).toBeCalledTimes(0);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

    req.url = "/api/5";
    req.method = "GET";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(2);
    expect(middleware1Api).toBeCalledTimes(1);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(1);
    expect(postApiMidd).toBeCalledTimes(0);
    expect(putApiMidd).toBeCalledTimes(0);
    expect(getHomeAllMidd).toBeCalledTimes(0);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

    req.url = "/api/5";
    req.method = "PUT";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(3);
    expect(middleware1Api).toBeCalledTimes(1);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(1);
    expect(postApiMidd).toBeCalledTimes(0);
    expect(putApiMidd).toBeCalledTimes(1);
    expect(getHomeAllMidd).toBeCalledTimes(0);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

    req.url = "/api/";
    req.method = "POST";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(4);
    expect(middleware1Api).toBeCalledTimes(2);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(1);
    expect(postApiMidd).toBeCalledTimes(1);
    expect(putApiMidd).toBeCalledTimes(1);
    expect(getHomeAllMidd).toBeCalledTimes(0);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

    req.url = "/api/";
    req.method = "DELETE";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(5);
    expect(middleware1Api).toBeCalledTimes(3);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(1);
    expect(postApiMidd).toBeCalledTimes(1);
    expect(putApiMidd).toBeCalledTimes(1);
    expect(getHomeAllMidd).toBeCalledTimes(0);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

    req.url = "/home/";
    req.method = "GET";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(globalMidd).toBeCalledTimes(6);
    expect(middleware1Api).toBeCalledTimes(3);
    expect(middleware1Home).toBeCalledTimes(1);
    expect(getApiAllMidd).toBeCalledTimes(1);
    expect(getApiMidd).toBeCalledTimes(1);
    expect(postApiMidd).toBeCalledTimes(1);
    expect(putApiMidd).toBeCalledTimes(1);
    expect(getHomeAllMidd).toBeCalledTimes(1);
    expect(getHomeMidd).toBeCalledTimes(0);
    expect(postHomeMidd).toBeCalledTimes(0);
    expect(putHomeMidd).toBeCalledTimes(0);

  });
});
