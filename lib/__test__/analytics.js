const test = require('blue-tape')
const proxyquire = require('proxyquire')

const baseStubs = ['dashbot', 'botmetrics', 'botanalytics'].reduce((anal, fn) => {
  anal[`./${fn}`] = {
    send: (type, id, message) => Promise.resolve({ type, id, message }),
  }
  return anal
}, {})

const secrets = {
  dashbot: {
    enabled: true,
    api_key: 'gSh96ivD8PfaFgn2TKV09cv3bnotU3VmQx4jhlph',
  },
  botmetrics: {
    enabled: true,
    api_key: '9VwZ4bdCpLaU84burrpqenxM',
  },
  botanalytics: {
    enabled: true,
    api_key: 'de0be1c34d54412cdad45e4711c96819',
  },
}

const msg = {
  service_name: 'twilio',
  service_user_id: '+34646946660',
  text: 'Test message',
}

test('analytics.logToAnalytics only logs to dashbot if the other two are disabled.', assert => {
  const expected = Object.assign({}, msg, {
    response: [[{
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.test.json': Object.assign({}, secrets, {
      botmetrics: { enabled: false },
      botanalytics: { enabled: false },
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
    response: [[{
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }, {
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.test.json': Object.assign({}, secrets, {
      botanalytics: { enabled: false },
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
    response: [[{
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }, {
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }, {
      type: 'input',
      id: 'twilio/+34646946660',
      message: 'Test message',
    }]],
  })
  const stubs = Object.assign({}, baseStubs, {
    '../secrets.test.json': Object.assign({}, secrets),
  })
  const analytics = proxyquire('../analytics', stubs)

  return analytics.logToAnalytics('input', msg)
    .then(response => {
      assert.equal(response.response[0].length, 3, 'Should log to all of the services.')
      assert.deepEqual(response, expected, 'Should log to all services only.')
    })
})
