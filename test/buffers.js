'use strict';
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express');

var hitIndex = 0;

var app = express();
var agent = request.agent(app);
app.use(routeCache.cacheSeconds(30));

describe('Buffers', function () {

  app.get('/send-buffer', function (req, res) {
    res.send(new Buffer('Test Buffer'));
  });

  app.get('/send-png', function (req, res) {
    res.type('png');
    res.send(new Buffer('test PNG'));
  });

  app.get('/send-gif', function (req, res) {
    res.type('gif');
    res.send(new Buffer('test GIF...'));
  });

  // TEST -----------

  it('Send Buffer', function (done) {
    agent
      .get('/send-buffer')
      .expect('Content-Length', '11')
      .expect('Content-Type', 'application/octet-stream')
      .expect(undefined, done);
  });

  it('Send PNG (Buffer) #1', function (done) {
    agent
      .get('/send-png')
      .expect('Content-Length', '8')
      .expect('Content-Type', 'image/png')
      .expect(undefined, done);
  });

  it('Send PNG (Buffer) #2', function (done) {
    agent
      .get('/send-png')
      .expect('Content-Length', '8')
      .expect('Content-Type', 'image/png')
      .expect(undefined, done);
  });

  it('Send GIF', function (done) {
    agent
      .get('/send-gif')
      .expect('Content-Length', '11')
      .expect('Content-Type', 'image/gif')
      .expect(undefined, done);
  });

});
