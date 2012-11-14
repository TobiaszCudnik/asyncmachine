
# Multi State Machine

  Multi state machine for declarative async logic.
  
# Disclaimer

Motivation behind MultiStateMachine was to make creating async evented systems 
easier, more predictable and to reduce code redundancy. It's loosely based on 
finite state machine and isn't backed up with any formalized theory. 

Target of this project is to extend and/or replace such patterns as promise, 
event emitter and callback passing style. 
  
# Example
  
```javascript
class Foo extends MultiStateMachine {
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
- states definitions (relations) in OO manner
-- blocks, implies, requires, depends
- transitions definitions in OO manner
-- ::A_enter, ::A_B, ::any_A, etc
- promises for deferred state changes
- lots of tests

## Order of a transition:
- STATE1_exit
- STATE1_STATE2
- STATE1_any
- any_STATE2
- STATE2_enter

# TODO / Ideas
- event emitter api, with piping
- mixin api (traits.js?)
- use an es5 compatibility lib
- method for generating all possible transitions
- customizable naming convention
  STATE_STATE to StateState or state_)

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