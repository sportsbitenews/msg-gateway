'use strict'

const test = require('blue-tape')
const receiver = require('../../skype').receiver

test(`SKYPE-'receiver' should parse a single message`, t => {
  const singleMessage = require('../events/skype_single.json')
  const expected = Object.assign({}, singleMessage, {
    messages: [{
      service_name: 'skype',
      service_user_id: 'yonah_forst',
      text: 'Hi abi',
      timestamp: 1439576628405,
    }],
    response: {
      status: 'ok',
    },
  })

  return receiver(singleMessage)
    .then(response => t.deepEqual(response, expected))
})

test(`SKYPE-'receiver' should ignore non text messages.`, t => {
  const other = require('../events/skype_other.json')
  const expected = Object.assign({}, other, {
    messages: [],
    response: {
      status: 'ok',
    },
  })

  return receiver(other)
    .then(response => t.deepEqual(response, expected))
})

test(`SKYPE-'receiver' fails on invalid json string`, t => {
  const jsonString = 'blah blah"invalidjson'
  const promise = receiver(jsonString)

  return t.shouldFail(promise)
})
