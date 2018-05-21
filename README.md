# AsyncMachine
 
Hybrid State Machine - a loose combination of the following concepts:
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

## Example ([edit live](https://stackblitz.com/edit/asyncmachine-example?file=index.ts))

```typescript
import { machine } from 'asyncmachine'
// define
const state = {
  Wet: { require: ['Water'] },
  Dry: { drop: ['Wet'] },
  Water: { add: ['Wet'], drop: ['Dry'] }
}
// initialize
const example = machine(state)
// make changes
example.add('Dry')
example.add('Water')
// check the state
example.is() // -> [ 'Wet', 'Water' ]
```

See more in a real world project [which uses AsyncMachine](https://github.com/TobiaszCudnik/gtd-bot/tree/master/src).

## [API docs](https://tobiaszcudnik.github.io/asyncmachine/)

- [machine() factory](https://tobiaszcudnik.github.io/asyncmachine/index.html#machine)
- [AsyncMachine class](https://tobiaszcudnik.github.io/asyncmachine/classes/asyncmachine.html)
- [Transition class](https://tobiaszcudnik.github.io/asyncmachine/classes/transition.html)
- [list of emitted events](https://tobiaszcudnik.github.io/asyncmachine/interfaces/iemit.html)

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
    // Tries to set the listed states along with itself
    add?: string[];
    // Prevents from setting or un-sets the listed states
    drop?: string[];
    // States required for this one to be set
    require?: string[];
    // State will try to set itself every time the state of the machine changes
    auto?: boolean;
    // Multi state always triggers "enter" and "state" transitions, plus
    // the clock is always incremented
    multi?: boolean;
    // Transition method of this state will be executed after the listed states
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
