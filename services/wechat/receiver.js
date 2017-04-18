'use strict'

var https = require('../../lib/https')

var SERVICE_NAME = 'wechat'

module.exports = function wechatReceiver(ev) {
  return https.parseXML(ev.body)
    .then(data => {
      var xml = data.xml ? data.xml : data.root ? data.root : {}
      var messages = xml.Content ? formatMessage(xml) : []

      return Object.assign({}, ev, {
        messages,
        response: { status: 'ok' },
      })
    })
}

function formatMessage(xml) {
  return [{
    service_name: SERVICE_NAME,
    service_user_id: `${xml.FromUserName}`,
    text: xml.Content,
    timestamp: ~~xml.CreateTime || new Date().getTime(),
  }]
}
