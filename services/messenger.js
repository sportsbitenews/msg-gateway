'use strict';

var qs = require('querystring')
var https = require('../lib/https')
var utils = require('../lib/utils')

var SERVICE_NAME = 'messenger'

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var FBVerifyToken = secrets.messenger.verifyToken
var FB_PAGE_ACCESS_TOKEN = secrets.messenger.page_access_token

function processEvent(ev) {
  switch (ev.method) {
    case 'GET':
      return _validate(ev.query)
        .then(response => Object.assign({}, ev, {
          response,
        }))
    case 'POST':
      return _parseMessages(ev.body)
        .then(messages => Object.assign({}, ev, {
          messages,
          response: {
            status: 'ok',
          },
        }))
    default:
      return Promise.reject(new Error('Unsupported messenger method:', ev.method))
  }
}

function _parseMessages(body) {
  return https.parseJson(body)
    .then(_extractEventsFromBody)
    .then(_filterMessageEvents)
    .then(_formatAsMessages)
}

// extract array of events then flatten them to a single array
function _extractEventsFromBody(body) {
  var entries = body.entry || []
  var arrays = entries.map(e => e.messaging)
  var events = [].concat.apply([], arrays) // flatten arrays
  return events
}

function _filterMessageEvents(events) {
  return events.filter(e => (e.message && !e.message.is_echo) || (e.postback && e.postback.payload))
}

function _formatAsMessages(events) {
  return events.map(e => ({
    service_name: SERVICE_NAME,
    service_user_id: e.sender.id.toString(),
    text: e.message ? e.message.text : e.postback.payload,
    timestamp: e.timestamp,
  }))
}

// recursive function. chunks messages and sends them one by one
function sendMessage(serviceUserId, message) {
  if (typeof message === 'string' && message.length > 320) {
    message = utils.makeParagraphs(message, 300, '.')
  }

  if (Array.isArray(message)) {
    return sendMessage(serviceUserId, message[0])
      .then(() => {
        if (message.length > 1) {
          _setTyping(serviceUserId, true)

          var text = message.slice(1)

          setTimeout(function () {
            return sendMessage(serviceUserId, text)
          }, utils.calcuatePauseForText(text[0]))
        }
      })
  }

  return _sendFBMessage(serviceUserId, message)
}

function _sendFBMessage(serviceUserId, text) {
  var body = {
    recipient: {
      id: serviceUserId,
    },
    message: {
      text: text,
    },
  }

  return _makeRequest('/v2.6/me/messages', body)
}

function _setTyping(serviceUserId, isTyping) {
  var body = {
    recipient: {
      id: serviceUserId,
    },
    sender_action: isTyping ? 'typing_on' : 'typing_off',
  }

  return _makeRequest('/v2.6/me/messages', body)
}

function _doSubscribeRequest() {
  return _makeRequest('/v2.6/me/subscribed_apps')
    .then(res => {
      console.log('Subscription result:', res)
    }).catch(e => {
      console.error('Error while subscription:', e)
    })
}

function _validate(query, token) {
  var verifyToken = token || FBVerifyToken
  if (query['hub.mode'] === 'subscribe' && query['hub.verifyToken'] === verifyToken) {
    return _doSubscribeRequest()
      .then(res => {
        console.log('Validating webhook')
        return parseInt(query['hub.challenge'])
      })
  }

  return Promise.reject(new Error("Couldn't verify token"))
}

function _makeRequest(path, body) {
  var querystring = {
    access_token: FB_PAGE_ACCESS_TOKEN,
  }

  var options = {
    hostname: 'graph.facebook.com',
    path: path + '?' + qs.stringify(querystring),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return https.request(options, JSON.stringify(body))
    .then(res => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        return res.json()
      } else {
        console.log(res)
        throw new Error(res.statusMessage)
      }
    })
}

module.exports = {
  processEvent,
  sendMessage,
}
