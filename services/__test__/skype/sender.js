'use strict'

import test from 'blue-tape'
import nock from 'nock'
import { sender, token } from '../../skype'

const config = token(process.env.SERVERLESS_STAGE || 'test')
const authNock = nock('https://login.microsoftonline.com')
const skypeNock = nock('https://skype.botframework.com')

test(`SKYPE-'sender'.makeAuthRequest() should make the Authorization request to get the token.`, t => {
  authNock.post('/common/oauth2/v2.0/token', {
    grant_type: 'client_credentials',
    client_id: config.id,
    client_secret: config.pass,
    scope: 'https://graph.microsoft.com/.default',
  })
  .reply(200, {})

  return sender.makeAuthRequest()
    .then(t.ok)
})

test(`SKYPE-'sender'.ensureConversation() should make a request to ensure that we have a conversation_id to send the message`, t => {
  skypeNock.post('/v3/conversations', {
    bot: {
      id: '8ccd7a31-d8a0-4058-81ee-f57addf8246c',
      name: 'Abi - Test',
    },
    members: [{
      id: 'USER_ID',
    }],
  })
  .reply(200, {})

  return sender.ensureConversation('USER_ID', { token: 'kmk1jn23193' })
    .then(t.ok)
})

test(`SKYPE-'sender' should throw when it fails to sends the message.`, t => {
  authNock.post('/common/oauth2/v2.0/token').reply(200, '{"access_token":"kjn12jk3n2jn1lk2jn3198sank","expires_in":1187270}')
  skypeNock.post('/v3/conversations').reply(200, '{"id":"219821kj3"}')
  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: 'hello from skype',
    timestamp: /\d.+/,
  })
  .replyWithError({ message: 'Unauthorized' })

  return t.shouldFail(sender('USER_ID', 'hello from skype'), /Unauthorized/)
})

test(`SKYPE-'sender' sends a single message`, t => {
  authNock.post('/common/oauth2/v2.0/token').reply(200, '{"access_token":"kjn12jk3n2jn1lk2jn3198sank","expires_in":1187270}')
  skypeNock.post('/v3/conversations').reply(200, '{"id":"219821kj3"}')
  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: 'Skype',
    timestamp: /\d.+/,
  })
  .reply(200, {})

  return sender('USER_ID', 'Skype')
    .then(t.ok)
})

test(`SKYPE-'sender' sends message in chunks when message is too large`, t => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  authNock.post('/common/oauth2/v2.0/token').reply(200, '{"access_token":"kjn12jk3n2jn1lk2jn3198sank","expires_in":1187270}')
  skypeNock.post('/v3/conversations').reply(200, '{"id":"219821kj3"}')

  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: first,
    timestamp: /\d.+/,
  })
  .reply(200, {})

  authNock.post('/common/oauth2/v2.0/token').reply(200, '{"access_token":"kjn12jk3n2jn1lk2jn3198sank","expires_in":1187270}')
  skypeNock.post('/v3/conversations').reply(200, '{"id":"219821kj3"}')
  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: second,
    timestamp: /\d.+/,
  })
  .reply(200, {})

  return sender('USER_ID', first + second)
    .then(_ => t.pass('Sends multiple messages.'))
})

