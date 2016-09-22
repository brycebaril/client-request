"use strict"

module.exports = request

var http = require("http")
var https = require("https")
var url = require("url")
var path = require("path")

var clientId = require("crypto").randomBytes(3).toString("hex")

var PassThrough = require("stream").PassThrough

var concat = require("./concat")
var util = require("util")
var debug = function noop() {}
if (util.debuglog != null) {
  debug = util.debuglog("client-request")
}

var requestCount = 0

function request(requestOptions, callback) {

  if (requestOptions == null) {
    throw new TypeError("Options parameter is required")
  }
  if (callback == null || (typeof callback != "function")) {
    throw new TypeError("callback is required")
  }

  var requestId = clientId + "-" + requestCount

  var options = formatOptions(requestOptions)
  var transport = http
  if (options.scheme == "https") {
    debug(requestId, "using https transport")
    transport = https
  }

  var body
  var isStream = false
  if (requestOptions.body != null) {
    if (typeof requestOptions.body == "string" || Buffer.isBuffer(requestOptions.body)) {
      debug("Detected simple body")
      body = requestOptions.body
    }
    // Stream duck typing
    else if (requestOptions.body.pipe != null && (typeof requestOptions.body.pipe == "function")) {
      debug("Detected stream body")
      body = requestOptions.body
      isStream = true
    }
    else {
      debug("Detected object body, will JSON-serialize")
      body = JSON.stringify(requestOptions.body)
    }
  }

  var metadata = {}
  var calledBack = false
  function reply(err, response) {
    debug(requestId, "in reply", err, response, calledBack)
    if (calledBack) {
      debug(requestId, "REFUSING TO CALL CALLBACK TWICE")
      return
    }
    calledBack = true
    clearTimeout(totalTimeout)
    debug(requestId, "calling callback err(" + err + ")")
    debug(requestId, "statusCode:", metadata.statusCode)
    debug(requestId, "reply headers:", metadata.headers)
    debug(requestId, "content:", Buffer.isBuffer(response) ? response.toString() : response)
    return callback(err, metadata, response)
  }

  function collect(content) {
    debug(requestId, "in collect")
    if (!requestOptions.json) {
      return reply(null, content)
    }
    try {
      var response = JSON.parse(content)
    }
    catch (e) {
      return reply(e)
    }
    return reply(null, response)
  }

  debug(requestId, "About to send request", options)
  debug(requestId, "calledBack:", calledBack)
  var req = transport.request(options, function onResponse(res) {
    metadata = res
    res.pipe(concat(collect))
    res.once("error", function resError(err) {
      return reply(err)
    })
  })


  var origAbort = req.abort
  req.abort = function abort() {
    clearTimeout(totalTimeout)
    debug(requestId, "aborting request")
    origAbort.call(this)
  }

  var totalTimeout
  if (requestOptions.timeout) {
    totalTimeout = setTimeout(function onTimeout() {
      req.abort()
      var err = new Error("client request timeout")
      return reply(err)
    }, requestOptions.timeout)

    // socket timeout
    req.setTimeout(requestOptions.timeout, function onSocketTimeout() {
      req.abort()
      var err = new Error("Socket Timeout on client request")
      return reply(err)
    })
  }

  req.once("abort", function onAbort() {
    debug(requestId, "ABORT", this.aborted)
  })

  req.once("error", function reqError(err) {
    debug(requestId, "req error event")
    return reply(err)
  })

  if (isStream) {
    debug("sending stream body")
    body.pipe(req)
  }
  else {
    if (body != null) {
      debug(requestId, "data:", body)
      req.write(body)
    }
    req.end()
  }

  requestCount++
  return req
}

function formatOptions(options) {
  var headers = options.headers || {}
  var u = url.parse(options.uri)
  var au = u.auth || options.auth
  if (au) {
      headers.authorization = "Basic " + Buffer(au).toString("base64")
  }

  var protocol = u.protocol || ""
  var iface = protocol === "https:" ? https : http
  var opts = {
      scheme: protocol.replace(/:$/, ""),
      method: options.method || "GET",
      host: u.hostname,
      port: Number(u.port) || (protocol === "https:" ? 443 : 80),
      path: u.path,
      headers: headers,
  }

  if (protocol === 'https:') {
    ["pfx", "key", "cert", "ca", "ciphers", "rejectUnauthorized", "secureProtocol"].forEach(function ea(key) {
      if (options[key]) {
        opts[key] = options[key]
      }
    })
  }

  if (options.agent != null) {
    opts.agent = options.agent
  }

  return opts
}
