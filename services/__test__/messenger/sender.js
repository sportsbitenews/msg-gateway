'use strict'

import test from 'blue-tape'
import nock from 'nock'
import messenger from '../../messenger'

var facebookNock = nock('https://graph.facebook.com')

facebookNock.post('/v2.6/me/messages?access_token=EAAD9FtcPt7MBALRV5KJowNfmoSPmv8N1kEEbwotbDMlGFrCcAHy9ht4nZBubOqbOcFvvzB4FGd74UESNZBeWvmZB4lmDx9MaXWbxvXnBiaP6614MlVzCZAn8lvyQBDrOzm7Kw2s14jFklYtLlNmSn7LJKMDyUZChCbAn5f4PnmAZDZD', {
  recipient: { id: 'USER_ID' },
  sender_action: /typing_(on|off)/,
}).reply(200, {})

facebookNock.post('/v2.6/me/messages?access_token=EAAD9FtcPt7MBALRV5KJowNfmoSPmv8N1kEEbwotbDMlGFrCcAHy9ht4nZBubOqbOcFvvzB4FGd74UESNZBeWvmZB4lmDx9MaXWbxvXnBiaP6614MlVzCZAn8lvyQBDrOzm7Kw2s14jFklYtLlNmSn7LJKMDyUZChCbAn5f4PnmAZDZD', {
  recipient: { id: 'USER_ID' },
  sender_action: /mark_seen/,
}).reply(200, {})


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
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  facebookNock.post('/v2.6/me/messages?access_token=EAAD9FtcPt7MBALRV5KJowNfmoSPmv8N1kEEbwotbDMlGFrCcAHy9ht4nZBubOqbOcFvvzB4FGd74UESNZBeWvmZB4lmDx9MaXWbxvXnBiaP6614MlVzCZAn8lvyQBDrOzm7Kw2s14jFklYtLlNmSn7LJKMDyUZChCbAn5f4PnmAZDZD', {
    recipient: { id: 'USER_ID' },
    message: { text: first },
  }).reply(200, {})

  facebookNock.post('/v2.6/me/messages?access_token=EAAD9FtcPt7MBALRV5KJowNfmoSPmv8N1kEEbwotbDMlGFrCcAHy9ht4nZBubOqbOcFvvzB4FGd74UESNZBeWvmZB4lmDx9MaXWbxvXnBiaP6614MlVzCZAn8lvyQBDrOzm7Kw2s14jFklYtLlNmSn7LJKMDyUZChCbAn5f4PnmAZDZD', {
    recipient: { id: 'USER_ID' },
    message: { text: second },
  }).reply(200, {})

  return messenger.sender('USER_ID', first + second)
    .then(_ => assert.pass('Sends multiple messages.'))
})
