'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    verifyToken: secrets.messenger.verify_token,
    page_access_token: secrets.messenger.page_access_token,
  }
}
