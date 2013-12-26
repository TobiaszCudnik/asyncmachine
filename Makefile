ASSETS = buid/test/assets
ONEJS = node_modules/one/bin/onejs
COFFEE = test/node_modules/coffee-script/bin/coffee
NODE = node

all:
	make build
	make build-test

build:
	rm -f build/lib/asyncmachine.js
	tsc --declarations -sourcemap -c src/asyncmachine.ts
	mv src/asyncmachine.js build/lib/
	mv src/asyncmachine.d.ts build/lib/
	#rm src/asyncmachine.d.ts
	$(COFFEE) Makefile.coffee build_fix
	mv src/asyncmachine.js.map build/lib/
	make package
	
package:
	$(ONEJS) build package.json build/pkg/build.js
	cp src/headers/rsvp.d.ts build/lib/
	cp src/headers/lucidjs.d.ts build/lib/
	cp src/headers/commonjs.d.ts build/lib/

build-test:
	make build
	$(COFFEE) -c test/test.coffee
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
	
example-basic:
	$(NODE) examples/basic-javascript/basic.js
	
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