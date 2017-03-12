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

function getSkippableCacheKey(req, res) {
  if (req.query.skip) { return false }

  return req.url
}

app.get('/hello/skippable', routeCache.cacheSeconds(1, getSkippableCacheKey), function (req, res) {
  hitIndex++
  res.send('Hello skippable#' + hitIndex)
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

  it('should cache 1st skippable cacheKey', function (done) {
    agent
      .get('/hello/skippable')
      .expect('Hello skippable#3', done)
  })

  it('should return cached 2nd skippable cacheKey', function (done) {
    agent
      .get('/hello/skippable')
      .expect('Hello skippable#3', done)
  })

  it('should not cache 3rd skippable cacheKey', function (done) {
    agent
      .get('/hello/skippable?skip=yep')
      .expect('Hello skippable#4', done)
  })

  it('should not cache 4th skippable cacheKey', function (done) {
    agent
      .get('/hello/skippable?skip=yep')
      .expect('Hello skippable#5', done)
  })

})
