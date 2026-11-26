'use strict'
const assert = require('assert')
const express = require('express')
const request = require('supertest')
const routeCache = require('../index')

describe('# Issue fixes & edge cases', function () {
  afterEach(function () {
    routeCache.config({})
  })

  it('drains concurrent queued requests for Buffer responses without hanging', function (done) {
    const app = express()
    app.get('/concurrent-buffer', routeCache.cacheSeconds(1), function (req, res) {
      setTimeout(function () {
        res.send(Buffer.from('buf-data'))
      }, 50)
    })

    const agent = request.agent(app)
    let completed = 0
    function onDone (err) {
      if (err) return done(err)
      completed++
      if (completed === 3) done()
    }

    agent.get('/concurrent-buffer').expect(200).end(onDone)
    agent.get('/concurrent-buffer').expect(200).end(onDone)
    agent.get('/concurrent-buffer').expect(200).end(onDone)
  })

  it('forwards cacheStore.get errors to Express error handler instead of hanging', function (done) {
    const failingStore = {
      async get () {
        throw new Error('Redis connection failed')
      },
      async set () {},
      async del () {},
      async clear () {}
    }
    routeCache.config({ cacheStore: failingStore })

    const app = express()
    app.get('/store-error', routeCache.cacheSeconds(10), function (req, res) {
      res.send('ok')
    })
    app.use(function (err, req, res, next) {
      res.status(503).send(err.message)
    })

    request(app)
      .get('/store-error')
      .expect(503, 'Redis connection failed', done)
  })

  it('does not double-cache body key on res.redirect', async function () {
    const stored = new Map()
    const spyStore = {
      async get (key) { return stored.get(key) },
      async set (key, val) { stored.set(key, val) },
      async del (key) { stored.delete(key) },
      async clear () { stored.clear() }
    }
    routeCache.config({ cacheStore: spyStore })

    const app = express()
    app.get('/redir', routeCache.cacheSeconds(10), function (req, res) {
      res.redirect(301, '/target')
    })

    await request(app).get('/redir').expect(301)
    assert.deepStrictEqual(stored.get('redirect:/redir'), { url: '/target', status: 301 })
    assert.strictEqual(stored.has('/redir'), false)
  })

  it('does not permanently mutate defaults when config({ max }) is called', function () {
    routeCache.config({ max: 10 })
    routeCache.config({})
    assert.strictEqual(routeCache.cacheStore.lru.max, 64 * 1000000)
  })

  it('preserves res.end arguments and returns Promises from removeCache/clearCache', async function () {
    const app = express()
    let endCbCalled = false

    app.get('/end-cb', routeCache.cacheSeconds(10), function (req, res) {
      res.end('hello-end', 'utf8', function () {
        endCbCalled = true
      })
    })

    await request(app).get('/end-cb').expect(200, 'hello-end')
    assert.strictEqual(endCbCalled, true)

    await routeCache.removeCache('/end-cb')
    await routeCache.clearCache()
  })

  it('skips cacheStore entirely when secondsTTL < 0', async function () {
    let called = false
    const spyStore = {
      async get () { called = true },
      async set () { called = true },
      async del () {},
      async clear () {}
    }
    routeCache.config({ cacheStore: spyStore })

    const app = express()
    let hits = 0
    app.get('/neg-ttl', routeCache.cacheSeconds(-1), function (req, res) {
      hits++
      res.send('hit-' + hits)
    })

    await request(app).get('/neg-ttl').expect(200, 'hit-1')
    await request(app).get('/neg-ttl').expect(200, 'hit-2')
    assert.strictEqual(called, false)
  })
})
