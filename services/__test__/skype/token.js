'use strict'

import test from 'blue-tape'
import isPlainObject from 'lodash.isplainobject'
import { token } from '../../skype'

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
    id: '8ccd7a31-d8a0-4058-81ee-f57addf8246c',
    pass: 'hepzYURMqKOHkayFgrwJwiO',
    bot_id: '8ccd7a31-d8a0-4058-81ee-f57addf8246c',
    bot_name: 'Abi - Test',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'config\' for interacting with SKYPE.')
})