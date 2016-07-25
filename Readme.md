# AsyncMachine
 
  A smart, multi-state dependency graph

## Description

Declarative modeling of the control flow, based on states interconnected by relations.
Activating a state triggers a two-pass transition - negotiation and set. If a
state change is triggered during an ongoing transition, it's gonna be queued. Each
state has a clock, which allows to distinguish state's "instances" (prevents the
double callback execution problem).


## Install

```
npm install asyncmachine
 
## Features
 
- state negotiation
- states clock
- synchronous nested transitions queueing
- the exception state
- transition exposed as events
- callbacks/promises/yield compatible
- expressive logging system
 
## Transitions
 
Example of an order of listeners during a transition between states A and B. All
methods *and events* with these names will be called.

- A_exit
- A_B
- A_any
- any_B
- B_enter
- A_end
- B_state
 
## Examples

https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples

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
