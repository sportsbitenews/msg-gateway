'use strict';

var https = require('../lib/https')
var utils = require('../lib/utils')

var qs = require('querystring')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var ACCOUNT_SID = secrets.twilio.account_sid
var MESSAGING_SERVICE_SID = secrets.twilio.messaging_service_sid
var API_KEY_SID = secrets.twilio.api_key_sid
var API_KEY_SECRET = secrets.twilio.api_key_secret

var SIZE_LIMIT = 160
var service_name = 'twilio'

function processEvent(ev) {
	var response = `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`
	var query = ev.method == 'GET' ? ev.query : qs.parse(ev.body)
	
	return _parseMessages(query)
		.then(messages => Object.assign({}, ev, { messages, response }))
}

function _parseMessages(query) {
	var service_user_id = query['From']
	var text = query['Body']
	var timestamp = query['Timestamp'] ? parseInt(query['Timestamp']) : new Date().getTime()
	
	var messages = [{ 
		service_name, 
		service_user_id, 
		text, 
		timestamp,
	}]

	return Promise.resolve(messages)
}
//recursive function. chunks messages and sends them one by one
function sendMessage(service_user_id, message) {
	if (typeof message == 'string' && message.length > 160) {
		message = utils.makeParagraphs(message, 160, '.')
	}

	if (Array.isArray(message)) {
		return sendMessage(service_user_id, message[0])
			.then(() => {
				if (message.length > 1) {
					var text = message.slice(1)

					setTimeout(function() {
						return sendMessage(service_user_id, text)	
					}, utils.calcuatePauseForText(text[0]) )	
				}
			})
	}

	return _sendTwilioMessage(service_user_id, message)
}

function _sendTwilioMessage(service_user_id, text) {
	var path = `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?`
	
	var body = {
		To: service_user_id,
		MessagingServiceSid: MESSAGING_SERVICE_SID,
		Body: text,
	}

	return _makeRequest(path, body)
}

function _makeRequest(path, body) {
	var options = {
	  hostname: 'api.twilio.com',
	  path: path,
	  method: 'POST',
	 	auth: API_KEY_SID + ':' + API_KEY_SECRET,
	  headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
  	},
	}

	return https.request(options, qs.stringify(body))
  	.then(res => {
	  	if (res.statusCode == 200 || res.statusCode == 201) {
	  		return res.json()
	  	} else {
	  		console.log(res)
	  		throw new Error(res.statusText)
	  	}
	  })
}

module.exports = {
	processEvent,
	sendMessage,
}