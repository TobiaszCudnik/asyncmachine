**AsyncMachine** is a modern state manager with intelligence built it.

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
* exception handling

## Install

```
npm i asyncmachine
```

## Example

This basic examples presents the following features: `states`, `transitions`, `relations` and `synchronous mutations`.

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

**Live and visual demo** available on [stackblitz](https://stackblitz.com/edit/asyncmachine-example?file=index.ts).

[![example](https://raw.githubusercontent.com/TobiaszCudnik/asyncmachine/gh-pages/images/example.gif)](https://stackblitz.com/edit/asyncmachine-example?file=index.ts)

For a real world example check [GTD bot](https://github.com/TobiaszCudnik/gtd-bot/tree/master/src) (sync engine for Google APIs).

## Documentation

* [AsyncMachine - The Definitive Guide](https://github.com/TobiaszCudnik/asyncmachine/wiki/AsyncMachine-The-Definitive-Guide) (wiki)<br>
  [PDF version](https://github.com/TobiaszCudnik/asyncmachine/raw/gh-pages/AsyncMachine-The-Definitive-Guide.pdf) (25 pages, 1.4mb)
* [API docs](https://tobiaszcudnik.github.io/asyncmachine/) (TypeScript)
  * [machine() factory](https://tobiaszcudnik.github.io/asyncmachine/index.html#machine)
  * [AsyncMachine class](https://tobiaszcudnik.github.io/asyncmachine/classes/asyncmachine.html)
  * [Transition class](https://tobiaszcudnik.github.io/asyncmachine/classes/transition.html)
  * [List of emitted events](https://tobiaszcudnik.github.io/asyncmachine/interfaces/iemit.html)

## Use cases

* state management
* thread pool
* synchronizing async actions
* solving non-linear problems
* fault tolerance
* resource allocation / disposal
* avoiding race conditions
* sync engines

## License

MIT
