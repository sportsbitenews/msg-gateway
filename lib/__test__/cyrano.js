var test = require('blue-tape')
var nock = require('nock');

var cyrano = require('../cyrano')
var cyranoNock = nock('https://cyranoapi.unbabel.com')

var isEqual = require('lodash/fp/isEqual');

test('translateIn(): sends a message for translation', assert => {
	var expected = {
		user: {
			id: '123456',
		},
		text: 'hello world!!',
	}

	cyranoNock.post(/\/bots\/\w+\/en\/messages\/in/, body => isEqual(body, expected))
	.reply(200, {})

	return cyrano.translateIn('123456', 'hello world!!')
		.then(assert.ok)
})
