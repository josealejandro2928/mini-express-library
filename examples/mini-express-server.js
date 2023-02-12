/* eslint-disable @typescript-eslint/no-var-requires */
const { AppServer, ServerError } = require("../build/cjs/index.js");
const path = require("node:path");
const fs = require("node:fs");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = new AppServer();
const userRouter = require("./routes/user.js");
const port = 1234;

/// comments this global middlewares when you try to test against the example in fastify
app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//////stressing the api//////////////
for (let i = 0; i < 500; i++) {
    app.get(`/api/endpoint/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
/////////////////////////////
app.get("/", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.post("/", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.put("/", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.patch("/", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.delete("/", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})

app.get("/api", async (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})

app.get("/api/error", async (req, res) => {
    res.status(200).sendFile("./static/home/style.css3");
})

app.get("/api/error2", (req, res) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new ServerError(403, "Forbidden is the result"));
        }, 1000)
    });
})

app.get("/api/error3", async (req, res) => {
    throw new Error("CUstom Error");
})

app.use("/api/user", userRouter);

// //////////////////////////// RENDER WEB PAGE //////////////////////////
// //////////////////Configuring the static route//////////////////////

app.setStatic("/api/web/static", path.join(__dirname, ".", "static"))
app.get("/api/web/:page/", (req, res, next) => {
    let page = req.params.page;
    let pagesRootPath = path.resolve("examples", "pages");
    fs.readdir(pagesRootPath, { encoding: "utf8" }, (err, files) => {
        if (err) {
            next(err);
        } else {
            let fileFound = files.find((file) => file == (page + ".html"))
            if (fileFound) return res.status(200).sendFile(path.resolve(pagesRootPath, fileFound));
            return next(new ServerError(404, "Page not found", [{ "websites": files }]));
        }
    })
})
// ///////////////////////////////////////////////////////////////////////////////

app.setErrorHandler((req, res, error) => {
    console.error("\nThere is an error: ", error);
    let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
    res.status(code).json({ message: error.message, error: true, meta: error.meta })
})



app.listen(port, (address) => {
    console.log("Server created by mini-express-server library listening at: ", address)
})