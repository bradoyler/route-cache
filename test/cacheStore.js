/* globals decribe */
'use strict'
const assert = require('assert')
const express = require('express')
const request = require('supertest')
const routeCache = require('../index')

let testindex = 0

class FakeStore {
  constructor(defaults) {
    this.store = new Map()
  }

  async get(key) {
    return Promise.resolve(this.store.get(key))
  }

  async set(key, value, ttl) {
    this.store.set(key, value)
    return Promise.resolve()
  }

  async del(key) {
    this.store.delete(key)
    return Promise.resolve()
  }
}

describe('# RouteCache customstore test', function () {
  const app = express()
  const cacheStore = new FakeStore()

  app.get('/cacheStore', routeCache.cacheSeconds(1), function (req, res) {
    testindex++
    res.send('CacheStore ' + testindex)
  })

  app.get('/cacheStore/1', routeCache.cacheSeconds(1), function (req, res) {
    res.send('CacheStore/1')
  })

  const agent = request.agent(app)

  before(function () {
    routeCache.config({cacheStore})
  })

  after(function () {
    routeCache.config({})
  })

  it('1st Hello uses custom store', function (done) {
    agent
      .get('/cacheStore')
      .expect(() => {
        assert.equal(cacheStore.store.size, 1)
      })
      .expect('CacheStore 1', done)
  })

  it('2nd Hello uses custom store', function (done) {
    agent
      .get('/cacheStore')
      .expect(() => {
        assert.equal(cacheStore.store.size, 1)
      })
      .expect('CacheStore 1', done)
  })
})
