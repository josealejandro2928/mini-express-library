/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "node:http";
export interface IRequest extends IncomingMessage {
    body: {
        [key: string]: any;
    } | string | any;
    query: {
        [key: string]: string;
    };
    params: {
        [key: string]: string;
    };
    hostName: string;
    pathName: string;
    context?: {
        [key: string]: any;
    };
}
export interface IResponse extends ServerResponse {
    status: (statusCode: number) => IResponse;
    text: (data: string) => void;
    json: (data: any) => void;
    sendFile: (data: string, contentType: string) => void;
}
export type IMiddleware = (req: IRequest, res: IResponse, next?: (error?: any) => any) => any;
export declare class ServerError extends Error {
    code: number;
    meta: any[];
    constructor(code: number, message: string, meta: []);
}
export type StaticRouteMap = {
    [route: string]: string;
};