/* eslint-disable @typescript-eslint/no-var-requires */
const { AppServer } = require("../build/cjs/index");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require('cors')

const app = new AppServer({ httpVersion: "HTTP2" })

app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "GET" })
})

app.post("/", (req, res) => {
    console.log(req.body);
    console.log(req.headers);
    res.status(200).json({ message: "Hello from server", method: "POST", body: req.body })
})

app.put("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "PUT", body: req.body })
})

app.get("/api", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.get("/api/:param1", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})


app.listen(8000, (address) => {
    console.log("Server listening: ", address)
})