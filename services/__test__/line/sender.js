'use strict'

import test from 'blue-tape'
import nock from 'nock'
import { sender } from '../../line'

const lineNock = nock('https://api.line.me')

test(`LINE-'sender' should throw when it fails to sends the message.`, t => {
  lineNock.post('/v2/bot/message/push', {
    to: 'USER_ID',
    messages: [{
      text: 'hello from line',
      type: 'text',
    }],
  })
  .replyWithError({ message: 'Unauthorized' })

  return t.shouldFail(sender('USER_ID', 'hello from line'), /Unauthorized/)
})

test(`LINE-'sender' sends a single message`, t => {
  lineNock.post('/v2/bot/message/push', {
    to: 'USER_ID',
    messages: [{
      text: 'hello from line',
      type: 'text',
    }],
  })
  .reply(200, {})

  return sender('USER_ID', 'hello from line')
    .then(t.ok)
})

test(`LINE-'sender' sends message in chunks when message is too large`, t => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  lineNock.post('/v2/bot/message/push', {
    to: 'USER_ID',
    messages: [{
      text: first,
      type: 'text',
    }],
  })
  .reply(200, {})

  lineNock.post('/v2/bot/message/push', {
    to: 'USER_ID',
    messages: [{
      text: second,
      type: 'text',
    }],
  })
  .reply(200, {})

  return sender('USER_ID', first + second)
    .then(_ => t.pass('Sends multiple messages.'))
})

