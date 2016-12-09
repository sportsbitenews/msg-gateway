var MIN_PAUSE_BETWEEN_MESSAGES = 500
var MAX_PAUSE_BETWEEN_MESSAGES = 6000
var VARIABLE_PAUSE = 1000

function makeParagraphs(string, maxLength, terminator) {
	var str = `(\\S.{1,${maxLength}}\\${terminator})|(\\S.{1,${maxLength}}\\s)|(\\S.{1,${maxLength}})`
	var regex = new RegExp(str, 'g')
	return string.match(regex).map(e => e.trim())
}

function calcuatePauseForText(text) {
	var pause = text.length * 10
	pause = Math.max(Math.min(pause, MAX_PAUSE_BETWEEN_MESSAGES), MIN_PAUSE_BETWEEN_MESSAGES)
	pause = pause + Math.random() * VARIABLE_PAUSE 
	return pause
}

module.exports = {
	makeParagraphs,
	calcuatePauseForText,
}