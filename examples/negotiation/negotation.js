const asyncmachine = require('../../build/asyncmachine.cjs.js')
require('source-map-support').install()


// setup the states
const states = asyncmachine.factory({
	A: { implies: 'Foo' },
	B: { implies: 'Foo' },
	Foo: {}
})
// setup logging
states.id('').logLevel(1)

// Foo agrees to be set indirectly only via A
states.Foo_enter = function(states) {
	// the return type has to be boolean
	return Boolean(~states.indexOf('A'))
}

states.add('B') // false
states.add('A') // true
console.log( states.is() ) // ['A', 'Foo']
