'use strict';

var facebook = require('../services/facebook')
var twilio = require('../services/twilio')
var messageHandler = require('../messageHandler')
var secrets = require('../secrets.json')

module.exports.handler = (event, context, callback) => {
	messageHandler.parseOutgoing(message)
		.then(_processMessage)
		.then(res => {
			callback(null, res ? res.response : null)
		}).catch(callback)
}

var _processMessage = message => {
	var service_name = event.path.service_name

	if (secrets[service_name] && !secrets[service_name].enabled) {
		return _reject('Service disabled: ' + service_name)
	}

	if (service_name == 'messenger') {
		return facebook.sendMessage(res.service_id, message.text)
	} else if (service_name == 'twilio') {
		return twilio.sendMessage(res.service_id, message.text)
	} else {
		return _reject('Unknown service: ' + service_name)
	}
}

var _reject = errorMessage => {
	return Promise.reject(new Error(errorMessage))
}