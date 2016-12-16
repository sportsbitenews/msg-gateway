'use strict'

var https = require('../lib/https')
var getGateway = require('../gateway')
var analytics = require('../lib/analytics')
var messageHandler = require('../messageHandler')

var gateway = getGateway({
  analytics,
  parser: messageHandler,
})

module.exports.handler = (event, context, callback) => {
  _parseMessagesFromEvent(event)
    .then(gateway.sender.handleMessages)
    .then(gateway.sender.formatResponse)
    .then(res => callback(null, res))
    .catch(e => {
      console.log(e)
      callback(e)
    })
}

// Extract message from the event. two possible event sources are SNS and HTTP.
// We need to inspect the event contents to determine which one it's from and parse them accordingly.
function _parseMessagesFromEvent(event) {
  // TODO: there's gotta be a better way to determine the event source
  if (event['Records']) {
    return _parseSnsEvent(event)
  } else if (event['body']) {
    return _parseHttpEvent(event)
  } else {
    return Promise.reject(new Error("Can't determine event source"))
  }
}

function _parseSnsEvent(event) {
  var messages = event['Records'].map(r => r['Sns']['Message'])

  return Promise.all(messages.map(https.parseJson))
}

function _parseHttpEvent(event) {
  var message = event['body']

  return https.parseJson(message)
    .then(res => [res])
}
