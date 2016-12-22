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

  return _getConversation(serviceUserId)
    .then(conv => {
      var path = `/v3/conversations/${conv.id}/activities`
      return _makeAuthenticatedRequest(path, body)
    })
}


module.exports.getConversation = _getConversation
function _getConversation(serviceUserId) {
  var body = {
    bot: {
      id: BOT_ID,
      name: BOT_NAME,
    },
    members: [{
      id: serviceUserId,
    }],
  }

  return _makeAuthenticatedRequest('/v3/conversations', body)
}

function _makeAuthenticatedRequest(path, body) {
  return _getAuth()
    .then(auth => {
      var stringBody = typeof body == 'string' ? body : JSON.stringify(body)

      var options = {
        path: path,
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Length': stringBody.length,
        },
      }

      return _makeRequest(options, stringBody)
    })
}

module.exports.getAuth = _getAuth
function _getAuth() {
  if (TOKEN.token && !utils.hasTokenExpired(TOKEN)) {
    return Promise.resolve(TOKEN)
  }

  var form = qs.stringify({
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
      'Content-Length': form.length,
    },
  }

  return _makeRequest(options, form)
    .then(response => {
      TOKEN.token = response.access_token
      TOKEN.expire_date = new Date().getTime() + response.expires_in * 10
      return TOKEN
    })
}

function _makeRequest(options, body) {
  options = options || {}

  var headers = Object.assign({}, defaultOptions.headers, options.headers)
  var mergedOptions = Object.assign({}, defaultOptions, options, { headers })

  return https.request(mergedOptions, body)
    .then(res => {
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        throw new Error(res.statusMessage)
      }

      return res.json()
    })
}
