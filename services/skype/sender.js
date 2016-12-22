'use strict'

var qs = require('querystring');

var https = require('../../lib/https')
var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var SKYPE_ID = config.id
var SKYPE_PW = config.pass
var BOT_ID = config.bot_id
var BOT_NAME = config.bot_name

var TOKEN = {}

var defaultOptions = {
  hostname: 'skype.botframework.com',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
}

module.exports = function skypeSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendSkypeMessage)
}

function sendSkypeMessage(serviceUserId, message) {
  var body = {
    type: 'message',
    text: message,
    timestamp: new Date().toISOString(),
  }

  return makeSkypeRequest(serviceUserId, body)
}

function makeSkypeRequest(serviceUserId, body) {
  if (TOKEN.token && !utils.hasTokenExpired(TOKEN)) {
    return _ensureConversation(serviceUserId)
      .then(response => _sendMessageRequest(response.id, body))
  }

  var form = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: SKYPE_ID,
    client_secret: SKYPE_PW,
    scope: 'https://graph.microsoft.com/.default',
  })

  var options = {
    hostname: 'login.microsoftonline.com',
    path: '/common/oauth2/v2.0/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }

  return _makeRequest(options, form)
    .then(response => {
      TOKEN.token = response.access_token
      TOKEN.expire_date = new Date().getTime() + response.expires_in * 10

      return _ensureConversation(serviceUserId)
        .then(response => _sendMessageRequest(response.id, body))
    })
}

function _ensureConversation(serviceUserId) {
  var body = {
    bot: {
      id: BOT_ID,
      name: BOT_NAME,
    },
    members: [{
      id: serviceUserId,
    }],
  }

  var options = {
    path: '/v3/conversations',
    headers: {
      Authorization: `Bearer ${TOKEN.token}`,
    }
  }
  

  return _makeRequest(options, body)
}

function _sendMessageRequest(conversationId, body) {
  var options = {
    path: `/v3/conversations/${conversationId}/activities`,
    headers: {
      Authorization: `Bearer ${TOKEN.token}`,
    },
  }

  return _makeRequest(options, body)
}


function _makeRequest(options, body) {
  options = options || {}
  var stringBody = typeof body == 'string' ? body : JSON.stringify(body)
  var lengthHeader = { 'Content-Length': stringBody.length }
  
  var headers = Object.assign({}, defaultOptions.headers, options.headers, lengthHeader)
  var mergedOptions = Object.assign({}, defaultOptions, options, { headers })

  return https.request(mergedOptions, stringBody)
    .then(res => {
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        throw new Error(res.statusMessage)
      }

      return res.json()
    })
}
