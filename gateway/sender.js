'use strict'

var https = require('../lib/https')
var SERVICES = require('../services')

module.exports = function (plugins, sns, secrets) {
  function handleMessages(messages) {
    return Promise.all(messages.map(_handleMessage))
  }

  function _handleMessage(msg) {
    return https.parseJson(msg)
      .then(_executeParser)
      .then(_sendMessage)
      .catch(e => _handleError(e, msg))
      .then(_executePlugins)
  }

  function _executeParser(msg) {
    return plugins.parser('outgoing', msg)
  }

  function _executePlugins(msg) {
    var middlewares = Object.keys(plugins)
      .filter(k => k !== 'parser')
      .map(plugin => plugins[plugin])

    return Promise.all(middlewares.map(m => m.execute(m)))
      .catch(error => {
        console.log('Error processing message: ', error, msg)
        return Object.assign({}, msg, {
          error,
        })
      })
  }

  function _sendMessage(msg) {
    var service_name = msg.service_name

    if (secrets[service_name] && !secrets[service_name].enabled) {
      throw new Error('Service disabled: ' + service_name)
    }

    if (Object.keys(SERVICES).indexOf(service_name) < 0) {
      throw new Error('Unknown service: ' + service_name)
    }

    return SERVICES[service_name].sendMessage(msg.service_user_id, msg.text)
      .then(response => Object.assign({}, msg, { response }))
  }

  function _handleError(error, msg) {
    console.log('Error processing message:', msg)
    console.log(error.message, error.stack)

    var errorParams = {
      error: error.message,
    }
    var message = Object.assign({}, msg, errorParams)

    return _sendMessage(message)
  }


  function formatResponse(res) {
    var response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(res),
    }

    return response
  }

  return {
    handleMessages,
    formatResponse,
  }
}
