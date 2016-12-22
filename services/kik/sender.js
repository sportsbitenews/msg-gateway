'use strict'

var request = require('request-promise')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var KIK_USERNAME = config.username
var KIK_API_KEY = config.api_key

module.exports = function kikSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendKikMessage, true)
}

function sendKikMessage(userId, message) {
  var body = {
    messages: [{
      to: userId,
      body: message,
      type: 'text',
      typeTime: ~~utils.calcuatePauseForText(message),
    }],
  }

  return makeKikRequest('/v1/message', body)
}

function makeKikRequest(endpoint, body) {
  var options = {
    url: `https://api.kik.com${endpoint}`,
    method: 'POST',
    body,
    json: true,
    auth: {
      user: KIK_USERNAME,
      pass: KIK_API_KEY,
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
