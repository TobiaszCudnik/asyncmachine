# AsyncMachine

  Multi state machine for a declarative async logic.
  
## Disclaimer

Motivation behind AsyncMachine was to make creating complex asynchronous systems 
easier, more predictable and to reduce code redundancy. It's loosely based on 
finite state machine and isn't backed up with any formalized theory. 

Target of this project is to extend or replace such patterns as promise, 
event emitter and callback passing style. 
  
## Sample code (in Coffee)
  
```coffeescript
class Foo extends AsyncMachine {
    state_A:
        # Decides about the order of activations (transitions).
        depends: []
        # Activates also following states.
        implies: ['B']
        # Will be activated only if following are met.
        requires: []
        # When active, blocks activation (or deactivates) of following states.
        blocks: []
        # Defines if the state should be tried to be set each time active states are changed.
        auto: false
    state_B: {}
    A_enter: ->
    A_exit: ->
    A_B: ->
    any_A: ->
    A_any: ->
}
```

## Features

- always synchronous state
 - transition can cancel a change of the state
- states definitions in OO manner
- state relations: blocks, implies, requires, depends
- state transitions (methods) in OO manner (prototype-level)
 - ::A_enter, ::A_B, ::any_A, etc
- transitions exposed via an event emitter
 - with sub events (superEvent.subEvent)
- nested transitions queued in a sync way, executed in a series
- promises support for deferred state changes (multiplexing)
- logging system for free
- mixin support
- written in TypeScript
- lots of tests (in Coffee)

## Order of transitions:

Example presents a transition from StateA to StateB:
- StateA_exit
- StateA_StateB
- StateA_any
- any_StateB
- StateB_enter

## Events

AsyncMachine has an event emitter based on LucidJS, which supports states and 
sub events. Following events are emitted from the above example transition:

- State.A.exit
- State.A._.State.B
- State.A._.any
- any._.State.B
- State.B._.enter

Notice the '.' dot convention. It allows you to namespace sub events. This means,
once bound to 'State.A' it'll be emitted for `enter`, `exit` events and all transitions.
You can understand it as if there would be a wildcard at the end.

Additionally, all states emit `enter` or `exit` event at once when you bind to 
them, depending if it's set or not.

## Asynchronous solutions

We have several ways of dealing with asynchronous code in JS/ECMAScript:
- Callbacks
- Events
- Promises

Although all of them doesn't scale well with a complicated relations between 
async actions. Consider a following relation between DB queries:

- Query 1 has no deps
- Query 2 has no deps
- Query 3 relies on Query 1 and query 2
- Query 4 relies on Query 1

This simple example shows how Query 3 and Query 4 can't be easily abstracted in a
lineral way. Thanks to AsyncMachine, such code can look like this:

```javascript
var am = require('../../build/pkg/build.js').main()

function QueryFetcher() {
	this.results = {}
	// Call the super contructor.
	am.AsyncMachine.call(this)
	// Turn on logging with a prefix.
	this.debugStates('[fetcher]')
	// Init states when logging is on or pass to the super contructor.
	this.initStates( ['ExecQuery1', 'ExecQuery2'] )
}
function Inherit() {
	this.constructor = QueryFetcher
}
Inherit.prototype = am.AsyncMachine.prototype
var p = QueryFetcher.prototype = new Inherit 
 
p.state_Start = {}
p.state_ExecQuery1 = {}
p.state_ExecQuery2 = {}
p.state_ExecQuery3 = {
	auto: true,
	requires: [ 'Query1Done', 'Query2Done' ]
}
p.state_ExecQuery4 = {
	auto: true,
	requires: [ 'Query1Done' ]
}	
p.state_Done = {
	auto: true,
	requires: [ 'Query1Done', 'Query2Done', 'Query3Done', 'Query4Done' ]
}	

p.state_Query1Done = {}
p.state_Query2Done = {}
p.state_Query3Done = {}
p.state_Query4Done = {}
p.state_Result = {}

p.ExecQuery1_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query1Done', 'Result']) )
}
p.ExecQuery2_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query2Done', 'Result']) )
}
p.ExecQuery3_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query3Done', 'Result']) )
}
p.ExecQuery4_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query4Done', 'Result']) )
}

// Collect results from every callback.
p.Result_enter = function() {
	// Redirect to self transition, to keep it concise.
	this.Result_Result.apply( this, arguments )
}
p.Result_Result = function(states, params, callback_params) {
	this.results[ states[0] ] = callback_params[0]
}

// Mocked method
p.query = function( query, next ) {
	setTimeout(function() {
		next( query )
	}, 0)
}

// Usage outside of an AM object (eg a dynamic one)
var fetcher = new QueryFetcher()
// This will work even if fetcher is already done.
fetcher.on('Done.enter', function() {
	console.log( fetcher.results )
})
```

