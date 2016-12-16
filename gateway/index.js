'use strict'

var sns = require('../lib/sns')
var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var getReceiver = require('./receiver')
var getSender = require('./sender')

module.exports = function (plugins) {
  return Object.assign({}, {
    receiver: getReceiver(plugins, sns, secrets),
    sender: getSender(plugins, sns, secrets),
  })
}
