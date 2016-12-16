'use strict'

var getGateway = require('../gateway')
var analytics = require('../lib/analytics')
var messageHandler = require('../messageHandler')

var gateway = getGateway({
  analytics,
  parser: messageHandler,
})

module.exports.handler = (event, context, callback) => {

  gateway.receiver.normalizeEvent(event)
    .then(gateway.receiver.processEvent)
    .then(gateway.receiver.formatMessagesResponse)
    .then(result => callback(null, result.response))
    .catch(e => {
      console.log(e)
      callback(e)
    })
}
