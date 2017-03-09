'use strict'

import test from 'blue-tape'
import isPlainObject from 'lodash.isplainobject'
import { token } from '../../kik'

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`KIK-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`KIK-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`KIK-'token' return the necessary configuration keys for kik`, t => {
  const config = token(stage)
  const expected = {
    'username': 'abihealth_test',
    'api_key': 'a599ec1e-acb3-45d4-965e-c77afaeedb3c',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'username\' & \'api_key\' for interacting with kik.')
})
