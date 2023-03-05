'use strict'

const LRU = require('lru-cache')

// This is a simple async wrapper around lru-cache.
class LruStore {
  constructor (defaults) {
    this.lru = new LRU(defaults)
  }

  async get (key) {
    return Promise.resolve(this.lru.get(key))
  }

  async set (key, value, ttl) {
    return Promise.resolve(this.lru.set(key, value, ttl))
  }

  async del (key) {
    return Promise.resolve(this.lru.del(key))
  }
}

module.exports = LruStore
