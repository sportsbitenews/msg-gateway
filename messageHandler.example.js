'use strict';

function parseIncoming(message) {
	console.log('received message:', message)
	return Promise.resolve(message)
}

function parseOutgoing(message) {
	console.log('will send message:', message)
	return Promise.resolve(message)
}

module.exports = {
	parseIncoming,
	parseOutgoing,
}
