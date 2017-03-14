'use strict'

const test = require('blue-tape')
const messenger = require('../../messenger')


test('MESSENGER-receiver(): should parse a single message', assert => {
  var singleMessage = require('../events/messenger_single.json')
  var expected = Object.assign({}, singleMessage, {
    messages: [{
      service_name: 'messenger',
      service_user_id: 'USER_ID',
      text: 'hello, world!',
      timestamp: 1458692752478,
    }],
    response: {
      status: 'ok',
    },
  })

  return messenger.receiver(singleMessage)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-receiver(): should parse multiple messages', assert => {
  var multipleMessages = require('../events/messenger_multiple.json')
  var expected = Object.assign({}, multipleMessages, {
    messages: [{
      service_name: 'messenger',
      service_user_id: 'USER_ID_1',
      text: 'hello, world!',
      timestamp: 1458692752478,
    }, {
      service_name: 'messenger',
      service_user_id: 'USER_ID_2',
      text: 'goodbye cruel world',
      timestamp: 1458692752785,
    }],
    response: {
      status: 'ok',
    },
  })

  return messenger.receiver(multipleMessages)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-receiver(): ignores non message events', assert => {
  var nonMessages = require('../events/messenger_other.json')
  var expected = Object.assign({}, nonMessages, {
    messages: [],
    response: {
      status: 'ok',
    },
  })

  return messenger.receiver(nonMessages)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-receiver(): parses postback events', assert => {
  var postback = require('../events/messenger_postback.json')
  var expected = Object.assign({}, postback, {
    messages: [{
      service_name: 'messenger',
      service_user_id: 'USER_ID',
      text: 'USER_DEFINED_PAYLOAD',
      timestamp: 1458692752478,
    }],
    response: {
      status: 'ok',
    },
  })

  return messenger.receiver(postback)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-receiver(): parses json if the message is a string', assert => {
  var singleMessage = require('../events/messenger_single.json')
  var jsonString = JSON.stringify(singleMessage.body)
  var event = Object.assign({}, singleMessage, {
    body: jsonString,
  })

  var expected = Object.assign({}, event, {
    messages: [{
      service_name: 'messenger',
      service_user_id: 'USER_ID',
      text: 'hello, world!',
      timestamp: 1458692752478,
    }],
    response: {
      status: 'ok',
    },
  })

  return messenger.receiver(event)
    .then(res => assert.deepEqual(res, expected))
})

test('MESSENGER-receiver(): fails on invalid json string', assert => {
  var jsonString = 'blah blah"invalidjson"'
  var promise = messenger.receiver(jsonString)
  return assert.shouldFail(promise)
})
