var https = require('https')

function parseJson(body) {
  return new Promise((resolve, reject) => {
    if (typeof body === 'object') {
      return resolve(body)
    }

    try {
      resolve(JSON.parse(body))
    } catch (e) {
      reject(e)
    }
  })
}

function request(options, postData) {
  var contentLength = { 'Content-Length': postData.length }
  var headers = Object.assign({}, contentLength, options.headers)
  var mergedOptions = Object.assign({}, options, { headers })

  return new Promise((resolve, reject) => {
    var req = https.request(mergedOptions, res => {
      res.setEncoding('utf8')

      var body = ''

      res.on('data', data => {
        body += data
      })

      res.on('end', () => {
        var response = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: body,
          json: () => parseJson(body),
        }

        resolve(response)
      })
    })

    req.on('error', reject)

    if (postData) {
      req.write(postData)
    }

    req.end()
  })
}

module.exports = {
  request,
  parseJson,
}
