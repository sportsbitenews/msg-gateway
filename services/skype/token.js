'use strict'

module.exports = function (stage) {
  var secrets = require(`../../secrets.${stage}.json`)

  return {
    id: secrets.skype.app_id,
    pass: secrets.skype.app_password,
    bot_id: secrets.skype.bot.id,
    bot_name: secrets.skype.bot.name,
  }
}
