'use strict'

const test = require('blue-tape')
const isPlainObject = require('lodash.isplainobject')
const token = require('../../messenger').token

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`MESSENGER-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`MESSENGER-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`MESSENGER-'token' return the necessary configuration keys for MESSENGER`, t => {
  const config = token(stage)
  const expected = {
    verifyToken: 'test_token',
    page_access_token: 'EAAD9FtcPt7MBALRV5KJowNfmoSPmv8N1kEEbwotbDMlGFrCcAHy9ht4nZBubOqbOcFvvzB4FGd74UESNZBeWvmZB4lmDx9MaXWbxvXnBiaP6614MlVzCZAn8lvyQBDrOzm7Kw2s14jFklYtLlNmSn7LJKMDyUZChCbAn5f4PnmAZDZD',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'config\' for interacting with MESSENGER.')
})
