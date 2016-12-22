var MIN_PAUSE_BETWEEN_MESSAGES = 500
var MAX_PAUSE_BETWEEN_MESSAGES = 6000
var VARIABLE_PAUSE = 1000

function makeParagraphs(string, maxLength, terminators) {
  if (!Array.isArray(terminators)) {
    terminators = [terminators]
  }

  var terminatorsString = terminators.map(escapeRegExp).join(',')

  var str = `(\\S.{1,${maxLength}}[${terminatorsString}])|(\\S.{1,${maxLength}}\\b)|(\\S.{1,${maxLength}})`
  var regex = new RegExp(str, 'g')
  return string.match(regex).map(e => e.trim())
}

function calcuatePauseForText(text) {
  var pause = text.length * 10
  pause = Math.max(Math.min(pause, MAX_PAUSE_BETWEEN_MESSAGES), MIN_PAUSE_BETWEEN_MESSAGES)
  pause = pause + Math.random() * VARIABLE_PAUSE
  return pause
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function hasTokenExpired(config) {
  return config.expire_date > new Date().getTime()
}

function sendMessageInChunks(serviceUserId, message, _send, noDelay) {
  message = _chunk(message)

  function _after() {
    if (!(message.length > 1)) return

    var text = message.slice(1)
    if (noDelay)
      return sendMessageInChunks(serviceUserId, text, _send)

    var delay = calcuatePauseForText(text[0])
    return _sendWithTimeout(delay, (done) => {
      sendMessageInChunks(serviceUserId, text, _send).then(done)
    })
  }

  return !Array.isArray(message)
    ? _send(serviceUserId, message)
    : sendMessageInChunks(serviceUserId, message[0], _send).then(_after)
}

function _chunk(message) {
  if (typeof message === 'string' && message.length > 320) {
    message = makeParagraphs(message, 300, ['.', ':', ','])
  }

  return message
}

function _sendWithTimeout(delay, callback) {
  return new Promise(resolve => {
    setTimeout(() => callback(resolve), delay)
  })
}

module.exports = {
  sendWithTimeout: _sendWithTimeout,
  calcuatePauseForText,
  sendMessageInChunks,
  hasTokenExpired,
  makeParagraphs,
  escapeRegExp,
  chunk: _chunk,
}
