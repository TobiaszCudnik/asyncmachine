ASSETS = buid/test/assets
ONEJS = node_modules/one/bin/onejs
COFFEE = test/node_modules/coffee-script/bin/coffee
NODE = node
CCOFFEE = ccoffee

all:
	make build
	make build-test


build:
	$(CCOFFEE) -o build -i src

build-watch:
	$(CCOFFEE) -o build -i src --watch
	
package:
	./node_modules/browserify/bin/cmd.js -r ./build/dist/asyncmachine.js:asyncmachine \
		--no-builtins > \
		build/dist-pkg/asyncmachine.js

build-test:
	$(CCOFFEE) -o build/test -i test

build-test-watch:
	$(CCOFFEE) -o build/test -i test \
		--watch

browser-test:
	make build-test
	make server
	echo "Open http://localhost:8080/build/dist-pkg/test.html"
	# TODO open URL

server:
	node_modules/http-server/bin/http-server
	
example-basic:
	$(NODE) examples/basic-javascript/basic.js
	
setup:
	npm install

test:
	#rm test/build/*/**
	./node_modules/mocha/bin/mocha \
		--harmony-generators \
		--compilers coffee:coffee-script \
		--reporter spec \
		build/test/dist/*.js

test-debug:
	#rm test/build/*/**
	./node_modules/mocha/bin/mocha \
		--debug-brk \
		--harmony-generators \
		--compilers coffee:coffee-script \
		--reporter spec \
		build/test/dist/*.js
	
.PHONY: build test