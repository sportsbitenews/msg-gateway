'use strict'

var qs = require('querystring')

var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')
var https = require('../../lib/https')

module.exports = function makeFBRequest (path, body) {
  var querystring = {
    access_token: config.page_access_token,
  }

  var options = {
    hostname: 'graph.facebook.com',
    path: path + '?' + qs.stringify(querystring),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return https.request(options, JSON.stringify(body))
    .then(res => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        return res.json()
      } else {
        console.log(res)
        throw new Error(res.body)
      }
    })
}
