// mocha -R list test/json
'use strict';
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express');

var hitIndex = 0;

var app = express();
var agent = request.agent(app);
app.use(routeCache.cacheSeconds(30));

describe('res.json caching', function () {

  app.get('/test-json', function (req, res) {
    hitIndex++;
    res.json({msg: 'Hit#'+hitIndex});
  });

  app.get('/test-null-json', function (req, res) {
    res.json(null);
  });

  it('res.json null body', function (done) {
    agent
      .get('/test-null-json')
      .expect('Content-Length', '4')
      .expect(null, done);
  });

  it('res.json data', function (done) {
    agent
      .get('/test-json')
      .expect('Content-Length', '15')
      .expect({msg: 'Hit#1'}, done);
  });

  it('res.json data', function (done) {
    agent
      .get('/test-json')
      .expect('Content-Length', '15')
      .expect({msg: 'Hit#1'}, done);
  });

  it('res.json headers', function (done) {
    agent
      .get('/test-json')
      .expect('Content-Type', /json/).end(function (req, res) {
        setTimeout(function () {
          agent
            .get('/test-json')
            .expect('Content-Type', /json/, done);
        }, 200);
      });
  });

});
