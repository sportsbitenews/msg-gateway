'use strict'

var getService = require('../services')

var analytics = require('../lib/analytics')
var messageHandler = require('../messageHandler')
var sns = require('../lib/sns')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

module.exports.handler = (event, context, callback) => {
  _normalizeEvent(event)
    .then(_processEvent)
    .then(_handleMessages)
    .then(_formatResponse)
    .then(result => callback(null, result.response))
    .catch(e => {
      console.log(e)
      callback(e)
    })
}

function _normalizeEvent(event) {
  var path = event.pathParameters
  var body = event.body
  var service_name = path.service_name
  var method = event.method || event.httpMethod
  var query = event.queryStringParameters || event.query

  if (secrets[service_name] && !secrets[service_name].enabled) {
    return Promise.reject(new Error('Service disabled: ' + service_name + '.'))
  }

  return Promise.resolve({
    body,
    path,
    query,
    method,
    service_name,
  })
}

// our router
function _processEvent(ev) {
  var serviceName = ev.service_name
  var service = getService(serviceName)

  if (!service) {
    throw new Error('Unknown service: ' + serviceName + '.')
  }

  return service.receiver(ev)
}

function _handleMessages(ev) {
  if (!Array.isArray(ev.messages)) {
    console.log('will not handle messages for event:', ev)
    return ev
  }

  return Promise.all(ev.messages.map(_handleMessage))
    .then(messages => Object.assign({}, ev, {
      messages,
    }))
}

function _handleMessage(msg) {
  return _processThroughMsgHandler(msg)
    .then(_publishToSns)
    .then(analytics.logToAnalytics.bind(analytics, 'incoming'))
    .catch(error => {
      console.log('Error processing message:', error, msg)
      return Object.assign({}, msg, {
        error,
      })
    })
}

function _formatResponse(ev) {
  if (!ev.response) {
    throw new Error('Missing response for event:', ev)
  }

  var contentType = ev.service_name === 'twilio' ? 'application/xml' : 'application/json'
  var body = typeof ev.response === 'object' ? JSON.stringify(ev.response) : ev.response

  var response = {
    body,
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
    },
  }

  return Object.assign({}, ev, {
    response,
  })
}

// parse message using our custom message handler
function _processThroughMsgHandler(msg) {
  return messageHandler.parseIncoming(msg)
}

function _publishToSns(msg) {
  var shouldPublishToSNS = secrets.sns && secrets.sns.enabled

  if (!shouldPublishToSNS) {
    return msg
  }

  return sns.publishReceivedMessage(msg, 'msgGateway-receivedMsg')
    .then(snsReceipt => Object.assign({}, msg, {
      snsReceipt,
    }))
}
