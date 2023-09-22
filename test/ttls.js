// mocha -R list test/no-cache
'use strict';
var request = require('supertest'),
  routeCache = require('../index'),
  express = require('express'),
  assert = require('assert');

var app = express();
var agent = request.agent(app);

describe('TTL:', function () {

  context('disabled (-1)', function () {
    var hitIndex = 0;
    var noContentIndex = 0;

    app.get('/cache-disabled', routeCache.cacheSeconds(-1), function (req, res) {
      hitIndex++;
      res.send('test hit#'+ hitIndex);
    });

    app.get('/cache-disabled-204', routeCache.cacheSeconds(-1), function (req, res) {
      noContentIndex++;
      res.status(204).send();
    });

    it('Should get Hit #1', function (done) {
      agent
        .get('/cache-disabled')
        .expect(200)
        .expect('test hit#1', done);
    });

    it('Should get Hit #2 (after nextTick)', function (done) {

      process.nextTick(function () {
        agent
          .get('/cache-disabled')
          .expect(200)
          .expect('test hit#2', done);
      });
    });

    it('Should noContentIndex is 1', function (done) {
      agent
        .get('/cache-disabled-204')
        .expect(204, () => {
          assert.equal(noContentIndex, 1)
          done()
        })
    });

    it('Should noContentIndex is 2 (after nextTick)', function (done) {

      process.nextTick(function () {
        agent
          .get('/cache-disabled-204')
          .expect(204, () => {
            assert.equal(noContentIndex, 2)
            done()
          })
      });
    });

  })

  context('zero', function () {
    var hitIndex = 0;
    var noContentIndex = 0;

    app.get('/cache-zero', routeCache.cacheSeconds(0), function (req, res) {
      hitIndex++;
      res.send('test hit#'+ hitIndex);
    });

    app.get('/cache-zero-204', routeCache.cacheSeconds(0), function (req, res) {
      noContentIndex++;
      res.status(204).send();
    });

    it('Should get Hit #1', function (done) {
      agent
        .get('/cache-zero')
        .expect(200)
        .expect('test hit#1', done);
    });

    it('Should get Hit #1 (after nextTick)', function (done) {

      process.nextTick(function () {
        agent
          .get('/cache-zero')
          .expect(200)
          .expect('test hit#1', done);
      });
    });

    it('Should get Hit #2 (after 200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-zero')
          .expect(200)
          .expect('test hit#2', done);
      }, 200);
    });

    it('Should noContentIndex is 1', function (done) {
      agent
        .get('/cache-zero-204')
        .expect(204, () => {
          assert.equal(noContentIndex, 1)
          done()
        })
    });

    it('Should noContentIndex is 1 (after nextTick)', function (done) {

      process.nextTick(function () {
        agent
          .get('/cache-zero-204')
          .expect(204, () => {
            assert.equal(noContentIndex, 1)
            done()
          })
      });
    });

    it('Should noContentIndex is 2 (after 200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-zero-204')
          .expect(204, () => {
            assert.equal(noContentIndex, 2)
            done()
          })
      }, 200);
    });

  })

  context('1 second:', function () {
    var hitIndex = 0;
    var noContentIndex = 0;

    app.get('/cache-1s', routeCache.cacheSeconds(1), function (req, res) {
      hitIndex++;
      res.send('test hit#'+ hitIndex);
    });

    app.get('/cache-1s-204', routeCache.cacheSeconds(1), function (req, res) {
      noContentIndex++;
      res.status(204).send();
    });

    it('Should get Hit #1', function (done) {
      agent
        .get('/cache-1s')
        .expect(200)
        .expect('test hit#1', done);
    });

    it('Should get Hit #1 (after 200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-1s')
          .expect(200)
          .expect('test hit#1', done);
      }, 300);
    });

    it('Should get Hit #2 (after 1200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-1s')
          .expect(200)
          .expect('test hit#2', done);
      }, 1300);
    });

    it('Should noContentIndex is 1', function (done) {
      agent
        .get('/cache-1s-204')
        .expect(204, () => {
          assert.equal(noContentIndex, 1)
          done()
        })
    });

    it('Should noContentIndex is 1 (after 200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-1s-204')
          .expect(204, () => {
            assert.equal(noContentIndex, 1)
            done()
          })
      }, 300);
    });

    it('Should noContentIndex is 2 (after 1200ms delay)', function (done) {

      setTimeout(function () {
        agent
          .get('/cache-1s-204')
          .expect(204, () => {
            assert.equal(noContentIndex, 2)
            done()
          })
      }, 1300);
    });

  });

});
