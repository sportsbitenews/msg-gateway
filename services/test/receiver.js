'use strict'

const https = require('../../lib/https')

const SERVICE_NAME = 'testing'

module.exports = function testingReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      const message = formatMessage(json.message);

      return Object.assign({}, ev, {
        message,
        response: { status: 'ok' },
      });
    });
}

function formatMessages(message) {
  return ({
    service_name: SERVICE_NAME,
    service_user_id: message.from,
    text: message.body,
    timestamp: message.timestamp || new Date().getTime(),
  });
}
