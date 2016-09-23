var qs = require('querystring')
var https = require('./https')
var secrets = require('../secrets.json')

var API_KEY = secrets.dashbot &&  secrets.dashbot.enabled ? secrets.dashbot.api_key : null

function send(type, message) {
	if (!API_KEY) {
		return Promise.reject(new Error('dashbot: apikey missing from secrets or disabled'))
	}

	var querystring = {
		platform: 'generic',
		v: '0.7.4-rest',
		type: type,
		apiKey: API_KEY,
	}

	var options = {
	  hostname: 'tracker.dashbot.io',
	  path: '/track?' + qs.stringify(querystring),
	  method: 'POST',
	  headers: {
  		'Content-Type': 'application/json',
  	},
	}

	var body = JSON.stringify({
		userId: [message.service_name, message.service_user_id].join('/'),
		text: message.text,
	})

	return https.request(options, body)
	  .then(res => {
	  	if (res.statusCode == 200 || res.statusCode == 201) {
	  		return res.json()
	  	} else {
	  		throw new Error(res.body)
	  	}
	  })
}

module.exports = {
	send,
}
