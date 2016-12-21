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
  '../lib/dashbot': {
    send: () => Promise.resolve('ok'),
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

var webhook = proxyquire('../webhook', stubs)

test('webhook.handler(): handles an http KIK event', t => {
  var kikSingle = require(path.join(__dirname, 'events', 'kik_single.json'))
  var event = Object.assign({}, kikSingle, {
    pathParameters: { service_name: 'kik' },
  })
  var expected = {
    body: '{"status":"ok"}',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
  }

  return webhook.handler(event, null, (err, res) => {
    t.error(err)
    t.deepEqual(expected, res)
    t.end()
  })
})

test('webhook.handler(): handles an http LINE event', t => {
  var lineSingle = require(path.join(__dirname, 'events', 'line_single.json'))
  var event = Object.assign({}, lineSingle, {
    pathParameters: { service_name: 'line' },
  })
  var expected = {
    body: '{"status":"ok"}',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
  }

  return webhook.handler(event, null, (err, res) => {
    t.error(err)
    t.deepEqual(expected, res)
    t.end()
  })
})

test('webhook.handler(): handles an http SKYPE event', t => {
  var skypeSingle = require(path.join(__dirname, 'events', 'skype_single.json'))
  var event = Object.assign({}, skypeSingle, {
    pathParameters: { service_name: 'skype' },
  })
  var expected = {
    body: '{"status":"ok"}',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
  }

  return webhook.handler(event, null, (err, res) => {
    t.error(err)
    t.deepEqual(expected, res)
    t.end()
  })
})

test('webhook.handler(): handles an http TWILIO event', assert => {
  var event = {
    body: 'From=%2B123456789&Body=Hello%2C%20world!&Timestamp=1458692752478',
    pathParameters: {
      service_name: 'twilio',
    },
    method: 'POST',
  }

  var expected = {
    body: '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>',
    headers: {
      'Content-Type': 'application/xml',
    },
    statusCode: 200,
  }

  return webhook.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('webhook.handler(): handles an http TELEGRAM event', t => {
  var telegramSingle = require(path.join(__dirname, 'events', 'telegram_single.json'))
  var event = Object.assign({}, telegramSingle, {
    pathParameters: { service_name: 'telegram' },
  })
  var expected = {
    body: '{"status":"ok"}',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
  }

  return webhook.handler(event, null, (err, res) => {
    t.error(err)
    t.deepEqual(expected, res)
    t.end()
  })
})

test('webhook.handler(): handles an http MESSENGER event', assert => {
  var messengerSingle = require(path.join(__dirname, 'events', 'messenger_single.json'))
  var event = Object.assign({}, messengerSingle, {
    pathParameters: { service_name: 'messenger' },
  })

  var expected = {
    body: '{"status":"ok"}',
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
  }

  return webhook.handler(event, null, (error, res) => {
    assert.error(error)
    assert.deepEqual(res, expected)
    assert.end()
  })
})

test('webhook.handler(): callback error for an unknown service', assert => {
  var event = {
    pathParameters: { service_name: 'chatomatic' },
    method: 'POST',
  }

  return webhook.handler(event, null, (error, res) => {
    assert.equal(error.message, 'Unknown service: chatomatic')
    assert.end()
  })
})

test('webhook.handler(): callback error for a disabled service', assert => {
  var event = {
    pathParameters: { service_name: 'somedisabledservice' },
    method: 'POST',
  }

  return webhook.handler(event, null, (error, res) => {
    assert.equal(error.message, 'Service disabled: somedisabledservice')
    assert.end()
  })
})
