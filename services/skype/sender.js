'use strict'

var request = require('request-promise')

var utils = require('../../lib/utils')
var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var SKYPE_ID = config.id
var SKYPE_PW = config.pass
var BOT_ID = config.bot_id
var BOT_NAME = config.bot_name

var TOKEN = {}

var AUTH_REQUEST = {
  url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  method: 'POST',
  form: {
    grant_type: 'client_credentials',
    client_id: SKYPE_ID,
    client_secret: SKYPE_PW,
    scope: 'https://graph.microsoft.com/.default',
  },
}

var CHECK_REQUEST = {
  url: _getFullyQualifiedPath('/conversations'),
  method: 'POST',
  json: true,
}

module.exports = function skypeSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendSkypeMessage)
}

function _getFullyQualifiedPath(path) {
  return `https://skype.botframework.com/v3${path}`
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
  var options = {
    method: 'POST',
    body,
    json: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }

  if (TOKEN.token && !utils.hasTokenExpired(TOKEN)) {
    return _ensureConversation(serviceUserId, TOKEN)
      .then(response => _sendMessageRequest(response.id, options, TOKEN))
  }

  return makeAuthRequest()
    .then(() => {
      return _ensureConversation(serviceUserId, TOKEN)
        .then(response => _sendMessageRequest(response.id, options, TOKEN))
    })
}

module.exports.makeAuthRequest = makeAuthRequest
function makeAuthRequest() {
  return request(AUTH_REQUEST)
    .then(authResponse => {
      var response = JSON.parse(authResponse)

      TOKEN.token = response.access_token
      TOKEN.expire_date = new Date().getTime() + response.expires_in * 10

      return Promise.resolve(true)
    })
}

module.exports.ensureConversation = _ensureConversation
function _ensureConversation(serviceUserId, auth) {
  var checking = Object.assign({}, CHECK_REQUEST, {
    body: {
      bot: {
        id: BOT_ID,
        name: BOT_NAME,
      },
      members: [{
        id: serviceUserId,
      }],
    },
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  })

  return request(checking)
    .then(res => {
      var response = typeof res === 'string' ? JSON.parse(res) : res
      return Promise.resolve(response)
    })
    .catch(e => {
      throw new Error(e.message)
    })
}

function _sendMessageRequest(conversationId, options, auth) {
  var config = Object.assign({}, options, {
    url: _getFullyQualifiedPath(`/conversations/${conversationId}/activities`),
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  })

  return request(config)
    .then(response => response)
    .catch(e => {
      let message = e.message

      if (e.error && e.error.message) {
        message = e.error.message
      }

      throw new Error(message)
    })
}

