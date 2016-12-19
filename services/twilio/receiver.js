'use strict'

var qs = require('querystring')

var SERVICE_NAME = 'twilio'

module.exports = function twilioReceiver (ev) {
  var response = `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`
  var query = ev.method === 'GET' ? ev.query : qs.parse(ev.body)

  return Object.assign({}, ev, {
    messages: parseMessages(query),
    response,
  })
}

function parseMessages(query) {
  var serviceUserId = query['From']
  var text = query['Body']
  var timestamp = query['Timestamp'] ? parseInt(query['Timestamp']) : new Date().getTime()

  return [{
    service_name: SERVICE_NAME,
    service_user_id: serviceUserId,
    text,
    timestamp,
  }]
}
