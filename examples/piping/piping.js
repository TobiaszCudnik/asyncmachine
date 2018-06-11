/**
 * AsyncMachine Piping Example
 *
 * This example shows how piping states between machines works.
 *
 * Scroll down to see log the output.
 *
 * @link https://github.com/TobiaszCudnik/asyncmachine
 */

const { machine, PipeFlags } = require('asyncmachine')
require('source-map-support').install()

const foo = machine({
  A: {},
  B: {}
})
  .id('foo')
  .logLevel(2)

const bar = machine({
  AA: {},
  NotB: {}
})
  .id('bar')
  .logLevel(2)

const baz = machine({
  NotB: {}
})
  .id('baz')
  .logLevel(2)

console.log('\ncreate the pipes (and sync the state)\n')

foo.pipe('A', bar, 'AA')
foo.pipe('B', baz, 'NotB', PipeFlags.INVERT)
baz.pipe('NotB', bar, 'NotB')

console.log('\n start mutating [foo] only, and others will follow \n')

foo.add('A')
foo.add('B')
foo.drop('B')

/*
Console output:

create the pipes (and sync the state)

[foo] [pipe] 'A' as 'AA' to 'bar'
[bar] [drop] AA
[foo] [pipe:invert] 'B' as 'NotB' to 'baz'
[baz] [add] NotB
[baz] [state] +NotB
[baz] [pipe] 'NotB' as 'NotB' to 'bar'
[bar] [add] NotB
[bar] [state] +NotB

 start mutating [foo] only, and others will follow

[foo] [add] A
[foo] [state] +A
[bar] [add] AA
[bar] [state] +AA
[foo] [add] B
[foo] [state] +B
[baz] [drop] NotB
[baz] [state] -NotB
[bar] [drop] NotB
[bar] [state] -NotB
[foo] [drop] B
[foo] [state] -B
[baz] [add] NotB
[baz] [state] +NotB
[bar] [add] NotB
[bar] [state] +NotB
 */