**AsyncMachine** is a **relational state machine** (dependency graph) for a declarative flow control.

Usages:

* state management
* parallel tasks
* loose coupling
* resource allocation / disposal
* exception handling
* fault tolerance
* method cancellation

It can be used as a single state machine, or a network composed of many. Gzipped code is 7.5kb.

## Install

```
npm i asyncmachine
```

## Documentation

* [AsyncMachine - The Definitive Guide](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide) (wiki)<br>
  [PDF version](https://github.com/TobiaszCudnik/asyncmachine/raw/gh-pages/AsyncMachine-The-Definitive-Guide.pdf) (25 pages, 1.5mb)
* [API docs](https://tobiaszcudnik.github.io/asyncmachine/api) (TypeScript)
  * [machine() factory](https://tobiaszcudnik.github.io/asyncmachine/api/index.html#machine)
  * [AsyncMachine class](https://tobiaszcudnik.github.io/asyncmachine/api/classes/asyncmachine.html)
  * [Transition class](https://tobiaszcudnik.github.io/asyncmachine/api/classes/transition.html)
  * [List of emitted events](https://tobiaszcudnik.github.io/asyncmachine/api/interfaces/iemit.html)
* [Roadmap](https://github.com/TobiaszCudnik/asyncmachine/blob/master/TODO.md)

Components:

* [states](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#states)
* [transitions](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#transitions)
* [relations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#state-relations)
* [clocks](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#state-clocks)
* [pipes](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#pipes---connections-between-machines)
* [queues](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#queue-and-machine-locks)

Features:

* [synchronous mutations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#mutating-the-state)
* [state negotiation](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#aborting-by-negotiation-handlers)
* [cancellation](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#abort-functions)
* [automatic states](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#auto-states)
* [exception handling](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#exception-as-a-state)
* [visual inspector / debugger](https://github.com/TobiaszCudnik/asyncmachine-inspector)

## Examples

### Dry Wet

This basic examples makes use of: [states](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#states), [transitions](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#transitions), [relations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#state-relations) and [synchronous mutations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#mutating-the-state).

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1edd421eaec500126c11ce)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-dry-wet?file=index.ts)

```typescript
import { machine } from 'asyncmachine'
// define
const state = {
  // state Wet when activated, requires state Water to be active
  Wet: {
    require: ['Water']
  },
  // state Dry when activated, will drop (de-activate) state Wet
  Dry: {
    drop: ['Wet']
  },
  // state Water when activated, will add (activate) state Wet and
  // drop (de-activate) state Dry
  Water: {
    add: ['Wet'],
    drop: ['Dry']
  }
}
// initialize
const example = machine(state)
// initially the machine has no active states
example.is() // -> []
// activate state Dry
example.add('Dry')
example.is() // -> [ 'Dry' ]
// activate state Water, which will resolve the relations:
// 1. Water activates Wet
// 2. Wet requires Water
// 3. Dry de-activates Wet
// 4. Water de-activates Dry
// 5. Water activates Wet
example.add('Water')
example.is() // -> [ 'Wet', 'Water' ]
```

[![example](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/example.gif)](https://stackblitz.com/edit/asyncmachine-example-dry-wet?file=index.ts)

### Negotiation

Presents how the [state negotiation](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#aborting-by-negotiation-handlers) works.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ed850c6dc1f0012db1346)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-negotiation?file=index.ts)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/negotiation)

### Async Dialog

Presents the following concepts: [automatic states](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#auto-states), [synchronous mutations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#mutating-the-state), [delayed mutations](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#delayed-mutations) and loose coupling.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ede5f62717e0013877cdc)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-async-dialog?file=index.ts)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/async-dialog)

### Exception State

A simple fault tolerance (retrying) using the [Exception state](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#exception-as-a-state).

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ee7113321180012ebafcf)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-exception?file=index.ts)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/exception-state)

### Piping

Shows how [pipes](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#pipes---connections-between-machines) forward states between machines.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1eea671eaec500126c1be7)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-piping?file=index.ts)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/piping)

### Transitions

Shows various types of [transition handlers](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide#transition-handlers) and the way params get passed to them.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1eeaba3b97b60012c83ec0)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-transitions?file=index.ts)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/transitions)

### TodoMVC and React

Classic TodoMCV example using **AsyncMachine** as the controller and **React** as the view.

* [Edit on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-todomvc?file=src/controller.js)
* [Source on GitHub](https://github.com/TobiaszCudnik/todomvc-asyncmachine)

### State streams with RxJS

Observe state changes and navigate through specific paths with RxJS, then feed the result back as a state.

* Comming soon!

### Restaurant

A complex example showing how to solve the **producer / consumer problem** using AsyncMachine.

* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-inspector-restaurant)
* [Source on GitHub](https://github.com/TobiaszCudnik/asyncmachine-inspector/tree/master/examples/restaurant)

[![inspector view](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/restaurant.png)](https://stackblitz.com/edit/asyncmachine-inspector-restaurant)

### TaskBot

For a real world example check [TaskBot](https://github.com/TaskSync/TaskBot.app/tree/master/src) - a real-time sync engine for Google APIs.

[![Preview](http://tobiaszcudnik.github.io/asyncmachine-inspector/sample.png)](http://tobiaszcudnik.github.io/asyncmachine-inspector/sample.mp4)

## License

MIT
