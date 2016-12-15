var qs = require('querystring')
var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var API_KEY = secrets.botanalytics &&  secrets.botanalytics.enabled ? secrets.botanalytics.api_key : null

function send(type, user_id, message) {
  if (!API_KEY) {
    return Promise.reject(new Error('botanalytics: apikey missing from secrets or disabled'))
  }

  var body = {
    is_sender_bot: type !== 'incoming',
    platform: 'generic',
    user: {
      id: user_id,
    },
    message: {
      text: message,
      timestamp: new Date().getTime(),
    },
  };

  return _makeRequest('/api/v1/messages/generic/', body)
}

function _makeRequest(path, body) {
  var options = {
    hostname: 'botanalytics.co',
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${API_KEY}`,
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
