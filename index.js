'use strict'
var LRU = require('lru-cache')

var queues = {}
var defaults = {
  max: 64 * 1000000, // ~64mb
  length: function (n, key) {
    if (n.body && typeof n.body === 'string') {
      return n.body.length
    }
    return 1
  },
  maxAge: 200 // deletes stale cache older than 200ms
}
var cacheStore = new LRU(defaults)

module.exports.config = function (opts) {
  if (opts && opts.max) {
    defaults.max = opts.max
  }
  cacheStore = new LRU(defaults)
  return this
}

module.exports.cacheSeconds = function (secondsTTL, cacheKey) {
  var ttl = secondsTTL * 1000
  return function (req, res, next) {
    var key = req.originalUrl // default cache key
    if (typeof cacheKey === 'function') {
      key = cacheKey(req, res) // dynamic key
    } else if (typeof cacheKey === 'string') {
      key = cacheKey // custom key
    }

    var redirectKey = cacheStore.get('redirect:' + key)
    if (redirectKey) {
      return res.redirect(redirectKey.status, redirectKey.url)
    }

    var value = cacheStore.get(key)

    if (value) {
      // returns the value immediately
      if (value.isJson) {
        res.json(value.body)
      } else {
        res.send(value.body)
      }
      return
    }

    res.original_send = res.send
    res.original_json = res.json
    res.original_redirect = res.redirect

    if (!queues[key]) {
      queues[key] = []
    }

    var didHandle = false

    function rawSend (data, isJson) {
      // pass-through for Buffer - not supported
      if (typeof data === 'object') {
        if (Buffer.isBuffer(data)) {
          queues[key] = [] // clear queue
          res.set('Content-Length', data.length)
          res.original_send(data)
          return
        }
      }

      didHandle = true
      var body = data instanceof Buffer ? data.toString() : data
      if (res.statusCode < 400) cacheStore.set(key, { body: body, isJson: isJson }, ttl)

      // drain the queue so anyone else waiting for
      // this value will get their responses.
      var subscriber = null
      while (queues[key].length > 0) {
        subscriber = queues[key].shift()
        process.nextTick(subscriber)
      }

      if (isJson) {
        res.original_json(body)
      } else {
        res.original_send(body)
      }
    }

    // first request will get rendered output
    if (queues[key].length === 0) {
      queues[key].push(function noop () {})

      didHandle = false

      res.send = function (data) {
        if (didHandle) {
          res.original_send(data)
        } else {
          rawSend(data, false)
        }
      }

      res.json = function (data) {
        rawSend(data, true)
      }

      // If response happens to be a redirect -- store it to redirect all subsequent requests.
      res.redirect = function (url) {
        delete queues[key]
        var address = url
        var status = 302

        // allow statusCode for 301 redirect. See: https://github.com/expressjs/express/blob/master/lib/response.js#L857
        if (arguments.length === 2) {
          if (typeof arguments[0] === 'number') {
            status = arguments[0]
            address = arguments[1]
          } else {
            console.log('res.redirect(url, status): Use res.redirect(status, url) instead')
            status = arguments[1]
          }
        }

        cacheStore.set('redirect:' + key, {url: address, status: status}, ttl)
        return res.original_redirect(status, address)
      }

      next()
    // subsequent requests will batch while the first computes
    } else {
      queues[key].push(function () {
        var value = cacheStore.get(key) || {}
        if (value.isJson) {
          res.json(value.body)
        } else {
          res.send(value.body)
        }
      })
    }
  }
}

module.exports.removeCache = function (url) {
  cacheStore.del('redirect:' + url)
  cacheStore.del(url)
}

module.exports.cacheStore = cacheStore
