'use strict'

const test = require('blue-tape')
const nock = require('nock')
const sender = require('../../wechat').sender
const wechatNock = nock('https://api.wechat.com')

wechatNock.get('/cgi-bin/token?grant_type=client_credential&appid=wxbe61854c143724e0&secret=c6c607f0fb38577550dc3c984dfcbc40')
  .reply(200, `{"access_token":"kjn12jk3n2jn1lk2jn3198sank"}`).persist()

test(`WECHAT-sender gets the access_token`, assert => {
  return sender.getAccessToken()
    .then(response => response.json())
    .then(json => {
      assert.equal(json.access_token, 'kjn12jk3n2jn1lk2jn3198sank')
    })
})

test(`WECHAT-sender sends a single message`, assert => {
  wechatNock.post('/cgi-bin/message/custom/send?access_token=kjn12jk3n2jn1lk2jn3198sank', {
    touser: 'wechatuser123',
    msgtype: 'text',
    text: {
      content: 'Hello, world!',
    },
  })
    .reply(200, {})

  return sender('wechatuser123', 'Hello, world!')
    .then(assert.ok)
})

test(`WECHAT-sender sends message in chunks when message is too large`, assert => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  wechatNock.post('/cgi-bin/message/custom/send?access_token=kjn12jk3n2jn1lk2jn3198sank', {
    touser: 'wechatuser123',
    msgtype: 'text',
    text: {
      content: first,
    },
  }).reply(200, {})

  wechatNock.post('/cgi-bin/message/custom/send?access_token=kjn12jk3n2jn1lk2jn3198sank', {
    touser: 'wechatuser123',
    msgtype: 'text',
    text: {
      content: second,
    },
  }).reply(200, {})

  return sender('wechatuser123', first + second)
    .then(_ => assert.pass('Sends multiple messages.'))
})
