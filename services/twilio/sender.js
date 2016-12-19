'use strict'

var qs = require('querystring')

var https = require('../../lib/https')
var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var ACCOUNT_SID = config.account_sid
var MESSAGING_SERVICE_SID = config.messaging_service_sid
var API_KEY_SID = config.api_key_sid
var API_KEY_SECRET = config.api_key_secret

module.exports = function twilioSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendTwilioMessage)
}

function sendTwilioMessage(serviceUserId, text) {
  var path = `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?`

  var body = {
    To: serviceUserId,
    MessagingServiceSid: MESSAGING_SERVICE_SID,
    Body: text,
  }

  return makeTwilioRequest(path, body)
}

function makeTwilioRequest(path, body) {
  var options = {
    hostname: 'api.twilio.com',
    path: path,
    method: 'POST',
    auth: API_KEY_SID + ':' + API_KEY_SECRET,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }

  return https.request(options, qs.stringify(body))
    .then(res => {
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.log(res)
        throw new Error(res.statusText)
      }

      return res.json()
    })
}
