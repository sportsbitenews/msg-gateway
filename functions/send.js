'use strict';


var skype = require('../services/skype');
var messenger = require('../services/messenger');
var twilio = require('../services/twilio');
var messageHandler = require('../messageHandler');
var analytics = require('../lib/analytics');
var https = require('../lib/https');

var stage = process.env.SERVERLESS_STAGE || 'dev';
var secrets = require(`../secrets.${stage}.json`);

module.exports.handler = (event, context, callback) => {
  _parseMessagesFromEvent(event)
      .then(messages => Promise.all(messages.map(_handleOutgoingMessage)))
      .then(_formatResponse)
      .then(res => callback(null, res))
      .catch(e => {
        console.log(e)
        callback(e)
      });
};

function _handleOutgoingMessage (msg) {
  return https.parseJson(msg)
      .then(messageHandler.parseOutgoing)
      .then(_sendMessage)
      .catch(e => _handleError(e, msg))
      .then(analytics.logToAnalytics);
}

function _handleError (error, msg) {
  console.log('error processing message:', msg);
  console.log(error.message, error.stack);
  var errorParams = {
    error: error.message
  };
  var message = Object.assign({}, msg, errorParams);
  return _sendMessage(message);
}

// extract message from the event. two possible event sources are SNS and HTTP.
// We need to inspect the event contents to determine which one it's from and parse them accordingly.
function _parseMessagesFromEvent (event) {
  //TODO: there's gotta be a better way to determine the event source
  if (event['Records']) {
    return _parseSnsEvent(event);
  } else if (event['body']) {
    return _parseHttpEvent(event);
  } else {
    return Promise.reject(new Error("Can't determine event source"));
  }
}

function _parseSnsEvent (event) {
  var messages = event['Records'].map(r => r['Sns']['Message']);
  return Promise.all(messages.map(https.parseJson));
}

function _parseHttpEvent (event) {
  var message = event['body'];
  return https.parseJson(message)
      .then(res => [res]);
}

//send a single message using the apprioriate service
function _sendMessage (msg) {
  var service_name = msg.service_name;

  if (secrets[service_name] && !secrets[service_name].enabled) {
    throw new Error('Service disabled: ' + service_name);
  }

  switch (service_name) {
    case 'messenger':
      return messenger.sendMessage(msg.service_user_id, msg.text)
          .then(sendReceipt => Object.assign({}, msg, { sendReceipt }));

    case 'twilio':
      return twilio.sendMessage(msg.service_user_id, msg.text)
          .then(sendReceipt => Object.assign({}, msg, { sendReceipt }));

    case 'skype':
      return skype.sendMessage(msg.service_user_id, msg.text)
          .then(sendReceipt => Object.assign({}, msg, { sendReceipt }));

    default:
      throw new Error('Unknown service: ' + service_name);
  }
}

function _formatResponse (res) {
  var response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(res),
  };

  return response;
}

