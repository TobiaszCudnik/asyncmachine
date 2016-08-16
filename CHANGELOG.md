### ROADMAP

- graph visualizer with support for stepping through the history
  - based on the d3s forced layout
- GC and memory management
  - track the context of all the bindings
  - auto unbinding unreachable transitions
  - auto unbinding unreachable promises' error handlers
  - memory leaks load tests
- remote state machines
- case insensitive state names (when strings)
- d.ts generator with string literal types
- state as an object (shorter API calls, like `states.A.add()`
- closure compiler support (eg compose all the attributes)
- dynamic states (???)
- chai assertion helper
- rewrite tests
- ensure all the state lists and params are shallow copied

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
- non-negotiation transitions
- updated and extended API
- log readability optimized
- composition over inheritance
- (almost) backwards compatible