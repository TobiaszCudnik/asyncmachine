all:
	#make build
	make build-test

build:
	#tsc --declarations -sourcemap -c --module AMD src/multistatemachine.ts
	tsc --declarations -sourcemap -c src/multistatemachine.ts
	mv src/multistatemachine.js build
	mv src/multistatemachine.d.ts build
	mv src/multistatemachine.js.map build
	onejs build package.json build/lib/build.js --verbose 

build-test:
	#	-c -o build/test \
	./test/node_modules/coffee-script/bin/coffee \
		-c test/test.coffee
	onejs build test/package.json build/test/build.js --verbose 
	rm test/test.js
	#tsc --declarations -c test/test.ts
	#./node_modules/browserify/bin/cmd.js \
	#	test/test.coffee \
	#	-o build/browser-test/bundle.js 
	#mv src/multistatemachine.js build
	#mv src/multistatemachine.d.ts build

browser-test:
	make build
	make server

server:
	http-server

test:
	make build
	./node_modules/mocha/bin/mocha test/test.js

.PHONY: build test