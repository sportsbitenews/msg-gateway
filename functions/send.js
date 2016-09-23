'use strict';

var messenger = require('../services/messenger')
var twilio = require('../services/twilio')
var messageHandler = require('../messageHandler')
var secrets = require('../secrets.json')
var dashbot = require('../lib/dashbot')

module.exports.handler = (event, context, callback) => {
	_parseMessagesFromEvent(event)
		.then(_parseOutgoingMessages)
		.then(_sendMessages)
		.then(_logToAnalytics)
		.then(res => {
			console.log(res)
			return res
		})
		.then(res => callback(null, res))
		.catch(e => {
			console.error(e)
			callback(e)
		})
}

// extract message from the event. two possible event sources are SNS and HTTP. 
// We need to inspect the event contents to determine which one it's from and parse them accordingly.
function _parseMessagesFromEvent(event) {
	return new Promise((resolve, reject) => {
			//TODO: there's gotta be a better way to determine the event source
		if (event['Records']) {
			resolve(_parseSnsEvent(event))
		} else if (event['body']) {
			resolve(_parseHttpEvent(event))
		} else {
			reject(new Error("Can't determine event source"))
		}
	})

}

function _parseSnsEvent(event) {
	var messages = []
	event['Records'].forEach(r => {
		try {
			messages.push(JSON.parse(r['Sns']['Message']))
		} catch (e) {
			console.error(e)
		}
	})
	return messages
}

function _parseHttpEvent(event) {
	var messages = []
	messages.push(event['body'])
	return messages
}

function _parseOutgoingMessages(messages) {
	var promises = messages.map(messageHandler.parseOutgoing)
	return _resolveAll(promises)
}

function _logToAnalytics(messages) {
	var shouldLogToAnalytics = secrets.dashbot && secrets.dashbot.enabled

	if (!shouldLogToAnalytics) {
		return response
	}

	var promises = messages.map(message => {
		return dashbot.send('outgoing', message)
			.then(dashbotReceipt => Object.assign({}, message, { dashbotReceipt }))
	})

	return _resolveAll(promises)
}

function _sendMessages(messages) {
	var promises = messages.map(_sendMessage)
	return _resolveAll(promises)
}


//send a single message using the apprioriate service
function _sendMessage(message) {
	var service_name = message.service_name

	if (secrets[service_name] && !secrets[service_name].enabled) {
		return _reject('Service disabled: ' + service_name)
	}

	switch (service_name) {
		case 'messenger':
			return messenger.sendMessage(message.service_user_id, message.text)
				.then(sendReceipt => Object.assign({}, message, { sendReceipt }))
		case 'twilio':
			return twilio.sendMessage(message.service_user_id, message.text)
				.then(sendReceipt => Object.assign({}, message, { sendReceipt }))
		default:
			return _reject('Unknown service: ' + service_name)
	}
}

function _reject(errorMsg) {
	console.log(errorMsg)
	return Promise.reject(new Error(errorMsg))
} 

function _resolveAll(promises) {
	var res = promises.map(p => {
		return p.catch(e => {
			console.log(e)
			return e.toString()
		})
	})
	return Promise.all(res)
}

