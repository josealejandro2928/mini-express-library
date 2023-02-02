import { IncomingMessage, ServerResponse } from "node:http";

export interface IRequest extends IncomingMessage {
  body: { [key: string]: any } | string | any;
  query: { [key: string]: string };
  params: { [key: string]: string };
  hostName: string;
  pathName: string;
  context?: { [key: string]: any };
}

export interface IResponse extends ServerResponse {
  status: (statusCode: number) => IResponse;
  text: (data: string) => void;
  json: (data: any) => void;
  sendFile: (data: string, contentType: string) => void;
}

export type IMiddleware = (req: IRequest, res: IResponse, next?: (error?: any) => any) => any;

export class ServerError extends Error {
  code: number = 0;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
