var Eidetic = require('eidetic');
var cachestore = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

var queues = {};

module.exports.cacheSeconds = function(ttl) {

  return function(req, res, next) {
    var key = req.originalUrl;
    var self = this;
    var cache = cachestore.get(key);
    res.original_send = res.send;

    // returns the value immediately
    if (cache) {
      res.send(cache);
      return;
    }

    if (!queues[key]) {
      queues[key] = [];
    }

    // first request will get rendered output
    if (queues[key].length === 0
      && queues[key].push(function noop(){})) {

      res.send = function (string) {
        var body = string instanceof Buffer ? string.toString() : string;
        cachestore.put(key, body, ttl);
        
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
        var body = cachestore.get(key);
        res.send(body);
      });
    }

  }

};
