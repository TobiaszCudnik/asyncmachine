all:
	make build

build:
	tsc --declarations -c src/multistatemachine.ts
	tsc --declarations -c test/test.ts
	./node_modules/browserify/bin/cmd.js \
		test/test.js \
		-o build/browser-test/bundle.js 

browser-test:
	make build
	make server

server:
	http-server

test:
	make build
	./node_modules/mocha/bin/mocha test/test.js

.PHONY: build test