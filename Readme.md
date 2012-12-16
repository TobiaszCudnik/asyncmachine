# AsyncMachine

  Multi state machine for a declarative async logic.
  
# Disclaimer

Motivation behind AsyncMachine was to make creating async evented systems 
easier, more predictable and to reduce code redundancy. It's loosely based on 
finite state machine and isn't backed up with any formalized theory. 

Target of this project is to extend and/or replace such patterns as promise, 
event emitter and callback passing style. 
  
# Example
  
```javascript
class Foo extends AsyncMachine {
    state_A = {
        // Decides about the order of activations (transitions).
        depends: [],
        // Activates also following states.
        implies: ['B'],
        // Will be activated only if following are met.
        requires: [],
        // When active, blocks activation (or deactivates) of following states.
        blocks: []
    };
    state_B = {}
    A_enter() { };
    A_exit() { };
    A_B() { };
    any_A() { };
    A_any() { };
}
```

# Features

- always synchronous state
-- transition can cancel a change of the state
- states definitions in OO manner
- state relations: blocks, implies, requires, depends
- state transitions (methods) in OO manner (prototype-level)
-- ::A_enter, ::A_B, ::any_A, etc
- transitions exposed via an event emitter
-- with sub events (superEvent.subEvent)
- nested transitions queued in a sync way, executed in a series
- promises support for deferred state changes (multiplexing)
- logging system for free
- mixin support
- written in TypeScript
- lots of tests (in Coffee)

## Order of a transition:

Example presents a transition from StateA to StateB:
- StateA_exit
- StateA_StateB
- StateA_any
- any_StateB
- StateB_enter

## Events

AsyncMachine has an event emitter based on LucidJS, which supports states and 
sub events. Following events are emitted from the above example transition:

- State.A.exit
- State.A._.State.B
- State.A._.any
- any._.State.B
- State.B._.enter

Notice the '.' dot convention. It allows you to namespace sub events. This means,
once bound to 'State.A' it'll be emitted for an exit event and all transitions.
You can understand it as if there would be a wildcard at the end.

Additionally, all currenly active states emit 'State.Name.enter' event at once
when you bind to them.

# TODO / Ideas

- break for Array#some and Array#every (or replace with a normal loop)
- exception support (includes promise rejections)
-- promises eat exceptions
- log only executed transitions
- queued state changes (when nested)
- travis CI
- make logging better
-- pass thou a method (namespaced)
-- log only executed transitions
- auto trigger an event if state is set
- try to auto drop the implied state when dropping a state
- tests for the mixin api (traits.js support & examples?)
- method for generating all possible transition permutations (honoring the relations)
- customizable naming convention
-- STATE_STATE to StateState or state_

# Design concerns

- [add|set]StateLater works only once
- dropped state transitions to all currently active states, not only newly added ones
- state change during a state change is queued after current one finishes
- auto states that drops other states? should not be allowed?
- parsing auto states before state change? what if a new state relays on an auto state?
- typescript properties implementation prevents the visibility of sub 
  class states in the super constructor (need for calling this.initStates() )
- polluted stack trace

## License 

(The MIT License)

Copyright (c) 2012 Tobiasz Cudnik &lt;tobiasz.cudnik@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 