'use strict'

var kik = require('../services/kik')
var skype = require('../services/skype')
var twilio = require('../services/twilio')
var telegram = require('../services/telegram')
var messenger = require('../services/messenger')

module.exports = {
  kik,
  skype,
  twilio,
  telegram,
  messenger,
}
