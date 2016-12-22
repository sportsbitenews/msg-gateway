'use strict'

var utils = require('../../lib/utils')

var makeFBRequest = require('./makeFBRequest')


module.exports = function messengerSender(serviceUserId, message) {
  if (typeof message === 'string' && message.length > 320) {
    message = utils.makeParagraphs(message, 300, ['.', ':', ','])
  }

  function _after() {
    if (!(message.length > 1)) return

    setTyping(serviceUserId, true)
      .catch(e => console.log(e))
      .then(_ => {
        var text = message.slice(1)
        var delay = calcuatePauseForText(text[0])

        utils.sendWithTimeout(delay, (done) => {
          messengerSender(serviceUserId, text).then(done)
        })
      })
  }

  return !Array.isArray(message)
    ? sendFBMessage(serviceUserId, message)
    : messengerSender(serviceUserId, message[0]).then(_after)
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
