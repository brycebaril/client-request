'use strict'

var test = require('tape')

var request = require('../request')
var promise = require('../promise')
var concat = require('../concat')
var spigot = require('stream-spigot')
var fs = require('fs')
var path = require('path')
var http = require('http')

var ca = fs.readFileSync(path.join(__dirname, 'certs', 'client', 'my-root-ca.crt.pem'))

require('./test_server')(function ready (servers) {
  test('basic', (t) => {
    var opts = {
      uri: servers.http_address
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.ok(Buffer.isBuffer(body), 'body is a Buffer')
      t.equal(body.toString(), 'HELLO THERE', 'expected content')
      t.end()
    })
  })

  test('promise basic', (t) => {
    var opts = {
      uri: servers.http_address
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 200, 'statusCode 200')
      t.ok(Buffer.isBuffer(result.body), 'body is a Buffer')
      t.equal(result.body.toString(), 'HELLO THERE', 'expected content')
      t.end()
    })
  })

  test('get json', (t) => {
    var opts = {
      uri: servers.http_address + '/foo.json',
      json: true
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.deepEqual(body, { some: 'good json' }, 'expected content')
      t.end()
    })
  })

  test('promise get json', (t) => {
    var opts = {
      uri: servers.http_address + '/foo.json',
      json: true
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 200, 'statusCode 200')
      t.deepEqual(result.body, { some: 'good json' }, 'expected content')
      t.end()
    })
  })

  test('get json, but response has no body', (t) => {
    var opts = {
      uri: servers.http_address + '/redirect.json',
      json: true
    }

    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 301, 'statusCode 301')
      t.end()
    })
  })

  test('promise get json, but response has no body', (t) => {
    var opts = {
      uri: servers.http_address + '/redirect.json',
      json: true
    }

    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 301, 'statusCode 301')
      t.end()
    })
  })

  test('bad json', (t) => {
    var opts = {
      uri: servers.http_address + '/bad.json',
      json: true
    }
    request(opts, (err, response, body) => {
      t.ok(err, 'expect an error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.notOk(body, 'no body')
      t.end()
    })
  })

  test('promise bad json', (t) => {
    var opts = {
      uri: servers.http_address + '/bad.json',
      json: true
    }
    promise(opts).catch((err) => {
      t.ok(err, 'expect an error')
      t.end()
    })
  })

  test('timeout', (t) => {
    var opts = {
      uri: servers.http_address + '/slow',
      timeout: 10
    }
    request(opts, (err, response, body) => {
      t.ok(err, 'expect an error')
      t.equal(err.message, 'client request timeout', 'correct error message')
      t.equal(err.code, 'ECONNRESET', 'correct error code')
      t.notOk(response.statusCode, 'no statusCode (timed out)')
      t.notOk(body, 'no body')
      t.end()
    })
  })

  test('promise timeout', (t) => {
    var opts = {
      uri: servers.http_address + '/slow',
      timeout: 10
    }
    promise(opts).catch((err) => {
      t.ok(err, 'expect an error')
      t.equal(err.message, 'client request timeout', 'correct error message')
      t.equal(err.code, 'ECONNRESET', 'correct error code')
      t.end()
    })
  })

  test('post string', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: 'test data'
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.equal(body.toString(), 'OK')
      t.end()
    })
  })

  test('promise post string', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: 'test data'
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 201, 'statusCode 201')
      t.equal(result.body.toString(), 'OK')
      t.end()
    })
  })

  test('post buffer', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: Buffer.from('test data')
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.equal(body.toString(), 'OK')
      t.end()
    })
  })

  test('promise post buffer', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: Buffer.from('test data')
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 201, 'statusCode 201')
      t.equal(result.body.toString(), 'OK')
      t.end()
    })
  })

  test('post object', (t) => {
    var opts = {
      uri: servers.http_address + '/post.json',
      method: 'POST',
      body: { test: 'data' },
      json: true
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.deepEqual(body, { cool: 'beans' })
      t.end()
    })
  })

  test('promise post object', (t) => {
    var opts = {
      uri: servers.http_address + '/post.json',
      method: 'POST',
      body: { test: 'data' },
      json: true
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 201, 'statusCode 201')
      t.deepEqual(result.body, { cool: 'beans' })
      t.end()
    })
  })

  test('post stream', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: spigot(['te', 'st', ' ', 'da', 'ta'])
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.deepEqual(body.toString(), 'OK')
      t.end()
    })
  })

  test('promise post stream', (t) => {
    var opts = {
      uri: servers.http_address,
      method: 'POST',
      body: spigot(['te', 'st', ' ', 'da', 'ta'])
    }
    promise(opts).then((result) => {
      t.equal(result.response.statusCode, 201, 'statusCode 201')
      t.deepEqual(result.body.toString(), 'OK')
      t.end()
    })
  })

  test('https basic', (t) => {
    var opts = {
      uri: servers.https_address,
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.ok(Buffer.isBuffer(body), 'body is a Buffer')
      t.equal(body.toString(), 'HELLO THERE', 'expected content')
      t.end()
    })
  })

  test('https opts', (t) => {
    var opts = {
      uri: servers.https_address,
      ca: ca,
      agent: false,
      servername: 'notthisserver.com'
    }
    request(opts, (err, response, body) => {
      t.error(err.Error, 'bad servername for this cert')
      t.end()
    })
  })

  test('https get json', (t) => {
    var opts = {
      uri: servers.https_address + '/foo.json',
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.deepEqual(body, { some: 'good json' }, 'expected content')
      t.end()
    })
  })

  test('https bad json', (t) => {
    var opts = {
      uri: servers.https_address + '/bad.json',
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.ok(err, 'expect an error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.notOk(body, 'no body')
      t.end()
    })
  })

  test('https timeout', (t) => {
    var opts = {
      uri: servers.https_address + '/slow',
      timeout: 10,
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.ok(err, 'expect an error')
      t.equal(err.message, 'client request timeout', 'correct error message')
      t.equal(err.code, 'ECONNRESET', 'correct error code')
      t.notOk(response.statusCode, 'no statusCode (timed out)')
      t.notOk(body, 'no body')
      t.end()
    })
  })

  test('https post string', (t) => {
    var opts = {
      uri: servers.https_address,
      method: 'POST',
      body: 'test data',
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.equal(body.toString(), 'OK')
      t.end()
    })
  })

  test('https post buffer', (t) => {
    var opts = {
      uri: servers.https_address,
      method: 'POST',
      body: Buffer.from('test data'),
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.equal(body.toString(), 'OK')
      t.end()
    })
  })

  test('https post object', (t) => {
    var opts = {
      uri: servers.https_address + '/post.json',
      method: 'POST',
      body: { test: 'data' },
      json: true,
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.deepEqual(body, { cool: 'beans' })
      t.end()
    })
  })

  test('https post stream', (t) => {
    var opts = {
      uri: servers.https_address,
      method: 'POST',
      body: spigot(['te', 'st', ' ', 'da', 'ta']),
      ca: ca,
      agent: false
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 201, 'statusCode 201')
      t.deepEqual(body.toString(), 'OK')
      t.end()
    })
  })

  test('using options.agent', (t) => {
    var agent = new http.Agent()
    var agentUsed = false

    agent.createConnectionOriginal = agent.createConnection
    agent.createConnection = function orig (options, callback) {
      agentUsed = true
      return this.createConnectionOriginal(options, callback)
    }

    var opts = {
      uri: servers.http_address,
      agent: agent
    }

    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.ok(Buffer.isBuffer(body), 'body is a Buffer')
      t.equal(body.toString(), 'HELLO THERE', 'expected content')
      t.equal(agentUsed, true, 'expected request to pass through agent')
      t.end()
    })
  })

  test('using options.url', (t) => {
    var opts = {
      url: servers.http_address
    }
    request(opts, (err, response, body) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.ok(Buffer.isBuffer(body), 'body is a Buffer')
      t.equal(body.toString(), 'HELLO THERE', 'expected content')
      t.end()
    })
  })

  test('using options.stream', (t) => {
    var opts = {
      uri: servers.http_address,
      stream: true
    }
    request(opts, (err, response, stream) => {
      t.notOk(err, 'no error')
      t.equal(response.statusCode, 200, 'statusCode 200')
      t.ok(stream.pipe != null && (typeof stream.pipe === 'function'), 'stream quacks like a duck')
      stream.pipe(concat((contents) => {
        t.ok(Buffer.isBuffer(contents), 'contents are a Buffer')
        t.equal(contents.toString(), 'HELLO THERE', 'expected contents')
        t.end()
      }))
    })
  })

  test('stream timeout', (t) => {
    var opts = {
      uri: servers.http_address + '/slow',
      timeout: 10,
      stream: true
    }
    request(opts, (err, response, body) => {
      t.ok(err, 'expect an error')
      t.equal(err.message, 'client request timeout', 'correct error message')
      t.equal(err.code, 'ECONNRESET', 'correct error code')
      t.notOk(response.statusCode, 'no statusCode (timed out)')
      t.notOk(body, 'no body')
      t.end()
    })
  })
})
