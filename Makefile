TESTS = services/__test__/twilio/* \
	services/__test__/kik/* \
	services/__test__/line/* \
	services/__test__/telegram/* \
	services/__test__/skype/* \
	services/__test__/messenger/*

NYC = ./node_modules/.bin/nyc

install:
	npm install

install_production: clean
	npm install --production

test:
	@SERVERLESS_STAGE=test TAPE_TEST=true node \
		./node_modules/.bin/blue-tape $(TESTS) | ./node_modules/.bin/tap-spec

test_cov:
	@SERVERLESS_STAGE=test node \
		$(NYC) --reporter=lcov $(REQUIRED) \
		./node_modules/.bin/blue-tape

test_report:
	@SERVERLESS_STAGE=test node \
		$(NYC) report

clean:
	rm -rf node_modules

deploy_test:
	sls deploy -s test

deploy_dev:
	sls deploy

deploy_prod:
	sls deploy -s production

deploy: clean install_production
	sls deploy

.PHONY: install install_production deploy test test_report test_cov clean
