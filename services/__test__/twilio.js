var test = require('blue-tape')
var nock = require('nock');

var twilio = require('../twilio')
var twilioNock = nock('https://api.twilio.com')

test('parseMessages(): should parse a single message', assert => {
	var singleMessage = "From=%2B123456789&Body=Hello%2C%20world!&Timestamp=1458692752478"
	var expected = {
		messages: [
			{
				service_name: 'twilio',
				service_user_id: '+123456789',
				text: 'Hello, world!',
				timestamp: 1458692752478,
			}
		],
		service_name: 'twilio',
	}
	return twilio.parseMessages(singleMessage)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): uses current time if timestamp is missing', assert => {
	var singleMessage = "From=%2B123456789&Body=Hello%2C%20world!"
	var now = new Date().getTime()
	var then = now + 100

	return twilio.parseMessages(singleMessage)
		.then(res => assert.ok(res.messages[0].timestamp >= now && res.messages[0].timestamp <= then))
})

test('formatResponse(): should return an twilXML Lambda proxy response', assert => {
	var expected = {
		statusCode: 200,
		headers: {
			"Content-Type" : "application/xml",
		},
		body: '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>',
	}
	var response = twilio.formatResponse('blah blah blah')

	assert.plan(1)
	assert.deepEqual(response, expected)
})

test('sendMessage(): sends a single message', assert => {
	twilioNock.post(/\/2010-04-01\/Accounts\/\w+\/Messages.json/, {
		To: '+1234567890',
		MessagingServiceSid: /\w+/,
		Body: 'Hello, world!',
	})
	.reply(200, {})
	
	return twilio.sendMessage('+1234567890', 'Hello, world!')
		.then(assert.ok)
})


test('sendMessage(): rejects a message over the size limit', assert => {
	var message = new Array(1601 + 1).join('x')
	
	twilioNock.post(/\/2010-04-01\/Accounts\/\w+\/Messages.json/, {
		To: '+1234567890',
		MessagingServiceSid: /\w+/,
		Body: message,
	})
	.reply(200, {})
	
	var promise = twilio.sendMessage('+1234567890', message)
	return assert.shouldFail(promise)
})