'use strict'

var request = require('request-promise')
var https = require('../lib/https')
var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var utils = require('../lib/utils')


var TOKEN = {}
var SERVICE_NAME = 'skype'
var SKYPE_ID = secrets.skype.app_id
var SKYPE_PW = secrets.skype.app_password

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

function processEvent(ev) {
  return _parseMessages(ev.body)
    .then(_filterEventType)
    .then(_formatMessage)
    .then(messages => Object.assign({}, ev, {
      messages,
      response: {
        status: 'ok',
      },
    }))
}

function _parseMessages(body) {
  return https.parseJson(body)
}

function _filterEventType(event) {
  return event.type === 'message' ? event : null
}

function _formatMessage(json) {
  if (!json) {
    return []
  }

  return [{
    service_name: SERVICE_NAME,
    service_user_id: json.from.id,
    text: json.text,
    timestamp: json.timestamp,
  }]
}

function sendMessage(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, _sendSkypeMessage)
}

function _sendSkypeMessage(serviceUserId, message) {
  var body = {
    type: 'message',
    text: message,
    timestamp: new Date().toISOString(),
  }

  return makeRequest(serviceUserId, body)
}

function _getFullyQualifiedPath(path) {
  return `https://skype.botframework.com/v3${path}`
}

function makeRequest(serviceUserId, body) {
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

  return request(AUTH_REQUEST)
    .then(authResponse => {
      var response = JSON.parse(authResponse)

      TOKEN.token = response.access_token
      TOKEN.expire_date = new Date().getTime() + response.expires_in * 10

      return _ensureConversation(serviceUserId, TOKEN)
        .then(response => _sendMessageRequest(response.id, options, TOKEN))
    })
}

function _ensureConversation(serviceUserId, auth) {
  var checking = Object.assign({}, CHECK_REQUEST, {
    body: {
      bot: {
        id: secrets.skype.bot.id,
        name: secrets.skype.bot.name,
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
      throw new Error(e.message)
    })
}

module.exports = {
  processEvent,
  sendMessage,
}
