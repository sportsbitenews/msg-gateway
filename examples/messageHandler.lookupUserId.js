'use strict';

var myUserDB = require('./myUserDB') // this is fake

var handleIncoming = message => {
	return _getUserId(message.service_name, message.service_user_id)
		// merge the original message just in case we cant find a user and need to use the service info.
		.then(res => res ? Object.assign({}, {user_id: res.user_id}, message) : message)
		.then(msg => {
			console.log('received message from user:', msg.user_id, msg)
		})
}

var parseOutgoing = message => {
	return _getResponsePath(message.user_id)
		.then(res => {
			// in case we don't find a response path, use whatever service info MIGHT have been included on the original message
			var msg = {
				service_name: res ? res.service_name : message.service_name,
				service_user_id: res ? res.service_user_id : message.service_user_id,
				text: message.text,
			}
			console.log('will send message:', res)
			return msg
		})
}

var _getUserId = (service_name, service_user_id) => {
	// lookup service_name and service_user_id in your DB and return a promise
	return myUserDB.find({ service_name, service_user_id})
		.then(res => {
			return {
				user_id: res.id,
			}
		})
}

var _getResponsePath = (user_id) => {
	// lookup user_id in your DB and return a service_name and service_user_id
	// if you dont find a user, return null
	return myUserDB.find({id: user_id})
		.then(res => {
			if (!!res) {
				return {
					service_name: res.service_name,
					service_user_id: res.service_user_id,
				}
			}
		})
		.catch(e => {
			console.log(e)
			return
		})
}

module.exports = {
	handleIncoming,
	parseOutgoing,
}

