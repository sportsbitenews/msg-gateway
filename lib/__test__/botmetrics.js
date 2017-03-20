'use strict';

const test = require('blue-tape')
const nock = require('nock')

const botmetrics = require('../botmetrics')
const botmetricsNock = nock('https://api.bot-metrics.com')
const isEqual = require('lodash/fp/isEqual')

test('send(): logs an inbound message to botmetrics', assert => {
  const expected = {
    platform: 'twilio',
    user_id: 'twilio/+1234567890',
    message_type: 'incoming',
    text: 'hello, world!',
  }

  botmetricsNock.post('/v1/messages', body => isEqual(body, expected))
    .query({
      token: /\w+/,
    })
    .reply(200, {})

  return botmetrics.send('incoming', 'twilio/+1234567890', 'hello, world!')
    .then(assert.ok)
})

test('send(): logs an outbound message to botmetrics', assert => {
  botmetricsNock.post('/v1/messages', {
    platform: 'twilio',
    user_id: 'twilio/+1234567890',
    message_type: 'outgoing',
    text: 'bye bye',
  })
  .query({
    token: /\w+/,
  })
  .reply(200, {})

  return botmetrics.send('outgoing', 'twilio/+1234567890', 'bye bye')
      .then(assert.ok)
})
