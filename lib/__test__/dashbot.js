'use strict';

const test = require('blue-tape')
const nock = require('nock')

const dashbot = require('../dashbot')
const dashbotNock = nock('https://tracker.dashbot.io')
const isEqual = require('lodash/fp/isEqual')

test('send(): logs an inbound message to dashbot', assert => {
  const expected = {
    userId: 'twilio/+1234567890',
    text: 'hello, world!',
  }

  dashbotNock.post('/track', body => isEqual(body, expected)).query({
    platform: 'generic',
    v: '0.7.4-rest',
    type: 'incoming',
    apiKey: /\w+/,
  }).reply(200, {})

  return dashbot.send('incoming', 'twilio/+1234567890', 'hello, world!').then(assert.ok)
})

test('send(): logs an outbound message to dashbot', assert => {
  dashbotNock.post('/track', {
    userId: 'twilio/+1234567890',
    text: 'bye bye',
  })
  .query({
    platform: 'generic',
    v: '0.7.4-rest',
    type: 'outgoing',
    apiKey: /\w+/,
  }).reply(200, {})

  const message = {
    service_name: 'twilio',
    service_user_id: '+1234567890',
    text: '',
  }

  return dashbot.send('outgoing', 'twilio/+1234567890', 'bye bye').then(assert.ok)
})
