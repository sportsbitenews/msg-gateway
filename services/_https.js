var https = require('https')


var _parseJson = body => {
	return new Promise((resolve, reject) => {
		try {
      resolve(JSON.parse(body))
  	} catch (e) {
    	reject(e)
  	}
	})
}


var request = (options, postData) => {
	return new Promise((resolve, reject) => {
		var req = https.request(options, res => {
			res.setEncoding('utf8')

			var body = ""
			
			res.on('data', data => {
				body += data
			})

			res.on('end', () => {
				var response = {
					statusCode: res.statusCode,
  				statusMessage: res.statusMessage,
  				headers: res.headers,
  				body: body,
  				json: () => _parseJson(body)
				}
				
				resolve(response)
			})
		})

		req.on('error', reject)

		if (postData) {
			req.write(postData)
		}

		req.end()
	})
}

module.exports = {
	request,
}