
/* globals - should, describe, it */
var request = require('supertest'),
    RouteCache = require('../index'),
    express = require('express');

 var app = express();
 var testindex = 0;
 var routeCache = new RouteCache();

 routeCache.on('cache.get', function(key) {
   console.log('cache.get for key: ', key);
 });
 routeCache.on('cache.set', function(key) {
   console.log('cache.set for key: ', key);
 });

describe('# RouteCache middleware test', function(){

  app.get('/hello', routeCache.cacheSeconds(1), function(req, res){
  	 testindex++;
     res.send('Hello ' + testindex);
  });

  app.get('/test', routeCache.cacheSeconds(25), function(req, res){
    res.send('test');
  });

  var agent = request.agent(app);

  it('GET #1: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  });

  it('GET #2: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  });

  it('GET #3: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  });

  it('GET #4 ~ delayed: Hello 2', function(done){
  	setTimeout(function() {
	    agent
	    .get('/hello')
	    .expect('Hello 2', done);
    }, 1200);
  });
});
