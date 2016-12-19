'use strict'

var analytics = require('../lib/analytics')
var messageHandler = require('../messageHandler')
var sns = require('../lib/sns')

var getService = require('../services')
var receiver = require('./receiver')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

module.exports.handler = (_event, context, callback) => {
  var event = receiver.normalize(_event)
  var service = getService(event.service_name)

  if (!service) throw new Error('Unknown service: ' + event.service_name)

  return service.receiver(event)
    .then(event => {
      if (!Array.isArray(event.messages)) {
        console.log('Will not handle messages for event: ', event)
        return event
      }

      return Promise.all(event.messages.map(handleMessage))
        .then(result => callback(null, result.response))
    })
    .catch(error => {
      console.log(error)
      return callback(error)
    })
}

function handleMessage(msg) {
  return messageHandler.parseIncoming(msg)
    .then(m => {
      var shouldPublish = secrets.sns && secrets.sns.enabled

      if (!shouldPublish) return m

      return sns.publishReceivedMessage(m, 'msgGateway-receivedMsg')
        .then(snsReceipt => {
          var response = Object.assign({}, m, { snsReceipt })

          return analytics.logToAnalytics(response)
            .catch(error => {
              console.log('Error processing message: ', error, m)
              return Object.assign({}, m, { error })
            })
            .then(receipts => receiver.formatResponse(receipts))
        })
    })
}
