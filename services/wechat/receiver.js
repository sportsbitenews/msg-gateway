'use strict'

var https = require('../../lib/https')

var qs = require('querystring')
var crypto = require('crypto')

var config = require('./token')(process.env.SERVERLESS_STAGE || 'dev')

var SERVICE_NAME = 'wechat'

module.exports = function wechatReceiver(ev) {
  if (ev.method !== 'GET' && ev.method !== 'POST') {
    return Promise.reject(new Error('Unsupported wechat method:', ev.method))
  }

  if (ev.method === 'GET') {
    return validate(ev.query)
      .then(res => Object.assign({}, ev, {
        response: res,
      }))
  }

  return https.parseXML(ev.body)
    .then(data => {
      var xml = data.xml ? data.xml : data.root ? data.root : {}
      var messages = xml.Content ? formatMessage(xml) : []

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function formatMessage(xml) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: `${xml.FromUserName}`,
    text: xml.Content,
    timestamp: ~~xml.CreateTime || new Date().getTime(),
  }]
}

function validate(query, token) {
  var verifyToken = token || config.verifyToken

  var sha1Str = crypto.createHash('sha1').update([verifyToken, query.timestamp, query.nonce].sort().join('')).digest('hex');
  console.log("query signature: " + query.signature);
  console.log("my signature: " + sha1Str);

  if (sha1Str === query.signature) {
    return Promise.resolve(query.echostr)
  }

  return Promise.reject(new Error("Couldn't verify token"))

}
