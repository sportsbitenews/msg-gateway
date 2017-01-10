'use strict'

var https = require('../../lib/https')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

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
  var stringBody = JSON.stringify(body)
  var options = {
    hostname: `api.line.me`,
    path: endpoint,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.channel_access_token}`,
      'Content-Type': 'application/json',
      'Content-Length': stringBody.length,
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
