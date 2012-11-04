ASSETS = buid/test/assets

all:
	#make build
	make build-test

build:
	tsc --declarations -sourcemap -c src/multistatemachine.ts
	mv src/multistatemachine.js build/lib/
	mv src/multistatemachine.d.ts build/lib/
	mv src/multistatemachine.js.map build/lib/
	onejs build package.json build/pkg/build.js 

build-test:
	make build
	./test/node_modules/coffee-script/bin/coffee \
		-c test/test.coffee
	onejs build test/package.json build/test/build.js
	mv test/test.js build/test/assets
	cat test/bootstrap.js >> build/test/build.js

browser-test:
	make build-test
	make server
	echo "Open http://localhost:8080/build/test.html"
	# TODO open URL

server:
	http-server
	
test-env-prepare:
	ln -s . test/node_modules/multistatemachine

test:
	make build-test
	make test-exec

test-exec:
	./test/node_modules/mocha/bin/mocha \
		build/test/build.js

.PHONY: build test