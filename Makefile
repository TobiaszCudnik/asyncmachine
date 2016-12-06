BIN=./node_modules/.bin

all:
	make build
	make build-test

build:
	-tsc
	-$(BIN)/rollup -c rollup.config.js
	-$(BIN)/rollup -c rollup-shims.config.js

build-dev:
	-$(BIN)/tsc --watch --isolatedModules --module commonjs

compile:
	$(BIN)/tsc --noEmit --pretty

compile-watch:
	$(BIN)/tsc --watch --noEmit --pretty
	
setup:
	npm install

test:
	./node_modules/mocha/bin/mocha \
		test/*.js

test-build:
	-$(BIN)/tsc \
		--isolatedModules \
		--skipLibCheck \
		-p test

test-build-watch:
	-$(BIN)/tsc \
		--isolatedModules \
		--skipLibCheck \
		--watch \
		-p test

test-grep:
	$(BIN)/mocha \
		--grep "$(GREP)"
		test/*.js

test-debug:
	$(BIN)/mocha \
		--debug-brk \
		--grep "$(GREP)" \
		test/*.js

test-grep-debug:
	$(BIN)/mocha \
		--debug-brk \
		--grep "$(GREP)" \
		test/*.js

docs:
	$(BIN)/typedoc \
		--out docs/ \
		--ignoreCompilerErrors \
		--name AsyncMachine \
		src/asyncmachine.ts

.PHONY: build test docs
