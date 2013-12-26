ASSETS = buid/test/assets
ONEJS = node_modules/one/bin/onejs
COFFEE = test/node_modules/coffee-script/bin/coffee
NODE = node

all:
	make build
	make build-test


build:
	node --harmony ../typed-coffeescript/src/coffeetype.js -o build2 -i src2

build-watch:
	node --harmony ../typed-coffeescript/src/coffeetype.js -o build2 -i src2 --watch
	
package:
	./node_modules/browserify/bin/cmd.js build2/dist/asyncmachine.js > \
		build2/dist/asyncmachine.pkg.js

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
	#rm test/build/*/**
	./node_modules/mocha/bin/mocha \
		--harmony-generators \
		--compilers coffee:coffee-script \
		--reporter spec \
		build2/test/dist/*.coffee

build-test-watch:
	node --harmony ../typed-coffeescript/src/coffeetype.js -o build2/test -i test \
		--watch
	
.PHONY: build test