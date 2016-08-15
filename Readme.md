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
```

## Features
 
- state negotiation
- states clock
- synchronous nested transitions queueing
- the exception state
- transition exposed as events
- callbacks/promises/yield compatible
- expressive logging system
 
## Transitions
 
Example order of listeners during a transition between states A and B. All
methods (and events) with these names will be called.

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

MIT