import { Server } from "node:http";
import { AppServer} from "../lib/index";
describe("AppServer class", () => {
  let appServer: AppServer;
  beforeEach(() => {
    appServer = new AppServer();
  });

  afterEach(()=>{
    appServer.getHttpServer().close();
  })

  test("init() should create an instance of node's http Server", () => {
    expect(appServer.getHttpServer()).toBeInstanceOf(Server);
  });

  test("switchRoutes() should call the correct route based on the request method", () => {
    const req = {
      method: "GET",
      url: "https://test.com",
      on: jest.fn(),
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    const spyRoutesHandler = jest.spyOn(appServer as any, "routesHandler");
    appServer["switchRoutes"](req as any, res as any, "");

    expect(spyRoutesHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      appServer["mapGetHandlers"]
    );
  });

  test("extendReqRes() should extend the IncomingMessage and ServerResponse objects", () => {
    const req = {
      url: "https://test.com/api?limit=10&offset=0",
    };
    const res = {};

    const { req: reqExtended, res: resExtended } = appServer["extendReqRes"](
      req as any,
      res as any,
      "This is a message body"
    );

    expect(reqExtended).toHaveProperty("query");
    expect(reqExtended.query).toEqual({ limit: "10", offset: "0" });
    expect(reqExtended).toHaveProperty("params");
    expect(reqExtended.params).toEqual({});
    expect(reqExtended).toHaveProperty("pathName");
    expect(reqExtended.pathName).toEqual("/api");
    expect(reqExtended).toHaveProperty("hostName");
    expect(reqExtended).toHaveProperty("context");
    expect(reqExtended.context).toEqual({});

    expect(resExtended).toHaveProperty("status");
    expect(resExtended).toHaveProperty("text");
    expect(resExtended).toHaveProperty("json");
    expect(resExtended).toHaveProperty("sendFile");
  });

  test("listen() should start the HTTP server", () => {
    appServer.listen();
    expect(appServer.getHttpServer().listening).toBeTruthy();
  });

  test("get() should add a GET route and its middlewares", () => {
    const route = "/test";
    const middlewares = [jest.fn(), jest.fn()];

    appServer.get(route, ...middlewares);

    expect(appServer["mapGetHandlers"].get(route)).toEqual(middlewares);
    expect(appServer["mapPostHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPutHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapDeleteHandlers"].get(route)).toEqual(undefined);
  });

  test("post() should add a POST route and its middlewares", () => {
    const route = "/test";
    const middlewares = [jest.fn(), jest.fn()];

    appServer.post(route, ...middlewares);

    expect(appServer["mapGetHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPostHandlers"].get(route)).toEqual(middlewares);
    expect(appServer["mapPutHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapDeleteHandlers"].get(route)).toEqual(undefined);
  });

  test("put() should add a PUT route and its middlewares", () => {
    const route = "/test";
    const middlewares = [jest.fn(), jest.fn()];

    appServer.put(route, ...middlewares);

    expect(appServer["mapGetHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPostHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPutHandlers"].get(route)).toEqual(middlewares);
    expect(appServer["mapDeleteHandlers"].get(route)).toEqual(undefined);
  });

  test("delete() should add a DELETE route and its middlewares", () => {
    const route = "/test";
    const middlewares = [jest.fn(), jest.fn()];

    appServer.delete(route, ...middlewares);

    expect(appServer["mapGetHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPostHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapPutHandlers"].get(route)).toEqual(undefined);
    expect(appServer["mapDeleteHandlers"].get(route)).toEqual(middlewares);
  });
});

describe("AppServer.routesHandler", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      method: "GET",
      url: "/test",
      headers: {
        authorization: "Bearer userId:2",
        "content-type": "application/json",
        connection: "keep-alive",
        "content-length": "33",
      },
      query: { limit: 10, search: "books" },
      params: { userId: 10 },
      pathName: "/test",
      hostName: "localhost",
      body: "Message passed as text",
      context: {},
    };

    res = {
      statusCode: 200,
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
      text: jest.fn(),
      json: jest.fn().mockImplementation(data => {
        return JSON.stringify(data);
      }),
      sendFile: jest.fn(),
    };
  });

  it("should call the first middleware", () => {
    const middleware1 = jest.fn();
    const middleware2 = jest.fn();
    const appServer = new AppServer();
    appServer.get("/test", middleware1, middleware2);
    appServer["routesHandler"](req, res, appServer["mapGetHandlers"]);
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalledTimes(0);
  });

  it("should call the second middleware", () => {
    const middleware1 = jest.fn().mockImplementation((req, res, next) => {
      next();
    });
    const middleware2 = jest.fn();
    const appServer = new AppServer();
    appServer.get("/test", middleware1, middleware2);
    appServer["routesHandler"](req, res, appServer["mapGetHandlers"]);
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });

  const date = new Date();
  it("should complete the process of calling a route with diferent midd and modifyn the req", () => {
    const middleware1 = jest.fn().mockImplementation((req, res, next) => {
      req.context = { query: req.query, params: req.params, date: date };
      next();
    });
    const middleware2 = jest.fn().mockImplementation((req, res, next) => {
      req.context["authorization"] = req.headers.authorization.split("Bearer ")[1];
      next();
    });
    const middleware3 = jest.fn().mockImplementation((req, res) => {
      res.status(200).json(req.context);
    });
    const appServer = new AppServer();
    appServer.get("/test", middleware1, middleware2, middleware3);
    appServer["routesHandler"](req, res, appServer["mapGetHandlers"]);
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
    expect(middleware3).toHaveBeenCalled();
    expect(res.json).toBeCalled();
    expect(req.context).toHaveProperty("query");
    expect(req.context["query"]).toEqual(req.query);
    expect(req.context).toHaveProperty("date");
    expect(req.context["date"]).toEqual(date);
    expect(req.context).toHaveProperty("date");
    expect(req.context["authorization"]).toEqual("userId:2");
    expect(res.json).toReturnWith(
      JSON.stringify({
        query: req.query,
        params: req.params,
        date: date,
        authorization: "userId:2",
      })
    );
  });
});
