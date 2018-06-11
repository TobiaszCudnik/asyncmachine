**AsyncMachine** is a modern state manager with intelligence built in. It's a combination of several different concepts, while still being a minimalistic library (**7.5**kb gzipped). It was born slowly over the years of writing complex JavaScript apps and other asynchronous systems. Most of all, it's a state machine, thus the label _Hybrid State Machine_.

Components:

* states
* transitions
* relations
* clocks
* pipes
* queues

Features:

* synchronous mutations
* negotiation
* cancellation
* automatic states
* exception handling
* [visual inspector / debugger](https://github.com/TobiaszCudnik/asyncmachine-inspector)

## Install

```
npm i asyncmachine
```

## Examples

### Dry Wet

This basic examples makes use of: `states`, `transitions`, `relations` and `synchronous mutations`.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1edd421eaec500126c11ce)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-dry-wet?file=index.ts)

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

[![example](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/example.gif)](https://stackblitz.com/edit/asyncmachine-example-dry-wet?file=index.ts)

### Async Dialog

Presents the following concepts: `automatic states`, `synchronous mutations`, `delayed mutations` and loose coupling.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ede5f62717e0013877cdc)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-async-dialog?file=index.ts)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/async-dialog)

### Negotiation

Presents how the `state negotiation` works.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ed850c6dc1f0012db1346)
* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-example-negotiation?file=index.ts)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/negotiation)

### Exception State

A simple fault tolerance (retrying) using the `Exception` state.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1ee7113321180012ebafcf)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-exception?file=index.ts)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/exception-state)

### Piping

Shows how `pipes` forward states between machines.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1eea671eaec500126c1be7)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-piping?file=index.ts)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/piping)

### Transitions

Shows various types of `transition handlers` and the way params get passed to them.

* [Edit on RunKit](https://runkit.com/tobiaszcudnik/5b1eeaba3b97b60012c83ec0)
* [Inspect on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-transitions?file=index.ts)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine/tree/master/examples/transitions)

### TodoMVC

Classic TodoMCV example using **AsyncMachine** as the controller and **React** as the view.

* [Edit on Stackblitz](https://stackblitz.com/edit/asyncmachine-example-todomvc?file=src/controller.js)
* [Code on GitHub](https://github.com/TobiaszCudnik/todomvc-asyncmachine)

### Restaurant

A complex example showing how to solve the **producer / consumer problem** using AsyncMachine.

* [Inspect on StackBlitz](https://stackblitz.com/edit/asyncmachine-inspector-restaurant)
* [Code on GitHub](https://github.com/TobiaszCudnik/asyncmachine-inspector/tree/master/examples/restaurant)

[![inspector view](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/restaurant.png)](https://stackblitz.com/edit/asyncmachine-inspector-restaurant)

### GTD Bot

For a real world example check [GTD bot](https://github.com/TobiaszCudnik/gtd-bot/tree/master/src) - a sync engine for Google APIs.

[![Preview](http://tobiaszcudnik.github.io/asyncmachine-inspector/sample.png)](http://tobiaszcudnik.github.io/asyncmachine-inspector/sample.mp4)

## Documentation

* [AsyncMachine - The Definitive Guide](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide) (wiki)<br>
  [PDF version](https://github.com/TobiaszCudnik/asyncmachine/raw/gh-pages/AsyncMachine-The-Definitive-Guide.pdf) (25 pages, 1.4mb)
* [API docs](https://tobiaszcudnik.github.io/asyncmachine/api) (TypeScript)
  * [machine() factory](https://tobiaszcudnik.github.io/asyncmachine/api/index.html#machine)
  * [AsyncMachine class](https://tobiaszcudnik.github.io/asyncmachine/api/classes/asyncmachine.html)
  * [Transition class](https://tobiaszcudnik.github.io/asyncmachine/api/classes/transition.html)
  * [List of emitted events](https://tobiaszcudnik.github.io/asyncmachine/api/interfaces/iemit.html)
* [Roadmap](https://github.com/TobiaszCudnik/asyncmachine/blob/master/TODO.md)

## Use cases

* state management
* synchronizing async actions
* solving non-linear problems
* fault tolerance
* resource allocation / disposal
* avoiding race conditions
* thread pools
* sync engines

## License

MIT
