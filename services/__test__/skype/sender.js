'use strict'

const test = require('blue-tape')
const nock = require('nock')
const qs = require('querystring')
const sender = require('../../skype').sender

const authNock = nock('https://login.microsoftonline.com')
const skypeNock = nock('https://skype.botframework.com')

authNock.post('/common/oauth2/v2.0/token', {
    grant_type: 'client_credentials',
    client_id: 'eb376078-b4bf-4cfc-8df9-484ce54f6829',
    client_secret: 'xU7YBp0W1QCQGusKriwPU3A',
    scope: 'https://graph.microsoft.com/.default',
}).reply(200, `{"access_token":"kjn12jk3n2jn1lk2jn3198sank","expires_in":1187270,"random":"${Math.random()}"}`).persist();

test(`SKYPE-'sender'.getAuth() should load the token the first time, then from cache.`, t => {
  return sender.getAuth()
    .then(firstResponse => {
      t.equal(firstResponse.token, 'kjn12jk3n2jn1lk2jn3198sank')
      sender.getAuth().then(secondResponse => t.equal(firstResponse.random, secondResponse.random))
    })
})

test(`SKYPE-'sender'.getConversation() should make a request to ensure that we have a conversation_id to send the message`, t => {
  authNock.post('/common/oauth2/v2.0/token').query(true).reply(200, JSON.stringify({ token: Math.random() }))
  skypeNock.post('/v3/conversations', {
    bot: { id: 'eb376078-b4bf-4cfc-8df9-484ce54f6829', name: 'Abi - Test' },
    members: [{ id: 'USER_ID' }],
  }).reply(200, {})

  return sender.getConversation('USER_ID')
    .then(t.ok)
})

test(`SKYPE-'sender' sends a single message`, t => {
  skypeNock.post('/v3/conversations').reply(200, {})
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

  skypeNock.post('/v3/conversations').reply(200, {})
  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: first,
    timestamp: /\d.+/,
  })
  .reply(200, {})

  skypeNock.post('/v3/conversations').reply(200, {})
  skypeNock.post(/\/v3\/conversations\/\w.+?\/activities/, {
    type: 'message',
    text: second,
    timestamp: /\d.+/,
  })
  .reply(200, {})

  return sender('USER_ID', first + second)
    .then(_ => t.pass('Sends multiple messages.'))
})

