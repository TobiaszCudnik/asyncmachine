ASSETS = buid/test/assets
ONEJS = node_modules/one/bin/onejs
COFFEE = test/node_modules/coffee-script/bin/coffee
NODE = node
CCOFFEE = node_modules/compiled-coffee/bin/ccoffee
# CCOFFEE = node_modules/compiled-coffee/bin/ccoffee-osx

all:
	make build
	make build-test


build:
	$(CCOFFEE) -o build -i src -p "asyncmachine.js:asyncmachine"

build-watch:
	$(CCOFFEE) -o build -i src --watch -p "asyncmachine.js:asyncmachine"

server:
	node_modules/http-server/bin/http-server
	
example-basic:
	6to5 examples/basic/basic.js --out-file examples/basic/basic.es5.js
	node examples/basic/basic.es5.js
	
setup:
	npm install

test:
	#rm test/build/*/**
	./node_modules/mocha/bin/mocha \
		--compilers mocha --compilers coffee:coffee-script/register \
		--reporter spec \
		test/*.coffee

test-grep:
	./node_modules/mocha/bin/mocha \
		--compilers mocha --compilers coffee:coffee-script/register \
		--reporter spec \
		--grep "$(GREP)"
		test/*.coffee

test-debug:
	./node_modules/mocha/bin/mocha \
		--debug-brk \
		--compilers coffee:coffee-script \
		--reporter spec \
		test/*.coffee

test-grep-debug:
	./node_modules/mocha/bin/mocha \
		--debug-brk \
		--compilers mocha --compilers coffee:coffee-script/register \
		--reporter spec \
		--grep "$(GREP)"
		test/*.coffee
	
.PHONY: build test
