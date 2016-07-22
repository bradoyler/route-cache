// mocha -R list test/no-cache
'use strict';
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express');

var hitIndex = 0;

var app = express();
var agent = request.agent(app);
app.use(routeCache.cacheSeconds(0));

describe('Cache disabled:', function () {

  app.get('/no-cache', function (req, res) {
    hitIndex++;
    res.send('test hit#'+ hitIndex);
  });

  it('1st res.send', function (done) {
    agent
      .get('/no-cache')
      .expect(200)
      .expect('test hit#1', done);
  });

  it('2nd res.send (delayed)', function (done) {

    setTimeout(function () {
      agent
        .get('/no-cache')
        .expect(200)
        .expect('test hit#2', done);
    }, 200);
  });

});
