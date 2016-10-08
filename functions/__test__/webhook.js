var test = require('blue-tape')
var proxyquire = require('proxyquire');
var stubs = {
  '../lib/dashbot': {
    send: () => Promise.resolve('ok'),
  },
  '../lib/sns': {
  	publishReceivedMessage: () => Promise.resolve('ok'),
  },
  '../secrets.json': require('./events/secrets.test.json')
}
var webhook = proxyquire('../webhook', stubs)

test('handler(): handles an http messenger event', assert => {
	var messenger_single = require('./events/messenger_single.json')
	assert.plan(2)
	
	var event = {
		body: messenger_single,
		pathParameters: {
			service_name: 'messenger',
		},
		method: 'POST'
	}

	var expected = {
	 	body: '{"status":"ok"}', 
	 	statusCode: 200
	}

	webhook.handler(event, null, (error, res) => {
		assert.error(error)
		assert.deepEqual(res, expected)
	})
})

test('handler(): handles an http twilio event', assert => {
	assert.plan(2)

	var event = {
		body: "From=%2B123456789&Body=Hello%2C%20world!&Timestamp=1458692752478",
		pathParameters: {
			service_name: 'twilio',
		},
		method: 'POST'
	}

	var expected = {
	 	body: '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>', 
	 	headers: { 'Content-Type': 'application/xml' },
	 	statusCode: 200,
	}
	
	webhook.handler(event, null, (error, res) => {
		assert.error(error)
		assert.deepEqual(res, expected)
	})
})

test('handler(): callback error for an unknown service', assert => {
	assert.plan(1)
	
	var event = {
		pathParameters: {
			service_name: 'chatomatic',
		},
		method: 'POST'
	}

	webhook.handler(event, null, (error, res) => {
		assert.ok(error.message == 'Unknown service: chatomatic')
	})
})

test('handler(): callback error for an disabled service', assert => {
	assert.plan(1)
	
	var event = {
		pathParameters: {
			service_name: 'somedisabledservice',
		},
		method: 'POST'
	}

	webhook.handler(event, null, (error, res) => {
		assert.ok(error.message == 'Service disabled: somedisabledservice')
	})
})

