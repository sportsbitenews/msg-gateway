'use strict'

const test = require('blue-tape')
const wechat = require('../../wechat')

test('WECHAT-validate(): validates if token is correct', assert => {

  var event = {
    method: 'GET',
    query: {
      'signature': '233d0bf51d99b60b5c77af8f0602335393b40ddf',
      'timestamp': '1234567890',
      'nonce': '987654321',
      'echostr': 'somecrazyrandomstring',
    },
  }

  var expected = Object.assign({}, event, {
    response: 'somecrazyrandomstring',
  })

  return wechat.receiver(event)
    .then(res => assert.deepEqual(res, expected))
})

test('WECHAT-validate(): does not validate if token is incorrect', assert => {

  var event = {
    method: 'GET',
    query: {
      'signature': 'ijsodifjsiodjfoisdjfiosdjfoi',
      'timestamp': '1234567890',
      'nonce': '987654321',
      'echostr': 'somecrazyrandomstring',
    },
  }

  var promise = wechat.receiver(event)
  return assert.shouldFail(promise)
})
