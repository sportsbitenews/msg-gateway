'use strict'

var request = require('request-promise')

var https = require('../lib/https')
var utils = require('../lib/utils')
var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var SERVICE_NAME = 'kik'
var KIK_USERNAME = secrets.kik.username
var KIK_API_KEY = secrets.kik.api_key

function processEvent(ev) {
  return _parsesMessages(ev.body)
    .then(messages => Object.assign({}, ev, {
      messages,
      response: {
        status: 'ok',
      },
    }))
}

// TODO: Will have to implement filtering for the events.
function _parsesMessages(body) {
  return https.parseJson(body)
    .then(_filterMessagesEvents)
    .then(_formatMessages)
}

function _filterMessagesEvents(json) {
  return json.messages.filter(message => message.type === 'text')
}

function _formatMessages(messages) {
  return messages.map(message => ({
    service_name: SERVICE_NAME,
    service_user_id: message.from,
    text: message.body,
    timestamp: message.timestamp,
  }))
}

function sendMessage(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, _sendKikText, true)
}

function _sendKikText(userId, message) {
  var body = {
    messages: [{
      to: userId,
      body: message,
      type: 'text',
      typeTime: ~~utils.calcuatePauseForText(message),
    }],
  }

  return _makeRequest('/v1/message', body)
}

function _makeRequest(endpoint, body) {
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
      throw new Error(e.message)
    })
}

module.exports = {
  processEvent,
  sendMessage,
}
