'use strict'
const LruStore = require('./lruStore')
const debug = require('debug')('route-cache')
const queues = Object.create(null)

const defaults = {
  max: 64 * 1000000, // ~64mb
  length: function (n, key) {
    if (n && n.body && typeof n.body === 'string') {
      return n.body.length
    }
    return 1
  },
  maxAge: 200 // deletes stale cache older than 200ms
}
let cacheStore = new LruStore(defaults)

module.exports.config = function (opts) {
  if (opts) {
    const storeOpts = Object.assign({}, defaults)
    if (opts.max) {
      storeOpts.max = opts.max
    }

    if (opts.cacheStore) {
      cacheStore = opts.cacheStore
    } else {
      cacheStore = new LruStore(storeOpts)
    }
    module.exports.cacheStore = cacheStore
  }
  return this
}

function drainQueue (key) {
  if (!queues[key]) return
  debug('drainQueue:', key)
  const queue = queues[key]
  delete queues[key]
  while (queue.length > 0) {
    const subscriber = queue.shift()
    process.nextTick(subscriber)
  }
}

function resolveCacheKey (req, res, cacheKey) {
  if (typeof cacheKey === 'function') {
    return cacheKey(req, res)
  }
  if (typeof cacheKey === 'string') {
    return cacheKey
  }
  return req.originalUrl
}

async function tryServeFromCache (key, res, sendEmptyOnMiss) {
  const redirectKey = await cacheStore.get('redirect:' + key)
  if (redirectKey) {
    res.redirect(redirectKey.status, redirectKey.url)
    return true
  }

  const cachedValue = await cacheStore.get(key)
  if (!cachedValue && !sendEmptyOnMiss) {
    return false
  }

  const value = cachedValue || {}
  debug(sendEmptyOnMiss ? '>> queued hit:' : 'hit!!', key)
  if (value.contentType) res.set('Content-Type', value.contentType)
  const status = value.status || 200
  if (value.isJson) {
    res.status(status).json(value.body)
  } else {
    res.status(status).send(value.body)
  }
  return true
}

module.exports.cacheSeconds = function (secondsTTL, cacheKey) {
  const ttl = secondsTTL * 1000
  return function (req, res, next) {
    if (secondsTTL < 0) { return next() }
    const key = resolveCacheKey(req, res, cacheKey)
    // Allow skipping the cache
    if (!key) { return next() }

    tryServeFromCache(key, res, false).then((handledByCache) => {
      if (handledByCache) return

      const originalSend = res.send
      const originalEnd = res.end
      const originalJson = res.json
      const originalRedirect = res.redirect

      if (!queues[key]) {
        queues[key] = []
      }

      // first request will get rendered output
      if (queues[key].length === 0) {
        debug('miss:', key)
        queues[key].push(function noop () {})

        let didHandle = false

        res.once('close', function () {
          if (!didHandle) {
            drainQueue(key)
          }
        })

        function rawSend (data, isJson) {
          debug('rawSend', typeof data, data ? data.length : 0)
          didHandle = true

          // pass-through for Buffer - not supported
          if (Buffer.isBuffer(data)) {
            drainQueue(key)
            res.set('Content-Length', data.length)
            return originalSend.call(res, data)
          }

          if (res.statusCode < 400) {
            Promise.resolve(cacheStore.set(key, {
              status: res.statusCode,
              body: data,
              isJson,
              contentType: res.getHeader('Content-Type')
            }, ttl)).catch((err) => debug('cacheStore.set error:', err))
          }

          // send this response to everyone in the queue
          drainQueue(key)

          if (isJson) {
            debug('res.original_json')
            return originalJson.call(res, data)
          }
          debug('res.original_send')
          return originalSend.call(res, data)
        }

        res.send = function (data) {
          if (didHandle) {
            return originalSend.call(res, data)
          }
          return rawSend(data, false)
        }

        res.end = function (...args) {
          didHandle = true
          drainQueue(key)
          return originalEnd.apply(res, args)
        }

        res.json = function (data) {
          if (didHandle) {
            return originalJson.call(res, data)
          }
          return rawSend(data, true)
        }

        // If response happens to be a redirect -- store it to redirect all subsequent requests.
        res.redirect = function (url) {
          let address = url
          let status = 302

          // allow statusCode for 301 redirect. See: https://github.com/expressjs/express/blob/master/lib/response.js#L857
          if (arguments.length === 2) {
            if (typeof arguments[0] === 'number') {
              status = arguments[0]
              address = arguments[1]
            } else {
              debug('res.redirect(url, status): Use res.redirect(status, url) instead')
              status = arguments[1]
            }
          }

          didHandle = true
          Promise.resolve(cacheStore.set('redirect:' + key, { url: address, status }, ttl))
            .catch((err) => debug('cacheStore.set error:', err))
          drainQueue(key)
          return originalRedirect.call(res, status, address)
        }

        next()
      // subsequent requests will batch while the first computes
      } else {
        debug(key, '>> has queue.length:', queues[key].length)
        queues[key].push(function () {
          tryServeFromCache(key, res, true).catch(next)
        })
      }
    }).catch(next)
  }
}

module.exports.removeCache = function (url) {
  return Promise.all([
    cacheStore.del('redirect:' + url),
    cacheStore.del(url)
  ])
}

module.exports.clearCache = function () {
  return cacheStore.clear()
}

module.exports.cacheStore = cacheStore
