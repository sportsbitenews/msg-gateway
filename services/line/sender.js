'use strict'

var request = require('request-promise')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var CHANNEL_TOKEN = config.channel_access_token

module.exports = function lineSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendLineMessage)
}

function sendLineMessage(userId, message) {
  var body = {
    to: userId,
    messages: [{
      text: message,
      type: 'text',
    }],
  }

  return makeLineRequest('/v2/bot/message/push', body)
}

function makeLineRequest(endpoint, body) {
  var options = {
    url: `https://api.line.me${endpoint}`,
    method: 'POST',
    body,
    json: true,
    headers: {
      Authorization: `Bearer ${CHANNEL_TOKEN}`,
    },
  }

  return request(options)
    .then(response => response)
    .catch(e => {
      let message = e.message

      if (e.error && e.error.message) {
        message = e.error.message
      }

      throw new Error(message)
    })
}
