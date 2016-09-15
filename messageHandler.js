'use strict';

var handleIncoming = message => {
	console.log('received message:', message)
}

var parseOutgoing = message => {
	console.log('will send message:', message)
	return Promise.resolve(message)
}

module.exports = {
	handleIncoming,
	parseOutgoing,
}