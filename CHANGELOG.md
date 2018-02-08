### ROADMAP

- fix change events
  - 'state-changed' (ignores tick per state changes)
  - 'tick' (fired on any change) 
  - instead of a single 'change'
- TS type generator
  - group by state, not declaration type
  - ability to output to a different dir
- maybe: State_rejected() method, triggered when a certain state wasnt accepted
  - only for target, non-auto states
- integrate cancellable generator functions with getAbort() and abort functions
  - https://github.com/getify/CAF
  - also provide abort.onAbort()
- define machines as JSONs
  - state inheritance example (via object spread)
- state validation when registering
- create TODO.md
- stop auto states when Exception is active
- #toggle(name) #api
- #has(name) #api
- history API, optional #features
  - logged as an used queue
  - add destination states
  - time?
- state groups - `FooA`, `FooB`, `FooC`, when all in group `Foo` #engine #api
  - then only one can be active at a time
  - defined by `group` or `switch` or `switch_group`
- fix "Aborted AB listener as the tick changed." displayed too many times #debug
- improve logs #debug
  - more consistent
  - more levels and better assignments
- make stack traces as short as possible #debug
    - skip 2 stack frames from deferred
- make Any state a real thing #engine
  - arguments?
- use uuid from a module #refactoring
- make a comparison of `pipe`, `pipe negotiation` to `add`, `add & require` #docs
- synchronous throw when not in a promise $engine
  - why?
- states should be in order they were requested #2 #engine
- edge case: piping negotiation, when a further state is cancelling
  - makes the piping inconsistent
  - for now, rely on the self transition
  - in the future, wait with the 3rd transition phase in the machine B
    till the negotiation is finished
- `#now()` -> `{ state: clock, state2: clock }` #api
  - `#wasLater(#now(), #now())` but with a better name
  - `#is({A: 1, b: 34}): boolean`
- GC and memory management #engine #api
  - track the context of all the bindings
  - auto unbinding unreachable transitions
  - auto unbinding unreachable promises' error handlers
  - memory leaks load tests
- transition executing the queue via generator(?) iteration #?
  - -2 stack frames
  - possibly avoid nesting when piping in the future
- extend the multi states which create new machines (eg for requests) #?
  - separate / mixin / util function / decorator
- remote state machines #?
  - separate / mixin / util function / decorator
- case insensitive state names (when strings) #api
- state as an object (shorter API calls, like `states.A.add()`) #maybe #api
  - considers signals composed out of event emitters (per each signal)
- closure compiler support (tsickle) #project
- dynamic states (???) #engine #api
- chai assertion helper #project #api
- ensure all the state lists and params are shallow copied #api #refactoring
- rename ./tools to ./bin #project #3

### v3.2

- auto states prepended to the currently executing queue
- cancelled transition doesnt cancel transitions queued in the meantime
- fixed piping without negotiation
- bugfixes

### v3.1

- extracted the `Transition` class
- stricter compiler checks (nulls, implicit any, returns)
- structurized transition steps
- use currently executing queue when available
- type safety for events and states (TS only)
- types generator from JSON and classes (TS only)
- fixed `addByCallback`/`Listener` getting fired only once
- bugfixes

### v3.0

- tail call optimizations and reduced number of stack frames
- moved to the regular typescript (2.0)
- better logging API
- states array not passed to transition any more (use #from() and #to())
- machine IDs
- multi states
- exception state enhancements
- reworked piping
- state binding fixes
- new build system (shims supported)
- bugfixes
 
### v2.0
 
- states clock
- synchronous queue across composed asyncmachines
- abort functions
- exception handling
- state negotiation fixes
- state piping fixes
- event namespaces are gone
- non-negotiable transition phase
- updated and extended API
- log readability optimized
- composition over inheritance
- (almost) backwards compatible

### v1.0

- TODO
