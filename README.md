# Route-Cache
Blazing fast :bullettrain_side: Express middleware for route caching with a given TTL (in seconds)

[![Build Status](https://travis-ci.com/bradoyler/route-cache.svg?branch=master)](https://travis-ci.com/bradoyler/route-cache)
[![NPM Version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[![NPM](https://nodei.co/npm/route-cache.png?downloads=true&downloadRank=true)](https://nodei.co/npm/route-cache/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Why?
- makes hard-working routes super-fast, under heavy-load, [see Load Tests](loadtests)
- defend against 'thundering herd'
- supports various content-types
- support for redirects
- allows for conditional caching (per request)
- works with gzip compression

## Install
```sh
npm install route-cache
```

## Test
```sh
npm test
```

## How to use
```javascript
var routeCache = require('route-cache');

// cache route for 20 seconds
app.get('/index', routeCache.cacheSeconds(20), function(req, res){
  // do your dirty work here...
  console.log('you will only see this every 20 seconds.');
  res.send('this response will be cached');
});
```

By default `req.originalUrl` is used as the cache key so every URL is cached separately.

You can set a custom key by passing a second argument to `cacheSeconds`.

```javascript
routeCache.cacheSeconds(20, 'my-custom-cache-key')
```

You can set a dynamic key from the `req` and `res` objects by passing a function.

```javascript
// Cache authenticated and unauthenticated responses separately
routeCache.cacheSeconds(20, function(req, res) {
  return req.originalUrl + '|' + res.locals.signedIn
})
```

If you return `false` the response will not be cached.

```javascript
// Only cache unauthenticated responses
routeCache.cacheSeconds(20, function(req, res) {
  if (res.locals.signedIn) { return false }

  return req.originalUrl
})
```

## Delete a cached route
```javascript
routeCache.removeCache('/index');
```

## Use a distributed cache
```javascript
const Redis = require('ioredis')
const IoRedisStore = require('route-cache/ioRedisStore')


const redisClient = new Redis(6379, '127.0.0.1'))
const cacheStore = new IoRedisStore(redisClient)
routeCache.config({cacheStore})
```

## Future plans / todos
- client-side Cache-Control

------
The MIT License (MIT)

Copyright (c) 2014 Brad Oyler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[npm-image]: https://img.shields.io/npm/v/route-cache.svg
[downloads-image]: http://img.shields.io/npm/dm/route-cache.svg
[npm-url]: https://npmjs.org/package/route-cache
