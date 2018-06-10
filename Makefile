BIN=./node_modules/.bin
MOCHA=./node_modules/mocha/bin/mocha

all:
	make build
	make build-test

build:
	-make build-ts 
	make dist-es6
	make dist
	make dist-dts

build-dev:
	$(BIN)/tsc --watch --isolatedModules

dist:
	$(BIN)/rollup -c rollup.config.js

dist-es6:
	$(BIN)/rollup -c rollup-es6.config.js

dist-shims:
	$(BIN)/rollup -c rollup-shims.config.js

build-ts:
	tsc

build-ts-watch:
	tsc --watch

dist-dts:
	# TODO move to dts-bundle.json
	./node_modules/.bin/dts-bundle \
		--name asyncmachine \
		--main build/asyncmachine.d.ts \
		--out asyncmachine-bundle.d.ts

compile:
	$(BIN)/tsc --noEmit --pretty

compile-watch:
	$(BIN)/tsc --watch --noEmit --pretty
	
setup:
	npm install

# make version version=x.x.x
version:
	npm --no-git-tag-version --allow-same-version version $(version)

	cd pkg && \
		npm --no-git-tag-version --allow-same-version version $(version)

publish:
	make build
	rm -Rf pkg-tmp
	cp -RL pkg pkg-tmp
	cd pkg-tmp && \
		npm publish

test:
	$(MOCHA) \
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
	$(MOCHA) \
		--grep "$(GREP)"
		test/*.js

test-debug:
	$(MOCHA) \
		--inspect-brk \
		--grep "$(GREP)" \
		test/*.js

test-grep-debug:
	$(MOCHA) \
		--debug-brk \
		--grep "$(GREP)" \
		test/*.js

docs:
	mkdir -p docs/api
	$(BIN)/typedoc \
		--out docs/api \
		--ignoreCompilerErrors \
		--name AsyncMachine \
		--theme minimal \
		--excludeNotExported \
		--excludePrivate \
		--readme none \
		--mode file \
		src/asyncmachine.ts

pdf:
	cp \
		wiki/AsyncMachine-The-Definitive-Guide.pdf \
		docs/AsyncMachine-The-Definitive-Guide.pdf

.PHONY: build test docs
