/* eslint-disable @typescript-eslint/no-var-requires */

const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require('cors')

const app = express();
const port = 1235;

app.use(morgan("common"));
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

//////stressing the api//////////////
for (let i = 0; i < 500; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
/////////////////////////////

app.get(`/api`, (req, res) => {
    let { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})

app.listen(port, () => {
    console.log("Server created by express library listening: ", port)
})