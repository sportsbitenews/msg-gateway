'use strict'

var qs = require('querystring')

var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')
var https = require('../../lib/https')

var FB_PAGE_ACCESS_TOKEN = config.page_access_token

module.exports = function makeFBRequest (path, body) {
  var querystring = {
    access_token: FB_PAGE_ACCESS_TOKEN,
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
    .then(res => res.json())
    .catch(e => {
      console.log(e)
      throw new Error(e.message)
    })
}
