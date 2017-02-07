'use strict'

var strip = require('striptags')
var https = require('../../lib/https')

var SERVICE_NAME = 'skype'

module.exports = function skypeReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      let messages

      if (json.type !== 'message') {
        messages = []
      } else {
        messages = formatMessageEvent(json)
      }

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function formatMessageEvent(json) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: json.from.id,
    text: strip(json.text),
    timestamp: json.timestamp,
  }]
}
