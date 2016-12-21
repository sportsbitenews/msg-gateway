'use strict'

import test from 'blue-tape'
import nock from 'nock'
import { sender } from '../../twilio'

const twilioNock = nock('https://api.twilio.com')

test('TWILIO-\'sender\' sends a single message', assert => {
  twilioNock.post(/\/2010-04-01\/Accounts\/\w+\/Messages.json/, {
    To: '+1234567890',
    MessagingServiceSid: /\w+/,
    Body: 'Hello, world!',
  })
  .reply(200, {})

  return sender('+1234567890', 'Hello, world!')
    .then(assert.ok)
})

test('TWILIO-\'sender\' rejects a message over the size limit', assert => {
  var message = new Array(1601 + 1).join('x')

  twilioNock.post(/\/2010-04-01\/Accounts\/\w+\/Messages.json/, {
    To: '+1234567890',
    MessagingServiceSid: /\w+/,
    Body: message,
  })
    .reply(200, {})

  var promise = sender('+1234567890', message)
  return assert.shouldFail(promise)
})

