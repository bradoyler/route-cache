'use strict';
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express');

var hitIndex = 0;

var app = express();
var agent = request.agent(app);
app.use(routeCache.cacheSeconds(30));

describe('res.redirect caching', function () {

  app.get('/dest', function () {
    hitIndex++;
    res.send('redirect ' + hitIndex);
  });

  app.get('/redirect-test', function (req, res) {
    res.redirect('/dest');
  });

  app.get('/301-redirect-test', function (req, res) {
    res.redirect(301, '/dest');
  });

  app.get('/302-redirect-test', function (req, res) {
    res.redirect(302, '/dest');
  });

  it('1st redirect', function (done) {
    agent
      .get('/redirect-test')
      .expect(302, /\/dest/, done);
  });

  it('2nd redirect', function (done) {
    agent
      .get('/redirect-test')
      .expect(302, /\/dest/, done);
  });

  it('1st 301 redirect', function (done) {
    agent
      .get('/301-redirect-test')
      .expect(301, /\/dest/, done);
  });

  it('2nd delayed 301 redirect', function (done) {
    setTimeout(function () {
      agent
        .get('/301-redirect-test')
        .expect(301, /\/dest/, done);
    }, 1200);
  });

  it('Explicit 302 redirect', function (done) {
    agent
      .get('/302-redirect-test')
      .expect(302, /\/dest/, done);
  });

});
