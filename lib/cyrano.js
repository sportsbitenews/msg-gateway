'use strict';

const https = require('./https')

const stage = process.env.SERVERLESS_STAGE || 'dev'
const secrets = require(`../secrets.${stage}.json`)

const API_KEY = secrets.cyrano && secrets.cyrano.enabled ? secrets.cyrano.api_key : null
const API_USER = secrets.cyrano && secrets.cyrano.enabled ? secrets.cyrano.api_user : null

function translateIn(user_id, text) {
  if (!API_KEY || !API_USER) {
    return Promise.reject(new Error('cyrano: api_key or api_user missing from secrets or disabled'))
  }

  const body = {
    user: {
      id: user_id,
    },
    text: text,
  }

  const path = `/bots/${API_USER}/en/messages/in`
  return _makeRequest(path, body)
}

function _makeRequest(path, body) {
  const options = {
    hostname: 'cyranoapi.unbabel.com',
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_USER + ':' + API_KEY,
    },
  }

  return https.request(options, JSON.stringify(body))
    .then(res => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        return res.json()
      } else {
        console.log(res)
        throw new Error(res.body)
      }
    })
}

module.exports = {
  translateIn,
}
