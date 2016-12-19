'use strict'

function normalize(event) {
  var path = event.pathParameters || event.path
  var service_name = path.service_name
  var body = event.body
  var query = event.queryStringParameters || event.query
  var method = event.method || event.httpMethod

  if (secrets[service_name] && !secrets[service_name].enabled) {
    var _error = 'Service disabled: ' + service_name

    console.log(_error)
    return Promise.reject(new Error(_error))
  }

  return Promise.resolve({
    path,
    service_name,
    body,
    query,
    method,
  })
}

function formatResponse(event) {
  if (!event.response) throw new Error('Missing response for event: ', event)

  var contentType = (
    event.service_name === 'twilio'
    ? 'application/xml' : 'application/json'
  )

  var body = (
    typeof event.response === 'object'
    ? JSON.stringify(event.response) : event.response
  )

  var response = {
    body,
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
    },
  }

  return Object.assign({}, event, { response })
}


module.exports = {
  normalize,
  formatResponse,
}
