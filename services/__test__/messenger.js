var test = require('blue-tape')
var nock = require('nock');

var messenger = require('../messenger')
var facebookNock = nock('https://graph.facebook.com')

test('parseMessages(): should parse a single message', assert => {
	var singleMessage = require('./events/messenger_single.json')
	var expected = {
		messages: [
			{
				service_name: 'messenger',
				service_user_id: 'USER_ID',
				text: 'hello, world!',
				timestamp: 1458692752478,
			}
		],
		service_name: 'messenger',
	}
	return messenger.parseMessages(singleMessage)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): should parse multiple messages', assert => {
	var multipleMessages = require('./events/messenger_multiple.json')
	var expected = {
		messages: [
			{
				service_name: 'messenger',
				service_user_id: 'USER_ID_1',
				text: 'hello, world!',
				timestamp: 1458692752478,
			},
			{
				service_name: 'messenger',
				service_user_id: 'USER_ID_2',
				text: 'goodbye cruel world',
				timestamp: 1458692752785,
			}    			
		],
		service_name: 'messenger',
	}
	return messenger.parseMessages(multipleMessages)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): ignores non message events', assert => {
	var nonMessages = require('./events/messenger_other.json')
	var expected = {
		messages: [],
		service_name: 'messenger',
	}

	return messenger.parseMessages(nonMessages)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): parses postback events', assert => {
	var postback = require('./events/messenger_postback.json')
	var expected = {
		messages: [
			{
				service_name: 'messenger',
				service_user_id: 'USER_ID',
				text: 'USER_DEFINED_PAYLOAD',
				timestamp: 1458692752478,
			}
		],
		service_name: 'messenger',
	}

	return messenger.parseMessages(postback)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): parses json if the message is a string', assert => {
	var singleMessage = require('./events/messenger_single.json')
	var expected = {
		messages: [
			{
				service_name: 'messenger',
				service_user_id: 'USER_ID',
				text: 'hello, world!',
				timestamp: 1458692752478,
			}
		],
		service_name: 'messenger',
	}
	var jsonString = JSON.stringify(singleMessage)

	return messenger.parseMessages(jsonString)
		.then(res => assert.deepEqual(res, expected))
})

test('parseMessages(): fails on invalid json string', assert => {
	var jsonString = 'blah blah"invalidjson"'
	var promise = messenger.parseMessages(jsonString)
	return assert.shouldFail(promise)
})

test('sendMessage(): send a single message', assert => {
	facebookNock.post('/v2.6/me/messages', {
		recipient: {
			id: "USER_ID"
		},
		message: {
			text: "hello world!"
		}
	})
	.query(true)
	.reply(200, {})

	return messenger.sendMessage('USER_ID', 'hello world!')
		.then(assert.ok)
})

test('sendMessage(): chunks and sends a large message', assert => {
	var first = new Array(300 + 1).join('x')
	var second = new Array(300 + 1).join('y')

	facebookNock.post('/v2.6/me/messages', {
		recipient: {
			id: "USER_ID"
		},
		message: {
			text: first
		}
	})
	.query(true)
	.reply(200, {})
	
	facebookNock.post('/v2.6/me/messages', {
		recipient: {
			id: "USER_ID"
		},
		message: {
			text: second
		}
	})
	.query(true)
	.reply(200, {})

	return messenger.sendMessage('USER_ID', first + second)
		.then(assert.ok)
})
  
test('validate(): validates if token is correct', assert => {
	facebookNock.post('/v2.6/me/subscribed_apps')
		.query(true)
		.reply(200, {})

	var query = {
		'hub.mode': 'subscribe',
		'hub.verify_token': 'a10dollarBanana',
		'hub.challenge': '1234567890'
	}

	var expected = {
		response: 1234567890,
		messages: [],
		service_name: 'messenger',
	}

	return messenger.validate(query, 'a10dollarBanana')
		.then(res => assert.deepEqual(res, expected))
})

test('validate(): does not validate if token is incorrect', assert => {
	facebookNock.post('/v2.6/me/subscribed_apps')
		.query(true)
		.reply(200, {})

	var query = {
		'hub.mode': 'subscribe',
		'hub.verify_token': 'thisisaninvalidtokenmwahahah',
		'hub.challenge': '1234567890'
	}

	var expected = {
		response: 1234567890,
		messages: [],
		service_name: 'messenger',
	}

	var promise = messenger.validate(query, 'a10dollarBanana')
	return assert.shouldFail(promise)
})
  