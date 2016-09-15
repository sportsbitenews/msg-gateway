## msg-gateway

A messaging aggregator. Connect it to your messaging services; send and receive messages in a standard format.

Built with the Server⚡️less framework

### Chatbots
So you want to build a chatbot, eh? We're here to help. MsgGateway connects to your various messaging services and parses incoming/outgoing messages, so that's one less piece you need to worry about. It can be extended to support any messaging service with an API.

MsgGateway runs completely on AWS so there's no need to worry about servers. If you're unfamiliar with the Serverless framwork (or serverless in general), you can read about it here: http://blog.serverless.com/defining-serverless/

Currently supports Facebook messenger and Twilio SMS. It's super easy to add more services so don't be *shy*, send a PR.

### How to get started

If you don't have the Serverless framework installed, install it here:
`npm install -g serverless`
then (setup your aws credentials)[https://github.com/serverless/serverless/blob/master/docs/02-providers/aws/01-setup.md]

`git clone https://github.com/yonahforst/msg-gateway.git`
`cd msg-gateway`
`cp secrets.example.json secrets.json`

open `secrets.json` and add the tokens for the services you want to use (make sure you also set `enabled` to `true`)
(see below for setting up those services and finding the tokens)

`sls deploy`

Copy the endpoints listed in the output.

Congrats 👏🏽 you now have messaging gateway running on AWS Lambda. Go ahead, give yourself a small hug. You're awesome!
