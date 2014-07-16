var Eidetic = require('eidetic');
var redis = require('redis');
var localcache = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

function RouteCache(port, host, password) {
  if(host) {
      this.useRedis = true;
      var options = {};
      if (password) {
        options = {auth_pass: password};
      }
      this.redisClient = redis.createClient(port, host, options); 
  }
}

RouteCache.prototype.useRedis = false;

RouteCache.prototype.cacheSeconds = function(seconds) {
  return this.cache(seconds);
};

RouteCache.prototype.cacheSet = function(cacheKey, body, ttl) {
  if(this.useRedis) {
    this.redisClient.set(cacheKey, body);
    this.redisClient.expire(cacheKey, ttl);
  }
  else {
    localcache.put(cacheKey, body, ttl);
  }
};

RouteCache.prototype.cacheGet = function(cacheKey, callback) {
  if(this.useRedis) {
    this.redisClient.get(cacheKey, function(err, reply) {
        callback(err, reply);
    });
  }
  else {
    var cache = localcache.put(cacheKey, body, ttl);
    callback(null, cache);
  }
};

RouteCache.prototype.cache = function(ttl) {
  var self = this;

  return function(req, res, next) {
    var cacheKey ='route_'+ req.url;

    self.cacheGet(cacheKey, function(err, reply) {
      if (reply) {
        res.send(reply);
      } else {
        var send = res.send;
        res.send = function(string) {
          var body = string instanceof Buffer ? string.toString() : string;
          self.cacheSet(cacheKey, body, ttl);
          send.call(this, body);
        };
        next();
      }
    });
  };
};


module.exports = RouteCache;