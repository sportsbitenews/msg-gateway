var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

var libs = {
  dashbot: require('./dashbot'),
  botmetrics: require('./botmetrics'),
  botanalytics: require('./botanalytics'),
}

var activated = Object.keys(libs)
  .filter(k => secrets[k] && secrets[k].enabled)
  .map(k => libs[k])

function logToAnalytics (type, msg) {
  if (activated.length === 0) {
    return msg
  }

  var id = `${msg.service_name}/${msg.service_user_id}`
  var text = msg.text

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
