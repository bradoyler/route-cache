var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Eidetic = require('eidetic');

var queues = {};

function RouteCache(cachestore) {
  if(!cachestore) {
    cachestore = new Eidetic({maxSize: 50, canPutWhenFull: true});
  }
  this.cachestore = cachestore;
}

util.inherits(RouteCache, EventEmitter);

RouteCache.prototype.cacheSeconds = function(ttl) {

  var self = this;

  return function(req, res, next) {
    var key = req.originalUrl;
    var cache = self.cachestore.get(key);
    res.original_send = res.send;

    // returns the value immediately
    if (cache) {
      res.send(cache);
      self.emit('cache.get', key);
      return;
    }

    if (!queues[key]) {
      queues[key] = [];
    }

    // first request will get rendered output
    if (queues[key].length === 0 &&
        queues[key].push(function noop(){})) {

      res.send = function (string) {
        var body = string instanceof Buffer ? string.toString() : string;
        self.cachestore.put(key, body, ttl);
        self.emit('cache.set', key);
        // drain the queue so anyone else waiting for
        // this value will get their responses.
        var subscriber = null;
        while (subscriber = queues[key].shift()) {
          if (subscriber) {
            process.nextTick(subscriber);
          }
        }
        res.original_send(body);
      };

      next();
    // subsequent requests will batch while the first computes
    } else {
      queues[key].push(function() {
        var body = self.cachestore.get(key);
        res.send(body);
      });
    }

  };

};

module.exports = RouteCache;
