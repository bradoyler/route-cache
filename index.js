var Eidetic = require('eidetic');
var cachestore = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

module.exports.cacheSeconds = function(ttl) {

  return function(req, res, next) {

    var cache = cachestore.get(req.path);

    if (cache) {
      res.send(cache);
    } else {
      var send = res.send;
      res.send = function(string) {
        var body = string instanceof Buffer ? string.toString() : string;
        cachestore.put(req.url, body, ttl);
        send.call(this, body);
      };
      next();
    }
  }
};
