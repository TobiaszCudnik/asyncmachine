# TODO

## 3.x
- add more comments to the initial example in the readme
- handle exceptions happening in an ASYNC Exception_state handler
  - honor `this.machine.print_exception`
- accept transition handlers in the `machine()` param
- indicate "in transition" for statesToString()
- fix the `@ts-ignore` injection for d.ts files
- ability to `npm link` directly from /build
  - move the dist files to /build/dist
- validate state names in relations
- rxjs integration examples
  - parsing state sets coming from a group of machines
  - parse the stream of states and "mine" complex states eg user behavior
  - demos on stackblitz
- test `createChild()`
- test `Exception_state` params
- test params for requested state handlers
- implement `pipeRemoveBinding(binding)`
- implement `unregister(state)`
- fix / correct the broken tests

## 4.x
- alias `is()` as `currentState()`
- rename `transition()` to `get transition()`
  - and alias a `get current_transition`
- rename `PipeFlags` to match the event names
  - eg `NEGOTIATION_ENTER` is `enter`, `FINAL_EXIT` is `end` 
- `debug` method
  - uses queries and if they match goes into `debugger`
  - `debug(DEBUG.ADD, [machine_id], ['Foo'])`
  - `debug(DEBUG.LOG, [machine_id], '[bind:on] HistoryIdFetched')`
- easy way to wait on a drained queue from >1 machine
- new way of handling queue race conditions
  - check for every queue entry instead of transition.ts
- TypeScript 3.0 compat
  - align /bin/am-types
- include prettier in the workflow
- state groups - `FooA`, `FooB`, `FooC`, when all in group `Foo` #engine #api
  - then only one can be active at a time
  - defined by `group` or `switch` or `switch_group`
- `#now()` -> `{ state: clock, state2: clock }` #api
  - `#wasAfter(#now(), #now())` but with a better name
  - `#is({A: 1, b: 34}): boolean`
- maybe: in case of an Exception all the target states should be set and then
  - dropped, causing a Broken_Exception() transition handlers to kick in
  - currently you have to define Exception_state and check target_states param
- move configs to ./configs
- resolve relations using BFS/DFS to achieve full propagation
- sideEffects: false in package.json
- #toggle(name) #api
- #has(name) #api
- merge #when and #whenNot
  - #when(['Foo', 'Bar'], ['Baz']) fires when +Foo+Bar-Baz
- #whenQueueDone - an async method returning when the whole queue got processed
  - used when `if (this.duringTransition()) await this.whenQueueDone();`
- return an ES6 Set when applicable
- #tick() triggers auto states but doesnt explicitly change anything
- tests
  - align broken tests
  - handle all of those `// TODO write a test` places
- manually specified queue for piping (piping from A to B using the queue from C)
- ensure all the state lists and params are shallow copied #api #refactoring
- `ins.implements(JSONState | AsyncMachine)`
  - return true if
  - all the states are implemented
  - relations BETWEEN THEM are the same

## Later

- mount submodules - gh-pages into /docs and wiki into /wiki
- stop auto states when Exception is active
- make it possible to serialize a machine to JSON
  - no instance refs, indirect addressing, binary format
- `machine` factory when used without am-types highlights with an error
- FSM interface?
- TimeArray decorator for states, counting times with moment.js API
  - eg number of state sets in last 10 minutes
  - useful for counting request quota limits for API clients
  - separate npm module
  - support timezones
- investigate `[drop:implied]`
- maybe: State_rejected() method, triggered when a certain state wasnt accepted
  - only for target, non-auto states
- implement push signal for abort functions `abort.onAbort(listener)`
- define machines as JSONs
  - state inheritance example (via object spread)
- history API, optional #features
  - logged as an used queue
  - add destination states
  - time?
- improve logs #debug
  - more consistent
  - more levels and better assignments
- make stack traces as short as possible #debug
    - skip 2 stack frames from deferred
- make Any state a real thing #engine
  - arguments?
- synchronous throw when not in a promise #engine
- edge case: piping negotiation, when a further state is cancelling
  - makes the piping inconsistent
  - for now, rely on the self transition
  - in the future, wait with the 3rd transition phase in the machine B
    till the negotiation is finished
- GC and memory management #engine #api
  - track the context of all the bindings
  - auto unbinding unreachable transitions
  - auto unbinding unreachable promises' error handlers
  - memory leaks load tests
- extend the multi states which create new machines (eg for requests) #?
  - separate / mixin / util function / decorator
- remote state machines #?
  - separate / mixin / util function / decorator
- case insensitive state names (when strings) #api
- state as an object (shorter API calls, like `states.A.add()`) #maybe #api
  - considers signals composed out of event emitters (per each signal)
- chai assertion helper #project #api

## WIKI / Def Guide

* Queue duplicates detection
  * Mention in the docs - pipes, mutations
* Make a comparison of `pipe`, `pipe negotiation` to `add`, `add & require`
* Examples on stackblitz

## Transition

* refactor the execution of calls to sth structured instead of strings
* multi-step (keep couple of steps as one step)