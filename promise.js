const request = require('./request')

module.exports = function requestPromise(opts) {
  return new Promise(function(resolve, reject) {
    request(opts, function(err, response, body) {
      if (err) {
        reject(err)
      } else if (response.statusCode !== 200) {
        const err = new Error('Status code ' + response.statusCode)
        err.response = response
        err.body = body
        reject(err)
      } else {
        resolve(body)
      }
    })
  })
}
