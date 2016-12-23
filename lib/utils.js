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
  var messages = _chunk(message, 300)
  var boundSendFunc = _send.bind(null, serviceUserId)

  return _chainPromiseWithArguments(boundSendFunc, messages, calcuatePauseForText)
}

function _chainPromiseWithArguments(_promise, argArray, _pauseFunc) {
  var first = argArray[0]
  var rest = argArray.slice(1)

  if (rest.length == 0) {
    return _promise(first)
  }

  var delay = _pauseFunc ? _pauseFunc(first) : 0

  return _promise(first)
    .then(() => _resolveAfter(delay))
    .then(() => _chainPromiseWithArguments(_promise, rest, _pauseFunc))
}

function _chunk(message, size) {
  if (Array.isArray(message)) {
    return message.reduce((pre, cur) => pre.concat(_chunk(cur, size)), [])
  } else if (typeof message === 'string' && message.length > size) {
    return makeParagraphs(message, size, ['.', ':', ','])
  } else {
    return [ message ]
  }
}

function _resolveAfter(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}

module.exports = {
  chainPromiseWithArguments: _chainPromiseWithArguments,
  calcuatePauseForText,
  sendMessageInChunks,
  hasTokenExpired,
  makeParagraphs,
  escapeRegExp,
  chunk: _chunk,
}
