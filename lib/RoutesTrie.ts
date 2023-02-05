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
    pivot.cbs = cbs;
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
    const params: { [key: string]: string } = { ...req.params };
    const parts = route.split("/").filter(x => x != "");
    let pivot: RoutesTrieTree = this.tree;
    for (const part of parts) {
      let match: string | null = null;
      for (const key in pivot) {
        if (key == "isFinal" || key == "cbs") continue;
        if (key.startsWith(":")) {
          const param = key.split(":")[1];
          params[param] = part;
          match = key;
          break;
        } else {
          if (key == part) {
            match = key;
            break;
          }
        }
      }
      if (!match) return [];
      pivot = pivot[match];
    }
    if (!pivot.isFinal) return [];
    req.params = params;
    return pivot.cbs as IMiddleware[];
  }
}
