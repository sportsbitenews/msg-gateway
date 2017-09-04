'use strict';

var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
const { chatbase={} } = require(`../secrets.${stage}.json`)

var API_KEY = chatbase.enabled ? chatbase.api_key : null

function send(type, user_id, message, intent, platform) {
  if (!API_KEY) {
    return Promise.reject(new Error('chatbase: apikey missing from secrets or disabled'))
  }

  var body = {
    platform,
    user_id,
    message,
    intent,
    api_key: API_KEY,
    type: type === 'incoming' ? 'user' : 'agent',
    version: '1.0',
    time_stamp: new Date().getTime().toString(),
  };

  return _makeRequest('/api/message', body)
}

function _makeRequest(path, body) {
  var options = {
    hostname: 'chatbase.com',
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
