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
- promises support for deferred state changes (multiplexing)
- logging system for free
- mixin support
- written in TypeScript
- lots of tests (in Coffee)

## Order of a transition:

- STATE1_exit
- STATE1_STATE2
- STATE1_any
- any_STATE2
- STATE2_enter

# TODO / Ideas

- receive callback params !!!
- accessible method for setting a state on a next tick
- travis CI
- make logging better (namespace, pass thou a method)
- add state to the states' stack before running it's enter transition
- auto trigger an event if state is set
- nested state changes exceptions
- try to auto drop the implied state when dropping a state
- tests for the mixin api (traits.js support & examples?)
- method for generating all possible transition permutations (honoring the relations)
- customizable naming convention
-- STATE_STATE to StateState or state_

# Design concerns

- dropped state transitions to all currently active states, on only newly added ones
- state change request during state change transition is not allowed

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