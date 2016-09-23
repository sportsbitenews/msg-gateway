'use strict';

var qs = require('querystring')
var https = require('../lib/https')

var service_name = 'messenger'

var secrets = require('../secrets.json')

var FB_VERIFY_TOKEN = secrets.messenger.verify_token
var FB_PAGE_ACCESS_TOKEN = secrets.messenger.page_access_token

function parseMessages(body) {
	return _extractEventsFromEntries(body.entry)
		.then(_extractMessagesFromEvents)
}

function _extractEventsFromEntries(entries) {
	return new Promise((resolve, reject) => {

		if (!entries) {
			return reject("Couldn't find entries")
		}

		var events = entries.reduce((array, entry) => {
			Array.prototype.push.apply(array, entry.messaging)
			return array
		}, [])

		resolve(events)
	})
}

function _extractMessagesFromEvents(events) {
	return new Promise((resolve, reject) => {

		var messages = events.reduce((array, event) => {
			if ((event.message && !event.message.is_echo) || (event.postback && event.postback.payload)) {
				var message = _messageFromEvent(event)
				array.push(message)
			}
			return array
		}, [])

		resolve({ messages, service_name })
	})
}

function _messageFromEvent(event) {
	var service_user_id = event.sender.id.toString()
	var text = event.message ? event.message.text : event.postback.payload;
	var timestamp = event.timestamp
	return { service_name, service_user_id, text, timestamp }
}

function sendMessage(service_user_id, text) {
	if (text.length <= 320) {
		return sendFBMessage(service_user_id, text)
	}

	var message = text.slice(0, 300)
	var remainder = text.slice(300, text.length)

	return sendFBMessage(service_user_id, message)
		.then(() => sendMessage(service_user_id, remainder))
}

function sendFBMessage(service_user_id, text) {
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

function validate(query) {	
	return new Promise((resolve, reject) => {
		 if (query['hub.mode'] == 'subscribe' && query['hub.verify_token'] == FB_VERIFY_TOKEN) {
	    console.log("Validating webhook");
	    resolve({response: parseInt(query['hub.challenge'])})
	  } else {
	  	reject(new Error("Couldn't verify token"))
	  }
	})
}

function formatResponse(res) {
	var response = {
		statusCode: 200
	}
	return response
}


module.exports = {
	parseMessages,
	validate,
	sendMessage,
	formatResponse,
}