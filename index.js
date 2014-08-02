var Eidetic = require('eidetic');
var cachestore = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

var queues = {};

module.exports.cacheSeconds = function(ttl) {

  return function(req, res, next) {
    var self = this;
    var cache = cachestore.get(req.path);
    res.original_send = res.send;

    // returns the value immediately
    if (cache) {
      res.send(cache);
      return;
    }

    if (!queues[req.path]) {
      queues[req.path] = [];
    }

    // first request will get rendered output
    if (queues[req.path].length === 0
      && queues[req.path].push(function noop(){})) {

      res.send = function (string) {
        var body = string instanceof Buffer ? string.toString() : string;
        cachestore.put(req.url, body, ttl);
        
        // drain the queue so anyone else waiting for
        // this value will get their responses.
        var subscriber = null;
        while (subscriber = queues[req.path].shift()) {
          if (subscriber) {
            process.nextTick(subscriber);
          }
        }
        res.original_send(body);
      };

      next();
    // subsequent requests will batch while the first computes
    } else {
      queues[req.path].push(function() {
        var body = cachestore.get(req.path);
        res.send(body);
      });
    }

  }

};
