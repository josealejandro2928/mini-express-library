import http2 = require("http2");

const { HTTP2_HEADER_PATH, HTTP2_HEADER_METHOD, HTTP2_HEADER_STATUS } = http2.constants;

export type fetchHttp2Options = {
  relativePath: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: {
    [key: string]: string;
  };
  body?: string | Uint8Array;
  ca?: any;
};
export type fetchHttpResponse = {
  status: number | string;
  data: string;
  headers: {
    [key: string]: string;
  };
};

export async function fetchHttp2(
  serverHost: string,
  options?: fetchHttp2Options,
  validStatus?: (status: string | number) => boolean
): Promise<fetchHttpResponse> {
  return new Promise((resolve, reject) => {
    try {
      const basicOptions: fetchHttp2Options = {
        method: "GET",
        relativePath: "/",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "0",
        },
      };
      const opts: fetchHttp2Options = { ...basicOptions, ...(options || {}) };
      const buffer = Buffer.from(opts.body || "");
      opts.headers["Content-Length"] = buffer.length + "";

      const clientSession: http2.ClientHttp2Session = http2.connect(serverHost, {
        ca: opts?.ca || null,
        rejectUnauthorized: true,
      });
      clientSession.once("error", err => {
        reject(err);
        clientSession.close();
      });

      clientSession.once("connect", () => {
        const req = clientSession.request({
          [HTTP2_HEADER_PATH]: opts.relativePath,
          [HTTP2_HEADER_METHOD]: opts.method,
          ...(opts.headers || {}),
        });
        if (opts.method != "GET") {
          req.write(opts.body || "", "utf-8");
        }
        req.on("response", headers => {
          const status: number | string = headers[HTTP2_HEADER_STATUS] as string;
          let dataResponse = "";
          req.on("data", chunk => {
            dataResponse += chunk;
          });
          req.on("end", () => {
            const response: fetchHttpResponse = {
              status,
              headers: { ...headers } as any,
              data: dataResponse,
            };
            let checkStatus = (status: number) => {
              if (status > 100 && status < 300) return true;
              return false;
            };
            if (validStatus) {
              checkStatus = validStatus;
            }
            if (checkStatus(+status)) {
              resolve(response);
            } else {
              reject(dataResponse);
            }
            clientSession.close();
          });
        });
        req.end();
      });
    } catch (e) {
      reject(e);
    }
  });
}
