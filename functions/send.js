'use strict'

var messageHandler = require('../messageHandler')
var https = require('../lib/https')

var sender = require('./sender')

var analytics = require('../lib/analytics')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

module.exports.handler = (event, context, callback) => {
  var messages = sender.parse(event)

  return Promise.all(messages.map(handleOutgoing))
    .then(out => {
      var response = sender.formatResponse(out)
      return callback(null, response)
    })
    .catch(error => {
      console.log(error)
      return callback(error)
    })
}

function handleOutgoing(message) {
  return https.parseJson(message)
    .then(messageHandler.parseOutgoing)
    .then(sendMessage)
    .catch(e => handleError(e, message))
    .then(analytics.logToAnalytics)
}

function sendMessage(message) {
  var name = message.service_name

  if (secrets[name] && !secrets[name].enabled) {
    throw new Error('Service disabled: ' + name)
  }

  var service = getService(name)

  if (!service) {
    throw new Error('Unknown service: ' + name)
  }

  return service.sender(message.service_user_id, message.text)
    .then(response => Object.assign({}, message, { response }))
}

function handleError(error, message) {
  console.log('Error processing message: ', message)
  console.log(error.message, error.stack)

  var errorParams = { error: error.message }
  var message = Object.assign({}, message, errorParams)

  return sendMessage(message)
}
