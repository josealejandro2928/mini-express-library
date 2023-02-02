
const AppServer = require("../build/mini-express-server/index.js").default;
const path = require("node:path");
const fs = require("node:fs");
const { authorizationMidd, logReqMidd } = require("./middlewares");
const { ServerError } = require("../build/mini-express-server/models.class.js");


const app = new AppServer()
const port = 1234;


app.get(`/api`, logReqMidd, (req, res) => {
    const { query, params, body, headers, context } = req;
    res.status(200).json({ query, params, body, headers, context });
})

app.get(`api/web/:page/`, logReqMidd, (req, res, next) => {
    let page = req.params.page;
    let pagesRootPath = path.resolve("pages");
    fs.readdir(pagesRootPath, { encoding: "utf8" }, (err, files) => {
        if (err) {
            next(err);
        } else {
            let fileFound = files.find((file) => file.includes(page))
            if (fileFound) return res.status(200).sendFile(path.resolve(pagesRootPath, fileFound));
            return next(new ServerError(404, "Page not found"));
        }
    })
})

app.get(`api/user/`, logReqMidd, (req, res) => {
    res.status(200).json({ userId: req.params.userId });
})

app.get(`api/user/:userId/`, logReqMidd, (req, res) => {
    res.status(200).json({ userId: req.params.userId });
})



app.listen(port, () => {
    console.log("Server listening: ", port)
})