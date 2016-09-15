'use strict';

var fetch = require('node-fetch')
var qs = require('querystring');

var SIZE_LIMIT = 1600

var secrets = require('../secrets.json')

var ACCOUNT_SID = secrets.twilio.account_sid
var MESSAGING_SERVICE_SID = secrets.twilio.messaging_service_sid
var API_KEY_SID = secrets.twilio.api_key_sid
var API_KEY_SECRET = secrets.twilio.api_key_secret

var service_name = 'twilio'
var auth = 'Basic ' + new Buffer(API_KEY_SID + ':' + API_KEY_SECRET).toString('base64')

var parseMessages = body => {
	return new Promise((resolve, reject) => {
		var sender_id = body['From']
		var text = body['Body']
		var timestamp = new Date().getTime()
		var messages = [{ 
			service_name, 
			sender_id, 
			text, 
			timestamp,
		}]
		var response = '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>'

		resolve({ messages, response })
	})
}

var sendMessage = (recipient_id, text) => {
	if (text.length > SIZE_LIMIT) {
		return Promise.reject('message is over size limit of ' + SIZE_LIMIT)
	}

	var querystring = {
		To: recipient_id,
		MessagingServiceSid: MESSAGING_SERVICE_SID,
		Body: text,
	}

	return fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?`, {
	  method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': auth,
		},
		body: qs.stringify(querystring),
  })
  .then(res => {
  	if (res.status == 200 || res.status == 201) {
  		return res.json()
  	} else {
  		throw new Error(res.statusText)
  	}
  })
}

module.exports = {
	parseMessages,
	sendMessage,
}