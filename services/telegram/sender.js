'use strict'

var https = require('../../lib/https')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var TELEGRAM_TOKEN = config.token

module.exports = function telegramSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendTelegramMessage)
}

function sendTelegramMessage(userId, message) {
  var body = {
    chat_id: userId,
    text: message,
  }

  return makeTelegramRequest('/sendMessage', body)
}

function makeTelegramRequest(endpoint, body) {
  var stringBody = JSON.stringify(body)

  var options = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}${endpoint}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': stringBody.length,
    }
  }

  return https.request(options, stringBody)
    .then(response => response)
    .catch(e => {
      let message = e.message

      if (e.error && e.error.message) {
        message = e.error.message
      }

      throw new Error(message)
    })
}
