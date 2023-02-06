/* eslint-disable @typescript-eslint/no-var-requires */

const { AppServer } = require("mini-express-server")
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require('cors')
const { jsonParser } = require("./middlewares.js");

const app = new AppServer();
const port = 1234;

app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(jsonParser);

//////stressing the api//////////////
for (let i = 0; i < 1000; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
/////////////////////////////

app.get(`/api`, (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})


app.listen(port, () => {
    console.log("Server created by mini-express-server library listening: ", port)
})