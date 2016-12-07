var https = require('./https')

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var API_KEY = secrets.cyrano &&  secrets.cyrano.enabled ? secrets.cyrano.api_key : null
var API_USER = secrets.cyrano &&  secrets.cyrano.enabled ? secrets.cyrano.api_user : null

function translateIn(user_id, text) {

	if (!API_KEY || !API_USER) {
		return Promise.reject(new Error('cyrano: api_key or api_user missing from secrets or disabled'))
	}

	var body = {
		user: {
			id: user_id,
		},
		text: text,
	}

	var path = `/bots/${API_USER}/en/messages/in`

	return _makeRequest(path, body)
}

function _makeRequest(path, body) {
	var options = {
	  hostname: 'cyranoapi.unbabel.com',
	  path: path,
	  method: 'POST',
	  headers: {
  		'Content-Type': 'application/json',
      'Authorization': API_USER + ':' + API_KEY,
  	},
	}

	return https.request(options, JSON.stringify(body))
	  .then(res => {
	  	console.log(res)
	  	if (res.statusCode == 200 || res.statusCode == 201) {
	  		return res.json()
	  	} else {
	  		console.log(res)
	  		throw new Error(res.body)
	  	}
	  })
}

module.exports = {
	translateIn,
}
