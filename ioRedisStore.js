'use strict'

const debug = require('debug')('route-cache')

// This store is designed to work with https://github.com/luin/ioredis
class IoRedisStore {
  constructor (redisClient) {
    this.client = redisClient
  }

  async get (key) {
    debug('get: ' + key)
    return this.client.get(key).then((val) => {
      if (val === null) return val
      return JSON.parse(val)
    })
  }

  // Value must be a json-serializable object.
  async set (key, value, ttlMillis) {
    debug('set: ' + key)
    return this.client.set(key, JSON.stringify(value), 'PX', ttlMillis)
  }

  async del (key) {
    debug('del: ' + key)
    return this.client.del(key)
  }
}

module.exports = IoRedisStore
