'use strict'

const test = require('blue-tape')
const receiver = require('../../wechat').receiver

test(`WECHAT-receiver should parse a single message from body`, assert => {
  const event = {
    method: 'POST',
    body: `<xml><ToUserName><![CDATA[wechat1231]]></ToUserName><FromUserName><![CDATA[testuser123]]></FromUserName><CreateTime>1234567</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[Hello, world!]]></Content></xml>`,
  }
  const expected = Object.assign({}, event, {
    messages: [{
      service_name: 'wechat',
      service_user_id: 'testuser123',
      text: 'Hello, world!',
      timestamp: 1234567,
    }],
    response: { status: 'ok' },
  })

  return receiver(event)
    .then(response => assert.deepEqual(response, expected))
})

test(`WECHAT-receiver uses current time if CreateTime is missing`, assert => {
  const event = {
    method: 'POST',
    body: `<xml><ToUserName><![CDATA[wechat1231]]></ToUserName><FromUserName><![CDATA[testuser123]]></FromUserName><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[Hello, world!]]></Content></xml>`,
  }

  const now = new Date().getTime()
  const then = now + 100

  return receiver(event)
    .then(response => {
      assert.ok(response.messages[0].timestamp >= now && response.messages[0].timestamp <= then)
    })
})

test(`WECHAT-receiver fails on invalid xml string`, assert => {
  const xmlString = `xmlstring`
  const promise = receiver(xmlString)

  return assert.shouldFail(promise)
})
