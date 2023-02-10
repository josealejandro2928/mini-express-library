/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage, ServerOptions as ServerOptionsHttp1, ServerResponse } from "node:http";
import {
  Http2ServerRequest,
  ServerOptions as ServerOptionsHttp2,
  Http2ServerResponse,
} from "node:http2";

export interface IRequest extends IncomingMessage {
  body: { [key: string]: any } | string | any;
  query: { [key: string]: string };
  params: { [key: string]: string };
  hostName: string;
  pathName: string;
  context: { [key: string]: any };
}
export interface IRequestHttp2 extends Http2ServerRequest {
  body: { [key: string]: any } | string | any;
  query: { [key: string]: string };
  params: { [key: string]: string };
  hostName: string;
  pathName: string;
  context: { [key: string]: any };
}

export interface IResponse extends ServerResponse {
  status: (statusCode: number) => IResponse;
  text: (data: string) => void;
  send: (data: string) => void;
  json: (data: any) => void;
  sendFile: (pathFile: string) => void;
}
export interface IResponseHttp2 extends Http2ServerResponse {
  status: (statusCode: number) => IResponse;
  text: (data: string) => void;
  send: (data: string) => void;
  json: (data: any) => void;
  sendFile: (pathFile: string) => void;
}

export type IMiddleware = (req: IRequest, res: IResponse, next: (error?: any) => any) => any;

export class ServerError extends Error {
  code = 0;
  meta: any[] = [];
  constructor(code: number, message: string, meta: any[] = []) {
    super(message);
    this.code = code;
    this.meta = meta;
  }
}

export type StaticRouteMap = {
  [route: string]: string;
};

export type ListenOptions = {
  hostname?: string | undefined;
  backlog?: number | undefined;
};

export interface CustomServerOptions extends ServerOptionsHttp1, ServerOptionsHttp2 {
  httpVersion?: "HTTP1" | "HTTP2";
  key?: any;
  cert?: any;
  allowHTTP1?:boolean
}
