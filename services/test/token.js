'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    username: secrets.test.username,
    password: secrets.test.password,
  }
}
