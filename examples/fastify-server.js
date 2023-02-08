/* eslint-disable @typescript-eslint/no-var-requires */

const app = require('fastify')()
const port = 1236;

//////stressing the api//////////////
for (let i = 0; i < 500; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
/////////////////////////////

app.get(`/api`, (req, res) => {
    const { query, params, body, headers } = req;
    return { query, params, body, headers };
})


app.listen({ port: port }, (err, address) => {
    if (err) throw err
    console.log("Server created by fastify library listening: ", address)
})