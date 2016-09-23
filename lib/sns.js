var AWS = require('aws-sdk')
var sns = new AWS.SNS({region: 'eu-west-1'}) //TODO: eventualy, read this from cloudformation outputs
var secrets = require('../secrets.json')

var TOPIC_ARN = secrets.sns && secrets.sns.enabled ? secrets.sns.topic_arn : null//TODO: eventualy, read this from cloudformation outputs

function publishReceivedMessage(message) {
  
  if (!TOPIC_ARN) {
    return Promise.reject(new Error('dashbot: apiKey missing from secrets or disabled'))
  }

	var body = {
		Subject: "received-message",
    TopicArn: TOPIC_ARN,
    Message: JSON.stringify(message),
  }

  return sns.publish(body).promise()
}

module.exports = {
	publishReceivedMessage,
}