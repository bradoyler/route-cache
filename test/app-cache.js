'use strict';
var request = require('supertest'),
  routeCache = require('../index').config({max:99}),
  express = require('express'),
  assert = require('assert');

var hitIndex = 0;
var noContentIndex = 0;

var app = express();
var agent = request.agent(app);
app.use(routeCache.cacheSeconds(30));

describe('App-level cache:', function () {

  app.get('/app-test', function (req, res) {
    hitIndex++;
    res.send('test hit#'+ hitIndex);
  });

  app.get('/send-buffer', function (req, res) {
    res.type('png');
    res.send(new Buffer('test buffer'+hitIndex));
  });

  app.get('/send-test', function (req, res) {
    hitIndex++;
    res.send('test hit#'+ hitIndex);
  });

  app.get('/test-api', function (req, res) {
    hitIndex++;
    res.json({msg: 'Hit#'+hitIndex});
  });

  app.get('/send-test-204', function (req, res) {
    noContentIndex++;
    res.status(204).send();
  });

  app.get('/test-api-204', function (req, res) {
    noContentIndex++;
    res.status(204).json();
  });

  it('1st res.send', function (done) {
    agent
      .get('/app-test')
      .expect('test hit#1', done);
  });

  it('2nd res.send', function (done) {
    agent
      .get('/app-test')
      .expect('test hit#1', done);
  });

  it('res.send Buffer #1', function (done) {
    agent
      .get('/send-buffer')
      .expect(undefined, done);
  });

  it('res.send Buffer #2', function (done) {
    agent
      .get('/send-buffer')
      .expect(undefined, done);
  });

  it('res.send Buffer #1 Content-type', function (done) {
    agent
      .get('/send-buffer')
      .expect('Content-Type', 'image/png', done);
  });

  it('res.send Buffer #2 Content-type', function (done) {
    agent
      .get('/send-buffer')
      .expect('Content-Type', 'image/png', done);
  });

  it('res.send', function (done) {
    agent
      .get('/send-test')
      .expect('test hit#2', done);
  });

  it('res.json data', function (done) {
    agent
      .get('/test-api')
      .expect({msg: 'Hit#3'}, done);
  });

  it('res.json headers', function (done) {
    agent
      .get('/test-api')
      .expect('Content-Type', /json/).end(function (req, res) {
        setTimeout(function () {
          agent
            .get('/test-api')
            .expect('Content-Type', /json/, done);
        }, 200);
      });
  });

  it('1st send-test-204', function (done) {
    agent
      .get('/send-test-204')
      .expect(204, () => {
        assert.equal(noContentIndex, 1)
        done()
      })
  })

  it('2st send-test-204', function (done) {
    agent
      .get('/send-test-204')
      .expect(204, () => {
        assert.equal(noContentIndex, 1)
        done()
      })
  })

  it('1st test-api-204', function (done) {
    agent
      .get('/test-api-204')
      .expect(204, () => {
        assert.equal(noContentIndex, 2)
        done()
      })
  })

  it('2st test-api-204', function (done) {
    agent
      .get('/test-api-204')
      .expect(204, () => {
        assert.equal(noContentIndex, 2)
        done()
      })
  })
});
