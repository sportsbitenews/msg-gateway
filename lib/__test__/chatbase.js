'use strict';

const test = require('blue-tape')
const nock = require('nock')

const chatbase = require('../chatbase')
const chatbaseNock = nock('https://chatbase.com')
const isEqual = require('lodash/fp/isEqual')

test('send(): logs an inbound message to chatbase', assert => {
  const expected = {
    platform: 'twilio',
    user_id: 'user-1234',
    intent: 'foo.bar',
    type: 'user',
    message: 'hello, world!',
    version: 1.0,
  }

  chatbaseNock.post('/api/message', body => {
    delete body.api_key
    delete body.time_stamp
    return isEqual(body, expected)
  })
  .reply(200, {})

  return chatbase.send('incoming', 'user-1234', 'hello, world!', 'foo.bar', 'twilio')
    .then(assert.ok)
})

test('send(): logs an outbound message to chatbase', assert => {
  const expected = {
    platform: 'twilio',
    user_id: 'user-1234',
    intent: 'foo.bar',
    type: 'agent',
    message: 'hello, world!',
    version: 1.0,
  }

  chatbaseNock.post('/api/message', body => {
    delete body.api_key
    delete body.time_stamp
    return isEqual(body, expected)
  })
  .reply(200, {})

  return chatbase.send('outgoing', 'user-1234', 'hello, world!', 'foo.bar', 'twilio')
    .then(assert.ok)
})
