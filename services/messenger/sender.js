'use strict'

var utils = require('../../lib/utils')

var makeFBRequest = require('./makeFBRequest')


module.exports = function messengerSender(serviceUserId, message) {
  if (typeof message === 'string' && message.length > 320) {
    message = utils.makeParagraphs(message, 300, ['.', ':', ','])
  }

  if (Array.isArray(message)) {
    return messengerSender(serviceUserId, message[0])
      .then(() => {
        if (message.length > 1) {
          setTyping(serviceUserId, true)
            .catch(e => console.log(e))
            .then(_ => {
              var text = message.slice(1)

              setTimeout(function () {
                return messengerSender(serviceUserId, text)
              }, utils.calcuatePauseForText(text[0]))
            })
        }
      })
  }

  return sendFBMessage(serviceUserId, message)
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
