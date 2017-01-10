'use strict'

var https = require('../../lib/https')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

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
  var KIK_USERNAME = config.username
  var KIK_API_KEY = config.api_key
  var KIK_AUTH = new Buffer(`${KIK_USERNAME}:${KIK_API_KEY}`).toString('base64')

  var stringBody = JSON.stringify(body)
  var options = {
    hostname: 'api.kik.com',
    path: endpoint,
    method: 'POST',
    headers: {
      Authorization: `Basic ${KIK_AUTH}`,
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
