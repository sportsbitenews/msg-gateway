'use strict'

var https = require('../../lib/https')

function parseSNS(event) {
  var messages = event['Record'].map(rec => rec['Sns']['Message'])

  return Promise.all(messages.map(http.parseJson))
}

function parseHTTP(event) {
  var message = event['body']

  return https.parseJson(message)
    .then(res => [res])
}

function formatResponse(response) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  }
}

module.exports = {
  parse: function eventParser(event) {
    if (event['Records']) return parseSNS(event)
    if (event['body']) return parseHTTP(event)

    return Promise.reject(new Error('Can\'t determine event source.'))
  },
  formatResponse
}
