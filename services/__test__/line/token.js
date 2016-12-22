'use strict'

import test from 'blue-tape'
import isPlainObject from 'lodash.isplainobject'
import { token } from '../../line'

const stage = process.env.SERVERLESS_STAGE || 'test'

test(`LINE-'token' is a function`, t => {
  t.plan(1)
  t.equal(typeof token, 'function', 'Should be a function.')
})

test(`LINE-'token' returns an object`, t => {
  t.plan(1)
  t.ok(isPlainObject(token(stage)), 'Should be a javascript Object.')
})

test(`LINE-'token' return the necessary configuration keys for LINE`, t => {
  const config = token(stage)
  const expected = {
    channel_access_token: 'krm8bkWY+mUV0AoSxlMNFPi2QF9DEVxuLLsgkkjR3dFIlxVx6oDW4IdnJx88aw8vtEe/pcA8rnpWRB+GFjXJZl7w5/6MpwHTEDTmjmsQrhRNfZ9DY0YT0jA2lb3yHPhJdX/rcv+G/oz+YFYnJUyH6QdB04t89/1O/w1cDnyilFU=',
  }

  t.plan(1)
  t.deepEqual(config, expected, 'Should return the \'channel_access_token\' for interacting with LINE.')
})
