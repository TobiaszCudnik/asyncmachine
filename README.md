# AsyncMachine
 
  Decision making multi state machine

## WIP: README IS OUTDATED

## Install

```
npm install asyncmachine
```

## Example

```typescript
import { machine } from 'asyncmachine'
// define
const state = {
  Wet: { drop: ['Dry'], require: ['Water'] },
  Dry: { drop: ['Wet'] },
  Water: { add: ['Wet'] }
}
// initialize
const example = machine(state)
// make changes
example.add('Dry')
example.add('Water')
// check the state
example.is() // -> ['Water', 'Wet']
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
- [inspector / debugger available](https://github.com/TobiaszCudnik/asyncmachine-inspector)
- OOP and functional APIs
 
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
	// When set, sets also the listed states
	add?: string[];
	// When set, blocks activation (or deactivates) listed states
	drop?: string[];
	// State (and the transition) will be rejected, if any of listed states
	// isn't set (and isn't about to be set)
	require?: string[];
	// State will be set automatically, as long as it's not blocked by
	// any of the currently set states
	auto?: boolean;
	// Multi states always triggers the "enter" and "state" transitions, plus
	// the clock is always incremented
	multi?: boolean;
	// Decides about the execution order of transition methods
	after?: string[];
}
```

## Transitions
 
Order of transition methods for an example transition from `A` to `B`. All
methods (and events) with the following names will be called (if defined).

- A_exit
- A_B
- A_any
- any_B
- B_enter
- A_end
- B_state

## License

MIT
