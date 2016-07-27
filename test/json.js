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

  it('res.json data', function (done) {
    agent
      .get('/test-json')
      .expect({msg: 'Hit#1'}, done);
  });

  it('res.json data', function (done) {
    agent
      .get('/test-json')
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
