all:
	#make build
	make build-test

build:
	tsc --declarations -c src/multistatemachine.ts
	mv src/multistatemachine.js build

build-test:
	tsc --declarations -c test/test.ts
	./node_modules/browserify/bin/cmd.js \
		test/test.js \
		-o build/browser-test/bundle.js 
	mv src/multistatemachine.js build

browser-test:
	make build
	make server

server:
	http-server

test:
	make build
	./node_modules/mocha/bin/mocha test/test.js

.PHONY: build test