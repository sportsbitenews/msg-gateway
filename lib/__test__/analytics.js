'use strict';

const test = require('blue-tape')
const proxyquire = require('proxyquire')

const baseStubs = ['dashbot', 'botmetrics', 'botanalytics', 'botlytics', 'chatbase'].reduce((anal, fn) => {
  anal[`./${fn}`] = {
    send: (type, id, message, intent, platform) => Promise.resolve({ type, id, message, intent, platform }),
  }
  return anal
}, {})

const secrets = {
  dashbot: {
    enabled: true,
    api_key: 'sdfssdfsd',
  },
  botmetrics: {
    enabled: true,
    api_key: 'sdfsfsd',
  },
  botanalytics: {
    enabled: true,
    api_key: 'sfddsfsfsd',
  },
  botlytics: {
    enabled: true,
    api_key: 'sdfsdfsd',
  },
  chatbase: {
    enabled: true,
    api_key: 'sdfsdfdssdfsd',
  },
}

const msg = {
  service_name: 'twilio',
  service_user_id: '+34646946660',
  text: 'Test message',
  userId: 'user-1234',
  intent: 'foo.bar',
}

const res = {
  type: 'input',
  id: 'user-1234',
  message: 'Test message',
  intent: 'foo.bar',
  platform: 'twilio',
}

test('analytics.logToAnalytics only logs to dashbot if the others are disabled.', assert => {
  const expected = Object.assign({}, msg, {
    response: [[ res ]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.dev.json': Object.assign({}, secrets, {
      botmetrics: { enabled: false },
      botanalytics: { enabled: false },
      botlytics: { enabled: false },
      chatbase: { enabled: false },
    }),
  })
  const analytics = proxyquire('../analytics', stubs)

  return analytics.logToAnalytics('input', msg)
    .then(response => {
      assert.equal(response.response[0].length, 1, 'Should be only one log.')
      assert.deepEqual(response, expected, 'Should log to dashbot only.')
    })
})

test('analytics.logToAnalytics to dashbot and botmetrics that are enabled.', assert => {
  const expected = Object.assign({}, msg, {
    response: [[ res, res ]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.dev.json': Object.assign({}, secrets, {
      botanalytics: { enabled: false },
      botlytics: { enabled: false },
      chatbase: { enabled: false },
    }),
  })
  const analytics = proxyquire('../analytics', stubs)

  return analytics.logToAnalytics('input', msg)
    .then(response => {
      assert.equal(response.response[0].length, 2, 'Should be only two logs.')
      assert.deepEqual(response, expected, 'Should log to two services only.')
    })
})

test('analytics.logToAnalytics logs to all services that are enabled', assert => {
  const expected = Object.assign({}, msg, {
    response: [[ res, res, res, res, res ]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.dev.json': Object.assign({}, secrets),
  })
  const analytics = proxyquire('../analytics', stubs)

  return analytics.logToAnalytics('input', msg)
    .then(response => {
      assert.equal(response.response[0].length, 5, 'Should log to all of the services.')
      assert.deepEqual(response, expected, 'Should log to all services only.')
    })
})
