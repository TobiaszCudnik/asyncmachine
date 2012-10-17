build:
	tsc --declarations src/multistatemachine.ts
	tsc --declarations test/test.ts

test:
	make build
	./node_modules/mocha/bin/mocha test/test.js

.PHONY: build test