You can run it yourself with `make example-basic`.

Like you see in the above implementation, the code isn't the shortes one, but
you gain an important information thanks to this approach - **you put an address 
on a timeline of a lifecycle of your object**. Using auto states you don't have to 
trigger states manually. Bonus to that, you can easily overload these methods and
extend by additional logic in sub classes.

This declarative approach gives integrity of behavior accross different scenarios 
easily.

There's a more complicated example with throttling while 
[monitoring gmail threads](https://github.com/TobiaszCudnik/asyncmachine/blob/master/examples/gmail-query/monitor.ts).

## Logging system

After executing a following method
```javascript
this.debugStates('[prefix]')
```
preferably before calling the `constructor` (or `initStates`) you turn on an 
expressive logging system. Here's the output of the simple example available above:

```
node examples/basic-javascript/basic.js
[fetcher] [*] Set state ExecQuery1, ExecQuery2
[fetcher] any._.Exec.Query1
[fetcher] Exec.Query1.enter
[fetcher] any._.Exec.Query2
[fetcher] Exec.Query2.enter
[fetcher] [*] Add state ExecQuery3, ExecQuery4, Done
[fetcher] [i] State ExecQuery3 dropped as required state Query1Done is missing
[fetcher] [i] State ExecQuery3 dropped as required state Query2Done is missing
[fetcher] [i] State ExecQuery4 dropped as required state Query1Done is missing
[fetcher] [i] State Done dropped as required state Query1Done is missing
[fetcher] [i] State Done dropped as required state Query2Done is missing
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] State Done dropped as required state Query4Done is missing
[fetcher] [i] Transition cancelled, as target states wasn't accepted
[fetcher] [*] Add state Query1Done, Result
[fetcher] any._.Query1Done
[fetcher] Query1Done.enter
[fetcher] any._.Result
[fetcher] Result.enter
[fetcher] [*] Add state ExecQuery3, ExecQuery4, Done
[fetcher] [i] State ExecQuery3 dropped as required state Query2Done is missing
[fetcher] [i] State Done dropped as required state Query2Done is missing
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] State Done dropped as required state Query4Done is missing
[fetcher] any._.Exec.Query4
[fetcher] Exec.Query4.enter
[fetcher] [*] Add state ExecQuery3, Done
[fetcher] [i] State ExecQuery3 dropped as required state Query2Done is missing
[fetcher] [i] State Done dropped as required state Query2Done is missing
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] State Done dropped as required state Query4Done is missing
[fetcher] [i] Transition cancelled, as target states wasn't accepted
[fetcher] [*] Add state Query2Done, Result
[fetcher] any._.Query2Done
[fetcher] Query2Done.enter
[fetcher] [*] Add state ExecQuery3, Done
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] State Done dropped as required state Query4Done is missing
[fetcher] any._.Exec.Query3
[fetcher] Exec.Query3.enter
[fetcher] [*] Add state Done
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] State Done dropped as required state Query4Done is missing
[fetcher] [i] Transition cancelled, as target states wasn't accepted
[fetcher] [*] Add state Query4Done, Result
[fetcher] any._.Query4Done
[fetcher] Query4Done.enter
[fetcher] [*] Add state Done
[fetcher] [i] State Done dropped as required state Query3Done is missing
[fetcher] [i] Transition cancelled, as target states wasn't accepted
[fetcher] [*] Add state Query3Done, Result
[fetcher] any._.Query3Done
[fetcher] Query3Done.enter
[fetcher] [*] Add state Done
[fetcher] any._.Done
[fetcher] Done.enter
{ Query1Done: 'foo bar baz',
  Query2Done: 'foo bar baz',
  Query4Done: 'foo bar baz',
  Query3Done: 'foo bar baz' }
```

# API headers

```javascript
export module asyncmachine {
    interface IState {
        depends?: string[];
        implies?: string[];
        blocks?: string[];
        requires?: string[];
        auto?: bool;
    }
    interface IConfig {
        debug: bool;
    }
    interface ITransition {
        call(states?: string[], state_params?: any[], callback_params?: any[]): bool;
        call(states?: string[], state_params?: any[], callback_params?: any[]): any;
        apply(context, args): any;
    }
    class AsyncMachine {
        public last_promise: rsvp.Promise;
        public config: IConfig;
        constructor (state?: string, config?: IConfig);
        constructor (state?: string[], config?: IConfig);
        public initStates(state: string);
        public initStates(state: string[]);
        public getState(name): IState;
        public state(name: string): bool;
        public state(name: string[]): bool;
        public state(): string[];
        public setState(states: string[], ...params: any[]): bool;
        public setState(states: string, ...params: any[]): bool;
        public setStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public setStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public addState(states: string[], ...params: any[]): bool;
        public addState(states: string, ...params: any[]): bool;
        public addStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public addStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public dropState(states: string[], ...params: any[]): bool;
        public dropState(states: string, ...params: any[]): bool;
        public dropStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public dropStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public pipeForward(state: AsyncMachine, machine?: string);
        public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
        public pipeInvert(state: string, machine: AsyncMachine, target_state: string): void;
        public pipeOff(): void;
        public namespaceStateName(state: string): string;
        public defineState(name: string, config: IState): void;
        public debugStates(prefix?: string, log_handler?: (...msgs: string[]) => void): void;
        public initAsyncMachine(state: string, config?: IConfig): void;
        static mixin(prototype: Object): void;
        static mergeState(name: string): void;
        public on(event: string, VarArgsBoolFn): LucidJS.IBinding;
        public once(event: string, VarArgsBoolFn): LucidJS.IBinding;
        public trigger(event: string, ...args: any[]): bool;
        public set(event: string, ...args: any[]): LucidJS.IBinding;
    }
}
export class AsyncMachine extends asyncmachine.AsyncMachine {}
```

## TODO / Ideas

- more examples
- broken tests :)
- break for Array#some and Array#every (or replace with a normal loop)
- exception support (includes promise rejections)
 - promises eat exceptions
