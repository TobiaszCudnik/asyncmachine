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
	tsc --watch --noEmit --pretty

server:
	node_modules/http-server/bin/http-server
	
setup:
	npm install

test:
	./node_modules/mocha/bin/mocha \
		test/*.js

test-build:
	-tsc \
		--isolatedModules \
		-p test

test-build-watch:
	-tsc \
		--isolatedModules \
		--watch \
		-p test

test-grep:
	./node_modules/mocha/bin/mocha \
		--grep "$(GREP)"
		test/*.js

test-debug:
	./node_modules/mocha/bin/mocha \
		--debug-brk \
		--grep "$(GREP)" \
		test/*.js

test-grep-debug:
	./node_modules/mocha/bin/mocha \
		--debug-brk \
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
		--reporter spec \
		test/*.js >> docs/spec.html
	echo "</pre></body></html>" >> docs/spec.html

.PHONY: build test docs
