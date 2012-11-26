ASSETS = buid/test/assets
ONEJS = node_modules/one/bin/onejs

all:
	make build
	make build-test

build:
	rm -f build/lib/asyncmachine.js
	tsc --declaration -sourcemap -c src/asyncmachine.ts
	mv src/asyncmachine.js build/lib/
	# TODO use coffee makefile fix
	mv src/asyncmachine.d.ts build/lib/
	#rm src/asyncmachine.d.ts
	coffee Makefile.coffee build_fix
	mv src/asyncmachine.js.map build/lib/
	$(ONEJS) build package.json build/pkg/build.js
	cp headers/rsvp.d.ts build/lib/
	cp headers/lucidjs.d.ts build/lib/

build-test:
	make build
	./test/node_modules/coffee-script/bin/coffee \
		-c test/test.coffee
	$(ONEJS) build test/package.json build/test/build.js
	mv test/test.js build/test/assets
	cat test/bootstrap.js >> build/test/build.js

browser-test:
	make build-test
	make server
	echo "Open http://localhost:8080/build/test.html"
	# TODO open URL

server:
	node_modules/http-server/bin/http-server
	
setup:
	npm install
	rm -f test/node_modules/asyncmachine
	mkdir -p test/node_modules
	ln -s ../.. test/node_modules/asyncmachine
	mv test/package.json test/package-one.json
	mv test/package-npm.json test/package.json

	cd test && npm install
	mv test/package.json test/package-npm.json
	mv test/package-one.json test/package.json

test:
	make build-test
	make test-exec

test-exec:
	./test/node_modules/mocha/bin/mocha \
		--reporter spec \
		build/test/build.js

.PHONY: build test