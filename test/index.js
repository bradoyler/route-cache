/* globals decribe */
'use strict'
const request = require('supertest')
const routeCache = require('../index')
const express = require('express')

let testindex = 0
let paramTestindex = 0
let testindexRemove = 0

describe('# RouteCache middleware test', function () {
  const app = express()

  app.get('/hello', routeCache.cacheSeconds(1), function (req, res) {
    testindex++
    res.send('Hello ' + testindex)
  })

  app.get('/hello/1', routeCache.cacheSeconds(1), function (req, res) {
    res.send('Hello/1')
  })

  app.get('/hello/:num([0-9])', routeCache.cacheSeconds(1), function (req, res) {
    res.send('Hello param:' + req.params.num)
  })

  app.get('/500', routeCache.cacheSeconds(10), function (req, res) {
    res.status(500).send('Internal server error: ' + Math.random())
  })

  app.get('/redirect-to-hello', routeCache.cacheSeconds(1), function (req, res) {
    res.redirect('/hello')
  })

  app.get('/301-redirect-to-hello', routeCache.cacheSeconds(1), function (req, res) {
    res.redirect(301, '/hello')
  })

  app.get('/302-redirect-to-hello', routeCache.cacheSeconds(1), function (req, res) {
    res.redirect(302, '/hello')
  })

  app.get('/hello-remove', routeCache.cacheSeconds(3600), function (req, res) {
    testindexRemove++
    res.send('Hello remove ' + testindexRemove)
  })

  app.get('/hello-api', routeCache.cacheSeconds(3600), function (req, res) {
    res.json({msg: 'Hello'})
  })

  const agent = request.agent(app)

  it('1st Hello', function (done) {
    agent
      .get('/hello')
      .expect('Hello 1', done)
  })

  it('2nd Hello', function (done) {
    agent
      .get('/hello')
      .expect('Hello 1', done)
  })

  it('1st Hello w/ param', function (done) {
    agent
      .get('/hello/1')
      .expect('Hello/1', done)
  })

  it('2nd Hello w/ param', function (done) {
    agent
      .get('/hello/2')
      .expect('Hello param:2', done)
  })

  it('1st Redirect to hello', function (done) {
    agent
      .get('/redirect-to-hello')
      .expect(302, /\/hello/, done)
  })

  it('2nd Redirect to hello', function (done) {
    agent
      .get('/redirect-to-hello')
      .expect(302, /\/hello/, done)
  })

  it('301 Redirect to hello', function (done) {
    agent
      .get('/301-redirect-to-hello')
      .expect(301, /\/hello/, done)
  })

  it('~ delayed 301 Redirect to hello', function (done) {
    setTimeout(function () {
      agent
        .get('/301-redirect-to-hello')
        .expect(301, /\/hello/, done)
    }, 1200)
  })

  it('~ delayed 302 Redirect to hello', function (done) {
    setTimeout(function () {
      agent
        .get('/redirect-to-hello')
        .expect(302, /\/hello/, done)
    }, 1200)
  })

  it('Explicit 302 Redirect to hello', function (done) {
    agent
      .get('/302-redirect-to-hello')
      .expect(302, /\/hello/, done)
  })

  it('~ delayed: Hello 2', function (done) {
    setTimeout(function () {
      agent
        .get('/hello')
        .expect('Hello 2', done)
    }, 1200)
  })

  it('Hello test with param', function (done) {
    agent
      .get('/hello?a=1')
      .expect('Hello 3', done)
  })

  it("Error states don't get cached", function (done) {
    let message

    agent.get('/500').expect(500).end(function (req, res) {
      message = res.text

      agent.get('/500').expect(500).end(function (req, res) {
        if (message == res.text) return done(Error('Got same error message as before'))
        done()
      })
    })
  })

  it('test removeCache', function (done) {
    agent
      .get('/hello-remove')
      .expect('Hello remove 1').end(function (req, res) {
      setTimeout(function () {
        agent
          .get('/hello-remove')
          .expect('Hello remove 1').end(function (req, res) {
          routeCache.removeCache('/hello-remove')

          agent
            .get('/hello-remove')
            .expect('Hello remove 2', done)
        })
      }, 1200)
    })
  })

  it('res.json headers', function (done) {
    agent
      .get('/hello-api')
      .expect('Content-Type', /json/).end(function (req, res) {
      setTimeout(function () {
        agent
          .get('/hello-api')
          .expect('Content-Type', /json/, done)
      }, 200)
    })
  })
})
