'use strict'

const test = require('blue-tape')
const isPlainObject = require('lodash.isplainobject')

const token = require('../../twilio').token
const stage = process.env.SERVERLESS_STAGE || 'test'

test(`TWILIO-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`TWILIO-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`TWILIO-'token' return the necessary configuration keys for kik`, t => {
  const config = token(stage)
  const expected = {
    'account_sid': 'AC464a930a1b8ed60a2238bb5344e6b36e',
    'messaging_service_sid': 'MG80b880f23be9d2ac9f61b1605da9a2a6',
    'api_key_sid': 'SKc944a344f6b6083ec477dfaf365bfa37',
    'api_key_secret': 'Rmf36NKUKnbmPXmIlGwQbdywjkzx70cW',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'config\' for interacting with twilio.')
})
