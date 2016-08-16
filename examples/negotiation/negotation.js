const asyncmachine = require('../../build/asyncmachine.cjs.js')
require('source-map-support').install()


/**
 * This example presents how the state negotiation works.
 * 
 * Log level 2 output:
[add] B
[add:implied] Foo
[transition] Foo_enter
[cancelled] B, Foo by the method Foo_enter
[add] A
[add:implied] Foo
[transition] Foo_enter
[states] +A +Foo
[ 'A', 'Foo' ]
 */

// setup the states
const states = asyncmachine.factory({
	A: { add: ['Foo'] },
	B: { add: ['Foo'] },
	Foo: {}
})
// setup logging
states.id('').logLevel(2)

// Foo agrees to be set indirectly only via A
states.Foo_enter = function() {
	// the return type has to be boolean
	return Boolean(~this.to().indexOf('A'))
}

states.add('B') // false
states.add('A') // true
console.log( states.is() ) // ['A', 'Foo']
