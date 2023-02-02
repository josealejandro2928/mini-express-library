# mini-express-server

A short implementation of a web server based in express architecture using only build-in node modules
like path, http, and fs

## installation

```sh
npm i mini-express-server --save
```

## Usage

```JavaScript
const { AppServer,ServerError } = require("mini-express-server");
const app = new AppServer()
const port = 1234;

// A global middleware that will be execute to every incomming request
app.use((req, res,next) => {
    console.log("Hello world")
    req.context["date"] = new Date();
    next();
})

app.get(`/api`, (req, res) => {
    const { query, params, body, headers, context } = req;
    context["server"] = "my-app-server";
    res.status(200).json({ query, params, body, headers, context });
})

app.listen(port, () => {
    console.log("Server listening: ", port)
})
```

You can configure your custom Error handler

```JavaScript
const { AppServer,ServerError } = require("mini-express-server");
const app = new AppServer()
const port = 1234;

// A global middleware that will be execute to every incomming request
app.use((req, res,next) => {
    console.log("Hello world")
    req.context["date"] = new Date();
    next();
})

app.get(`/api`, (req, res) => {
    const { query, params, body, headers, context } = req;
    context["server"] = "my-app-server";
    res.status(200).json({ query, params, body, headers, context });
})

// As in express you can call next an that will cut the execution of the middlewares and return an error
app.get(`/endpoind`, (req, res, next) => {
    next(new ServerError(400,"Custom Error",[{message:"Custom error to test"}]))
})

/// But if you have a error without try-catch also will be catched automatic and passed to the error handler
app.post(`/endpoind/:id`, (req, res) => {
    let total = 0;
    for(let i=0;i<100;i++){
        total+=i;
        if(i == 40){
            throw new Error("Custom Error also like this")
        }
    }
    res.status(200).json({ id:req.params.id,sum:total });
})


///////// Custom Error handler
app.setErrorHandler((req, res, error) => {
    console.error("THere is an error: ", error);
    let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
    res.status(code).json({ message: error.message, error: true, meta: error.meta })
})

app.listen(port, () => {
    console.log("Server listening: ", port)
})
```
