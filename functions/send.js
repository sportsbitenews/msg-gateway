'use strict';

var messenger = require('../services/messenger')
var twilio = require('../services/twilio')
var messageHandler = require('../messageHandler')
var secrets = require('../secrets.json')
var dashbot = require('../lib/dashbot')
var https = require('../lib/https')

module.exports.handler = (event, context, callback) => {
	_parseMessagesFromEvent(event)
		.then(_parseOutgoingMessages)
		.then(_sendMessages)
		.then(_logToAnalytics)
		.then(res => callback(null, res))
		.catch(e => {
			console.error(e)
			callback(e)
		})
}

// extract message from the event. two possible event sources are SNS and HTTP. 
// We need to inspect the event contents to determine which one it's from and parse them accordingly.
function _parseMessagesFromEvent(event) {
	//TODO: there's gotta be a better way to determine the event source
	if (event['Records']) {
		return _parseSnsEvent(event)
	} else if (event['body']) {
		return _parseHttpEvent(event)
	} else {
		return _reject("Can't determine event source")
	}
}

function _parseSnsEvent(event) {
	var messages = event['Records'].map(r => r['Sns']['Message'])
	var promises = messages.map(https.parseJson)
	return _resolveAll(promises)
}

function _parseHttpEvent(event) {
	var message = event['body']
	return https.parseJson(message)
		.then(res => [res])
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

	var promises = messages.map(_sendMessageToDashbot)
	return _resolveAll(promises)
}

function _sendMessageToDashbot(message) {
	return dashbot.send('outgoing', message)
		.then(dashbotReceipt => Object.assign({}, message, { dashbotReceipt }))		
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

