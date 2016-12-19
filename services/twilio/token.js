'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    account_sid: secrets.twilio.account_sid,
    messaging_service_sid: secrets.twilio.messaging_service_sid,
    api_key_sid: secrets.twilio.api_key_sid,
    api_key_secret: secrets.twilio.api_key_secret,
  }
}
