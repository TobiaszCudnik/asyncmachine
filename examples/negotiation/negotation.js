/**
 * AsyncMachine Negotiation Example
 *
 * This example presents how the state negotiation works.
 * Scroll down for the log output.
 *
 * @link https://github.com/TobiaszCudnik/asyncmachine
 */

const { machine } = require('asyncmachine')
require('source-map-support').install()

// setup the states
const example = machine({
  A: { add: ['Foo'] },
  B: { add: ['Foo'] },
  Foo: {}
})
// setup logging
example.id('').logLevel(2)

// `Foo` agrees to be set indirectly only via `A`
example.Foo_enter = function() {
  // the return type has to be boolean
  return Boolean(this.to().includes('A'))
}

example.add('B') // -> false
example.add('A') // -> true
console.log(example.is()) // -> ['A', 'Foo']

/*

Log output (level 2):

[add] B
[add:implied] Foo
[transition] Foo_enter
[cancelled] B, Foo by the method Foo_enter
[add] A
[add:implied] Foo
[transition] Foo_enter
[state] +A +Foo
[ 'A', 'Foo' ]

*/
