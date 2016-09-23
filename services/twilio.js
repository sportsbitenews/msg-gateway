'use strict';

var https = require('../lib/https')
var qs = require('querystring')
var secrets = require('../secrets.json')

var ACCOUNT_SID = secrets.twilio.account_sid
var MESSAGING_SERVICE_SID = secrets.twilio.messaging_service_sid
var API_KEY_SID = secrets.twilio.api_key_sid
var API_KEY_SECRET = secrets.twilio.api_key_secret

var SIZE_LIMIT = 1600
var service_name = 'twilio'

function parseMessages(body) {
	var parsedBody = qs.parse(body)
	var service_user_id = parsedBody['From']
	var text = parsedBody['Body']
	var timestamp = new Date().getTime()
	
	var messages = [{ 
		service_name, 
		service_user_id, 
		text, 
		timestamp,
	}]

	return Promise.resolve({ messages, service_name })
}

function formatResponse(res) {
	var body = `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`
	var response = {
		statusCode: 200,
		headers: {
			"Content-Type" : "application/xml",
		},
		body: body,
	}
	return response
}

function sendMessage(service_user_id, text) {
	
	if (text.length > SIZE_LIMIT) {
		var error = new Error('message is over size limit of ' + SIZE_LIMIT)
		return Promise.reject(error)
	}

	var querystring = {
		To: service_user_id,
		MessagingServiceSid: MESSAGING_SERVICE_SID,
		Body: text,
	}

	var options = {
	  hostname: 'api.twilio.com',
	  path: `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?`,
	  method: 'POST',
	 	auth: API_KEY_SID + ':' + API_KEY_SECRET,
	  headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
  	},
	}
	var body = qs.stringify(querystring)

 	return https.request(options, body)
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
	parseMessages,
	sendMessage,
	formatResponse,
}