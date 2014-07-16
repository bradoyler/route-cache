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
      this.client = redis.createClient(port, host, options); 
  }
}

RouteCache.prototype.useRedis = false;

RouteCache.prototype.cacheSeconds = function(seconds) {
  if(this.useRedis) {
    return this.getRedisCache(seconds);
  }
  return this.getCache(seconds);
};

RouteCache.prototype.getRedisCache = function(ttl) {
  var self = this;

  return function(req, res, next) {
    var cacheKey ='route_'+ req.url;

    self.client.get(cacheKey, function(err, reply) {
      if (reply) {
        res.send(reply);
      } else {
        var send = res.send;
        res.send = function(string) {
          var body = string instanceof Buffer ? string.toString() : string;
          self.client.set(cacheKey, body);
          self.client.expire(cacheKey, ttl);
          send.call(this, body);
        };
        next();
      }
    });
  };
};

RouteCache.prototype.getCache = function(ttl) {
  var self = this;

  return function(req, res, next) {
    var cacheKey ='route_'+ req.url;
    var cache = localcache.get(cacheKey);

    if (cache) {
      res.send(cache);
    } else {
      var send = res.send;
      res.send = function(string) {
        var body = string instanceof Buffer ? string.toString() : string;
        localcache.put(cacheKey, body, ttl);
        send.call(this, body);
      };
      next();
    }
  };
};

module.exports = RouteCache;