'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    channel_access_token: secrets.line.channel_access_token,
  }
}
