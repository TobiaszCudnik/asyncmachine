### ROADMAP

### v3.2

- better ./bin/am-types generator and type safety
- auto resuming of postponed queues
- `auto` states prepended to the currently executing queue
- cancelled transition doesn't discard the transitions queued in the meantime
- fixed piping without negotiation
- better log handlers API
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

- initial release
- TODO
