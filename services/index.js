'use strict'

var SERVICES = {
  kik: require('./kik'),
  line: require('./line'),
  skype: require('./skype'),
  twilio: require('./twilio'),
  telegram: require('./telegram'),
  messenger: require('./messenger'),
}

module.exports = function getService(name) {
  if (!Object.keys(SERVICES).indexOf(name) < 0) {
    return false
  }

  return SERVICES[name]
}
