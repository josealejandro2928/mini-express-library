/* eslint-disable @typescript-eslint/no-var-requires */
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require('cors')
const { jsonParser } = require("./middlewares.js");
const app = require('fastify')()
const port = 1236;

app.register(require('@fastify/express')).then(() => {
    app.use(morgan("common"));
    app.use(cors());
    app.use(helmet());
    app.use(jsonParser);
    for (let i = 0; i < 1000; i++) {
        app.get(`/v1/endpoind/${i}`, (req, res) => {
            res.status(200).json({ "message": `Hello: ${i}` });
        })
    }


    app.get(`/api`, (req, res) => {
        let { query, params, body, headers, context } = req;
        if (!context) {
            context = {};
        }
        context["server"] = "express";
        res.status(200).json({ query, params, body, headers, context });
    })


    app.listen({ port: port }, (err, address) => {
        if (err) throw err
        console.log("Server listening: ", address)
    })
})

