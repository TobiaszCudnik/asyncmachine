Transition steps:
1. relations parsing
2. negotiation calls (every call can abort the transition and all the further calls)
  - includes piped states
3.  state calls
  - includes piped states

Exception during transition

During negotiation
1. Simply aborts the whole transition
2. Exception state is called and the machine's state is still integral.

During state calls
1. Aborts the call chain and removed the non-called states from the active list.
2. Exception state is called and can handle the non-integral state by it own.