- queued state changes (when nested)
- travis CI
- make logging better
 - pass thou a method (namespaced)
 - log only executed transitions
- try to auto drop the implied state when dropping a state
- tests for the mixin api (traits.js support & examples?)
- method for generating all possible transition permutations (honoring the relations)
- customizable naming convention
 - STATE_STATE to StateState or state_

## Design concerns

- [add|set]StateLater works only once
- dropped state transitions to all currently active states, not only newly added ones
- state change during a state change is queued after current one finishes
- auto states that drops other states? should not be allowed?
- parsing auto states before state change? what if a new state relays on an auto state?
- typescript properties implementation prevents the visibility of sub 
  class states in the super constructor (need for calling this.initStates() )
- polluted stack trace

## Distributions

There are several ways you can incorporate AsyncMachine into your codebase
- TypeScript sources
- JavaScript CommonJS module
- JavaScript staticaly linked file (means deps included)
 - CommonJS interface
 - Browser compatible

## Tests / Specs

![alt text](http://tobiaszcudnik.github.com/asyncmachine/tests.png "Test results")

## Dependencies

- [es5-shim](https://github.com/kriskowal/es5-shim)
- [LucidJS](https://github.com/RobertWHurst/LucidJS)
- [RSVP](https://github.com/tildeio/rsvp.js)

## Development

```
make setup
make test
```

## Inspirations

- [node-disorder](https://github.com/substack/node-disorder)
- JS FSM work from [Tomasz Paczkowski](https://github.com/oinopion)
- [CKEditor](https://github.com/ckeditor)'s dependency calculation
- years of writing async systems

## Related URLs

#### Papers

- [Plaid: A Resource-Based Programming Language](http://www.cs.cmu.edu/~aldrich/presentations/plaid-resources.pdf)
- [Concurrency by Default: Using Permissions to Express Dataflow in Stateful Programs](http://www.cs.cmu.edu/~aldrich/papers/onward2009-concurrency.pdf)
- [Typestate-Oriented Programming](http://www.cs.cmu.edu/~aldrich/papers/onward2009-state.pdf)

#### Libraries

- [Machine.js](http://machina-js.org/)
- [node-state](https://github.com/ichernev/node-state)
- [javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine)
- [skinny-coffee-machine](https://github.com/fredwu/skinny-coffee-machine)

## License 

(The MIT License)

Copyright (c) 2012 Tobiasz Cudnik &lt;tobiasz.cudnik@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 