var path = require('path')
var test = require('blue-tape')
var proxyquire = require('proxyquire')

var services = {
  kik: true,
  line: true,
  skype: true,
  twilio: true,
  telegram: true,
  messenger: true,
}

const service = {
  sender: () => Promise.resolve('ok'),
  receiver: () => Promise.resolve('ok'),
}

var stubs = {
  '../lib/analytics': {
    logToAnalytics: () => Promise.resolve('ok'),
  },
  '../services': (name) => {
    if (services[name]) {
      return service
    }

    return false
  },
  '../secrets.test.json': require('./events/secrets.test.json'),
  '../../secrets.test.json': require('./events/secrets.test.json'),
}

var send = proxyquire('../send', stubs)

test('send.handler(): handles an SNS event', assert => {
  var event = {
    'Records': [{
      'Sns': {
        'Message': '{"service_name":"messenger","service_user_id":"123456","text":"hello!"}',
      },
    }],
  }

  var expected = {
    body: '["ok"]',
    headers: {
      'Content-Type': 'application/json',
    },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http KIK event', assert => {
  var event = {
    body: '{"service_name":"skype","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http LINE event', assert => {
  var event = {
    body: '{"service_name":"skype","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http SKYPE event', assert => {
  var event = {
    body: '{"service_name":"skype","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http TWILIO event', assert => {
  var event = {
    body: '{"service_name":"twilio","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http TELEGRAM event', assert => {
  var event = {
    body: '{"service_name":"telegram","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): handles an http MESSENGER event', assert => {
  var event = {
    body: '{"service_name":"messenger","service_user_id":"123456","text":"hello!"}',
  }

  var expected = {
    body: '["ok"]',
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
  }

  return send.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('send.handler(): fails for an UNKNOWN EVENT', assert => {
  var event = { foo: 'bar' }

  return send.handler(event, null, (error, res) => {
    assert.equal(error.message, "Can't determine event source.")
    assert.end()
  })
})

test('send.handler(): fails for UNKNOWN SERVICE', assert => {
  var event = {
    body: '{"service_name":"chatomatic","service_user_id":"123456","text":"hello!"}',
  }

  return send.handler(event, null, (error, res) => {
    assert.equal(error.message, 'Unknown service: chatomatic.')
    assert.end()
  })
})

test('send.handler(): fails for a disabeld service', assert => {
  var event = {
    body: '{"service_name":"somedisabledservice","service_user_id":"123456","text":"hello!"}',
  }

  return send.handler(event, null, (error, res) => {
    assert.equal(error.message, 'Service disabled: somedisabledservice.')
    assert.end()
  })
})
