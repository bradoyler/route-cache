'use strict'
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express'),
  assert = require('assert')

var hitIndex = 0

var app = express()

function getCacheKey(req, res) {
  return req.url + '|cookie=' + req.headers.cookie
}

app.get('/hello/dynamicCacheKey', routeCache.cacheSeconds(1, getCacheKey), function (req, res) {
  hitIndex++
  res.send('Hello dynamicCacheKey#' + hitIndex)
})

var agent = request.agent(app)

describe('cacheKey as a callback', function () {
  it('1st dynamic cacheKey', function (done) {
    agent
      .get('/hello/dynamicCacheKey')
      .set('Cookie', 'cookie=yep')
      .expect('Hello dynamicCacheKey#1', done)
  })

  it('2st dynamic cacheKey', function (done) {
    agent
      .get('/hello/dynamicCacheKey')
      .set('Cookie', 'cookie=yep')
      .expect('Hello dynamicCacheKey#1', done)
  })

  it('3rd dynamic cacheKey', function (done) {
    agent
      .get('/hello/dynamicCacheKey')
      .set('Cookie', 'cookie=nope')
      .expect('Hello dynamicCacheKey#2', done)
  })
})
