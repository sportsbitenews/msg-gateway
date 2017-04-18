'use strict'

var https = require('../../lib/https')

var utils = require('../../lib/utils')
var config

module.exports = function telegramSender(serviceUserId, message, keyboard) {
  config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

  var messages = utils.chunk(message, 300)
  var send = sendTelegramMessage.bind(null, serviceUserId)

  if (messages.length === 1) {
    return send(messages[0], keyboard)
  }

  var last = messages.slice(-1)
  messages = messages.slice(0, -1)

  return utils.chainPromiseWithArguments(send, messages, utils.calcuatePauseForText)
    .then(() => send(last[0], keyboard))
}

function sendTelegramMessage(userId, message, keyboard) {
  var body = {
    chat_id: userId,
    text: message,
  }

  if (keyboard) {
    body.reply_markup = createKeyboardButtons(keyboard)
  }

  return makeTelegramRequest('/sendMessage', body)
}

function makeTelegramRequest(endpoint, body) {
  var stringBody = JSON.stringify(body)

  var options = {
    hostname: 'api.telegram.org',
    path: `/bot${config.token}${endpoint}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

// TODO: Abstract to be open sourced...
function createKeyboardButtons(buttons) {
  return {
    keyboard: buttons.map(text => [{ text }]),
    one_time_keyboard: true,
  }
}
