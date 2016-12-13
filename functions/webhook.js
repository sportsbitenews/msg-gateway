'use strict';

var twilio = require('../services/twilio')
var messenger = require('../services/messenger')
var skype = require('../services/skype');

var analytics = require('../lib/analytics');
var messageHandler = require('../messageHandler')
var sns = require('../lib/sns')
var cyrano = require('../lib/cyrano')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

module.exports.handler = (event, context, callback) => {

  _normalizeEvent(event)
      .then(_processEvent)
      .then(_handleMessages)
      .then(_formatResponse)
      .then(result => callback(null, result.response))
      .catch(e => {
        console.log(e)
        callback(e)
      })
}

function _normalizeEvent (event) {
  var path = event.pathParameters || event.path
  var service_name = path.service_name
  var body = event.body
  var query = event.queryStringParameters || event.query
  var method = event.method || event.httpMethod

  if (secrets[service_name] && !secrets[service_name].enabled) {
    return _reject('Service disabled: ' + service_name)
  }

  return Promise.resolve({ path, service_name, body, query, method })
}


// our router
function _processEvent (ev) {

  switch (ev.service_name) {
    case 'messenger':
      return messenger.processEvent(ev)
    case 'twilio':
      return twilio.processEvent(ev)
    case 'skype':
      return skype.processEvent(ev);
    default:
      return _reject('Unknown service: ' + ev.service_name)
  }
}

function _handleMessages (ev) {

  if (!Array.isArray(ev.messages)) {
    console.log('will not handle messages for event:', ev)
    return ev
  }

  return Promise.all(ev.messages.map(_handleMessage))
      .then(messages => Object.assign({}, ev, { messages }))
}

function _formatResponse (ev) {
  if (!ev.response) {
    throw new Error('missing response for event:', ev)
  }

  var content_type = ev.service_name == 'twilio' ? 'application/xml' : 'application/json'
  var body = typeof ev.response == 'object' ? JSON.stringify(ev.response) : ev.response

  var response = {
    body,
    statusCode: 200,
    headers: {
      "Content-Type": content_type,
    },
  }

  return Object.assign({}, ev, { response })

}


// //Facebook Messenger will initially make a GET request with the VERIFY_TOKEN, then start POSTing messages
// //parse the messages from the BODY and return them in an array
// function _processMessengerEvent(event) {
// 	var method = event.method || event.httpMethod
// 	var query = event.queryStringParameters || event.query
// 	var body = event.body

// 	switch (method) {
// 		case 'GET':
// 			return messenger.validate(query)
// 		case 'POST':
// 			return messenger.parseMessages(body)
// 		default:
// 			return _reject('Unsupported method: ' + method)
// 	}
// }

// //twilio let's us pick between GET and POST. We're using GET right now, see issue #1
// //parse the message from the query and return it in an array (to be consistent with FB)
// function _processTwilioEvent(event) {
// 	var method = event.method || event.httpMethod
// 	var body = event.body

// 	switch (method) {
// 		case 'POST':
// 			return twilio.parseMessages(body)
// 		default:
// 			return _reject('Unsupported method: ' + method)
// 	}
// }

function _handleMessage (msg) {
  return _processThroughMsgHandler(msg)
  // .then(_translate)
      .then(_publishToSns)
      .then(analytics.logToAnalytics)
      .catch(error => {
        console.log('error processing message:', error, msg)
        return Object.assign({}, msg, { error })
      })
}

//parse message using our custom message handler
function _processThroughMsgHandler (msg) {
  return messageHandler.parseIncoming(msg)
}

function _publishToSns (msg) {
  var shouldPublishToSNS = secrets.sns && secrets.sns.enabled

  if (!shouldPublishToSNS) {
    return response
  }

  return sns.publishReceivedMessage(msg, 'msgGateway-receivedMsg')
      .then(snsReceipt => Object.assign({}, msg, { snsReceipt }))
}

function _translate (msg) {
  var user_id = msg.service_name + '/' + msg.service_user_id
  return cyrano.translateIn(user_id, msg.text)
      .then(res => {
        return msg
      })
}

function _formatResponseForService (messages) {

	if (messages.length == 0) {
		return;
	}

	var service_name = messages[0].service_name

  switch (service_name) {
    case 'messenger':
      return messenger.formatResponse(messages)
    case 'twilio':
      return twilio.formatResponse(messages)
    case 'skype':
      return skype.formatResponse(messages);
    default:
      return _reject('Unknown service: ' + service_name)
  }
}

function _reject (errorMsg) {
  console.log(errorMsg)
  return Promise.reject(new Error(errorMsg))
}


function _resolveAll (promises) {
  var res = promises.map(p => {
    return p.catch(e => {
      console.log(e)
      return e.toString()
    })
  })
  return Promise.all(res)
}

