import { IMiddleware, IRequest } from "./models.class";

type RoutesTrieTree = {
  isFinal: boolean;
  cbs?: IMiddleware[];
  [key: string]: any;
};
export class RoutesTrie {
  tree: RoutesTrieTree = { isFinal: false };
  set(route: string, ...cbs: IMiddleware[]) {
    const parts = route.split("/").filter(x => x != "");
    let pivot: RoutesTrieTree = this.tree;
    for (const part of parts) {
      if (!(part in pivot)) {
        const node: RoutesTrieTree = { isFinal: false };
        pivot[part] = node;
      }
      pivot = pivot[part];
    }
    pivot.isFinal = true;
    const handlers: IMiddleware[] = pivot.cbs || [];
    handlers.push(...cbs);
    pivot.cbs = handlers;
  }
  has(route: string): boolean {
    const parts = route.split("/").filter(x => x != "");
    let pivot: RoutesTrieTree = this.tree;
    for (const part of parts) {
      if (!(part in pivot)) {
        return false;
      }
      pivot = pivot[part];
    }
    return pivot.isFinal;
  }

  get(route: string, req: IRequest): IMiddleware[] {
    const params: { [key: string]: string } = {};
    const parts = route.split("/").filter(x => x != "");
    let pivot: RoutesTrieTree = this.tree;
    let match: string | null = null;
    for (const part of parts) {
      match = null;
      if ("*" in pivot) {
        match = "*";
        pivot = pivot[match];
        break;
      }
      for (const key in pivot) {
        if (key == "isFinal" || key == "cbs") continue;
        if (key.startsWith(":")) {
          const param = key.split(":")[1];
          params[param] = part;
          match = key;
          break;
        }
        if (key == part) {
          match = key;
          break;
        }
      }
      if (!match) return [];
      pivot = pivot[match];
    }
    if (!pivot.isFinal && match !== "*") return [];
    req.params = params;

    if (parts.length == 0 && pivot["*"]) {
      return pivot["*"].cbs || [];
    }
    return pivot.cbs as IMiddleware[];
  }
}
