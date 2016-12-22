REQUIRED = -r babel-register

TESTS = services/__test__/kik/* \
	services/__test__/line/* \
	services/__test__/skype/* \
	services/__test__/twilio/* \
	services/__test__/telegram/* \
	services/__test__/messenger/* \
	functions/__test__/send.js

NYC = ./node_modules/.bin/nyc

install:
	npm install

install_production: clean
	npm install --production

test:
	@SERVERLESS_STAGE=test node \
		./node_modules/.bin/blue-tape \
		$(REQUIRED) $(TESTS) \
		| faucet

test_cov:
	@SERVERLESS_STAGE=test node \
		$(NYC) --reporter=lcov $(REQUIRED) \
		./node_modules/.bin/blue-tape

test_report:
	@SERVERLESS_STAGE=test node \
		$(NYC) report

clean:
	rm -rf node_modules

deploy: clean install_production
	sls deploy

.PHONY: install install_production deploy test test_report test_cov clean
