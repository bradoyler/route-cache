const request = require('supertest')
const routeCache = require('../index')
const express = require('express')

describe('# res.end compatibility', function () {
  const app = express()

  app.get('/end/no-cache', (req, res) => res.end('res.end no-cache'))
  app.get('/end/1', routeCache.cacheSeconds(4), (req, res) => res.end('res.end 1'))
  app.get('/send/1', routeCache.cacheSeconds(4), (req, res) => res.send('res.send 1'))

  const agent = request.agent(app)

  it('res.end no-cache', function (done) {
    agent
      .get('/end/no-cache')
      .expect('res.end no-cache', done)
  })

  it('res.end Miss', function (done) {
    agent
      .get('/end/1')
      .expect('res.end 1', done)
  })

  it('res.end Hit', function (done) {
    agent
      .get('/end/1')
      .expect('res.end 1', done)
  })

  it('res.send Miss', function (done) {
    agent
      .get('/send/1')
      .expect('res.send 1', done)
  })

  it('res.send Hit', function (done) {
    agent
      .get('/send/1')
      .expect('res.send 1', done)
  })
})
