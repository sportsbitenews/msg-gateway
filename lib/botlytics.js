'use strict';

var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var API_KEY = secrets.botlytics &&  secrets.botlytics.enabled ? secrets.botlytics.api_key : null

function send(type, user_id, message) {
  if (!API_KEY) {
    return Promise.reject(new Error('botlytics: apikey missing from secrets or disabled'))
  }

  var message = {
    text: message,
    kind: type ,
    conversation_identifier: user_id,
    sender_identifier: user_id,
    platform: user_id.split('/')[0],
  }

  return _makeRequest(`/api/v1/messages?token=${API_KEY}`, { message })
}

function _makeRequest(path, body) {
  var options = {
    hostname: 'botlytics.co',
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return https.request(options, JSON.stringify(body))
      .then(res => {
        if (res.statusCode == 200 || res.statusCode == 201) {
          return res.json()
        } else {
          console.log(res)
          throw new Error(res.body)
        }
      })
}

module.exports = {
  send,
}
