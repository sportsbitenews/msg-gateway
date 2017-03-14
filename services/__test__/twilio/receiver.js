'use strict'

const test = require('blue-tape')
const receiver = require('../../twilio').receiver

test('TWILIO-\'receiver\' should parse a single message from body', assert => {
  var event = {
    method: 'POST',
    body: 'From=%2B123456789&Body=Hello%2C%20world!&Timestamp=1458692752478',
  }

  var expected = Object.assign({}, event, {
    messages: [{
      service_name: 'twilio',
      service_user_id: '+123456789',
      text: 'Hello, world!',
      timestamp: 1458692752478,
    }],
    response: `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`,
  })

  return receiver(event)
    .then(res => assert.deepEqual(res, expected))
})

test('TWILIO-\'receiver\' should parse a single message from query', assert => {
  var event = {
    method: 'GET',
    query: {
      From: '+123456789',
      Body: 'Hello, world!',
      Timestamp: 1458692752478,
    },
  }

  var expected = Object.assign({}, event, {
    messages: [{
      service_name: 'twilio',
      service_user_id: '+123456789',
      text: 'Hello, world!',
      timestamp: 1458692752478,
    }],
    response: `<?xml version="1.0" encoding="UTF-8" ?><Response></Response>`,
  })

  return receiver(event)
    .then(res => assert.deepEqual(res, expected))
})

test('TWILIO-\'receiver\' uses current time if timestamp is missing', assert => {
  var event = {
    method: 'POST',
    body: 'From=%2B123456789&Body=Hello%2C%20world!',
  }

  var now = new Date().getTime()
  var then = now + 100

  return receiver(event)
    .then(res => assert.ok(res.messages[0].timestamp >= now && res.messages[0].timestamp <= then))
})

test(`TWILIO-'receiver' fails on invalid json string`, t => {
  const jsonString = 'blah blah"invalidjson'
  const promise = receiver(jsonString)

  return t.shouldFail(promise)
})
