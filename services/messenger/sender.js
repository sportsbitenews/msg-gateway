'use strict'

var utils = require('../../lib/utils')

var makeFBRequest = require('./makeFBRequest')

module.exports = function messengerSender(serviceUserId, message) {
  var messages = utils.chunk(message, 300)
  var sendFunc = msg => {
    return sendFBMessage(serviceUserId, msg)
      .then(() => {
        var isLast = msg === messages.slice(-1)[0]
        return setTyping(serviceUserId, !isLast)
      })
  }

  return utils.chainPromiseWithArguments(sendFunc, messages, utils.calcuatePauseForText)
}

function setTyping(serviceUserId, isTyping) {
  var body = {
    recipient: {
      id: serviceUserId,
    },
    sender_action: isTyping ? 'typing_on' : 'typing_off',
  }

  return makeFBRequest('/v2.6/me/messages', body)
}

function sendFBMessage(serviceUserId, text) {
  var body = {
    recipient: {
      id: serviceUserId,
    },
    message: {
      text: text,
    },
  }

  return makeFBRequest('/v2.6/me/messages', body)
}
