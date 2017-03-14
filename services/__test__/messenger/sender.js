'use strict'

const test = require('blue-tape')
const nock = require('nock')
const messenger = require('../../messenger')

var facebookNock = nock('https://graph.facebook.com')

facebookNock.post('/v2.6/me/messages', {
  recipient: { id: 'USER_ID' },
  sender_action: 'typing_on',
}).query(true).reply(200, {})

facebookNock.post('/v2.6/me/messages', {
  recipient: { id: 'USER_ID' },
  sender_action: 'typing_off',
}).query(true).reply(200, {})

facebookNock.post('/v2.6/me/messages', {
  recipient: { id: 'USER_ID' },
  sender_action: /mark_seen/,
}).query(true).reply(200, {})


test('MESSENGER-sender: sends a single message', assert => {
  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: 'hello world!' },
  })
  .query(true)
  .reply(200, {})

  return messenger.sender('USER_ID', 'hello world!')
    .then(assert.ok)
})

test('MESSENGER-sender: chunks and sends a large message', assert => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: first },
  }).query(true).reply(200, {})

  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    sender_action: 'typing_off',
  }).query(true).reply(200, {})

  facebookNock.post('/v2.6/me/messages', {
    recipient: { id: 'USER_ID' },
    message: { text: second },
  }).query(true).reply(200, {})

  return messenger.sender('USER_ID', first + second)
    .then(_ => assert.pass('Sends multiple messages.'))
})
