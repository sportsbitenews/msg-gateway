'use strict';

var qs = require('querystring')
var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var API_KEY = secrets.dashbot && secrets.dashbot.enabled ? secrets.dashbot.api_key : null

function send (type, user_id, message) {
  if (!API_KEY) {
    return Promise.reject(new Error('dashbot: apikey missing from secrets or disabled'))
  }

  var querystring = {
    platform: 'generic',
    v: '0.7.4-rest',
    type: type,
    apiKey: API_KEY,
  }

  var body = {
    userId: user_id,
    text: message,
  };

  var path = '/track?' + qs.stringify(querystring)

  return _makeRequest(path, body)
}

function _makeRequest (path, body) {
  var options = {
    hostname: 'tracker.dashbot.io',
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
