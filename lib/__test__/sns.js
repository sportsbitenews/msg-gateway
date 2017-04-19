'use strict';

const test = require('blue-tape')
const AWS = require('aws-sdk-mock')

AWS.mock('SNS', 'createTopic', function (params, callback) {
  callback(null, { TopicArn: params.Name + '-123' })
})

AWS.mock('SNS', 'publish', function (params, callback) {
  callback(null, params)
})

const sns = require('../sns')

test('publishReceivedMessage(): creates topic and publishes stringified message', assert => {
  const expected = {
    TopicArn: 'topicz-123',
    Subject: 'received-message',
    Message: JSON.stringify({ foo: 'bar' }),
  }

  return sns.publishReceivedMessage({ foo: 'bar' }, 'topicz')
    .then(res => assert.deepEquals(res, expected))
})
