'use strict'

var https = require('../../lib/https')

var SERVICE_NAME = 'kik'

module.exports = function kikReceiver (ev) {
  return https.parseJson(ev.body)
    .then(json => {
      var toProcess = filterMessagesEvents(json.messages)
      var messages = formatMessages(toProcess)

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function filterMessagesEvents(messages) {
  return messages.filter(m => m.type === 'text')
}

function formatMessages(messages) {
  return messages.map(message => ({
    service_name: SERVICE_NAME,
    service_user_id: message.from,
    text: message.body,
    timestamp: message.timestamp,
  }))
}
