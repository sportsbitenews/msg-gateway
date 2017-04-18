'use strict'

const https = require('../lib/https');
const utils = require('../lib/utils');
const config = require('./token')(process.env.SERVERLESS_STAGE || 'dev');


module.exports = function testingSender(serviceUserId, message) {
  return utils.sendMessageInChunks(serviceUserId, message, sendTestingMessage, true)
};

function sendTestingMessage(userId, message) {

}
