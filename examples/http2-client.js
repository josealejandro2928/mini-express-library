/* eslint-disable @typescript-eslint/no-var-requires */
const { fetchHttp2 } = require("../build/cjs/index");

async function main() {
    const API_HOST = "http://127.0.0.1:8000"
    try {
  
        let res = await fetchHttp2(API_HOST);
        let data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        // Response on res:  { message: 'Hello from server', method: 'GET' }

        res = await fetchHttp2(API_HOST, {
            method: "POST",
            body: JSON.stringify({ name: "Jose", age: 27, date: new Date() }),
        });
        data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        /**
        Response on res:  {
                message: 'Hello from server',
                method: 'POST',
                body: { name: 'Jose', age: 27, date: '2023-02-10T13:30:51.992Z' }
            }
        */
        res = await fetchHttp2(API_HOST, {
            method: "PUT",
            body: JSON.stringify({ userId: 1, name: "Jose" }),
        });

        data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        /**
         *  Response on res:  {
                message: 'Hello from server',
                method: 'PUT',
                body: { userId: 1, name: 'Jose' }
            }
         */

        res = await fetchHttp2(API_HOST, {
            relativePath: "/api/exampleFullEndpoint/?limit=10&offset=5&status=enabled",
        })
        data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        /**
         * Response on res:  {
            query: { limit: '10', offset: '5', status: 'enabled' },
            params: { param1: 'exampleFullEndpoint' },
            body: '',
            headers: {
                ':path': '/api/exampleFullEndpoint/?limit=10&offset=5&status=enabled',
                ':method': 'GET',
                ':authority': '127.0.0.1:8000',
                ':scheme': 'http'
            }
        }
         */

    } catch (e) {
        console.log("Error: ", e);
    }
}

main();