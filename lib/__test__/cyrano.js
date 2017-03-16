const nock = require('nock')
const test = require('blue-tape')
const proxyquire = require('proxyquire')

const cnock = nock('https://cyranoapi.unbabel.com')
cnock.post(`/bots/cyrano/en/messages/in`, {
  user: { id: '1231lkm' },
  text: 'The amazing text',
}).reply(200, {}).persist()
const secrets = {
  enabled: true,
  api_key: '6cd868527e0a52dbeb69d0cca1be9bbc4d83e7b0',
  api_user: 'cyrano',
}

test('cyrano.translateIn fails if the service is disabled.', assert => {
  const stubs = {
    '../secrets.test.json': {
      cyrano: Object.assign({}, secrets, {
        enabled: false,
      }),
    },
  }
  const cyrano = proxyquire('../cyrano', stubs)
  return cyrano.translateIn('1231lkm', 'The amazing text')
    .catch(err => {
      assert.equal(
        err.message,
        'cyrano: api_key or api_user missing from secrets or disabled',
        'Should fail if cyrano is not enalbled'
      )
    })
})

test('cyrano.translateIn fails if the api_key is missing from the secrets.', assert => {
  const stubs = {
    '../secrets.test.json': {
      cyrano: Object.assign({}, secrets, {
        api_key: null,
      }),
    },
  }
  const cyrano = proxyquire('../cyrano', stubs)
  return cyrano.translateIn('1231lkm', 'The amazing text')
    .catch(err => {
      assert.equal(
        err.message,
        'cyrano: api_key or api_user missing from secrets or disabled',
        'Should fail if api_key is missing'
      )
    })
})

test('cyrano.translateIn fails if the api_user is missing from the sercrets.', assert => {
  const stubs = {
    '../secrets.test.json': {
      cyrano: Object.assign({}, secrets, {
        api_user: null,
      }),
    },
  }
  const cyrano = proxyquire('../cyrano', stubs)
  return cyrano.translateIn('1231lkm', 'The amazing text')
    .catch(err => {
      assert.equal(
        err.message,
        'cyrano: api_key or api_user missing from secrets or disabled',
        'Should fail if api_user is missing'
      )
    })
})

test('cyrano.translateIn make the request correctly with the correct params.', assert => {
  const stubs = {
    '../secrets.test.json': {
      cyrano: Object.assign({}, secrets, { enabled: true }),
    },
  }
  const cyrano = proxyquire('../cyrano', stubs)

  return cyrano.translateIn('1231lkm', 'The amazing text')
    .then(assert.ok)
})
