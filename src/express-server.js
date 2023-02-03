/* eslint-disable @typescript-eslint/no-var-requires */
const { ServerError } = require("mini-express-server");
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require('cors')

const { User } = require("./models")
const { authorizationMidd } = require("./middlewares");


const app = express();
const port = 1235;

app.use(morgan("common"));
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//////stressing the api//////////////
for (let i = 0; i < 1000; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
/////////////////////////////

app.get(`/api`, (req, res) => {
    let { query, params, body, headers, context } = req;
    if (!context) {
        context = {};
    }
    context["server"] = "express";
    res.status(200).json({ query, params, body, headers, context });
})

////////////////////////USER CRUD/////////////////////////////////
app.get(`/api/user/`, async (req, res) => {
    let users = await User.getListUsers()
    res.status(200).json({ data: users });
})

app.get(`/api/user/:userId/`, async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.getUserById(userId);
    if (!user) {
        next(new ServerError(404, `User with id=${userId} not found`));
    } else {
        res.status(200).json({ data: user });
    }
})


app.post(`/api/user/`, async (req, res) => {
    let data = req.body
    let newUser = await User.createUser(data.name, data.lastName, data.age);
    res.status(201).json({ data: newUser });
})

app.post(`/api/user/:userId/task`, authorizationMidd, async (req, res) => {
    let data = req.body;
    if (req.loggedUser.id != req.params.userId) {
        throw new ServerError(403, "Not allowed", ["you can edit other users"]);
    }
    let user = req.loggedUser;
    user.tasks = [...new Set([...user.tasks, ...data.tasks])]
    user = await User.editUser(user);
    res.status(201).json({ data: user });
})

app.put(`/api/user/:userId/`, async (req, res, next) => {
    let userId = req.params.userId;
    let user = await User.getUserById(userId);
    if (!user) {
        return next(new ServerError(404, `User with id=${userId} not found`));
    }
    let data = req.body
    if (data.name != undefined) {
        user.name = data.name;
    }
    if (data.lastName != undefined) {
        user.lastName = data.lastName;
    }
    if (data.age != undefined) {
        user.age = data.age;
    }
    user = await User.editUser(user);
    res.status(201).json({ data: user });
})

app.delete(`/api/user/:userId/`, authorizationMidd, async (req, res) => {
    if (req.loggedUser.id != req.params.userId) {
        throw new ServerError(403, "Not allowed", ["you can edit other users"]);
    }
    let user = req.loggedUser;
    await User.deleteUser(user.id)
    res.status(200).json({ status: "Ok" });
})
///////////////////////////////////////////////////////////////////////

//////////////////////////// RENDER WEB PAGE //////////////////////////
app.get(`/api/web/:page/`, (req, res, next) => {
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

////////////////////////////////////////////////////////////////////////////

// Error handler
app.use((error, req, res, next) => {
    console.error("THere is an error: ", error);
    let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
    res.status(code).json({ message: error.message, error: true, meta: error.meta })
})

let server = app.listen(port, () => {
    console.log("Server listening: ", port)
})