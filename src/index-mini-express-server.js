
///////////////////////////////////////////////////////////////////////
const AppServer = require("../build/mini-express-server/index.js").default;
const { ServerError } = require("../build/mini-express-server/models.class.js");
/////////////////////////////////////////////////////////////////////////
const path = require("node:path");
const fs = require("node:fs");
const { logReqMidd } = require("./middlewares");

const app = new AppServer()
const port = 1234;

const { User } = require("./models")

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
            let fileFound = files.find((file) => file == (page + ".html"))
            if (fileFound) return res.status(200).sendFile(path.resolve(pagesRootPath, fileFound));
            return next(new ServerError(404, "Page not found", [{ "websites": files }]));
        }
    })
})

app.get(`api/user/`, logReqMidd, async (req, res) => {
    let users = await User.getListUsers()
    res.status(200).json({ data: users });
})

app.get(`api/user/:userId/`, logReqMidd, async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.getUserById(userId);
    if (!user) {
        next(new ServerError(404, `User with id=${userId} not found`));
    } else {
        res.status(200).json({ data: user });
    }
})

app.setErrorHandler((req, res, error) => {
    console.error("THere is an error: ", error);
    let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
    res.status(code).json({ message: error.message, error: true, meta: error.meta })
})



app.listen(port, () => {
    console.log("Server listening: ", port)
})