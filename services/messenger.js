'use strict';

var qs = require('querystring')
var https = require('./_https')

var service_name = 'messenger'

var secrets = require('../secrets.json')

var FB_VERIFY_TOKEN = secrets.messenger.verify_token
var FB_PAGE_ACCESS_TOKEN = secrets.messenger.page_access_token

var parseMessages = (body) => {
	return new Promise((resolve, reject) => {
		if (body.entry) {
			var entries = body.entry
			entries.forEach((entry) => {
				var messages = []
				var messaging_events = entry.messaging
				if (messaging_events) {
					messaging_events.forEach((event) => {
						if ((event.message && !event.message.is_echo) ||
							(event.postback && event.postback.payload)) {
								var service_user_id = event.sender.id.toString()
								var text = event.message ? event.message.text : event.postback.payload;
								var timestamp = event.timestamp
								messages.push({ service_name, service_user_id, text, timestamp })
						}
					})
				}
				resolve({ messages })
			})
		} else {
			reject(new Error("Couldn't find entries"))
		}
	})
}

var sendMessage = (service_user_id, text) => {
	if (text.length <= 320) {
		return sendFBMessage(service_user_id, text)
	}

	var message = text.slice(0, 300)
	var remainder = text.slice(300, text.length)

	return sendFBMessage(service_user_id, message)
		.then(() => sendMessage(service_user_id, remainder))
}


var sendFBMessage = (service_user_id, text) => {
	var querystring = {access_token: FB_PAGE_ACCESS_TOKEN}

	var options = {
	  hostname: 'graph.facebook.com',
	  path: '/v2.6/me/messages?' + qs.stringify(querystring),
	  method: 'POST',
	  headers: {
  		'Content-Type': 'application/json',
  	},
	}

	var body = JSON.stringify({
		recipient: {id: service_user_id},
		message: {text: text}
	})

	return https.request(options, body)
	  .then(res => {
	  	if (res.statusCode == 200 || res.statusCode == 201) {
	  		return res.json()
	  	} else {
	  		throw new Error(res.statusText)
	  	}
	  })
}

var validate = query => {	
	return new Promise((resolve, reject) => {
		 if (query['hub.mode'] == 'subscribe' && query['hub.verify_token'] == FB_VERIFY_TOKEN) {
	    console.log("Validating webhook");
	    resolve({response: parseInt(query['hub.challenge'])})
	  } else {
	  	reject(new Error("Couldn't verify token"))
	  }
	})
}

module.exports = {
	parseMessages,
	validate,
	sendMessage
}