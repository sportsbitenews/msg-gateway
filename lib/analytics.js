'use strict';

const stage = process.env.SERVERLESS_STAGE || 'dev'
const secrets = require(`../secrets.${stage}.json`)

const libs = {
  dashbot: require('./dashbot'),
  botmetrics: require('./botmetrics'),
  botanalytics: require('./botanalytics'),
  botlytics: require('./botlytics'),
  chatbase: require('./chatbase'),
}

const activated = Object.keys(libs)
  .filter(k => secrets[k] && secrets[k].enabled)
  .map(k => libs[k])

function logToAnalytics (type, msg) {
  if (activated.length === 0) {
    return msg
  }

  const id = msg.userId || `${msg.service_name}/${msg.service_user_id}`
  const platform = msg.service_name
  const intent = msg.intent || 'unknown'
  let text = msg.text

  if (!Array.isArray(text)) {
    text = [text]
  }

  return Promise.all(text.map(m => _logToIndividualAnalytics(type, id, m, intent, platform)))
    .then(receipts => Object.assign({}, msg, { response: receipts }))
}

function _logToIndividualAnalytics (type, id, message, intent, platform) {
  return Promise.all(activated.map(l => l.send(type, id, message, intent, platform)))
}

module.exports = {
  logToAnalytics,
}
