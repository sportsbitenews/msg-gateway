'use strict'

var config = require('./token')(process.env.SSERVERLESS_STAGE || 'dev')
var https = require('../../lib/https')
var makeFBRequest = require('./makeFBRequest')

var SERVICE_NAME = 'messenger'
var FBVerifyToken = config.verifyToken

module.exports = function twilioReceiver(ev) {
  if (ev.method !== 'GET' && ev.method !== 'POST') {
    return Promise.reject(new Error('Unsupported messenger method:', ev.method))
  }

  if (ev.method === 'GET') {
    return Object.assign({}, ev, {
      response: validate(ev.query),
    })
  }

  return parseMessages(ev.body)
    .then(messages => Object.assign({}, ev, {
      messages,
      response: { status: 'ok' },
    }))
}

function validate(query, token) {
  var verifyToken = token || FBVerifyToken
  if (query['hub.mode'] === 'subscribe' && query['hub.verifyToken'] === verifyToken) {
    return doSubscribeRequest()
      .then(res => {
        console.log('Validating webhook')
        return parseInt(query['hub.challenge'])
      })
  }

  return Promise.reject(new Error("Couldn't verify token"))
}

function doSubscribeRequest() {
  return makeFBRequest('/v2.6/me/subscribed_apps')
    .then(res => {
      console.log('Subscription result:', res)
    }).catch(e => {
      console.error('Error while subscription:', e)
    })
}

function parseMessages(body) {
  return https.parseJson(body)
    .then(json => {
      var events = extractEventsFromBody(json)
      var messageEvents = filterMessageEvents(events)

      return formatAsMessages(messageEvents)
    })
}

function extractEventsFromBody(body) {
  var entries = body.entry || []
  var arrays = entries.map(e => e.messaging)
  var events = [].concat.apply([], arrays) // flatten arrays
  return events
}

function filterMessageEvents(events) {
  return events.filter(e => (e.message && !e.message.is_echo) || (e.postback && e.postback.payload))
}

function formatAsMessages(events) {
  return events.map(e => ({
    service_name: SERVICE_NAME,
    service_user_id: e.sender.id.toString(),
    text: e.message ? e.message.text : e.postback.payload,
    timestamp: e.timestamp,
  }))
}