'use strict';

const stage = process.env.SERVERLESS_STAGE || 'dev'
const secrets = require(`../secrets.${stage}.json`)

const libs = {
  dashbot: require('./dashbot'),
  botmetrics: require('./botmetrics'),
  botanalytics: require('./botanalytics'),
}

const activated = Object.keys(libs)
  .filter(k => secrets[k] && secrets[k].enabled)
  .map(k => libs[k])

function logToAnalytics (type, msg) {
  if (activated.length === 0) {
    return msg
  }

  const id = `${msg.service_name}/${msg.service_user_id}`
  let text = msg.text

  if (!Array.isArray(text)) {
    text = [text]
  }

  return Promise.all(text.map(m => _logToIndividualAnalytics(type, id, m)))
      .then(receipts => Object.assign({}, msg, { response: receipts }))
}

function _logToIndividualAnalytics (type, id, message) {
  return Promise.all(activated.map(l => l.send(type, id, message)))
}

module.exports = {
  logToAnalytics,
}
