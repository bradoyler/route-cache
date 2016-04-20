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

    var value = cacheStore.get(key);

    if (value) {
      // returns the value immediately
      if (value.isJson) {
        res.json(value.body);
      } else {
        res.send(value.body);
      }
      return;
    }

    res.original_send = res.send;
    res.original_json = res.json;
    res.original_redirect = res.redirect;

    if (!queues[key]) {
      queues[key] = [];
    }

    // first request will get rendered output
    if (queues[key].length === 0
      && queues[key].push(function noop(){})) {

      var didHandle = false;

      function rawSend(data, isJson) {
        didHandle = true;

        var body = data instanceof Buffer ? data.toString() : data;
        if (res.statusCode < 400) cacheStore.put(key, { body: body, isJson: isJson }, ttl);

        // drain the queue so anyone else waiting for
        // this value will get their responses.
        var subscriber = null;
        while (subscriber = queues[key].shift()) {
          if (subscriber) {
            process.nextTick(subscriber);
          }
        }

        if (isJson) {
          res.original_json(body);
        } else {
          res.original_send(body);
        }
      }

      res.send = function (data) {
        if (didHandle) {
          res.original_send(data);
        } else {
          rawSend(data, false);
        }
      };

      res.json = function (data) {
        rawSend(data, true);
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
        var value = cacheStore.get(key) || {};
        if (value.isJson) {
          res.json(value.body);
        } else {
          res.send(value.body);
        }
      });
    }

  }

};


module.exports.removeCache = function(url) {
  if (redirects[url])
    delete redirects[url];
  cacheStore.del(url);
};


module.exports.cacheStore = cacheStore;
