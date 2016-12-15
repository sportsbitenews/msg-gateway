'use strict';

var request = require('request-promise');
var https = require('../lib/https');
var stage = process.env.SERVERLESS_STAGE || 'dev';
var secrets = require(`../secrets.${stage}.json`);

var utils = require('../lib/utils');


var TOKEN = {};
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
};

var CHECK_REQUEST = {
  url: _getFullyQualifiedPath('/conversations'),
  method: 'POST',
  json: true,
};

function processEvent(ev) {
  return _parseMessages(ev.body)
    .then(messages => Object.assign({}, ev, {
      messages,
      response: {
        status: 'ok'
      }
    }));
}

function _parseMessages(body) {
  return https.parseJson(body)
    .then(_formatMessages)
}

function _formatMessages(json) {
  return [{
    service_name: service_name,
    service_user_id: json.from.id,
    text: json.text,
    timestamp: json.timestamp,
  }]
}

function sendMessage(service_user_id, message) {
  if (typeof message === 'string' && message.length > 320) {
    message = utils.makeParagraphs(message, 300, '.');
  }

  if (Array.isArray(message)) {
    return sendMessage(service_user_id, message[0])
      .then(() => {
        if (message.length > 1) {
          var text = message.slice(1);

          setTimeout(() => sendMessage(service_user_id, text), utils.calcuatePauseForText(text[0]));
        }
      })
  }

  return _sendSkypeMessage(service_user_id, message);
}

function _sendSkypeMessage(service_user_id, message) {
  var body = {
    type: 'message',
    text: message,
    timestamp: new Date().toISOString(),
  };

  return makeRequest(service_user_id, body);
}

function _getFullyQualifiedPath(path) {
  return `https://skype.botframework.com/v3${path}`;
}

function makeRequest(service_user_id, body) {
  var options = {
    method: 'POST',
    body,
    json: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  if (TOKEN.token && !utils.hasTokenExpired(TOKEN)) {
    return _ensureConversation(service_user_id, TOKEN)
      .then(response => _sendMessageRequest(response.id, options, TOKEN));
  }

  return request(AUTH_REQUEST)
    .then(authResponse => {
      var response = JSON.parse(authResponse);

      TOKEN.token = response.access_token;
      TOKEN.expire_date = new Date().getTime() + response.expires_in * 10;

      return _ensureConversation(service_user_id, TOKEN)
        .then(response => _sendMessageRequest(response.id, options, TOKEN));
    });
}

function _ensureConversation(service_user_id, auth) {
  var checking = Object.assign({}, CHECK_REQUEST, {
    body: {
      bot: {
        id: secrets.skype.bot.id,
        name: secrets.skype.bot.name,
      },
      members: [{
        id: service_user_id
      }],
    },
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return request(checking)
    .then(res => {
      var response = typeof res === 'string' ? JSON.parse(res) : res;
      return Promise.resolve(response);
    })
    .catch(e => {
      throw new Error(e.message);
    });
}

function _sendMessageRequest(conversation_id, options, auth) {
  var config = Object.assign({}, options, {
    url: _getFullyQualifiedPath(`/conversations/${conversation_id}/activities`),
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return request(config)
    .then(response => response)
    .catch(e => {
      throw new Error(e.message);
    });
}

module.exports = {
  processEvent,
  sendMessage,
};
