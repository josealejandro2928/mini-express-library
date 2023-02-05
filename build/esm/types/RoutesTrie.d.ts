import { IMiddleware, IRequest } from "./models.class";
type RoutesTrieTree = {
    isFinal: boolean;
    cbs?: IMiddleware[];
    [key: string]: any;
};
export declare class RoutesTrie {
    tree: RoutesTrieTree;
    set(route: string, ...cbs: IMiddleware[]): void;
    has(route: string): boolean;
    get(route: string, req: IRequest): IMiddleware[];
}
export {};
