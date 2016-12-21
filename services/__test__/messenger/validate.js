'use strict'

import nock from 'nock'
import test from 'blue-tape'

import messenger from '../../messenger'

const facebookNock = nock('https://graph.facebook.com')

test('MESSENGER-validate(): validates if token is correct', assert => {
  facebookNock.post('/v2.6/me/subscribed_apps')
    .query(true)
    .reply(200, 1234567890)

  var event = {
    method: 'GET',
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'test_token',
      'hub.challenge': '1234567890',
    },
  }

  var expected = Object.assign({}, event, {
    response: 1234567890,
  })

  return messenger.receiver(event)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-validate(): does not validate if token is incorrect', assert => {
  facebookNock.post('/v2.6/me/subscribed_apps')
    .query(true)
    .reply(200, 1234567890)

  var event = {
    method: 'GET',
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'thisisaninvalidtokenmwahahah',
      'hub.challenge': '1234567890',
    },
  }

  var promise = messenger.receiver(event)
  return assert.shouldFail(promise)
})
