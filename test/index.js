
var request = require('supertest'),
    should = require('should'),
    routeCache = require('../index'),
    express = require('express');

 var app = express(); 
 var testindex = 0;

describe('# RouteCache middleware test', function(){
  var app = express();

  app.get('/hello', routeCache.cacheSeconds(1), function(req, res){
  	 testindex++;
     res.send('Hello ' + testindex)
  });

  var agent = request.agent(app);

  it('GET #1: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  })
 
  it('GET #2: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  })

  it('GET #3: Hello 1', function(done){
    agent
    .get('/hello')
    .expect('Hello 1', done);
  })

  it('GET #4 ~ delayed: Hello 2', function(done){
  	setTimeout(function() {
	    agent
	    .get('/hello')
	    .expect('Hello 2', done);
    }, 1200);
  })
})