'use strict';

var test = require('blue-tape')
var nock = require('nock');
var testNock = nock('https://test.test')

var https = require('../https')

test('parseJSON(): parses a json string', assert => {
	var obj = { name: 'birdperson' }

	return https.parseJson(JSON.stringify(obj))
		.then(res => assert.deepEquals(res, obj))
})

test('parseJSON(): doesnt parse if already an object', assert => {
	var obj = { name: 'birdperson' }

	return https.parseJson(obj)
		.then(res => assert.deepEquals(res, obj))
})

test('parseJSON(): rejects if parsing fails', assert => {
	return https.parseJson('cantparsethis')
		.catch(e => assert.equal(e.name, 'SyntaxError'))
})

test('request(): makes POST request', assert => {
	testNock.post('/some/path', {
    to: 'USER_ID',
  })
  .reply(200, { success: true })

  var stringBody = JSON.stringify({ to: 'USER_ID' })
  var options = {
    hostname: `test.test`,
    path: '/some/path',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return https.request(options, stringBody)
    .then(res => {
    	assert.equal(res.statusCode, 200)
    	assert.deepEqual(res.headers, { 'content-type': 'application/json' })
  		return res.json()
    })
    .then(res => assert.deepEquals(res, { success: true }))
})


test('request(): makes GET request', assert => {
	testNock.get('/some/path')
  .query({
  	page: 1,
  })
  .reply(200, { success: true })

  var options = {
    hostname: `test.test`,
    path: '/some/path?page=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return https.request(options)
    .then(res => {
    	assert.equal(res.statusCode, 200)
    	assert.deepEqual(res.headers, { 'content-type': 'application/json' })
  		return res.json()
    })
    .then(res => assert.deepEquals(res, { success: true }))
})