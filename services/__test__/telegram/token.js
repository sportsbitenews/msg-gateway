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

test(`TELEGRAM-'token' return the necessary configuration keys for TELEGRAM`, t => {
  const config = token(stage)
  const expected = {
    token: '378856089:AAEok3Fs15vGBLV8X7p9tvjs0EsOfX0-1dQ',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'token\' for interacting with TELEGRAM.')
})
