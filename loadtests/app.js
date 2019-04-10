// app.js
var express = require('express')
var routeCache = require('./../index')

var CACHE_TTL = 20
var HIT_CNT = 1 // for debugging back-pressure valve

if (process.argv[3]) {
  if (isNaN(process.argv[3])) {
    CACHE_TTL = 'disabled'
  } else {
    CACHE_TTL = parseInt(process.argv[3])
  }
}

console.warn('>> CACHE_TTL:', CACHE_TTL)

// --> routes.js
var router = express.Router()

router.get('/', function (req, res, next) {
  setTimeout(function () {
    var dd = new Date()
    console.log('>>> Route Hit:', HIT_CNT++, dd)
    res.send('Route Hit ' + HIT_CNT + ', ' + dd)
  }, 900)
})

router.get('/redirect', function (req, res, next) {
  setTimeout(() => {
    console.log('>>> Redirect Route Hit:', HIT_CNT++, new Date())
    res.redirect('/dest')
  }, 900)
})

// <<< routes.js

// app.js
var app = express()
// app.use(logger('dev'))

app.use(routeCache.cacheSeconds(CACHE_TTL))
app.use('/', router)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    console.log('>>', err)
    res.status(err.status || 500)
    res.json({
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  console.log('>>', err)
  res.status(err.status || 500)
  res.json({
    message: err.message,
    error: {}
  })
})

// Boot app (web.js)
// var debug = require('debug')('http')
var http = require('http')

var port = 3000
app.set('port', port)
var server = http.createServer(app)
server.listen(port)
server.on('listening', onListening)
server.on('error', onError)

function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  // debug('Listening on ' + bind)

  console.log('>> Listening on ' + bind)
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}
