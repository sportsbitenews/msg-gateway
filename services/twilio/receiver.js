'use strict'

var qs = require('querystring')

var SERVICE_NAME = 'twilio'

module.exports = function twilioReceiver (event) {
  var response = `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`
  var query = event.method === 'GET' ? event.query : qs.parse(event.body)

  if (!event.method && (!event.body || !event.query)) {
    return Promise.reject(new Error('Couldn\'t process event.query. Invalid event.'))
  }

  return Promise.resolve(Object.assign({}, event, {
    messages: parseMessages(query),
    response,
  }))
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
