'use strict'

import test from 'blue-tape'
import nock from 'nock'
import messenger from '../../messenger'

var facebookNock = nock('https://graph.facebook.com')

test('MESSENGER-sender(): sends a single message', assert => {
  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: 'hello world!' },
  })
  .query(true)
  .reply(200, {})

  return messenger.sender('USER_ID', 'hello world!')
    .then(assert.ok)
})

test('MESSENGER-sender(): chunks and sends a large message', assert => {
  var first = new Array(300 + 2).join('x')
  var second = new Array(300 + 1).join('y')

  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: first },
  })
  .query(true)
  .reply(200, {})

  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: second },
  })
  .query(true)
  .reply(200, {})

  return messenger.sender('USER_ID', first + second)
    .then(_ => assert.pass('Sends multiple messages.'))
})
