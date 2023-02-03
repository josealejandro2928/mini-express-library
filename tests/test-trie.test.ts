import { RoutesTrie } from "../lib/RoutesTrie";

describe("Trie testing", () => {
  let routesTrie: RoutesTrie;
  beforeEach(() => {
    routesTrie = new RoutesTrie();
  });

  it("should register function", () => {
    const req: any = { params: {} };
    const cbs1 = [jest.fn(), jest.fn()];
    const cbs2 = [jest.fn(), jest.fn()];
    routesTrie.set("/api/example", ...cbs1);
    routesTrie.set("/api/:param1/view", ...cbs2);
    expect(routesTrie.has("xxx")).toBe(false);
    expect(routesTrie.has("api")).toBe(false);
    expect(routesTrie.has("/api")).toBe(false);
    expect(routesTrie.has("/api/")).toBe(false);
    expect(routesTrie.has("/api/examjK")).toBe(false);
    expect(routesTrie.has("/api/exam:")).toBe(false);
    expect(routesTrie.has("/api/example")).toBe(true);

    expect(routesTrie.get("/api/example", req)).toEqual(cbs1);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/api/home", req)).toEqual([]);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/api/value1/view", req)).toEqual(cbs2);
    expect(req.params).toEqual({ param1: "value1" });
  });
  it("should get right structure", () => {
    const req: any = { params: {} };
    
    const cbs1 = [jest.fn(), jest.fn()];
    const cbs2 = [jest.fn(), jest.fn()];
    const cbs3 = [jest.fn(), jest.fn(), jest.fn()];
    routesTrie.set("/api", ...cbs1);
    routesTrie.set("/home", ...cbs2);
    routesTrie.set("/api/home/:user/:chanel/view", ...cbs2, ...cbs3);
    expect(routesTrie.tree.isFinal).toBe(false);
    expect(routesTrie.tree).toEqual({
      isFinal: false,
      api: {
        isFinal: true,
        cbs: cbs1,
        home: {
          isFinal: false,
          ":user": {
            isFinal: false,
            ":chanel": {
              isFinal: false,
              view: {
                isFinal: true,
                cbs: [...cbs2, ...cbs3],
              },
            },
          },
        },
      },
      home: {
        isFinal: true,
        cbs: cbs2,
      },
    });
    expect(routesTrie.has("xxx")).toBe(false);
    expect(routesTrie.has("api")).toBe(true);
    expect(routesTrie.has("/home")).toBe(true);
    expect(routesTrie.has("/api")).toBe(true);
    expect(routesTrie.has("/api/")).toBe(true);
    expect(routesTrie.has("/api/examjK")).toBe(false);
    expect(routesTrie.has("/api/exam:")).toBe(false);
    expect(routesTrie.has("/api/example")).toBe(false);

    expect(routesTrie.get("/api", req)).toEqual(cbs1);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/api/home", req)).toEqual([]);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/home", req)).toEqual(cbs2);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/api/home/2/sports/", req)).toEqual([]);
    expect(req.params).toEqual({});
    expect(routesTrie.get("/api/home/2/sports/view", req)).toEqual([...cbs2, ...cbs3]);
    expect(req.params).toEqual({ user: "2", chanel: "sports" });
  });
});
