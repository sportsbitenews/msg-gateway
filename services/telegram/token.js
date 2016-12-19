'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    token: secrets.telegram.token,
  }
}
