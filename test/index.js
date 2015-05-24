var test = require("tape")

var request = require("../request")
var spigot = require("stream-spigot")
var fs = require("fs")
var path = require("path")

var ca = fs.readFileSync(path.join(__dirname, "certs", "client", "my-root-ca.crt.pem"))

require("./test_server")(function ready(servers) {
  test("basic", function (t) {
    var opts = {
      uri: servers.http_address
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.ok(Buffer.isBuffer(body), "body is a Buffer")
      t.equal(body.toString(), "HELLO THERE", "expected content")
      t.end()
    })
  })

  test("get json", function (t) {
    var opts = {
      uri: servers.http_address + "/foo.json",
      json: true
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.deepEqual(body, {some: "good json"}, "expected content")
      t.end()
    })
  })

  test("bad json", function (t) {
    var opts = {
      uri: servers.http_address + "/bad.json",
      json: true
    }
    request(opts, function (err, response, body) {
      t.ok(err, "expect an error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.notOk(body, "no body")
      t.end()
    })
  })

  test("timeout", function (t) {
    var opts = {
      uri: servers.http_address + "/slow",
      timeout: 10
    }
    request(opts, function (err, response, body) {
      t.ok(err, "expect an error")
      t.equal(err.message, "client request timeout", "correct error message")
      t.notOk(response.statusCode, "no statusCode (timed out)")
      t.notOk(body, "no body")
      t.end()
    })
  })

  test("post string", function (t) {
    var opts = {
      uri: servers.http_address,
      method: "POST",
      body: "test data"
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.equal(body.toString(), "OK")
      t.end()
    })
  })

  test("post buffer", function (t) {
    var opts = {
      uri: servers.http_address,
      method: "POST",
      body: new Buffer("test data")
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.equal(body.toString(), "OK")
      t.end()
    })
  })

  test("post object", function (t) {
    var opts = {
      uri: servers.http_address + "/post.json",
      method: "POST",
      body: {test: "data"},
      json: true
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.deepEqual(body, {cool: "beans"})
      t.end()
    })
  })

  test("post stream", function (t) {
    var opts = {
      uri: servers.http_address,
      method: "POST",
      body: spigot(["te", "st", " ", "da", "ta"])
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.deepEqual(body.toString(), "OK")
      t.end()
    })
  })

  test("https basic", function (t) {
    var opts = {
      uri: servers.https_address,
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.ok(Buffer.isBuffer(body), "body is a Buffer")
      t.equal(body.toString(), "HELLO THERE", "expected content")
      t.end()
    })
  })

  test("https get json", function (t) {
    var opts = {
      uri: servers.https_address + "/foo.json",
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.deepEqual(body, {some: "good json"}, "expected content")
      t.end()
    })
  })

  test("https bad json", function (t) {
    var opts = {
      uri: servers.https_address + "/bad.json",
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.ok(err, "expect an error")
      t.equal(response.statusCode, 200, "statusCode 200")
      t.notOk(body, "no body")
      t.end()
    })
  })

  test("https timeout", function (t) {
    var opts = {
      uri: servers.https_address + "/slow",
      timeout: 10,
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.ok(err, "expect an error")
      t.equal(err.message, "client request timeout", "correct error message")
      t.notOk(response.statusCode, "no statusCode (timed out)")
      t.notOk(body, "no body")
      t.end()
    })
  })

  test("https post string", function (t) {
    var opts = {
      uri: servers.https_address,
      method: "POST",
      body: "test data",
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.equal(body.toString(), "OK")
      t.end()
    })
  })

  test("https post buffer", function (t) {
    var opts = {
      uri: servers.https_address,
      method: "POST",
      body: new Buffer("test data"),
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.equal(body.toString(), "OK")
      t.end()
    })
  })

  test("https post object", function (t) {
    var opts = {
      uri: servers.https_address + "/post.json",
      method: "POST",
      body: {test: "data"},
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.deepEqual(body, {cool: "beans"})
      t.end()
    })
  })

  test("https post stream", function (t) {
    var opts = {
      uri: servers.https_address,
      method: "POST",
      body: spigot(["te", "st", " ", "da", "ta"]),
      ca: ca,
      agent: false
    }
    request(opts, function (err, response, body) {
      t.notOk(err, "no error")
      t.equal(response.statusCode, 201, "statusCode 201")
      t.deepEqual(body.toString(), "OK")
      t.end()
    })
  })
})
