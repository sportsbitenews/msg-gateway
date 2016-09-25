'use strict';

var twilio = require('../services/twilio')
var messenger = require('../services/messenger')

var messageHandler = require('../messageHandler')
var secrets = require('../secrets.json')
var sns = require('../lib/sns')
var dashbot = require('../lib/dashbot')

module.exports.handler = (event, context, callback) => {
	_parseMessagesFromEvent(event)
		.then(_processThroughMsgHandler)
		.then(_publishToSns)
		.then(_logToAnalytics)
		.then(_formatResponseForService)
		.then(res => callback(null, res))
		.catch(e => {
			console.log(e)
			callback(e)
		})
}


//handle the incoming event according to the provider, return the parsed messages and response for the callback
function _parseMessagesFromEvent(event) {
	var service_name = event.path.service_name || event.pathParameters.service_name

	if (secrets[service_name] && !secrets[service_name].enabled) {
		return _reject('Service disabled: ' + service_name)
	}

	switch (service_name) {
		case 'messenger':
			return _processMessengerEvent(event)
		case 'twilio':
			return _processTwilioEvent(event)
		default:
			return _reject('Unknown service: ' + service_name)
	}
}


//Facebook Messenger will initially make a GET request with the VERIFY_TOKEN, then start POSTing messages
//parse the messages from the BODY and return them in an array
function _processMessengerEvent(event) {
	var method = event.method || event.httpMethod
	var query = event.queryStringParameters
	var body = event.body

	switch (method) {
		case 'GET':
			return messenger.validate(query)
		case 'POST':
			return messenger.parseMessages(body)
		default:
			return _reject('Unsupported method: ' + method)
	}
}

//twilio let's us pick between GET and POST. We're using GET right now, see issue #1
//parse the message from the query and return it in an array (to be consistent with FB)
function _processTwilioEvent(event) {
	var method = event.method || event.httpMethod
	var body = event.body

	switch (method) {
		case 'POST':
			return twilio.parseMessages(body)
		default:
			return _reject('Unsupported method: ' + method)
	}
}

//parse messages using our custom message handler
function _processThroughMsgHandler(response) {
	var promises = response.messages.map(messageHandler.parseIncoming)
	return _resolveAll(promises)
		.then(messages => Object.assign({}, response, { messages }))
}

function _publishToSns(response) {
	var shouldPublishToSNS = secrets.sns && secrets.sns.enabled
	if (!shouldPublishToSNS) {
		return response
	}

	var promises = response.messages.map(_publishMessageToSns)

	return _resolveAll(promises)
		.then(messages => Object.assign({}, response, { messages }))
}

function _publishMessageToSns(message) {
	return sns.publishReceivedMessage(message)
		.then(snsReceipt => Object.assign({}, message, { snsReceipt }))
}

function _logToAnalytics(response) {
	var shouldLogToAnalytics = secrets.dashbot && secrets.dashbot.enabled

	if (!shouldLogToAnalytics) {
		return response
	}

	var promises = response.messages.map(_sendToDashbot)

	return _resolveAll(promises)
		.then(messages => Object.assign({}, response, { messages }))
}

function _sendToDashbot(message) {
	return dashbot.send('incoming', message)
		.then(dashbotReceipt => Object.assign({}, message, { dashbotReceipt }))
}

function _formatResponseForService(response) {
	var service_name = response.service_name
	switch (service_name) {
		case 'messenger':
			return messenger.formatResponse(response)
		case 'twilio':
			return twilio.formatResponse(response)
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

