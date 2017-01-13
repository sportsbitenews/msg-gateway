'use strict'

var qs = require('querystring');

var https = require('../../lib/https')
var utils = require('../../lib/utils')
var config

var TOKEN = {}

var defaultOptions = {
  hostname: 'skype.botframework.com',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
}

module.exports = function skypeSender(serviceUserId, message) {
  config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')
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
      id: config.bot_id,
      name: config.bot_name,
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
      var stringBody = typeof body === 'string' ? body : JSON.stringify(body)

      var options = {
        path: path,
        headers: {
          Authorization: `Bearer ${auth.token}`,
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
    client_id: config.id,
    client_secret: config.pass,
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
