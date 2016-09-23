var AWS = require('aws-sdk')
var sns = new AWS.SNS({region: 'eu-west-1'})

function publishReceivedMessage(message, topic_arn) {
	var body = {
		Subject: "received-message",
    TopicArn: topic_arn,
    Message: JSON.stringify(message),
  }

  return sns.publish(body).promise()
  	.then(snsReceipt => Object.assign({}, message, { snsReceipt }))
}

module.exports = {
	publishReceivedMessage,
}