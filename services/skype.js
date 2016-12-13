'use strict';

var request = require('request-promise');
var https = require('../lib/https');
var stage = process.env.SERVERLESS_STAGE || 'dev';
var secrets = require(`../secrets.${stage}.json`);

var utils = require('../lib/utils');


var service_name = 'skype';
var SKYPE_ID = secrets.skype.app_id;
var SKYPE_PW = secrets.skype.app_password;

var AUTH_REQUEST = {
  url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  method: 'POST',
  form: {
    grant_type: 'client_credentials',
    client_id: SKYPE_ID,
    client_secret: SKYPE_PW,
    scope: 'https://graph.microsoft.com/.default',
  }
}

function processEvent(ev) {
  console.log(ev.body);
  return _parseMessages(ev.body)
    .then(messages => Object.assign({}, ev, { messages, response: { status: 'ok' } }));
}

function _parseMessages(body) {
  return https.parseJson(body)
    .then(_formatMessages)
}

function _formatMessages(json) {
  var conversation_id = json.conversation.id;

  return [{
    service_name: service_name,
    service_user_id: conversation_id,
    text: json.text,
    timestamp: json.timestamp,
    recipient: json.from,
    from: json.recipient,
    conversation: json.conversation,
  }]
}

function sendMessage(conversation_id, message) {
  if (typeof message === 'string' && message.length > 320) {
    message = utils.makeParagraphs(message, 300, '.');
  }

  if (Array.isArray(message)) {
    return sendMessage(conversation_id, message[0])
      .then(() => {
        if (message.length > 1) {
          var text = message.slice(1);

          setTimeout(() => sendMessage(conversation_id, text), utils.calcuatePauseForText(text[0]));
        }
      })
  }

  return _sendSkypeMessage(conversation_id, message);
}

function _sendSkypeMessage(conversation_id, message) {
  var path = `/conversations/${conversation_id}/activities`;
  var body = {
    type: 'message',
    text: message,
  };

  return makeRequest(path, body);
}

function makeRequest(path, body) {
  var options = {
    url: `https://skype.botframework.com/v3${path}`,
    method: 'POST',
    body,
    json: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  return request(AUTH_REQUEST)
      .then(authResponse => {
        var response = JSON.parse(authResponse);
        var config = Object.assign({}, options, { headers: { Authorization: `Bearer ${response.access_token}` } });

        return request(config)
            .then(res => res)
            .catch(e => { throw new Error(e.message) })
      })
      .catch(e => { throw new Error(e.message) });
}

module.exports = {
  processEvent,
  sendMessage,
};
