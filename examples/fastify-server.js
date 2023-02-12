/* eslint-disable @typescript-eslint/no-var-requires */

const app = require('fastify')()
const port = 1236;

//////stressing the api//////////////
for (let i = 0; i < 500; i++) {
    app.get(`/api/endpoint/${i}`, (req, res) => {
        return { "message": `Hello: ${i}` };
    })
}
/////////////////////////////

app.get('/', async (req, res) => {
    const { query, params, body, headers } = req;
    return { query, params, body, headers };
})


app.get('/api', async (req, res) => {
    const { query, params, body, headers } = req;
    return { query, params, body, headers };
})


app.listen({ port: port }, (err, address) => {
    if (err) throw err
    console.log("Server created by fastify library listening: ", address)
})