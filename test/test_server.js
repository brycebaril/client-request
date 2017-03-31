"use strict"

module.exports = start

var http = require("http")
var https = require("https")
var url = require("url")
var assert = require("assert")
var concat = require("../concat")
var fs = require("fs")
var path = require("path")
var cert = fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.crt.pem"))
var key = fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.key.pem"))
var ca = fs.readFileSync(path.join(__dirname, 'certs', 'server', 'my-root-ca.crt.pem'))

var util = require("util")
var debug = function noop() {}
if (util.debuglog != null) {
  debug = util.debuglog("client-request")
}

function start(callback) {

  var count = 0
  function onListen() {
    if (++count == 2) {
      done()
    }
  }

  // start the servers
  var httpServer = http.createServer(middleware)
  httpServer.listen(onListen)
  var secureOptions = {
    cert: cert,
    key: key,
    ca: ca
  }
  var secureServer = https.createServer(secureOptions, middleware)
  secureServer.listen(onListen)

  httpServer.unref()
  secureServer.unref()

  function done() {
    debug("TEST SERVERS STARTED")
    var servers = {
      http: httpServer,
      http_address: "http://localhost:" + httpServer.address().port,
      https: secureServer,
      https_address: "https://local.ldsconnect.org:" + secureServer.address().port
    }
    servers.stop = function stop() {
      debug("stopping test servers")
      httpServer.close()
      secureServer.close()
    }

    callback(servers)
  }
}

function middleware(req, res) {
  var parsed = url.parse(req.url)
  var path = parsed.path
  var method = req.method
  if (method == "POST") {
    var jsonCollect = function jsonCollect(contents) {
      var data
      try {
        data = JSON.parse(contents.toString())
      }
      catch (e) {
        debug("bad json")
        res.statusCode = 503
        return res.end("NOPE -- bad JSON")
      }
      if (data.test == "data") {
        debug("good json")
        res.statusCode = 201
        res.end(JSON.stringify({cool: "beans"}))
      }
      else {
        debug("unexpected content")
        res.statusCode = 503
        res.end("NOPE -- unexpected content")
      }
    }

    var collect = function collect(contents) {
      if (contents.toString() == "test data") {
        debug("good post data")
        res.statusCode = 201
        res.end("OK")
      }
      else {
        debug("bad post data")
        res.statusCode = 503
        res.end("NOPE")
      }
    }

    if (path.indexOf(".json") >= 0) {
      return req.pipe(concat(jsonCollect))
    }
    return req.pipe(concat(collect))
  }


  if (path.indexOf("redirect.json") >= 0) {
    debug("redirect.json")
    res.statusCode = 301
    res.setHeader('location', '/redirect-fake.json')
    return res.end()
  }
  if (path.indexOf("bad.json") >= 0) {
    debug("bad.json")
    return res.end('{"some":"bad json')
  }
  if (path.indexOf(".json") >= 0) {
    debug("good .json")
    return res.end(JSON.stringify({some: "good json"}))
  }
  if (path.indexOf("slow") >= 0) {
    debug("slow -- setting timeout")
    return setTimeout(function onTimeout() {
      debug("slow replying")
      res.end("SLOW REPLY")
    }, 50)
  }
  debug("default GET")
  return res.end("HELLO THERE")
}
