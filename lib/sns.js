var AWS = require('aws-sdk')
var sns = new AWS.SNS({region: 'eu-west-1'}) //TODO: eventualy, read this from cloudformation outputs

function publishReceivedMessage(message, topic) {
  return sns.createTopic({Name: topic}).promise()
    .then(res => {
      var params = {
        TopicArn: res.TopicArn,
        Subject: "received-message",
        Message: JSON.stringify(message),
      }

      return _publish(params)
    })
}

function _publish(body) {
  return sns.publish(body).promise()
}

module.exports = {
  publishReceivedMessage,
}