'use strict'

var strip = require('striptags')
var https = require('../../lib/https')

var SERVICE_NAME = 'line'

module.exports = function lineReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      var toProcess = filterMessagesEvents(json.events)
      var messages = formatMessages(toProcess)

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function filterMessagesEvents(messages) {
  return messages.filter(m => m.type === 'message' && m.message.type === 'text')
}

function formatMessages(events) {
  return events.map(event => ({
    service_name: SERVICE_NAME,
    service_user_id: event.source.userId,
    text: strip(event.message.text),
    timestamp: event.timestamp,
  }))
}
