**AsyncMachine** is a modern state manager with intelligence built in. It's a combination of several different concepts, while still being a minimalistic library. It was born slowly over the years of writing complex JavaScript apps and other asynchronous systems. Most of all, it's a state machine, thus the label _Hybrid State Machine_.

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

## Install

```
npm i asyncmachine
```

## Examples

### Dry Wet

This basic examples makes use of: `states`, `transitions`, `relations` and `synchronous mutations`.

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

**Editable visual demo** available on [stackblitz.com](https://stackblitz.com/edit/asyncmachine-example?file=index.ts).

[![example](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/example.gif)](https://stackblitz.com/edit/asyncmachine-example?file=index.ts)

### TodoMVC

Classic TodoMCV example using AsyncMachine as a controller and React as the view:<br>
[TobiaszCudnik/todomvc-asyncmachine](https://github.com/TobiaszCudnik/todomvc-asyncmachine)

### GTD Bot

For a real world example check [GTD bot](https://github.com/TobiaszCudnik/gtd-bot/tree/master/src) - a sync engine for Google APIs.

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
