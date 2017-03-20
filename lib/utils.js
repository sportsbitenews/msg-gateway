'use strict';

let MIN_PAUSE_BETWEEN_MESSAGES = 1500
let MAX_PAUSE_BETWEEN_MESSAGES = 6000
let VARIABLE_PAUSE = 2000

function makeParagraphs(string, maxLength, terminators) {
  if (!Array.isArray(terminators)) {
    terminators = [terminators]
  }

  let paragraphs = []
  let startIndex = 0
  let lastTerminatorIndex = 0
  let lastBreakIndex = 0

  for (let i = 0; i < string.length; i++) {
    let char = string[i]
    lastBreakIndex = char.match(/\s/) ? i : lastBreakIndex

    if (terminators.indexOf(char) !== -1) {
      lastTerminatorIndex = i
    }

    if (i - startIndex >= maxLength) {
      if (lastTerminatorIndex - startIndex < 10) {
        lastTerminatorIndex = lastBreakIndex
      }
      if (lastTerminatorIndex === startIndex) {
        lastTerminatorIndex = maxLength
      }
      paragraphs.push(string.slice(startIndex, lastTerminatorIndex + 1))
      startIndex = lastTerminatorIndex + 1
    } else if (i === string.length - 1) {
      paragraphs.push(string.slice(startIndex))
    }
  }

  return paragraphs.map(e => e.trim())
}

function calcuatePauseForText(text) {
  let pause = text.length * 10
  pause = Math.max(Math.min(pause, MAX_PAUSE_BETWEEN_MESSAGES), MIN_PAUSE_BETWEEN_MESSAGES)
  pause = pause + Math.random() * VARIABLE_PAUSE
  return pause
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}

function hasTokenExpired(config) {
  return config.expire_date > new Date().getTime()
}

function sendMessageInChunks(serviceUserId, message, _send, noDelay) {
  let messages = _chunk(message, 300)
  let boundSendFunc = _send.bind(null, serviceUserId)

  return _chainPromiseWithArguments(boundSendFunc, messages, calcuatePauseForText)
}

function _chainPromiseWithArguments(_promise, argArray, _pauseFunc) {
  let first = argArray[0]
  let rest = argArray.slice(1)

  if (rest.length === 0) {
    return _promise(first)
  }

  let delay = process.env.TAPE_TEST ? 0 : _pauseFunc ? _pauseFunc(first) : 0

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
    setTimeout(resolve, process.env.TAPE_TEST ? 0 : delay)
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
