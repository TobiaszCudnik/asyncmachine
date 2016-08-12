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
	-tsc
	rollup -c rollup.config.js
	rollup -c rollup-shims.config.js

build-dev:
	-tsc --watch --isolatedModules --module commonjs

compile-watch:
	tsc --watch

server:
	node_modules/http-server/bin/http-server
	
setup:
	npm install

test:
	./node_modules/mocha/bin/mocha \
		--harmony \
		--reporter spec \
		test/*.js

test-build:
	./node_modules/.bin/coffee \
		-cm \
		test/*.coffee

test-build-watch:
	./node_modules/.bin/coffee \
		-cwm \
		test/*.coffee

test-grep:
	./node_modules/mocha/bin/mocha \
		--harmony \
		--reporter spec \
		--grep "$(GREP)"
		test/*.js

test-debug:
	./node_modules/mocha/bin/mocha \
		--harmony \
		--debug-brk \
		--reporter spec \
		--grep "$(GREP)" \
		test/*.js

test-grep-debug:
	./node_modules/mocha/bin/mocha \
		--harmony \
		--debug-brk \
		--reporter spec \
		--grep "$(GREP)" \
		test/*.js

docs:
	./node_modules/.bin/typedoc \
		--out docs/ \
		--ignoreCompilerErrors \
		--name AsyncMachine \
		src/asyncmachine.ts

spec:
	echo "<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>" > docs/spec.html
	./node_modules/mocha/bin/mocha \
		--harmony \
		--compilers mocha --compilers coffee:coffee-script/register \
		--reporter spec \
		test/*.js >> docs/spec.html
	echo "</pre></body></html>" >> docs/spec.html

.PHONY: build test docs
