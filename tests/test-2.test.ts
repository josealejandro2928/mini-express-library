/* eslint-disable @typescript-eslint/no-explicit-any */
import AppServer from "../lib/index";
describe("AppServer matching routes", () => {
  let appServer: AppServer;
  beforeEach(() => {
    appServer = new AppServer();
  });

  afterEach(() => {
    appServer.getHttpServer().close();
  });

  test("it should match the routes correctly", () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      on: jest.fn(),
      body: "Example body",
      params: {},
      query: {},
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    };
    const middleware1Get = jest.fn();
    const middleware2Get = jest.fn();
    appServer.get("/api", middleware1Get);
    appServer.get("/api/:elementId/home/:userId", middleware2Get);

    const middleware1Post = jest.fn();
    const middleware2Post = jest.fn().mockImplementation((req, res) => {
      res.json(req.body);
    });
    appServer.post("/api", middleware1Post);
    appServer.post("/api/:webPage", middleware2Post);

    appServer["switchRoutes"](req as any, res as any, "");
    expect(req.params).toEqual({});
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(0);
    expect(middleware1Post).toBeCalledTimes(0);
    expect(middleware1Post).toBeCalledTimes(0);

    req.url = "/api/tasks/home/2";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(req.params).toEqual({ elementId: "tasks", userId: "2" });
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(middleware1Post).toBeCalledTimes(0);
    expect(middleware2Post).toBeCalledTimes(0);

    req.url = "/api/tasks/home/2";
    req.method = "POST";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(req.params).toEqual({});
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(middleware1Post).toBeCalledTimes(0);
    expect(middleware2Post).toBeCalledTimes(0);

    req.url = "/api/facebook.com";
    req.method = "POST";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(req.params).toEqual({ webPage: "facebook.com" });
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(middleware1Post).toBeCalledTimes(0);
    expect(middleware2Post).toBeCalledTimes(1);
  });
});

describe("Error handling", () => {
  let appServer: AppServer;
  beforeEach(() => {
    appServer = new AppServer();
  });

  afterEach(() => {
    appServer.getHttpServer().close();
  });

  test("it should return error message", () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      on: jest.fn(),
      body: "Example body",
      params: {},
      query: {},
    };
    const res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    };

    const errHandler = jest.fn().mockImplementation((req, res, error) => {
      expect(error.message).toEqual("Custom Error");
    });
    appServer.get("/api", (req, res) => {
      throw { message: "Custom Error", code: 400 };
    });

    appServer.get("/api/:index", async (req, res, next) => {
      for (let i = 0; i < 10; i++) {
        if (i == 5) {
          (next as any)({ message: "Custom Error", code: 400 });
        }
      }
    });

    appServer["switchRoutes"](req as any, res as any, "");
    expect(errHandler).toBeCalledTimes(0);

    appServer.setErrorHandler(errHandler);
    appServer["switchRoutes"](req as any, res as any, "");
    expect(errHandler).toBeCalledTimes(1);

    req.url = "/api/2";
    appServer["switchRoutes"](req as any, res as any, "");
    expect(errHandler).toBeCalledTimes(2);
  });
});
