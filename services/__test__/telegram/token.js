'use strict'

import test from 'blue-tape'
import isPlainObject from 'lodash.isplainobject'
import { token } from '../../telegram'

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`TELEGRAM-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`TELEGRAM-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`TELEGRAM-'token' return the necessary configuration keys for TELEGRA`, t => {
  const config = token(stage)
  const expected = {
    token: '301394494:AAG4MPg9KcBe3lHeo_siOaseOkYXltc5nZU',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'token\' for interacting with TELEGRAM.')
})
