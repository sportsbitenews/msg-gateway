'use strict'

const analytics = require('../lib/analytics')

const prefix = 'msgGateway'
const eventParser = parseEvent.bind(null, 'Message')

module.exports.handler = function (snsEvent, context, callback) {
  const errorcb = customResponse.bind(null, callback)
  const successcb = errorcb.bind(null, null)
  const events = parseSnsEvent(snsEvent)
  const messages = events.map(eventParser)

  const requests = events.map((evt, idx) => (
    logit(isOutgoing(evt) ? 'outgoing' : 'incoming', messages[idx]))
  )

  return Promise.all(requests)
    .then(successcb)
    .catch(errorcb)
}

function parseEvent(property, event) {
  return JSON.parse(event[property])
}

function customResponse(callback, err, data) {
  return callback(err, data)
}

function logit(type, msg) {
  return analytics.logToAnalytics(type, msg)
}

function parseSnsEvent(event) {
  return event['Records'].map(record => record['Sns'])
}

function isOutgoing(event) {
  return event['Subject'].endsWith('sendMsg')
}
