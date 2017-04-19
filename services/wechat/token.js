'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    appId: secrets.wechat.app_id,
    appSecret: secrets.wechat.app_secret,
  }
}
