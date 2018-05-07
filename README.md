# AsyncMachine
 
Hybrid State Machine
  
AsyncMachine is a loose combination of the following concepts:
- Actor Model
- Declarative Dependency Graph
- Non-Deterministic Automaton
- Async Control Flow
- Declarative Scheduler
- State Manager
- Event Stream Processor
- Aspect Oriented Programming

## Install

```
npm i asyncmachine
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

TypeScript based **[API docs](https://tobiaszcudnik.github.io/asyncmachine/classes/asyncmachine.html)**.

See more in a real world project [which uses AsyncMachine](https://github.com/TobiaszCudnik/gtd-bot/tree/master/src).

## Features
 
- relations between states
- multiple states active simultaneously
- auto states
- transitions defined as class methods
- state negotiation phase
- state clocks
- state piping between machines
- nested transitions queuing
- exception is a state
- compatible with promises, callbacks and emitters
- expressive logging system
- [inspector / debugger available](https://github.com/TobiaszCudnik/asyncmachine-inspector)
- OOP and functional APIs
- TypeScript types generator
 
## What for?

- easy state management
- async operations as a state
- solving non-linear problems
- fault tolerance
- convenient resource disposal
- avoiding race conditions

## State definition

```typescript
interface IState {
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

- `A_exit`
- `A_B`
- `A_any`
- `any_B`
- `B_enter`
- `A_end`
- `B_state`

## License

MIT
