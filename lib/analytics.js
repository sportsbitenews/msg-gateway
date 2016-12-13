var dashbot = require('./dashbot');
var botmetrics = require('./botmetrics');
var botanalytics = require('./botanalytics');

var stage = process.env.SERVERLESS_STAGE || 'dev'
var secrets = require(`../secrets.${stage}.json`)

function logToAnalytics (msg) {
  var shouldLogToAnalytics = (secrets.dashbot && secrets.dashbot.enabled)
      || (secrets.botmetrics && secrets.botmetrics.enabled)
      || (secrets.botanalytics && secrets.botanalytics.enabled);

  if (!shouldLogToAnalytics) {
    return response
  }

  var id = `${msg.service_name}/${msg.service_user_id}`;
  var text = msg.text;

  if (!Array.isArray(text)) {
    text = [text];
  }

  return Promise.all(
      text.map(m => _logToIndividualAnalytics(id, m))
  )
      .then(receipts => Object.assign({}, msg, { receipts }))
}

function _logToIndividualAnalytics (id, message) {
  return Promise.all([
    dashbot.send('incoming', id, message),
    botmetrics.send('incoming', id, message),
    botanalytics.send('outgoing', id, message),
  ])
}

module.exports = {
  logToAnalytics,
}
