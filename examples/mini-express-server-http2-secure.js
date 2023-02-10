/* eslint-disable @typescript-eslint/no-var-requires */
const { AppServer } = require("../build/cjs/index");
const fs = require("fs");
const path = require("path");

const morgan = require("morgan");

const secureServerOptions = {
    httpVersion: "HTTP2",
    key: fs.readFileSync(path.resolve(__dirname, "localhost-privkey.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "localhost-cert.pem")),
    allowHTTP1: true,
}

console.log("🚀 ~ file: mini-express-server-http2-secure.js:12 ~ secureServerOptions", secureServerOptions)
const app = new AppServer(secureServerOptions);

app.use(morgan("combined"));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "GET" })
})

app.post("/", (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: "Hello from server", method: "POST", body: JSON.parse(req.body) })
})

app.put("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "PUT", body: JSON.parse(req.body) })
})

app.get("/api", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.get("/api/:param1", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})


app.listen(8001, (address) => {
    console.log("Server listening: ", address)
})