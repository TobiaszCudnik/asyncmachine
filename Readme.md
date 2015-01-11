# AsyncMachine
 
  Swiss army knife for complex async systems.

## Install

NPM, build systems, browserify:
```
npm install asyncmachine
```

Browser ready version is at [build-pkg/asyncmachine.js](https://github.com/TobiaszCudnik/asyncmachine/blob/master/build-pkg/asyncmachine.js) or use the CDN:
```html
<script src="https://cdn.rawgit.com/TobiaszCudnik/asyncmachine/coffee/build-pkg/asyncmachine.js" type="application/javascript"></script>
```

## Disclaimer
 
State-based async systems are easier to understand and to track down issues than other approaches.
Code can react on the current and the next state or the execution can be aborted if the state has changed
or has been re-set (prevents double callback execution problem). Joining parallel actions is a matter of
defining states relations. Same goes for extending already implemented behaviors, because responsibility
is decoupled. State exit transitions are a great place for garbage collection.

AsyncMachine is simply a multi-state machine thus can also be used for other purposes than managing async.

## Basic API

```coffeescript
# CoffeeScript
class Foo extends AsyncMachine
    A:
        # When true, a state will be set automatically if it's not blocked.
        auto: no
        # State will be rejected if any of those aren't set.
        requires: []
        # Decides about the order of activations (transitions).
        depends: []
        # When activated, activates also following states.
        implies: ['B']
        # When active, blocks activation (or deactivates) of given states.
        blocks: []
    B: {}

    # Transitions are simply methods, executed in the order like below:

    # negotiation transitions
    A_enter: ->
    A_exit: ->
    A_B: ->
    any_A: ->
    A_any: ->

    # non-negotiation transitions
    A_state: ->
    A_end: ->
 ```
 
## Features
 
- state negotiation
- states clock
- synchronous nested transitions queueing
- exceptions support
- transition exposed as events
- callbacks/promises/yield compatible
- expressive logging system
 
## Transitions
 
Example of an order of listeners during a transition between states A and B. All methods *and events* with these
names will be called.

- A_exit
- A_B
- A_any
- any_B
- B_enter
- A_end
- B_state
 
## Example
 
 
```javascript
// EcmaScript 6
var asyncmachine = require('asyncmachine')
require('object-mixin')


class QueryFetcherStates extends asyncmachine.AsyncMachine {
	constructor(target) {
		super(target)
		this.registerAll()
		this.debug('', 1)
	}
}

Object.mixin(QueryFetcherStates.prototype, {
	Enabled: {},

	Query1Running: {auto: true, requires: ['Enabled']},
	Query1Done: {},

	Query2Running: {auto: true, requires: ['Enabled']},
	Query2Done: {},

	Query3Running: {
		auto: true,
		requires: ['Query1Done', 'Query2Done', 'Enabled']
	},
	Query3Done: {},

	Query4Running: {
		auto: true,
		requires: ['Query1Done', 'Enabled']
	},
	Query4Done: {},

	Result: {},

	Done: {
		auto: true,
		requires: ['Query1Done', 'Query2Done', 'Query3Done', 'Query4Done']
	}
})


class QueryFetcher {
	constructor() {
		this.results = {}

		this.states = new QueryFetcherStates(this)
		this.states.add('Enabled')
	}

	Query1Running_state() {
		this.query('foo',
			this.states.addByCallback(['Query1Done', 'Result'])
		)
	}
	Query2Running_state() {
		this.query('bar',
			this.states.addByCallback(['Query2Done', 'Result'])
		)
	}
	Query3Running_state() {
		this.query('foo bar',
			this.states.addByCallback(['Query3Done', 'Result'])
		)
	}
	Query4Running_state() {
		this.query('baz',
			this.states.addByCallback(['Query4Done', 'Result'])
		)
	}

	// Collect results from every callback.

	// First state enter
	Result_state(states, result) {
		this.results[states[0]] = result
	}

	// Active state self transition
	Result_Result(states, result) {
		this.Result_state(states, result)
	}

	// Mocked async method
	query(query, next) {
		setTimeout(() => {
			next( null, query )
		}, 0)
	}
}


var fetcher = new QueryFetcher()

// This will work even if fetcher is already done.
fetcher.states.on('Done_state', () => {
	console.log( fetcher.results )
})
```
 
## Log
 
Every AsyncMachine produces an expressive log of state transitions, which includes state changes, state negotiation
process, triggered listeners, aborts and state queuing. Log level can be adjusted from basic to verbose. An example log
can look like this:

```
[states] +Enabled
[states] +Query1Running +Query2Running
[states] +Query1Done +Result
[states] +Query4Running
[states] +Query2Done
[states] +Query3Running
[states] +Query4Done
[states] +Query3Done
```

Logging with level == 2 gives you more insight into whats happening:

```
[add] state Enabled
[states] +Enabled
Can't set following states Query3Running(-Query1Done -Query2Done), Query4Running(-Query1Done), Done(-Query1Done -Query2Done -Query3Done -Query4Done)
[states] +Query1Running +Query2Running
[transition] Query1Running_end
[transition] Query2Running_end
Can't set following states Query3Running(-Query1Done -Query2Done), Query4Running(-Query1Done), Done(-Query1Done -Query2Done -Query3Done -Query4Done)
[add] state Query1Done, Result
[states] +Query1Done +Result
[transition] Result_end
Can't set following states Query3Running(-Query2Done), Done(-Query2Done -Query3Done -Query4Done)
[states] +Query4Running
[transition] Query4Running_end
Can't set following states Query3Running(-Query2Done), Done(-Query2Done -Query3Done -Query4Done)
[add] state Query2Done, Result
[transition] Result_Result
[states] +Query2Done
Can't set following states Done(-Query3Done -Query4Done)
[states] +Query3Running
[transition] Query3Running_end
Can't set following states Done(-Query3Done -Query4Done)
[add] state Query4Done, Result
[transition] Result_Result
[states] +Query4Done
Can't set following states Done(-Query3Done)
[add] state Query3Done, Result
[transition] Result_Result
[states] +Query3Done
[states] +Done
```

There's level 3 as well!
 
## API
 
AsyncMachine's source code is transpiled from CoffeeScript to TypeScript and merged with external static types definitions.
Public API looks like this:
 
```typescript
class AsyncMachine {
	public last_promise: Promise<any>;
	public config: IConfig;
	constructor(config?: IConfig);
	public Exception_state(states: string[], err: Error, exception_states?: string[]): boolean;

	public register(...states: string[]);
	public get(state: string): IState;
	public state(name: string): boolean;
	public state(name: string[]): boolean;
	public state(): string[];
	public is(state: string): boolean;
	public is(state: string[]): boolean;
	public is(state: string, tick?: number): boolean;
	public is(state: string[], tick?: number): boolean;
	public is(): string[];
	public any(...names: string[]): boolean;
	public any(...names: string[][]): boolean;
	public every(...names: string[]): boolean;
 
 	public add(target: AsyncMachine, states: string[], ...params: any[]): boolean;
 	public add(target: AsyncMachine, states: string, ...params: any[]): boolean;
 	public add(target: string[], states?: any, ...params: any[]): boolean;
 	public add(target: string, states?: any, ...params: any[]): boolean;
 	public addByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
 	public addByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
 	public addByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public addByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public addByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public addByListener(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public addByListener(target: string[], states?: any, ...params: any[]): (...params) => void;
 	public addByListener(target: string, states?: any, ...params: any[]): (...params) => void;
 	public addNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public addNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public addNext(target: string, states: any, ...params: any[]): (...params) => void;
 	public addNext(target: string[], states: any, ...params: any[]): (...params) => void;
 
 	public drop(target: AsyncMachine, states: string[], ...params: any[]): boolean;
 	public drop(target: AsyncMachine, states: string, ...params: any[]): boolean;
 	public drop(target: string[], states?: any, ...params: any[]): boolean;
 	public drop(target: string, states?: any, ...params: any[]): boolean;
 	public dropByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
 	public dropByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
 	public dropByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public dropByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public dropByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public dropByListener(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public dropByListener(target: string[], states?: any, ...params: any[]): (...params) => void;
 	public dropByListener(target: string, states?: any, ...params: any[]): (...params) => void;
 	public dropNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public dropNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public dropNext(target: string, states: any, ...params: any[]): (...params) => void;
 	public dropNext(target: string[], states: any, ...params: any[]): (...params) => void;
 
 	public set(target: AsyncMachine, states: string[], ...params: any[]): boolean;
 	public set(target: AsyncMachine, states: string, ...params: any[]): boolean;
 	public set(target: string[], states?: any, ...params: any[]): boolean;
 	public set(target: string, states?: any, ...params: any[]): boolean;
 	public setByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
 	public setByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
 	public setByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public setByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
 	public setByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public setByListener(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public setByListener(target: string[], states?: any, ...params: any[]): (...params) => void;
 	public setByListener(target: string, states?: any, ...params: any[]): (...params) => void;
 	public setNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
 	public setNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
 	public setNext(target: string, states: any, ...params: any[]): (...params) => void;
 	public setNext(target: string[], states: any, ...params: any[]): (...params) => void;
 
	public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: AsyncMachine, machine?: string);
	public pipeInvert(state: string, machine?: AsyncMachine, target_state?: string);
	public pipeInvert(state: string[], machine?: AsyncMachine, target_state?: string);
	public pipeInvert(state: AsyncMachine, machine?: string);
	public duringTransition(): boolean;
	public namespaceName(state: string): string;
	public debug(prefix?: string, level?: number): void;
	public debugOff(): void;
	public log(msg: string, level?: number): void;
 
	public when(states: string, abort?: Function): Promise<any>;
	public when(states: string[], abort?: Function): Promise<any>;
	public whenOnce(states: string, abort?: Function): Promise<any>;
	public whenOnce(states: string[], abort?: Function): Promise<any>;

	public getAbort(state: string, abort?: () => boolean): () => boolean;
    public getAbortEnter(state: string, abort?: () => boolean): () => boolean;
}
```
 
## Change log
 
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
 
## Related work
 
#### Inspiration
 
 - [node-disorder](https://github.com/substack/node-disorder)
 - JS FSM work from [Tomasz Paczkowski](https://github.com/oinopion)
 - [CKEditor](https://github.com/ckeditor)'s dependency calculation
 - years of writing async systems

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
