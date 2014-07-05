var Eidetic = require('eidetic');
var cachestore = new Eidetic({
  maxSize: 50,
  canPutWhenFull: true
});

module.exports.cacheSeconds = function(ttl) {

  return function(req, res, next) {

    var cache = cachestore.get(req.path);

    if (cache) {
      console.info('routecache hit');
      res.send(cache);
    } else {
      var send = res.send;
      res.send = function(string) {
        var body = string instanceof Buffer ? string.toString() : string;
        console.info('routecache\'d: ' + req.path, ' length: ' + body.length);
        cachestore.put(req.path, body, ttl);
        send.call(this, body);
      };
      next();
    }
  }
};