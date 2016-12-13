var qs = require('querystring')
var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var API_KEY = secrets.botmetrics &&  secrets.botmetrics.enabled ? secrets.botmetrics.api_key : null

function send(type, user_id, message) {
	if (!API_KEY) {
		return Promise.reject(new Error('botmetrics: apikey missing from secrets or disabled'))
	}

	var querystring = {
		token: API_KEY
	}

	var body = {
		message_type: type,
		platform: user_id.split('/')[0],
		user_id: user_id,
		text: message,
	}

	var path = '/v1/messages?' + qs.stringify(querystring)

	return _makeRequest(path, body)
}

function _makeRequest(path, body) {
	var options = {
	  hostname: 'api.bot-metrics.com',
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
