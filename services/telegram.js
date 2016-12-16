'use strict'

var request = require('request-promise')

var https = require('../lib/https')
var utils = require('../lib/utils')
var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var SERVICE_NAME = 'telegram'
var TELEGRAM_TOKEN = secrets.telegram.token

function processEvent (ev) {
  return _parsesMessages(ev.body)
    .then(messages => Object.assign({}, ev, {
      messages,
      response: { status: 'ok' },
    }))
}

function _parsesMessages (body) {
  return https.parseJson(body)
    .then(_formatMessages)
}

function _formatMessages (json) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: String(json.message.from.id),
    text: json.message.text,
    timestamp: json.message.date,
  }]
}

function sendMessage (serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, _sendTelegramText)
}

function _sendTelegramText (userId, message) {
  var body = {
    chat_id: userId,
    text: message,
  }

  return _makeRequest('/sendMessage', body)
}

function _makeRequest (endpoint, body) {
  var options = {
    url: `https://api.telegram.org/bot${TELEGRAM_TOKEN}${endpoint}`,
    method: 'POST',
    body,
    json: true,
  }

  return request(options)
    .then(response => response)
    .catch(e => {
      throw new Error(e.message)
    })
}

module.exports = {
  processEvent,
  sendMessage,
}
