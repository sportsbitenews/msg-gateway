'use strict'

const test = require('blue-tape')
const isPlainObject = require('lodash.isplainobject')

const token = require('../../wechat').token

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`WECHAT-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`WECHAT-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`WECHAT-'token' return the necessary configuration keys for wechat`, t => {
  const config = token(stage)
  const expected = {
    appId: 'wechatappid123456',
    appSecret: 'amsdlakm2oim1lm1lm2k1m',
    verifyToken: 'coolrunnings'
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'config\' for interacting with wechat.')
})
