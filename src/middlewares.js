module.exports = {
    logReqMidd: (req, res, next) => {
        const { pathName, query, params, body, headers } = req;
        req.context.date = new Date();
        req.context.user = { "name": "User 1" }

        res.once("finish", () => {
            console.log("*********************************************")
            console.log("logging: ", { pathName, query, params, body, headers, context: req.context, statusCode: res.statusCode });
            console.log("*********************************************")
        })
        next();
    },
    authorizationMidd: (req, res, next = () => { }) => {
        if (req.headers.authorization) {
            next();
        } else {
            throw new Error("Not authorizer");
        }
    }

}