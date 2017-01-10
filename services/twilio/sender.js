'use strict'

var qs = require('querystring')

var https = require('../../lib/https')
var utils = require('../../lib/utils')
var getConfig = require('./token')

var config

module.exports = function twilioSender(botname, serviceUserId, message) {
  config = getConfig(botname, process.env.SERVERLESS_STAGE || 'dev')
  return utils.sendMessageInChunks(serviceUserId, message, sendTwilioMessage)
}

function sendTwilioMessage(serviceUserId, text) {
  var path = `/2010-04-01/Accounts/${config.account_sid}/Messages.json?`

  var body = {
    To: serviceUserId,
    MessagingServiceSid: config.messaging_service_sid,
    Body: text,
  }

  return makeTwilioRequest(path, body)
}

function makeTwilioRequest(path, body) {
  var options = {
    hostname: 'api.twilio.com',
    path: path,
    method: 'POST',
    auth: config.api_key_sid + ':' + config.api_key_secret,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }

  return https.request(options, qs.stringify(body))
    .then(res => res.json())
    .catch(e => {
      throw new Error(e.message)
    })
}
