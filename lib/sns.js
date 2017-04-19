'use strict';

const AWS = require('aws-sdk')

function publishReceivedMessage(message, topic) {
  const sns = new AWS.SNS({ region: 'eu-west-1' })

  return sns.createTopic({ Name: topic }).promise() // TODO: eventualy, read this from cloudformation outputs
    .then(res => {
      const params = {
        TopicArn: res.TopicArn,
        Subject: 'received-message',
        Message: JSON.stringify(message),
      }

      return sns.publish(params).promise()
    })
}


module.exports = {
  publishReceivedMessage,
}
