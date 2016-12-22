'use strict'

var https = require('../../lib/https')

var SERVICE_NAME = 'telegram'

module.exports = function LINEReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      var messages = json.message.text ? formatMessage(json) : []

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function formatMessage(json) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: String(json.message.from.id),
    text: json.message.text,
    timestamp: json.message.date,
  }]
}
