'use strict'

const test = require('blue-tape')
const nock = require('nock')
const telegram = require('../../telegram')
const token = telegram.token
const sender = telegram.sender

const config = token(process.env.SERVERLESS_STAGE || 'test')
const telegramNock = nock('https://api.telegram.org')

test(`TELEGRAM-'sender' should throw when it fails to sends the message.`, t => {
  telegramNock.post(`/bot${config.token}/sendMessage`, {
    chat_id: 'USER_ID',
    text: 'hello from telegram',
  })
  .replyWithError({ message: 'Unauthorized' })

  return t.shouldFail(sender('USER_ID', 'hello from telegram'), /Unauthorized/)
})

test(`TELEGRAM-'sender' sends a single message`, t => {
  telegramNock.post(`/bot${config.token}/sendMessage`, {
    chat_id: 'USER_ID',
    text: 'Telegram',
  })
  .reply(200, {})

  return sender('USER_ID', 'Telegram')
    .then(t.ok)
})

test(`TELEGRAM-'sender' sends message in chunks when message is too large`, t => {
  const first = new Array(300 + 2).join('x')
  const second = new Array(300 + 1).join('y')

  telegramNock.post(`/bot${config.token}/sendMessage`, {
    chat_id: 'USER_ID',
    text: first,
  })
  .reply(200, {})

  telegramNock.post(`/bot${config.token}/sendMessage`, {
    chat_id: 'USER_ID',
    text: second,
  })
  .reply(200, {})

  return sender('USER_ID', first + second)
    .then(_ => t.pass('Sends multiple messages.'))
})

