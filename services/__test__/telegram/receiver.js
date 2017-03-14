'use strict'

const test = require('blue-tape');
const receiver = require('../../telegram').receiver


test(`TELEGRAM-'receiver' should parse a single message`, t => {
  const singleMessage = require('../events/telegram_single.json')
  const expected = Object.assign({}, singleMessage, {
    messages: [{
      service_name: 'telegram',
      service_user_id: 'USER_ID',
      text: 'Hello abi',
      timestamp: 1439576628405,
    }],
    response: {
      status: 'ok',
    },
  })

  return receiver(singleMessage)
    .then(response => t.deepEqual(response, expected))
})

test(`TELEGRAM-'receiver' should ignore non text messages.`, t => {
  const other = require('../events/telegram_other.json')
  const expected = Object.assign({}, other, {
    messages: [],
    response: {
      status: 'ok',
    },
  })

  return receiver(other)
    .then(response => t.deepEqual(response, expected))
})

test(`TELEGRAM-'receiver' fails on invalid json string`, t => {
  const jsonString = 'blah blah"invalidjson'
  const promise = receiver(jsonString)

  return t.shouldFail(promise)
})
