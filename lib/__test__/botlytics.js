'use strict';

const test = require('blue-tape')
const nock = require('nock')

const botlytics = require('../botlytics')
const botlyticsNock = nock('https://botlytics.co')
const isEqual = require('lodash/fp/isEqual')

test('send(): logs an inbound message to botlytics', assert => {
  const expected =

  botlyticsNock.post('/api/v1/messages', {
      message: {
        text: 'hello, world!',
        kind: 'incoming' ,
        conversation_identifier: 'twilio/+1234567890',
        sender_identifier: 'twilio/+1234567890',
        platform: 'twilio',
      }
    })
    .query({
      token: /\w+/,
    })
    .reply(200, {})

  return botlytics.send('incoming', 'twilio/+1234567890', 'hello, world!')
    .then(assert.ok)
})

test('send(): logs an outbound message to botlytics', assert => {
  botlyticsNock.post('/api/v1/messages', {
      message: {
        text: 'bye bye',
        kind: 'outgoing' ,
        conversation_identifier: 'twilio/+1234567890',
        sender_identifier: 'twilio/+1234567890',
        platform: 'twilio',
      }
    })
    .query({
      token: /\w+/,
    })
    .reply(200, {})

  return botlytics.send('outgoing', 'twilio/+1234567890', 'bye bye')
      .then(assert.ok)
})
