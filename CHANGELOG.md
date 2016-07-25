### ROADMAP

- graph visualizer with support for stepping through the history
- - based on the d3s forced layout
- GC and memory management
- - track the context of all the bindings
- - auto unbinding unreachable transitions
- - auto unbinding unreachable promises' error handlers
- - memory leaks load tests
- remote state machines
- case insensitive state names (when strings)
- d.ts generator with string literal types
- state as an object (shorter API calls, like `states.A.add()`
- closure compiler support (eg compose all the attributes)
- dynamic states

### v2.3

- tail call optimizations and reduced number of stack frames
- moved to the regular typescript (1.8)
- better logging API
- multi states
- dropped the promise dependency
- exception state enhancements
- new build system
 
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