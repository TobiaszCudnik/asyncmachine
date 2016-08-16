# AsyncMachine
 
  Declarative scheduler for the event loop

## Description

Technically a *multi-state dependency graph*, allows for a declarative modeling of the control flow, based on states interconnected by relations.
Activating a state triggers a two-pass transition - *negotiation* and *set*. If a
state change is triggered during an ongoing transition, it's gonna be queued. Each
state has a clock, which allows to distinguish *state's instances* (prevents the
double callback execution problem).


## Install

```
npm install asyncmachine
```

## Features
 
- relations between states
- multiple states active simultaneously
- state negotiation phase
- state clocks
- state piping between machines
- synchronous and nested transitions queuing
- exception as a state
- compatible with promises, callbacks and emitters
- expressive logging system
 
## What for?

- easy state management
- async actions as a state
- solving non-linear problems
- fault tolerance
- convenient resource disposal
- avoiding race conditions

## [Examples](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples)

## [API docs](http://tobiaszcudnik.github.io/asyncmachine/classes/_asyncmachine_.asyncmachine.html)

## States

```typescript
export interface IState {
	// Decides about the order of activations (transitions)
	after?: string[];
	// When set, sets also the following states
	add?: string[];
	// When set, blocks activation (or deactivates) given states
	drop?: string[];
	// State will be rejected if any of those aren't set
	require?: string[];
	// When true, the state will be set automatically, if it's not blocked
	auto?: boolean;
	// Multi states always triggers the enter and state transitions, plus
	// the clock is always incremented
	multi?: boolean;
}
```

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

## License

MIT
