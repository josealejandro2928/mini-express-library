/* eslint-disable @typescript-eslint/no-var-requires */
const { User } = require("../models");

module.exports = {
    logReqMidd: (req, res, next) => {
        req.context = {};
        req.context.date = new Date();
        req.context.user = { "name": "User 1" }
        let start = performance.now();

        res.once("finish", () => {
            let end = performance.now();
            let delay = ((end - start)).toFixed(2) + " ms";
            console.log("logging: ", `${req.method}:: ${req.url} -> ${res.statusCode} :: ${delay}`)
        })
        next();
    },
    authorizationMidd: async (req, res, next) => {
        if (!req.headers.authorization)
            throw { code: 401, message: "There is not authorization header" }

        let userPart = req.headers.authorization.split("Bearer ")[1]
        let userId = userPart.split("userId:")[1]
        let loggedUser = await User.getUserById(userId);
        if (!loggedUser)
            throw { code: 401, message: "Invalid user token" }

        req.loggedUser = loggedUser;
        next();
    },
    jsonParser: (req, res, next) => {
        try {
            let bodyJson = JSON.parse(req.body);
            req.body = bodyJson;
        } catch (e) {
            // NO JSON
        } finally {
            next();
        }

    }

}