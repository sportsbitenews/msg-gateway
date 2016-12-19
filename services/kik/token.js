'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    username: secrets.kik.username,
    api_key: secrets.kik.api_key,
  }
}
