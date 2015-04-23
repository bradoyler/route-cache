var Eidetic = require('eidetic');
var cacheStore = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

var queues = {};
var redirects = {};

module.exports.cacheSeconds = function(ttl) {

  return function(req, res, next) {
    var key = req.originalUrl;
    if (redirects[key]) return res.redirect(redirects[key]);

    var cache = cacheStore.get(key);
    res.original_send = res.send;
    res.original_redirect = res.redirect;

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
        if (res.statusCode < 400) cacheStore.put(key, body, ttl);

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

      // If response happens to be a redirect -- store it to redirect all
      // subsequent requests.
      res.redirect = function(string) {
        var body = string instanceof Buffer ? string.toString() : string;
        redirects[key] = body;
        res.original_redirect(body);
      };

      next();
      // subsequent requests will batch while the first computes
    } else {
      queues[key].push(function() {
        var body = cacheStore.get(key);
        res.send(body);
      });
    }

  }

};

module.exports.cacheStore = cacheStore;
