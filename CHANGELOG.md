### ROADMAP

- auto unbinding unreachable transitions
- state as an object (shorter API calls, like `states.A.add()`
- closure compiler support
- visualizer with support for stepping through the history (based on the d3s forced layout)
- unbind error handlers from not-in-the-scope promises

### v2.1

- tail call optimizations and reduced number of stack frames
- moved to regular typescript (1.8)
- better logging API
- multi states
- dropped promise dependency
 
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