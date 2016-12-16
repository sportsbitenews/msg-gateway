'use strict'

var kik = require('../services/kik')
var skype = require('../services/skype')
var twilio = require('../services/twilio')
var telegram = require('../services/telegram')
var messenger = require('../services/messenger')

var analytics = require('../lib/analytics')
var messageHandler = require('../messageHandler')
var sns = require('../lib/sns')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var SERVICES = {
  kik,
  skype,
  twilio,
  telegram,
  messenger,
}

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
  var path = event.pathParameters || event.path
  var service_name = path.service_name
  var body = event.body
  var query = event.queryStringParameters || event.query
  var method = event.method || event.httpMethod

  if (secrets[service_name] && !secrets[service_name].enabled) {
    return _reject('Service disabled: ' + service_name)
  }

  return Promise.resolve({
    path,
    service_name,
    body,
    query,
    method,
  })
}

// our router
function _processEvent(ev) {
  var service_name = ev.service_name

  if (Object.keys(SERVICES).indexOf(service_name) < 0) {
    throw new Error('Unknown service: ' + service_name)
  }

  return SERVICES[service_name].processEvent(ev)
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

function _formatResponse(ev) {
  if (!ev.response) {
    throw new Error('missing response for event:', ev)
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

function _handleMessage(msg) {
  return _processThroughMsgHandler(msg)
    .then(_publishToSns)
    .then(analytics.logToAnalytics)
    .catch(error => {
      console.log('error processing message:', error, msg)
      return Object.assign({}, msg, {
        error,
      })
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

function _reject(errorMsg) {
  console.log(errorMsg)
  return Promise.reject(new Error(errorMsg))
}
