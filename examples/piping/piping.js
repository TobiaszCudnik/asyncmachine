const asyncmachine = require('../../build/asyncmachine.cjs.js')
require('source-map-support').install()


// SETUP THE MACHINES AND LOGGING


const foo = asyncmachine.factory({
	FooA: {},
	FooB: {}
})
foo.id('foo').logLevel(1)

const bar = asyncmachine.factory({
	BarA: {},
	BarB: {}
})
bar.id('bar').logLevel(1)

const baz = asyncmachine.factory({
	BazA: {},
	BazB: {}
})
baz.id('baz').logLevel(1)


// CREATE THE PIPES


foo.pipe('FooA', bar, 'BarA')
foo.pipeInverted('FooB', baz, 'BazB')
baz.pipe('BazB', bar, 'BarB')


// RUN

foo.add('FooA')
foo.add('FooB')
foo.drop('FooB')


/*
Log output:

[foo] [states] +FooA
[bar] [states] +BarA
[foo] [states] +FooB
[foo] [states] -FooB
[baz] [states] +BazB
[bar] [states] +BarB
*/
