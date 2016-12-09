var test = require('blue-tape')
var nock = require('nock');

var dashbot = require('../dashbot')
var dashbotNock = nock('https://tracker.dashbot.io')
var isEqual = require('lodash/fp/isEqual');

test('send(): logs an inbound message to dashbot', assert => {

	var expected = {
		userId: 'twilio/+1234567890',
		text: 'hello, world!',
	}

	dashbotNock.post('/track', body => isEqual(body, expected))
	.query({
		platform: 'generic',
		v: '0.7.4-rest',
		type: 'incoming',
		apiKey: /\w+/,
	})
	.reply(200, {})

	var message = {
		service_name: 'twilio',
		service_user_id: '+1234567890',
		text: 'hello, world!',
	}
	
	return dashbot.send('incoming', message)
		.then(assert.ok)
})


test('send(): logs an outbound message to dashbot', assert => {
	dashbotNock.post('/track', {
		userId: 'twilio/+1234567890',
		text: 'bye bye',
	})
	.query({
		platform: 'generic',
		v: '0.7.4-rest',
		type: 'outgoing',
		apiKey: /\w+/,
	})
	.reply(200, {})

	var message = {
		service_name: 'twilio',
		service_user_id: '+1234567890',
		text: 'bye bye',
	}
	
	return dashbot.send('outgoing', message)
		.then(assert.ok)
})