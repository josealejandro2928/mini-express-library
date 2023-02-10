# mini-express-server

A minimal web server implementation based on express architecture uses only built-in node modules like path, http, http2, and fs. The core class is `AppServer`, which creates an instance of Server calling createServer from `node:http` and can create a server that implements a http2.0 protocol using `node:http2`. It listens to incoming requests and, based on the request method (GET, POST, PUT, DELETE). If the method is not supported, the Server returns a 405 status code with a "Not allowed" response.

- [mini-express-server](#mini-express-server)
  - [installation](#installation)
  - [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Definig multiples middlewares](#definig-multiples-middlewares)
    - [Error Handling](#error-handling)
    - [Static files Server](#static-files-server)
      - [Stackblitz example of serving static files from different sources](#stackblitz-example-of-serving-static-files-from-different-sources)
  - [Router](#router)
  - [Http2 Server](#http2-server)
  - [Benchmarking](#benchmarking)
    - [Basic api setup for mini-express-server and express](#basic-api-setup-for-mini-express-server-and-express)
    - [Commands executed for the tests](#commands-executed-for-the-tests)
    - [Table of metrics](#table-of-metrics)
      - [Results for experiment one](#results-for-experiment-one)
      - [Results for experiment two](#results-for-experiment-two)
    - [Benchmarking with autocannon](#benchmarking-with-autocannon)
      - [mini-express-server](#mini-express-server-1)
      - [koa](#koa)
      - [express](#express)
  - [Git Hub Examples](#git-hub-examples)
  - [AppServer](#appserver)
  - [Stackblitz example of basic API](#stackblitz-example-of-basic-api)

## installation

```sh
npm i mini-express-server --save
```

The implementation maintains the same architecture of express, where you can configure several middlewares for every route. Also, you can register global middlewares. See the example in Typescript

## Usage

### Basic usage

```TypeScript
import AppServer, { IRequest, IResponse } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');
const helmet = require("helmet");
const cors = require('cors')
const { jsonParser } = require("./middlewares");

const port: number = +(process?.env?.PORT || 1234);

///////You can use morgan middleware for logging as in express ////////
app.use(morgan('dev'));
app.use(cors()); // Using the popular cors
app.use(helmet()); // Using the popular helmet
app.use(jsonParser); // Using a custom body parser for incoming request (The express classic body-parser is not compatible)

app.get('/', (req: IRequest, res: IResponse) => {
  console.log('Hello World');
  return res.status(200).text('Hola mundo');
});

app.get('/api', (req, res) => {
  const { query, params, body, headers } = req;
  res.status(200).json({ query, params, body, headers });
});

app.listen(port, (address: any) => {
  console.log('Server listening on: ', address);
});

```

### Definig multiples middlewares

```TypeScript
...
/// Declaring middlewares /////////
const midd1: IMiddleware = (req: IRequest, res: IResponse, next) => {
  req.context.date = new Date();
  next();
};
const midd2: IMiddleware = (req: IRequest, res: IResponse, next) => {
  req.context.user = { name: 'Example', token: '454as54d5' };
  next();
};

app.get('/', midd1, (req: IRequest, res: IResponse) => {
  console.log('Hello World');
  return res.status(200).text('Hello World');
});

app.get('/api', midd1, midd2, (req, res) => {
  const { query, params, body, headers, context } = req;
  console.log(context);
  res.status(200).json({ query, params, body, headers, context });
});
....
```

**Example of console.log when we hit the endpoint "/api" in the above example**

<img height="70" src="https://user-images.githubusercontent.com/37028825/216784743-e9b7285b-df58-41a3-ae08-4ace5b84487b.png" />

### Error Handling

By default, the library catches all the errors inside the middleware and passes them to an internal global error handler, where the error message is returned to the client. Also, as in express, you can give the `next` function the object representing the error.

```TypeScript
import AppServer, { IMiddleware, IRequest, IResponse, ServerError } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');
const port: number = +(process?.env?.PORT || 1234);

app.use(morgan('dev'));

app.get(`/error/1`, (req, res, next) => {
  next(new ServerError(400, 'Custom Error', [{ message: 'Custom error to test' }]));
});

app.get(`/error/2`, async (req, res, next) => {
  let asyncOp = new Promise((_, reject) => {
    setTimeout(() => {
      reject('There was an error');
    }, 1000);
  });
  await asyncOp;
});

app.listen(port, (address: any) => {
  console.log('Server listening on: ', address);
});
```

**You can configure your custom Error handler**

```TypeScript
import AppServer, { IMiddleware, IRequest, IResponse, ServerError } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');
const port: number = +(process?.env?.PORT || 1234);

app.use(morgan('dev'));

app.get(`/error/1`, (req, res, next) => {
  next(new ServerError(400, 'Custom Error', [{ message: 'Custom error to test' }]));
});

app.get(`/error/2`, async (req, res, next) => {
  let asyncOp = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new ServerError(429, 'Too many requests', [
          'To many request for this user',
          'Clean cookies',
        ])
      );
    }, 1000);
  });
  await asyncOp;
});

///////// Custom Error handler //////////////////////////////
app.setErrorHandler((req, res, error) => {
  console.error('There is an error: ', error.message);
  let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
  res.status(code).json({ message: error.message, error: true, meta: error.meta });
});

app.listen(port, (address: any) => {
  console.log('Server listening on: ', address);
});
```

**Example response when we hit the endpoint "/error/2" in the above example**

![res-2](https://user-images.githubusercontent.com/37028825/216784872-6f158c4d-62a3-4e48-bc9b-a5e6d0d559c6.png)

### Static files Server

The `mini-express-server` also can serve static files and is quite similar to express. But here, using the method `setStatic`. The example below shows how to set different endpoints for serving static files.

```TypeScript
import AppServer, { IMiddleware, IRequest, IResponse, ServerError } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');
import path from 'node:path';

const port: number = +(process?.env?.PORT || 1234);

app.use(morgan('dev'));

...
/// first the endpoint for static files, the other the root path of the directory that contain the files
app.setStatic('/static', path.join(__dirname, '..', 'public'));
app.setStatic('/storage', path.join(__dirname, '..', 'storage'));
...

app.listen(port, (address: any) => {
  console.log('Server listening on: ', address);
});

```

#### Stackblitz example of serving static files from different sources

[https://stackblitz.com/edit/node-u2qygg?file=index.js](https://stackblitz.com/edit/node-u2qygg?file=index.js)

## Router

Since version 1.0.8, we have introduced the class Router that allows the creation of modular, mountable route handlers. A Router instance is a complete middleware and routing system. With that, you can split your app logic, enabling the separation of concerns and improving the modularity of your app.
Here an example of creation of CRUD operation over a class USER

```javascript
const { Router, ServerError } = require("mini-express-server");
const { authorizationMidd } = require("../middlewares");
const { User } = require("../models");

const router = new Router(); /// Creating a instance of Router class

///////// Custom middleware to get the user by the param :/userId ///////////
const userByIdMiddleware = async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.getUserById(userId);
  if (!user) throw new ServerError(404, `User with id=${userId} not found, try with other id`);
  req.context.user = user;
  next();
};

router.get("/", async (req, res) => {
  let users = await User.getListUsers();
  res.status(200).json({ data: users });
});

router.get("/:userId", userByIdMiddleware, async (req, res) => {
  res.status(200).json({ data: req.context.user });
});

router.post("/", async (req, res) => {
  let data = req.body;
  let newUser = await User.createUser(data.name, data.lastName, data.age);
  res.status(201).json({ data: newUser });
});

router.put("/:userId", userByIdMiddleware, async (req, res) => {
  let user = req.context.user;
  let data = req.body;
  user = await User.editUser(user);
  res.status(201).json({ data: user });
});

router.delete("/:userId", authorizationMidd, async (req, res) => {
  if (req.loggedUser.id != req.params.userId) {
    throw new ServerError(403, "Not allowed", ["you can edit other users"]);
  }
  let user = req.loggedUser;
  await User.deleteUser(user.id);
  res.status(200).json({ status: "Ok" });
});

module.exports = router;
```

In the main file fo your app you only have to do this:

```javascript
...
const app = new AppServer();
const userRouter = require("./routes/user.js");
const port = 1234;
...
app.use("/api/user", userRouter);

```

## Http2 Server

The constructor of the class AppServer can receive an options object where you can pass through the createServer function, and you can configure here options like:

```yaml
keepAlive: true // default value
connectionsCheckingInterval: 30000 // default value
keepAliveInitialDelay: 0 // default value
keepAliveTimeout: 5000 // default value
maxHeaderSize: 16384 // default value
noDelay: true // default value
httpVersion: "HTTP1" //default value
```

In order to create a server with http2.0 protocol, you only have to pass the corresponding configuration; see the example below:

```JavaScript
const { AppServer } = require("../build/cjs/index");
const app = new AppServer({ httpVersion: "HTTP2" })


app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "GET" })
})

app.post("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "POST", body: JSON.parse(req.body) })
})

app.put("/", (req, res) => {
    res.status(200).json({ message: "Hello from server", method: "PUT", body: JSON.parse(req.body) })
})

app.get("/api", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})
app.get("/api/:param1", (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})

app.listen(8000, (address) => {
    console.log("Server listening: ", address)
})
```

All the previous features the AppServer has will remain for the new server configuration; it only changes the protocol. You can use the router, the middlewares etc.
also for testing this server the package provides a fetchClient http 2.0, see the example below:

```JavaScript
const { fetchHttp2 } = require("mini-express-server");

async function main() {
    const API_HOST = "http://127.0.0.1:8000"
    try {

        let res = await fetchHttp2(API_HOST);
        let data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        // Response on res:  { message: 'Hello from server', method: 'GET' }

        res = await fetchHttp2(API_HOST, {
            method: "POST",
            body: JSON.stringify({ name: "Jose", age: 27, date: new Date() }),
        });
        data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        /**
        Response on res:  {
                message: 'Hello from server',
                method: 'POST',
                body: { name: 'Jose', age: 27, date: '2023-02-10T13:30:51.992Z' }
            }
        */
        res = await fetchHttp2(API_HOST, {
            relativePath: "/api/exampleFullEndpoint/?limit=10&offset=5&status=enabled",
        })
        data = JSON.parse(res.data);
        console.log("Response on res: ", data);
        /**
         * Response on res:  {
            query: { limit: '10', offset: '5', status: 'enabled' },
            params: { param1: 'exampleFullEndpoint' },
            body: '',
            headers: {
                ':path': '/api/exampleFullEndpoint/?limit=10&offset=5&status=enabled',
                ':method': 'GET',
                ':authority': '127.0.0.1:8000',
                ':scheme': 'http'
            }
        }
         */

    } catch (e) {
        console.log("Error: ", e);
    }
}

main();
```

## Benchmarking

We perform stress tests on an example API and compare it to express. We used the apache tool ab (Server benchmarking tool), and in the following setup, we got better results than ExpressJs.
The setup in which we made the tests is two endpoints where one returns a JSON object with the params, body, query, and header. The other return web pages in a dynamic parameter pass in the route.

### Basic api setup for mini-express-server and express

```JavaScript

...
const app = new AppServer()
const port = 1234;

app.use(morgan("common"));
app.use(cors());
app.use(helmet());
app.use(jsonParser);

app.get(`/api`, (req, res) => {
    const { query, params, body, headers } = req;
    res.status(200).json({ query, params, body, headers });
})

//////////////////////////// RENDER WEB PAGE //////////////////////////
//////////////////Configuring the static route//////////////////////
app.setStatic("/api/web/static", path.join(__dirname, ".", "static"))

app.get(`/api/web/:page/`, (req, res, next) => {
    let page = req.params.page;
    let pagesRootPath = path.resolve("src", "pages");
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
///////////////////////////////////////////////////////////////////////////////
app.setErrorHandler((req, res, error) => {
    console.error("THere is an error: ", error);
    let code = error.code && !isNaN(parseInt(error.code)) ? error.code : 500;
    res.status(code).json({ message: error.message, error: true, meta: error.meta })
})

app.listen(port, () => {
    console.log("Server listening: ", port)
})
```

### Commands executed for the tests

```sh
ab -k -c 350 -n 10000 "http://127.0.0.1:1234/api?param1=12" // our custom web server
ab -k -c 350 -n 10000 "http://127.0.0.1:1235/api?param1=12" // the same express api
```

The above command executes 10000 requests with a concurrency up to 350.

**Result for our custom web server**:

<img height=350 src="https://user-images.githubusercontent.com/37028825/216785473-95abdace-e39e-4796-9618-477ed9f23661.png"/>

**Result for express**:

<img height=350 src="https://user-images.githubusercontent.com/37028825/216785602-fe366848-17f1-45e6-8599-8e38ccb8c7b5.png"/>

### Table of metrics

#### Results for experiment one

| Web server library  | Time taken for the test | request per second (mean) | time per request (mean) | long request |
| ------------------- | ----------------------- | ------------------------- | ----------------------- | ------------ |
| mini-express-server | **3.525 sec**           | **2837.19 #/sec**         | **123.362 ms**          | **180 ms**   |
| express             | 4.137 sec               | 2417.42                   | 144.783 ms              | 271 ms       |

In addition, we modified the test suit, introducing a for loop to set 1000 routes in both web server implementations, and re-ran the test.

```JavaScript
//////stressing the api//////////////
for (let i = 0; i < 1000; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
//////////////////////////////////////
```

#### Results for experiment two

| Web server library  | Time taken for the test | request per second (mean) | time per request (mean) | long request |
| ------------------- | ----------------------- | ------------------------- | ----------------------- | ------------ |
| mini-express-server | **3.488 sec**           | **2866.72 #/sec**         | **122.091 ms**          | **251 ms**   |
| express             | 6.304 sec               | 1586.24                   | 220.647 ms              | 397 ms       |

As you can appreciate in the results, the mini-express-server library beat the express library running the described test. Saving in the worsts case (where the API had more than 1000 endpoints) **100 ms in time per request**, **146 ms in the long request**, having half of the time for completing the test and increasing the capacity of requests per second to **1300** more than express.

### Benchmarking with autocannon

In an example api configuration like:

```JavaScript
// mini-express-server
const { AppServer } = require("mini-express-server");
const { generateRouteRandom } = require("../utils.js");

const app = new AppServer();
const port = 3000;

////////// Generate a lot of random routes ///////////////
for (let i = 0; i < 100; i++) {
    app.get(generateRouteRandom("api", 3), (req, res) => {
        return res.json({ hello: 'world' });
    })
}

for (let i = 0; i < 100; i++) {
    app.get(generateRouteRandom("home", 3), (req, res) => {
        return res.json({ hello: 'world' });
    })
}
//////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    return res.json({ hello: 'world' });
})

app.listen(port, (address) => {
    console.log("Server created by library: mini-express-server is listening on port:", address)
})
```

Example for express

```JavaScript
// express
const express = require("express");
const { generateRouteRandom } = require("../utils.js");

const app = express();
const port = 3000;

app.disable('etag')
app.disable('x-powered-by')

////////// Generate a lot of random routes ///////////////
for (let i = 0; i < 100; i++) {
    app.get(generateRouteRandom("api", 3), (req, res) => {
        return res.json({ hello: 'world' });
    })
}

for (let i = 0; i < 100; i++) {
    app.get(generateRouteRandom("home", 3), (req, res) => {
        return res.json({ hello: 'world' });
    })
}
//////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    return res.json({ hello: 'world' });
})

app.listen(port, (address) => {
    console.log("Server created by library: express is listening on port:", address)
})
```

```JavaScript
// koa
const Koa = require('koa')
const Router = require('koa-router');
const { generateRouteRandom } = require("../utils.js");
const app = new Koa()

const port = 3000;

////////// Generate a lot of random routes ///////////////
const routerBlok1 = new Router({ prefix: "/" });
const routerBlok2 = new Router({ prefix: "/" });
for (let i = 0; i < 100; i++) {
    routerBlok1.get(generateRouteRandom("api", 3), ctx => {
        ctx.body = { hello: 'world' }
    })
}

for (let i = 0; i < 100; i++) {
    routerBlok2.get(generateRouteRandom("home", 3), ctx => {
        ctx.body = { hello: 'world' }
    })
}
//////////////////////////////////////////////////////////
app.use(routerBlok1.routes());
app.use(routerBlok2.routes());

app.use(ctx => {
    ctx.body = { hello: 'world' }
})

app.listen(port, () => {
    console.log("Server created by library: koaa is listening on port:", port)
})
```

We perform the test using autocannon with the command:

```sh
autocannon -c 100 -d 10 -p 10 localhost:3000
```

**And here the results**:

#### mini-express-server

<img src="https://user-images.githubusercontent.com/37028825/218147868-47ce03a2-ab20-48bd-b058-2b454d395d22.png" height="250"/>

#### koa

<img src="https://user-images.githubusercontent.com/37028825/218147926-eaf49bd0-5a96-4b18-84c0-c3ee866e4b2b.png" height="250"/>

#### express

<img src="https://user-images.githubusercontent.com/37028825/218147983-d406ff2b-29da-4743-9c56-9aaa1cee6d1f.png" height="250"/>

## Git Hub Examples

Here you can find more examples of using `mini-express-server`
[https://github.com/josealejandro2928/examples-mini-express-server](https://github.com/josealejandro2928/examples-mini-express-server)

## AppServer

The main class for the AppServer that creates the HTTP server and routes requests to the appropriate handlers.

**Properties**

- `httpServer`: An instance of the Node.js `Server` class or `null` or `undefined`.

- `port`: The port number the server will listen to. Default is 8888.

- `mapGetHandlers`: An instance of the `RoutesTrie` class for handling GET requests.

- `mapPostHandlers`: An instance of the `RoutesTrie` class for handling POST requests.

- `mapPutHandlers`: An instance of the `RoutesTrie` class for handling PUT requests.

- `mapDeleteHandlers`: An instance of the `RoutesTrie` class for handling DELETE requests.

- `globalMiddlewares`: An array of `IMiddleware` objects for global middlewares.

- `staticRouteMap`: An object of type `StaticRouteMap` for storing the static route mapping.

- `customErrorHandler`: A function for custom error handling.

**Methods of AppServer Class**

- **listen(port, cb?)**

  Starts the HTTP server and listens for incoming requests on the specified port. The default port is 8888. A cb will be called once the server starts successfully

  Parameters

  - `port`: The port number the server will listen to.
  - `cb`: A callback function that will be called once the server starts successfully

- **get(route: string, route: string, ...cbs: IMiddleware[])**

  Registers a route for handling GET requests.

  Parameters

  - `route`: The string representation of the route.
  - `cbs`: An array of functions or middleware functions for handling the GET request.

- **post(route: string, route: string, ...cbs: IMiddleware[])**

  Registers a route for handling POST requests.

  - Parameters
    - `route`: The string representation of the route.
    - `cbs`: An array of functions or middleware functions for handling the POST request.

- **put(route: string, route: string, ...cbs: IMiddleware[])**

  Registers a route for handling PUT requests.

  - Parameters

    - `route`: The string representation of the route.
    - `cbs`: An array of functions or middleware functions for handling the PUT request.

- **delete(route: string, route: string, ...cbs: IMiddleware[])**
  Registers a route for handling DELETE requests.

  - Parameters
    - `route`: The string representation of the route.
    - `cbs`: An array of functions or middleware functions for handling the DELETE request.

- **use(middleware: IMiddleware)**

  Registers a middleware for all requests.

  - Parameters
    - `middleware`: An instance of the `IMiddleware` interface for the middleware.

- **use(route:String ,middleware: IMiddleware)**

  Registers a middleware for a spesific route.

  - Parameters
    - `route`: A path route.
    - `middleware`: An instance of the `IMiddleware` interface for the middleware.

- **setStatic(route: string, pathToStaticDir: string)**

  Registers a static route for serving files.

  - Parameters
    - `route`: The string representation of the route.
    - `pathToStaticDir`: The path to the folder containing the files to be served.

## Stackblitz example of basic API

[https://stackblitz.com/edit/node-mpg9k4?file=index.js](https://stackblitz.com/edit/node-mpg9k4?file=index.js)
