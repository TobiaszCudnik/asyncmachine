### ROADMAP

- rename pipe, pipe negotiation to add, add&require
- synchronous throw when not in a promise
- piping self state transition
- states should be ordered by the order of setting them
- edge case: piping negotiation, when a further state is cancelling
  - makes the piping inconsistent
  - for now, rely on the self transition
  - in the future, wait with the 3rd transition phase in the machine B
    till the negotiation is finished
- #now() -> { state: clock, state2: clock }
  - #wasLater(#now(), #now()) but with a better name
  - #is({A: 1, b: 34}): boolean
- GC and memory management
  - track the context of all the bindings
  - auto unbinding unreachable transitions
  - auto unbinding unreachable promises' error handlers
  - memory leaks load tests
- transition executing the queue via generator iteration
  - -3 stack frames
  - possibly avoid nesting when piping in the future
- extend the multi states which create new machines (eg for requests)
- remote state machines
- case insensitive state names (when strings)
- state as an object (shorter API calls, like `states.A.add()`
- closure compiler support (eg compose all the attributes)
- dynamic states (???)
- chai assertion helper
- rewrite tests
- ensure all the state lists and params are shallow copied

### v3.1

- extracted the Transition class
- stricter compiler checks (nulls, implicit any, returns)
- structurized transition steps
- use currently executing queue when available
- type safety for events and states (TS only)
- types generator from JSON and classes (TS only)

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
- bunch of small bugfixes
 
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