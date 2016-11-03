'use strict';

var qs = require('querystring')
var https = require('../lib/https')

var service_name = 'messenger'

var dotenv = require('../lib/dotenv').config()
var stage = process.env.SERVERLESS_STAGE
var secrets = require(`../secrets.${stage}.json`)

var FB_VERIFY_TOKEN = secrets.messenger.verify_token
var FB_PAGE_ACCESS_TOKEN = secrets.messenger.page_access_token



function parseMessages(body) {
	return https.parseJson(body)
		.then(_extractEventsFromBody)
		.then(_filterMessageEvents)
		.then(_formatAsMessages)
		.then(_formatResponse)
}

// extract array of events then flatten them to a single array
function _extractEventsFromBody(body) {
	var entries = body.entry || []
	var arrays = entries.map(e => e.messaging)
	var events = [].concat.apply([], arrays) //flatten arrays
	return events
}

function _filterMessageEvents(events) {
	return events.filter(e => (e.message && !e.message.is_echo) || (e.postback && e.postback.payload))
}

function _formatAsMessages(events) {
	return events.map(e => ({
		service_name: service_name,
		service_user_id: e.sender.id.toString(),
		text: e.message ? e.message.text : e.postback.payload,
		timestamp: e.timestamp,
	}))
}

function _formatResponse(messages) {
	return { messages, service_name }
}

//recursive function. chunks messages and sends them one by one
function sendMessage(service_user_id, text) {
	if (text.length <= 320) {
		return _sendFBMessage(service_user_id, text)
	}

	var message = text.slice(0, 300)
	var remainder = text.slice(300, text.length)

	return _sendFBMessage(service_user_id, message)
		.then(() => sendMessage(service_user_id, remainder))
}

function _sendFBMessage(service_user_id, text) {
	var body = {
		recipient: {id: service_user_id},
		message: {text: text}
	}

	return _makeRequest('/v2.6/me/messages', body)
}

function _doSubscribeRequest() {
	return _makeRequest('/v2.6/me/subscribed_apps')
		.then(res => {
    	console.log('Subscription result:', res)
		}).catch(e => {
			console.error('Error while subscription:', error)
		})
}

function validate(query, token) {
	var verify_token = token || FB_VERIFY_TOKEN
	if (query['hub.mode'] == 'subscribe' && query['hub.verify_token'] == verify_token) {
    return _doSubscribeRequest().then(res => {
    	console.log("Validating webhook")
  	  var messages = []
	    var response = parseInt(query['hub.challenge'])
    	return { response, messages, service_name }
    })
  }

  return Promise.reject(new Error("Couldn't verify token"))
}

function formatResponse(res) {
	return {
		statusCode: 200,
	 	headers: {
			"Content-Type" : "application/json",
		},
		body: res.response ? res.response : JSON.stringify({ status: "ok" }),
	}
}

function _makeRequest(path, body) {
	var querystring = { access_token: FB_PAGE_ACCESS_TOKEN }

	var options = {
	  hostname: 'graph.facebook.com',
	  path: path + '?' + qs.stringify(querystring),
	  method: 'POST',
	  headers: {
  		'Content-Type': 'application/json',
  	},
	}

	return https.request(options, JSON.stringify(body))
	  .then(res => {
	  	if (res.statusCode == 200 || res.statusCode == 201) {
	  		return res.json()
	  	} else {
	  		console.log(res)
	  		throw new Error(res.statusMessage)
	  	}
	  })
}

module.exports = {
	parseMessages,
	validate,
	sendMessage,
	formatResponse,
}