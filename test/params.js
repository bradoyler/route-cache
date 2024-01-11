'use strict'
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express'),
  assert = require('assert')

var paramTestIndex = 0
var noContentIndex = 0
var contentTypeIndex = 0

describe('Params / Querystrings', function () {
  var app = express()

  app.get('/params', routeCache.cacheSeconds(1, '/params-test'), function (req, res) {
    paramTestIndex++
    res.send('Params test ' + paramTestIndex)
  })

  app.get('/params-204', routeCache.cacheSeconds(10, '/params-test-204'), function (req, res) {
    noContentIndex++
    res.status(204).send()
  })

  app.get('/params-content-type', routeCache.cacheSeconds(10, '/params-test-content-type'), function (req, res) {
    contentTypeIndex++
    res.set('Content-Type', 'application/xml')
    res.send('<xml><node>This is some content</node></xml>')
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

  it('204 without params', function (done) {
    agent
      .get('/params-204')
      .expect(204, () => {
        assert.equal(noContentIndex, 1)
        done()
      })
  })

  it('204 with a=1', function (done) {
    agent
      .get('/params-204?a=1')
      .expect(204, () => {
        assert.equal(noContentIndex, 1)
        done()
      })
  })

  it('204 with a=2', function (done) {
    agent
      .get('/params-204?a=2')
      .expect(204, () => {
        assert.equal(noContentIndex, 1)
        done()
      })
  })

  it('content-type without params', function (done) {
    agent
      .get('/params-content-type')
      .expect(200, (error, response) => {
        assert.equal(contentTypeIndex, 1)
        assert.equal(response.headers['content-type'], 'application/xml; charset=utf-8')
        assert.equal(response.text, '<xml><node>This is some content</node></xml>')
        done()
      })
  })

  it('content-type with a=1', function (done) {
    agent
      .get('/params-content-type')
      .expect(200, (error, response) => {
        assert.equal(contentTypeIndex, 1)
        assert.equal(response.headers['content-type'], 'application/xml; charset=utf-8')
        assert.equal(response.text, '<xml><node>This is some content</node></xml>')
        done()
      })
  })

  it('content-type with a=2', function (done) {
    agent
      .get('/params-content-type')
      .expect(200, (error, response) => {
        assert.equal(contentTypeIndex, 1)
        assert.equal(response.headers['content-type'], 'application/xml; charset=utf-8')
        assert.equal(response.text, '<xml><node>This is some content</node></xml>')
        done()
      })
  })
})
