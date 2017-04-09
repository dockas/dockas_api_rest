NODE_PATH:=./:./lib

.PHONY: prod dev test bash

prod:
	NODE_PATH=${NODE_PATH} NODE_ENV=production node --harmony index.js

dev:
	NODE_PATH=${NODE_PATH} NODE_ENV=development nodemon --config ./nodemon.json --legacy-watch index.js

gulp:
	NODE_PATH=${NODE_PATH} NODE_ENV=development gulp

lint:
	node ./node_modules/.bin/eslint --ignore-pattern '**/*.test.js' --ignore-pattern 'node_modules/**' --ignore-pattern 'gen-nodejs/**' '**/*.js'

test:
	NODE_PATH=${NODE_PATH} NODE_ENV=test mocha --reporter list --timeout 30000 --watch --harmony --es_staging --recursive --opts .test.js ./lib

init:
	git submodule update --recursive --remote

update:
	git submodule foreach git pull origin master

bash:
	bash
