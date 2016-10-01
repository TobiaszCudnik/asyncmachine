# AsyncMachine
 
  Declarative scheduler for the event loop

## Description

Technically, a *multi-state dependency graph*, allows for declarative modeling of the control flow based on states interconnected by relations.
Activating a state triggers a two-pass transition - *negotiation* and *set*. If a
state change is triggered during an ongoing transition, it's gonna be queued (non-synchronous). Each
state has a clock distinguishing *state's instances* (eg prevents the
double callback execution problem).

![Demo](http://tobiaszcudnik.github.io/asyncmachine/demo.gif)

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
- nested transitions queuing
- exception as a state
- compatible with promises, callbacks and emitters
- expressive logging system
- visula step-by-step inspector
 
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
	// When set, sets also the following states
	add?: string[];
	// When set, blocks activation (or deactivates) given states
	drop?: string[];
	// State (and the transition) will be rejected, if any of these aren't set
	require?: string[];
	// State will be set automatically, as long as it's not blocked
	auto?: boolean;
	// Multi states always triggers the "enter" and "state" transitions, plus
	// the clock is always incremented
	multi?: boolean;
	// Decides about the order of a transition
	after?: string[];
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
