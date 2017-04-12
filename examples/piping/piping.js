const asyncmachine = require('../../build/asyncmachine.js')
require('source-map-support').install()


/**
 * This example presents how piping works between machines.
 * 
 * Log output (mixed levels)
create the pipes (and sync the state)

[foo] [pipe] A as AA to bar
[bar] [drop] AA
[foo] [pipe:invert] B as NotB to baz
[baz] [add] NotB
[baz] [states] +NotB
[baz] [pipe] NotB as NotB to bar
[bar] [add] NotB
[bar] [states] +NotB

play with [foo] a bit

[foo] [states] +A
[bar] [states] +AA
[foo] [states] +B
[baz] [states] -NotB
[bar] [states] -NotB
[foo] [states] -B
[baz] [states] +NotB
[bar] [states] +NotB
*/

const foo = asyncmachine.factory({
	A: {},
	B: {}
}).id('foo').logLevel(2)

const bar = asyncmachine.factory({
	AA: {},
	NotB: {}
}).id('bar').logLevel(2)

const baz = asyncmachine.factory({
	NotB: {},
}).id('baz').logLevel(2)


console.log("\ncreate the pipes (and sync the state)\n")

foo.pipe('A', bar, 'AA')
foo.pipe('B', baz, 'NotB', asyncmachine.PipeFlags.INVERT)
baz.pipe('NotB', bar, 'NotB')

console.log("\nplay with [foo] a bit\n")
foo.logLevel(1)
bar.logLevel(1)
baz.logLevel(1)

foo.add('A')
foo.add('B')
foo.drop('B')
