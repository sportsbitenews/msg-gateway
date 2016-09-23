var sns = require('./services/sns')

var handleIncoming = message => {
	return sns.publish({
		Subject: "received-message",
    TopicArn: "<your SNS topic ARN>",
    Message: JSON.stringify(message),
  }).promise()
		.then(snsReceipt => Object.assign({}, message, { snsReceipt }))
}

var parseOutgoing = message => {
	return sns.publish({
			Subject: "sent-message",
	    TopicArn: "<your SNS topic ARN>",
	    Message: JSON.stringify(message),
	}).promise()
		.then(snsReceipt => Object.assign({}, message, { snsReceipt }))
}

module.exports = {
	handleIncoming,
	parseOutgoing,
}

