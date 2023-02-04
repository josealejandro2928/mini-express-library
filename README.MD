# mini-express-server

A minimal implementation of a web server based in express architecture using only build-in node modules like path, http, and fs. The core class is `AppServer` that create a instance of Server calling createServer from `node:http`

## installation

```sh
npm i mini-express-server --save
```

The implementation mantain the same architecture of express, where you can configure several middleware for every route. Also you can register global middlewares. See the example in typescript

## Usage

```TypeScript
import AppServer, { IRequest, IResponse } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');

const port: number = +(process?.env?.PORT || 1234);

///////You can use morgan middleware for logging as express ////////
app.use(morgan('dev'));

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

**You can define multiples middlewares**

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
**Example of console.log when we hit the endpoint "/api"**

<img height="70" src="https://user-images.githubusercontent.com/37028825/216784743-e9b7285b-df58-41a3-ae08-4ace5b84487b.png" />

### Error Handling

By default the library catch all the error inside of the middleware and pass them to a internal global error handler where the message of the error is returned back to the client. Also as in express you can passto the next function the object that represent the error.

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
        new ServerError(429, 'Too many requeest', [
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

**Example response when we hit the endpoint "/error/2"**

![res-2](https://user-images.githubusercontent.com/37028825/216784872-6f158c4d-62a3-4e48-bc9b-a5e6d0d559c6.png)


### Static files Server

The mini-express-server also have the capabilities of serving static files and is quite similar with express. Bu here using the method `setStatic`. In the example bellow you can find how to set different endpoint for serving static files

```TypeScript
import AppServer, { IMiddleware, IRequest, IResponse, ServerError } from 'mini-express-server';

const app: AppServer = new AppServer();
const morgan = require('morgan');
import path from 'node:path';

const port: number = +(process?.env?.PORT || 1234);

app.use(morgan('dev'));

...
/// first the endpoint for static files, the other the root path of thte directory that contain the files
app.setStatic('/static', path.join(__dirname, '..', 'public'));
app.setStatic('/storage', path.join(__dirname, '..', 'storage'));
...

app.listen(port, (address: any) => {
  console.log('Server listening on: ', address);
});

```
### Here an example of serving static files from different sources: 
[https://stackblitz.com/edit/node-u2qygg?file=index.js](https://stackblitz.com/edit/node-u2qygg?file=index.js)

## Benchmarking
We perform stress tests on an example API and compare it to express. We used the apache tool ab (server benchmarking tool), and in the following setup, we got better results than ExpressJs.
This is the setup:
bassically two endpoints where one return a json object with the params, body, query and header and the other return web pages

``` JavaScript

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
For the experiments we performed tests like: 
```sh
ab -k -c 350 -n 10000 "http://127.0.0.1:1234/api?param1=12" // our custom web server
ab -k -c 350 -n 10000 "http://127.0.0.1:1235/api?param1=12" // the same express api
```
The above command execute 10000 request with a concurrency until 350 

**Result for  our custom web server**:

<img height=350 src="https://user-images.githubusercontent.com/37028825/216785473-95abdace-e39e-4796-9618-477ed9f23661.png"/>

**Result for  express**:

<img height=350 src="https://user-images.githubusercontent.com/37028825/216785602-fe366848-17f1-45e6-8599-8e38ccb8c7b5.png"/>

|Web server library   | Time taken for the test | request per second (mean) | time per request (mean) | long request | 
|---------------------|-------------------------|---------------------------|-------------------------|--------------|
| mini-express-server | **3.525 sec**           | **2837.19 #/sec**         | **123.362 ms**          | **180 ms**   |
| express             |   4.137 sec             |   2417.42                 |   144.783 ms            |   271 ms     |


Also we made a modification. I introduce a code to set 1000 routes in both api implementation and we ran the test again

``` JavaScript
//////stressing the api//////////////
for (let i = 0; i < 1000; i++) {
    app.get(`/v1/endpoind/${i}`, (req, res) => {
        res.status(200).json({ "message": `Hello: ${i}` });
    })
}
//////////////////////////////////////
```

|Web server library   | Time taken for the test | request per second (mean) | time per request (mean) | long request | 
|---------------------|-------------------------|---------------------------|-------------------------|--------------|
| mini-express-server | **3.488 sec**           | **2866.72 #/sec**         | **122.091 ms**          | **251 ms**   |
| express             |   6.304 sec             |   1586.24                 |   220.647 ms            |   397 ms     |


As you can appreciate in the results, the mini-express-server library beat the express library saving in the worsts case (where the 
API had more than 1000 endpoints) **100 ms in time per request**, **146 ms in the long request**, having half of the time for completing the test
and increase the capacity of requests per second to **1300** more than express.

## Stackblitz example of basic API

[https://stackblitz.com/edit/node-mpg9k4?file=index.js](https://stackblitz.com/edit/node-mpg9k4?file=index.js)
