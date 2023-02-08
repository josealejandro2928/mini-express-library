/* eslint-disable @typescript-eslint/no-explicit-any */
import AppServer from "../lib/index";
describe("AppServer class", () => {
  let appServer: AppServer;
  beforeEach(() => {
    appServer = new AppServer();
  });

  afterEach(() => {
    appServer.getHttpServer().close();
  });

  const flushPromises = () => new Promise(setImmediate);

  test("it should handle properly the errors", async () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      headers: {},
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
      //   console.log("Error: ", error);
      expect(error).toBeInstanceOf(Error);
    });
    appServer.get("/api", (req, res) => {
      throw new Error("Error1");
    });

    appServer.get("/api/async", async (req, res) => {
      const response = await new Promise((_, rej) => {
        rej(new Error("Error2"));
      });
    });

    appServer.get("/api/error-calling", async (req, res) => {
      return res.status(200).json({ x: BigInt("454626524563232163") });
    });

    appServer.setErrorHandler(errHandler);

    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(1);

    req.url = "/api/async";
    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(2);

    req.url = "/api/error-calling";
    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(3);
  });

  test("it should handle properly the errors", async () => {
    const req = {
      method: "GET",
      url: "/api",
      pathName: "/api",
      headers: {},
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
      //   console.log("Error: ", error);
      expect(error).toBeInstanceOf(Error);
    });
    appServer.get("/api", (req, res) => {
      throw new Error("Error1");
    });

    appServer.get("/api/async", async (req, res) => {
      const response = await new Promise((_, rej) => {
        rej(new Error("Error2"));
      });
    });

    appServer.get("/api/error-calling", async (req, res) => {
      return res.status(200).json({ x: BigInt("454626524563232163") });
    });

    appServer.setErrorHandler(errHandler);

    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(1);

    req.url = "/api/async";
    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(2);

    req.url = "/api/error-calling";
    appServer["switchRoutes"](req as any, res as any, "");
    await flushPromises();
    expect(errHandler).toBeCalledTimes(3);
  });

  test("it should handle the innapropiate next call", () => {
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
    const middleware2Get = jest.fn().mockImplementation((req, res, next) => next());
    appServer.get("/api", middleware1Get, middleware2Get);

    const errHandler = jest.fn().mockImplementation((req, res, error) => {
      // console.log("Error: ", error);
      expect(error).toBeInstanceOf(Error);
    });
    appServer.setErrorHandler(errHandler);

    appServer["switchRoutes"](req as any, res as any, "");
    expect(middleware1Get).toBeCalledTimes(1);
    expect(middleware2Get).toBeCalledTimes(1);
    expect(errHandler).toBeCalledTimes(1);
  });
});
