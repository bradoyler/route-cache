'use strict'
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express')

var paramTestIndex = 0

describe('Params / Querystrings', function () {
  var app = express()

  app.get('/params', routeCache.cacheSeconds(1, '/params-test'), function (req, res) {
    paramTestIndex++
    res.send('Params test ' + paramTestIndex)
  })

  var agent = request.agent(app)

  it('without params', function (done) {
    agent
      .get('/params')
      .expect(200)
      .expect('Params test 1', done)
  })

  it('with a=1', function (done) {
    agent
      .get('/params?a=1')
      .expect(200)
      .expect('Params test 1', done)
  })

  it('with a=2', function (done) {
    agent
      .get('/params?a=2')
      .expect(200)
      .expect('Params test 1', done)
  })
})
