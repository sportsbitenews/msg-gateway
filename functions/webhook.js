'use strict';

var facebook = require('../services/facebook')
var messenger = require('../services/messenger')
var messageHandler = require('../messageHandler')
var secrets = require('../secrets.json')

module.exports.handler = (event, context, callback) => {
	_processEvent(event)
		.then(res => {

			if (res && res.messages) {
				res.messages.forEach(_handleMessage)
			}

			callback(null, res ? res.response : null)
		}).catch(callback)
}

var _processEvent = event => {
	var service_name = event.path.service_name

	if (secrets[service_name] && !secrets[service_name].enabled) {
		return _reject('Service disabled: ' + service_name)
	}

	if (service_name == 'messenger') {
		return _processMessengerEvent(event)
	} else if (service_name == 'twilio') {
		return _processTwilioEvent(event)
	} else {
		return _reject('Unknown service: ' + service_name)
	}
}

var _processMessengerEvent = event => {
	if (event.method == 'GET') {
		return messenger.validate(event.query)
	} else if (event.method == 'POST') {
		return messenger.parseMessages(event.body)
	} else {
		return _reject('Unsupported method: ' + event.method)
	}
}

var _processTwilioEvent = event => {
	if (event.method == 'POST') {
		return twilio.parseMessages(event.query)
	} else {
		return _reject('Unsupported method: ' + event.method)
	}
}

var _reject = errorMessage => {
	return Promise.reject(new Error(errorMessage))
}

var _handleMessage = message => {
	return messageHandler.handleIncomming(messenge)
}