### ROADMAP

- fix "Aborted AB listener as the tick changed." displayed too many times
- make logs easier to work with
- mark related states by the .rel property
- fix the exception stack traces
- 2nd pass for all of the A_B transitions
  - eg `A_B` (for negotiation) and A_B_end (for set)
- mute logging of failed tries to add (implied) states by
  - non-new and non-requested states
- add negation support to `#when()`
- state groups - `FooA`, `FooB`, `FooC`, when all in group `Foo`
  - then only one can be active at a time
- make Any state a real thing
- skip 2 stack frames from deferred
- use uuid from a module
- rename `pipe`, `pipe negotiation` to `add`, `add & require`
- synchronous throw when not in a promise
- piping `self` state transition
- `#toggle(state)` helper method
- states should be in order they were requested
- edge case: piping negotiation, when a further state is cancelling
  - makes the piping inconsistent
  - for now, rely on the self transition
  - in the future, wait with the 3rd transition phase in the machine B
    till the negotiation is finished
- `#now()` -> `{ state: clock, state2: clock }`
  - `#wasLater(#now(), #now())` but with a better name
  - `#is({A: 1, b: 34}): boolean`
- GC and memory management
  - track the context of all the bindings
  - auto unbinding unreachable transitions
  - auto unbinding unreachable promises' error handlers
  - memory leaks load tests
- transition executing the queue via generator(?) iteration
  - -2 stack frames
  - possibly avoid nesting when piping in the future
- extend the multi states which create new machines (eg for requests)
  - separate / mixin / util function / decorator
- remote state machines
  - separate / mixin / util function / decorator
- case insensitive state names (when strings)
- state as an object (shorter API calls, like `states.A.add()`)
  - considers signals composed out of event emitters (per each signal)
- closure compiler support (tsickle)
- dynamic states (???)
- chai assertion helper
- ensure all the state lists and params are shallow copied
- rename ./tools to ./bin

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