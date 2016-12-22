'use strict'

import test from 'blue-tape'
import nock from 'nock'
import { sender } from '../../kik'

const kikNock = nock('https://api.kik.com')

test(`KIK-'sender' should throw when it fails to sends the message.`, t => {
  kikNock.post('/v1/message', {
    messages: [{
      to: 'USER_ID',
      body: 'hello from kik',
      type: 'text',
      typeTime: /\d.+/,
    }],
  })
  .replyWithError({ message: 'Unauthorized' })

  return t.shouldFail(sender('USER_ID', 'hello from kik'), /Unauthorized/)
})

test(`KIK-'sender' sends a single message`, t => {
  kikNock.post('/v1/message', {
    messages: [{
      to: 'USER_ID',
      body: 'hello from kik',
      type: 'text',
      typeTime: /\d.+/,
    }],
  })
  .reply(200, {})

  return sender('USER_ID', 'hello from kik')
    .then(t.ok)
})

test(`KIK-'sender' sends message in chunks when message is too large`, t => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  kikNock.post('/v1/message', {
    messages: [{
      to: 'USER_ID',
      body: first,
      type: 'text',
      typeTime: /\d.+/,
    }],
  })
  .reply(200, {})

  kikNock.post('/v1/message', {
    messages: [{
      to: 'USER_ID',
      body: second,
      type: 'text',
      typeTime: /\d.+/,
    }],
  })
  .reply(200, {})

  return sender('USER_ID', first + second)
    .then(_ => t.pass('Sends multiple messages.'))
})

