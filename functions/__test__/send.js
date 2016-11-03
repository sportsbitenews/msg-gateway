var test = require('blue-tape')
var proxyquire = require('proxyquire');
var stubs = {
  '../lib/dashbot': {
    send: () => Promise.resolve('ok'),
  },
  '../services/messenger': {
  	sendMessage: () => Promise.resolve('ok'),
  },
  '../services/twilio': {
  	sendMessage: () => Promise.resolve('ok'),
  },
  '../secrets.json': require('./events/secrets.test.json')
}
var send = proxyquire('../send', stubs)

test('handler(): handles an http messenger event', assert => {
	assert.plan(2)

	var event = {
		body: '{"service_name":"messenger","service_user_id":"123456","text":"hello!"}',
	}

	var expected = {
	 	body: '[{"service_name":"messenger","service_user_id":"123456","text":"hello!","sendReceipt":"ok","dashbotReceipt":"ok"}]', 
	 	headers: { 'Content-Type': 'application/json' },
	 	statusCode: 200
	}

	send.handler(event, null, (error, res) => {
		assert.error(error)
		assert.deepEqual(res, expected)
	})
})

test('handler(): handles an http twilio event', assert => {
	assert.plan(2)

	var event = {
		body: '{"service_name":"twilio","service_user_id":"123456","text":"hello!"}',
	}

	var expected = {
	 	body: '[{"service_name":"twilio","service_user_id":"123456","text":"hello!","sendReceipt":"ok","dashbotReceipt":"ok"}]', 
	 	headers: { 'Content-Type': 'application/json' },
	 	statusCode: 200
	}

	send.handler(event, null, (error, res) => {
		assert.error(error)
		assert.deepEqual(res, expected)
	})
})

test('handler(): handles an sns event', assert => {
	assert.plan(2)

	var event = {
		'Records': [
			{'Sns': { 'Message': '{"service_name":"messenger","service_user_id":"123456","text":"hello!"}' }}
		]
	}

	var expected = {
	 	body: '[{"service_name":"messenger","service_user_id":"123456","text":"hello!","sendReceipt":"ok","dashbotReceipt":"ok"}]', 
	 	headers: { 'Content-Type': 'application/json' },
	 	statusCode: 200
	}

	send.handler(event, null, (error, res) => {
		assert.error(error)
		assert.deepEqual(res, expected)
	})
})

test('handler(): fails for an unknown event', assert => {
	assert.plan(1)

	var event = {
		foo: 'bar',
	}

	send.handler(event, null, (error, res) => {
		assert.equal(error.message, "Can't determine event source")
	})
})

test('handler(): fails for an unknown service', assert => {
	assert.plan(1)

	var event = {
		body: '{"service_name":"chatomatic","service_user_id":"123456","text":"hello!"}',
	}

	send.handler(event, null, (error, res) => {
		console.log(error.message)
		assert.equal(error.message, 'Unknown service: chatomatic')
	})
})

test('handler(): fails for a disabeld service', assert => {
	assert.plan(1)

	var event = {
		body: '{"service_name":"somedisabledservice","service_user_id":"123456","text":"hello!"}',
	}

	send.handler(event, null, (error, res) => {
		assert.equal(error.message, 'Service disabled: somedisabledservice')
	})
})