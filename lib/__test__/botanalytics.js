var test = require('blue-tape')
var nock = require('nock');

var botanalytics = require('../botanalytics')
var botanalyticsNock = nock('https://botanalytics.co')
var isEqual = require('lodash/fp/isEqual');

test('send(): logs an inbound message to botanalytics', assert => {

  var expected = {
    platform: 'generic',
    is_sender_bot: false,
    user: {
      id: 'twilio/+1234567890',
    },
    message: {
      text: 'hello, world!',
    },
  }

  botanalyticsNock.post('/api/v1/messages/generic/', body => isEqual(body, expected))
      .query({
        token: /\w+/,
      })
      .reply(200, {})

  return botanalytics.send('incoming', 'twilio/+1234567890', 'hello, world!')
      .then(assert.ok)
})


test('send(): logs an outbound message to botanalytics', assert => {
  botanalyticsNock.post('/api/v1/messages/generic/', {
    platform: 'generic',
    is_sender_bot: true,
    user: {
      id: 'twilio/+1234567890',
    },
    message: {
      text: 'bye bye',
    },
  })
      .query({
        token: /\w+/,
      })
      .reply(200, {})

  return botanalytics.send('outgoing', 'twilio/+1234567890', 'bye bye')
      .then(assert.ok)
})
