var MIN_PAUSE_BETWEEN_MESSAGES = 500
var MAX_PAUSE_BETWEEN_MESSAGES = 6000
var VARIABLE_PAUSE = 1000

function makeParagraphs (string, maxLength, terminator) {
  var str = `(\\S.{1,${maxLength}}\\${terminator})|(\\S.{1,${maxLength}}\\s)|(\\S.{1,${maxLength}})`
  var regex = new RegExp(str, 'g')
  return string.match(regex).map(e => e.trim())
}

function calcuatePauseForText (text) {
  var pause = text.length * 10
  pause = Math.max(Math.min(pause, MAX_PAUSE_BETWEEN_MESSAGES), MIN_PAUSE_BETWEEN_MESSAGES)
  pause = pause + Math.random() * VARIABLE_PAUSE
  return pause
}

function hasTokenExpired (config) {
  return config.expire_date > new Date().getTime()
}

function sendMessageInChunks (serviceUserId, message, serviceSendFunction) {
  if (typeof message === 'string' && message.length > 320) {
    message = makeParagraphs(message, 300, '.')
  }

  if (Array.isArray(message)) {
    return sendMessageInChunks(serviceUserId, message[0], serviceSendFunction)
      .then(() => {
        if (message.length > 1) {
          var text = message.slice(1)

          setTimeout(() => {
            sendMessageInChunks(serviceUserId, text, serviceSendFunction)
          }, calcuatePauseForText(text[0]))
        }
      })
  }

  return serviceSendFunction(serviceUserId, message)
}

module.exports = {
  calcuatePauseForText,
  sendMessageInChunks,
  hasTokenExpired,
  makeParagraphs,
}
