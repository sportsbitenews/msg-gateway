'use strict'

const test = require('blue-tape')
const isPlainObject = require('lodash.isplainobject')
const token = require('../../skype').token

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`SKYPE-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`SKYPE-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`SKYPE-'token' return the necessary configuration keys for SKYPE`, t => {
  const config = token(stage)
  const expected = {
    id: 'eb376078-b4bf-4cfc-8df9-484ce54f6829',
    pass: 'xU7YBp0W1QCQGusKriwPU3A',
    bot_id: 'eb376078-b4bf-4cfc-8df9-484ce54f6829',
    bot_name: 'Abi - Test',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'config\' for interacting with SKYPE.')
})
