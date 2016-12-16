'use strict'

var SERVICES = require('../services')

module.exports = function (plugins, sns, secrets) {
  function _reject(errorMsg) {
    console.log(errorMsg)
    return Promise.reject(new Error(errorMsg))
  }

  function normalizeEvent(event) {
    var path = event.pathParameters || event.path
    var service_name = path.service_name
    var body = event.body
    var query = event.queryStringParameters || event.query
    var method = event.method || event.httpMethod

    if (secrets[service_name] && !secrets[service_name].enabled) {
      return _reject('Service disabled: ' + service_name)
    }

    return Promise.resolve({
      path,
      service_name,
      body,
      query,
      method,
    })
  }

  function processEvent(ev) {
    var service_name = ev.service_name

    if (Object.keys(SERVICES).indexOf(service_name) < 0) {
      throw new Error('Unknown service: ' + service_name)
    }

    return SERVICES[service_name].processEvent(ev)
  }

  function publishToSns(msg) {
    return _shouldPublish(msg)
      ? msg
      : sns.publishReceivedMessage(msg, 'msgGateway-receivedMsg')
        .then(snsReceipt => Object.assign({}, msg, {
          snsReceipt,
        }))
  }

  function _shouldPublish(msg) {
    return secrets.sns && secrets.sns.enabled
  }

  function formatMessagesResponse(ev) {
    if (!Array.isArray(ev.messages)) {
      console.log('will not handle messages for event:', ev)
      return ev
    }

    return Promise.all(ev.messages.map(_handleMessage))
      .then(messages => Object.assign({}, ev, {
        messages,
      }))
      .then(_formatResponse)
  }

  function _handleMessage(msg) {
    if (plugins.parser && typeof plugins.parser === 'function') {
      return plugins.parser('incoming', msg)
        .then(_commonHandleMessage)
    }

    return publishToSns(msg)
      .then(_commonHandleMessage)
  }

  function _commonHandleMessage(msg) {
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

  function _formatResponse(ev) {
    if (!ev.response) {
      throw new Error('missing response for event:', ev)
    }

    var body = typeof ev.response === 'object' ? JSON.stringify(ev.response) : ev.response
    var contentType = ev.service_name === 'twilio' ? 'application/xml' : 'application/json'

    var response = {
      body,
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
      },
    }

    return Object.assign({}, ev, {
      response,
    })
  }

  return {
    formatMessagesResponse,
    normalizeEvent,
    processEvent,
    publishToSns,
  }
}
