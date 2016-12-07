'use strict';

var https = require('../lib/https')
var qs = require('querystring')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

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
	var timestamp = parsedBody['Timestamp'] ? parseInt(parsedBody['Timestamp']) : new Date().getTime()
	
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
	parseMessages,
	sendMessage,
	formatResponse,
}