'use strict'

const test = require('blue-tape')
const nock = require('nock')
const isPlainObject = require('lodash.isplainobject')
const token = require('../../telegram').token

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
