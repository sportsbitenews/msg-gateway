# MsgGateway

A messaging aggregator. Connect it to your messaging services; send and receive messages in a standard format.

Built with the Server⚡️less framework

## Chatbots
So you want to build a chatbot, eh? We're here to help. MsgGateway connects to your various messaging services and parses incoming/outgoing messages, so that's one less piece you need to worry about. It can be extended to support any messaging service with an API.

MsgGateway runs completely on AWS so there's no need to worry about servers. If you're unfamiliar with the Serverless framwork (or serverless in general), you can read about it here: http://blog.serverless.com/defining-serverless/

Currently supports Facebook messenger and Twilio SMS but it's super easy to add more services so **don't be shy**, *send a PR*.

## How to get started

##### Step 1
If you don't have the Serverless framework installed, install it here:  
`npm install -g serverless`  
[setup your aws credentials](https://github.com/serverless/serverless/blob/master/docs/02-providers/aws/01-setup.md)

##### Step 2
```
git clone https://github.com/yonahforst/msg-gateway.git
cd msg-gateway
cp secrets.example.json secrets.json
cp messageHandler.example.js messageHandler.json
```

Open `secrets.json` and add the tokens for the services you want to use. See below for setting up those services and finding the tokens  
_Note: make sure you also set `enabled` to `true`_  
_Note: `verify_token` is generated by you. you can use your favorite movie quote or run `uuidgen` for somethign random (osx)_

##### Step 3
Run
`sls deploy`

Congrats 👏🏽 you now have messaging gateway running on AWS Lambda. High five! you're awesome.


### Sending and receiving messages
###### Send
To send messages, use the send endpoint (run `sls info` to list your endpoints)
```
curl -X POST 'https://xxxxx.execute-api.xxxx.amazonaws.com/dev/send' \
-d '{"service_name":"twilio","service_user_id":"+17185551212","text":"I got your number from a movie"}'
```

To receive messages, you need to point the various messaging services to your webhook endpoint (instructions below)
###### Receive
Received messages are delivered to the `handleIncoming` function of `messageHandler.js`. They look a little something like this:
```
{ service_name: 'messenger',
  service_user_id: '112342234345343',
  text: 'hakuna matata, what a wonderful phrase!',
  timestamp: 1473951829723 }
 ```
 From there you can do what you want; forward them to another API, send them to another lambda function, or process them right there... whatever you want.

 You can also hook in, and parse messages before they are sent by customizing the `parseOutgoing` function. 

###### Examples
 E.g. I don't want to know anything about `service_user_id`s and `service_names` in the rest of my code. I'm using these functions match `service_name` + `service_user_id` to a `user_id` in my database. Checkout my code for this in the `examples` dir

### Integrations
####Facebook:
Follow [this guide for the Facebook page config](https://developers.facebook.com/docs/messenger-platform/product-overview/setup) (ignore the code snippits):

When you get to the __Webhook__ section, __Verfiy Token__ is whatever you specified in `secrets.json`.  
__Callback Url__ is your webhook endpoint: `https://xxxx.execute-api.xxxx.amazonaws.com/dev/webhook/messenger`  

#### Twilio:
Your `account_sid` is found on your Twilio __Console Dashboard__  
Your `api_key_sid/api_key_secret` can be created by going to __Developer Center > API Keys__

Go to __Progammable SMS > Messaging Services__ and create a new one. There you'll get a `messaging_service_sid`. Under __Inbound Settings__, make sure __Process Inbound Messages__ is checked and set your __Request Url__ to your webhook endpoint: `https://xxxx.execute-api.xxxx.amazonaws.com/dev/webhook/twilio` (the method should be set to `HTTP_GET`)

#### Skype:
Your `app_id` which is the Microsoft App ID from your bots panel.
Your `app_password` which is the password that it's only shown to you once when you create the Bot.

#### Telegram:
Your `token` the token when you create the bot.

#### Kik:
Your `username` the username for your bot.
Your `api_key` which can be found and "regenerated" in __Configuration > API Key__.


#### TODO
- DONE - there's a bug with twilio because we're sending a content-type=application/json header but the body is actually xml
- can we use generators and yield to clean up all this promise-passing? that would be cool
- figure out someway to use api_keys from api-gateway
- we're not handling secrets very well right now. serverless should be coming out with a built in solution in their final release
- turn all these todos into github issues
- DONE - add an sns event to sendFunc. Allow messages to be sent by pushing to an SNS topic
- DONE - if we're gonna allow messages to be send via SNS we should also publish to an SNS topic when they are recived.
- figure out a better way to determine the event source from within the code.
- figure out a way to discover the a topics ARN from within the code.
- add tests
- ADD TESTS!!!
- figure out a way to let twilio send replies as part of the response	

