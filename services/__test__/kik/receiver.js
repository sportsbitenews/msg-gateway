'use strict'

import test from 'blue-tape'
import { receiver } from '../../kik'

test(`KIK-'receiver' should parse a single message`, t => {
  const singleMessage = require('../events/kik_single.json')
  const expected = Object.assign({}, singleMessage, {
    messages: [{
      service_name: 'kik',
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

test(`KIK-'receiver' should parse multiple messages`, t => {
  const multiple = require('../events/kik_multiple.json')
  const expected = Object.assign({}, multiple, {
    messages: [
      {
        service_name: 'kik',
        service_user_id: 'yonah_forst',
        text: 'Hello abi',
        timestamp: 1439576628405,
      },
      {
        service_name: 'kik',
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

test(`KIK-'receiver' should ignore non text messages.`, t => {
  const other = require('../events/kik_other.json')
  const expected = Object.assign({}, other, {
    messages: [],
    response: {
      status: 'ok',
    },
  })

  return receiver(other)
    .then(response => t.deepEqual(response, expected))
})

test(`KIK-'receiver' fails on invalid json string`, t => {
  const jsonString = 'blah blah"invalidjson'
  const promise = receiver(jsonString)

  return t.shouldFail(promise)
})
