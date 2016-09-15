'use strict';

var https = require('./_https')
var qs = require('querystring')
var secrets = require('../secrets.json')

var ACCOUNT_SID = secrets.twilio.account_sid
var MESSAGING_SERVICE_SID = secrets.twilio.messaging_service_sid
var API_KEY_SID = secrets.twilio.api_key_sid
var API_KEY_SECRET = secrets.twilio.api_key_secret

var SIZE_LIMIT = 1600
var service_name = 'twilio'

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
	  		throw new Error(res.statusText)
	  	}
	  })
}

module.exports = {
	parseMessages,
	sendMessage,
}