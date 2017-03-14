'use strict'

const test = require('blue-tape')
const receiver = require('../../line').receiver

test(`LINE-'receiver' should parse a single message`, t => {
  const singleMessage = require('../events/line_single.json')
  const expected = Object.assign({}, singleMessage, {
    messages: [{
      service_name: 'line',
      service_user_id: 'yonah_forst',
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

test(`LINE-'receiver' should parse multiple messages`, t => {
  const multiple = require('../events/line_multiple.json')
  const expected = Object.assign({}, multiple, {
    messages: [
      {
        service_name: 'line',
        service_user_id: 'yonah_forst',
        text: 'Hello abi',
        timestamp: 1439576628405,
      },
      {
        service_name: 'line',
        service_user_id: 'yonah_forst',
        text: 'Second',
        timestamp: 1439576628405,
      },
    ],
    response: {
      status: 'ok',
    },
  })

  return receiver(multiple)
    .then(response => t.deepEqual(response, expected))
})

test(`LINE-'receiver' should ignore non text messages.`, t => {
  const other = require('../events/line_other.json')
  const expected = Object.assign({}, other, {
    messages: [],
    response: {
      status: 'ok',
    },
  })

  return receiver(other)
    .then(response => t.deepEqual(response, expected))
})

test(`LINE-'receiver' fails on invalid json string`, t => {
  const jsonString = 'blah blah"invalidjson'
  const promise = receiver(jsonString)

  return t.shouldFail(promise)
})
