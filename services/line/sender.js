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

  return makeViberRequest('/v2/bot/message/push', body)
}

function makeViberRequest(endpoint, body) {
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
      throw new Error(e.message)
    })
}
