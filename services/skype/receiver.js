'use strict'

var https = require('../../lib/https')

var SERVICE_NAME = 'skype'

module.exports = function skypeReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      if (json.type !== 'message') {
        return []
      }

      return Object.assign({}, ev, {
        messages: formatMessageEvent(json),
        response: { status: 'ok' },
      })
    })
}

function formatMessageEvent(json) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: json.from.id,
    text: json.text,
    timestamp: json.timestamp,
  }]
}
