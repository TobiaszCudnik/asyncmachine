/**
 * TODO
 * - go through all the TODOs in the file
 * - cleanup post-coffeescript code
 * - if possible, introduce TS'es strict null checks
 */


import EventEmitter from "./ee"
import uuid from './uuid-v4'
import {
    STATE_CHANGE,
    STATE_CHANGE_LABELS,
    QUEUE,
    Deferred,
    PipeFlags,
    IQueueRow,
    IPipeStateTarget,
    IPipeStateBindings,
    IPipeNegotiationBindings,
    IPreparedTransitions,
    IState,
    TPipeBindings,
    TStateMethod,
    TransitionException
} from './types'
// shims for current engines
import 'core-js/fn/array/keys'
import 'core-js/fn/array/includes'


export {
    PipeFlags
} from './types' 


/**
 * Creates an AsyncMachine instance (not a constructor) with specified states.
 * States properties are empty, so you'd need to set it by yourself.
 *
 * @param states List of state names to register on the new instance or a map
 *   of state names and their properties.
 * @return
 *
 * Using names:
 * ```
 * let states = asyncmachine.factory(['A', 'B','C'])
 * states.A = { add: ['B'] }
 * states.add('A')
 * states.is() // -> ['A', 'B']
 * ```
 *
 * Using a map:
 * ```
 * let states = asyncmachine.factory({
 *   A: { add: ['B'] },
 *   B: {},
 *   C: {}
 * })
 * states.add('A')
 * states.is() // -> ['A', 'B']
 * ```
 */
export function factory<T extends AsyncMachine>(
        states: string[] | { [state: string]: IState } = [],
        constructor?: { new(...params): AsyncMachine; }): T {
    var instance = <T><any>(new (constructor || AsyncMachine))

    if (states instanceof Array) {
        for (let state of states) {
            instance[state] = {};
            instance.register(state);
        }
    } else {
        for (let state of Object.keys(states)) {
            instance[state] = states[state];
            instance.register(state);
        }
    }

    return instance;
}

/**
 * Base class which you extend with your own one defining the states.
 * The [[Exception]] state is already provided.
 *
 * ```
 * class FooStates extends AsyncMachine
 *   Enabled: {}
 *
 *   Downloading: drop: 'Downloaded'
 *   Downloaded: drop: 'Downloading'
 *
 * class Foo
 *   constructor: ->
 *   	this.states = new FooStates this, yes
 *
 *   Downloading_state: (states, @url)
 *   	fetch url, this.states.addByCallack 'Downloaded'
 *
 *   Downloaded_state: (states, local_path) ->
 *   	console.log 'Downloaded #{this.url} to #{local_path}'
 *
 * ```
 * TODO
 * - exposing the current state during transition (via the #duringTransition() method)
 * - loose bind in favor of closures
 */
export class AsyncMachine extends EventEmitter {

    /**
     * Empty Exception state properties. See [[Exception_state]] transition handler.
     */
    Exception = {
        multi: true
    };
    states_all: string[] = [];
    last_promise: Promise<any>;
    piped: { [state: string]: IPipeStateTarget[] } = {};
    // should the exception be printed immediately after being thrown
    // automaticaly turned on with logLevel > 0
    print_exception = false;

    protected states_active: string[] = [];
    protected queue: IQueueRow[] = [];
    protected lock: boolean = false;
    protected clock_: { [state: string]: number } = {};
    protected target: AsyncMachine = null;
    // Events buffer
    protected transition_events: any[];
    protected lock_queue = false;
    protected log_level_: number = 0;
    protected log_handler_: Function;
    protected current_transition: IPreparedTransitions;
    /**
     * TODO this should be automatic
     * TODO write a test for this asserting states_all
     */
    protected internal_fields: string[] = ["_events", "states_all", "lock_queue",
        "states_active", "queue", "lock", "last_promise", "debug_prefix",
        "log_level_", "log_handler_", "clock_", "target", "internal_fields",
        "transition_events", "piped", 'id_', 'print_exception', 'current_transition'];
    private id_: string = uuid();

    /**
     * Creates a new instance with only state one registered, which is the
     * Exception.
     * When extending the class, you should register your states by using either
     * [[registerAll]] or [[register]].
     *
     * @param target Target object for the transitions, useful when composing the
     * 	states instance.
     * @param registerAll Automaticaly registers all defined states.
     * @see [[AsyncMachine]] for the usage example.
     */
    constructor(target?: AsyncMachine, register_all: boolean = true) {
        super();

        this.setTarget(target || this);
        if (register_all)
            this.registerAll()
        else
            this.register("Exception")
    }

    /**
     * All exceptions are caught into this state, including both synchronous and
     * asynchronous from promises and callbacks. You can overcreateride it and
     * handle exceptions based on their type and target states of the transition
     * during which they appeared.
     *
     * @param err The exception object.
     * @param target_states Target states of the transition during
     * 	which the exception was thrown.
     * @param base_states Base states in which the transition orginated.
     * @param exception_state The explicite state which thrown the exception.
     * @param async_target_states Only for async transitions like
     * [[addByCallback]], these are states which we're supposed to be set by the
     * callback.
     * @return
     *
     * Example of exception handling
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.Exception_state = (err, target_states) ->
     * 	# Re-adds state 'C' in case of an exception if A is set.
     * 	if exception_states.some((state) -> state is 'C') and @is 'A'
     * 		states.add 'C'
     * ```
     * Example of a manual exception triggering
     * ```
     * states.A_state = (states) ->
     * 	foo = new SomeAsyncTask
     * 	foo.start()
     * 	foo.once 'error', (error) =>
     * 		this.add 'Exception', error, states
     * ```
     * 
     * TODO update the docs
     * TODO change from stdout to the log
     */
    Exception_state(err: Error, target_states: string[], base_states: string[], 
            exception_transition: string, async_target_states?: string[]): void {
        if (this.print_exception)
            console.error("EXCEPTION from AsyncMachine");
        if (target_states && target_states.length > 0)
            this.log(`Exception \"${err}\" when setting the following states:\n    ${target_states.join(", ")}`);
        if (async_target_states && async_target_states.length > 0)
            this.log(`Next states that were supposed to be (add|drop|set):\n    ${target_states.join(", ")}`);
        // if the exception param was passed, print and throw (but outside of the current stack trace)
        if (err) {
            if (this.print_exception) 
                console.error(err)
            this.setImmediate(() => { throw err })
        }
    }

    /**
     * Sets the target for the transition handlers. Useful to keep all you methods in
     * in one class while the states class is composed as an attribute of the main
     * object. There's also a shorthand for this method as
     * [[AsyncMachine.constructor]]'s param.
     *
     * @param target Target object.
     * @return
     *
     * ```
     * class Foo
     * 	constructor: ->
     * 		this.states = asyncmachine.factory ['A', 'B', 'C']
     * 		this.states.setTarget this
     * 		this.states.add 'A'
     *
     * 	A_state: ->
     * 		console.log 'State A set'
     * ```
     */
    setTarget(target) {
        return this.target = target;
    }

    /**
     * Registers all defined states. Use it only if you don't define any other
     * attributes on the object (or it's prototype). If you do, register the states
     * manually with the [[register]] method. There's also a shorthand for this
     * method as [[AsyncMachine.constructor]]'s param.
     *
     * ```
     * class States extends AsyncMachine
     * 	A: {}
     * 	B: {}
     *
     * class Foo
     * 	constructor: ->
     * 		this.states = new States
     * 		this.states.registerAll()
     * ```
     */
    registerAll() {
        var _results;
        var name = "";
        var value = null;
        
		// test the instance vars
        for (name in this) {
            value = this[name];
            if ((this.hasOwnProperty(name)) && !this.internal_fields.includes(name) && !(this[name] instanceof Function)) {
                this.register(name);
            }
        }
        
		// test the prototype chain
        var constructor = this.constructor.prototype;
        if (constructor === AsyncMachine.prototype)
            return

        while (true) {
            for (name in constructor) {
                value = constructor[name];
                if ((constructor.hasOwnProperty(name)) && !this.internal_fields.includes(name) && !(constructor[name] instanceof Function)) {
                    this.register(name);
                }
            }

            constructor = Object.getPrototypeOf(constructor);
            if (constructor === AsyncMachine.prototype) {
                break;
            }
        }
        return _results;
    }

    /**
     * Returns an array of relations from one state to another.
     * Maximum set is ["drop", "after", "add", "require"].
     *
     * TODO code sample
     * TODO test case
     */
    getRelationsBetween(from_state: string, to_state: string): string[] {
		// TODO enum
        var relations = ["drop", "after", "add", "require"]
        var state = this.get(from_state)
		// TODO assert

        return relations.filter( relation => state[relation] && 
            state[relation].indexOf(to_state) >= 0);
    }

    /**
     * Returns a list of relations for a given state.
     * 
     * TODO enum
     * TODO test case
     */
    getRelationsOf(state: string): string[] {
		// TODO enum
        var relations = ["drop", "after", "add", "require"]
        var data = this.get(state)
        return relations.filter( name => data[name] )
    }

    /**
     * If no states passed, returns all the current states.
     *
     * If states passed, returns a boolean if all of them are set.
     *
     * If only one state is passed, one can assert on a certain tick of the given
     * state (see [[clock]]).
     *
     * @param state One or more state names.
     * @param tick For one state, additionally checks if state's clock is at the same
     * moment.
     *
     * ```
     * states = asyncmachine.factory ['A', 'B']
     * states.add 'A'
     * states.is 'A' # -> true
     * states.is ['A'] # -> true
     * states.is ['A', 'B'] # -> false
     * // assert the tick
     * tick = states.clock 'A'
     * states.drop 'A'
     * states.add 'A'
     * states.is 'A', tick # -> false
     * ```
     */
    is(states: string | string[], tick?: number): boolean;
    is(): string[];
    is(states?: any, tick?: any): any {
        if (!states) {
            return this.states_active;
        }
        let states_parsed = this.parseStates(states)
        var active = states_parsed.every( (state) => {
            return Boolean(~this.states_active.indexOf(state));
        })
        if (!active) {
            return false;
        }
        if (states_parsed.length && tick !== undefined) {
            return this.clock(states) === tick;
        }
        return true;
    }

    /**
     * Checks if any of the passed states is set. State can also be an array, then
     * all states from this param has to be set.
     *
     * @param states State names and/or lists of state names.
     * @return
     *
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add ['A', 'B']
     *
     * states.any 'A', 'C' # -> true
     * states.any ['A', 'C'], 'C' # -> false
     * ```
     */
    any(...states: string[]): boolean;
    any(...states: string[][]): boolean;
    any(...states: any[]): boolean {
        return states.some((name) => {
            if (Array.isArray(name)) {
                return this.every(name);
            } else {
                return this.is(name);
            }
        });
    }

    /**
     * Checks if all the passed states are set.
     *
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add ['A', 'B']
     *
     * states.every 'A', 'B' # -> true
     * states.every 'A', 'B', 'C' # -> false
     * ```
     */
    every(...states: string[]): boolean {
        return states.every((name) => Boolean(~this.states_active.indexOf(name)));
    }

    /**
     * Returns the current queue. For struct's meaning, see [[QUEUE]].
     */
    futureQueue(): IQueueRow[] {
        return this.queue;
    }

    /**
     * Register the passed state names. State properties should be already defined.
     *
     * @param states State names.
     * @return
     *
     * ```
     * states = new AsyncMachine
     * states.Enabled = {}
     * states.Disposed = drop: 'Enabled'
     *
     * states.register 'Enabled', 'Disposed'
     *
     * states.add 'Enabled'
     * states.is() # -> 'Enabled'
     * ```
     */
    register(...states: string[]) {
        for (let state of this.parseStates(states)) { 
            if (!this.states_all.includes(state))
                this.states_all.push(state)
            this.clock_[state] = 0
        }
    }

    /**
     * Returns state's properties.
     *
     * @param state State name.
     * @return
     *
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.A = drop: ['B']
     *
     * states.get('A') # -> { drop: ['B'] }
     * ```
     */
    get(state: string): IState {
        return this[state];
    }

    /**
     * Sets specified states and deactivate all the other which are currently set.
     *
     * @param target OPTIONAL. Pass it if you want to execute a transition on an
     *   external machine, but using the local queue.
     * @param states Array of state names or a single state name.
     * @param params Params to be passed to the transition handlers (only ones from
     *   the specified states, not implied or auto states).
     * @return Result of the transition. FALSE means that states weren't accepted,
     *   or some of implied or auto states dropped some of the requested states
     *   after the transition.
     *
     * Basic usage
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.set 'A'
     * states.is() # -> ['A']
     * states.set 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = asyncmachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Setting a state on an external machine
     * ```
     * states1 = asyncmachine.factory ['A', 'B']
     * states2 = asyncmachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# is fully finished
     * 	states1.add states2, 'B'
     * ```
     */
    set(target: AsyncMachine, states: string[] | string, ...params: any[]): boolean;
    set(target: string[] | string, states?: any, ...params: any[]): boolean;
    set(target: any, states?: any, ...params: any[]): boolean {
        if (!(target instanceof AsyncMachine)) {
            if (states) {
                params = [states].concat(params);
            }
            states = target;
            target = null;
        }

        this.enqueue_(STATE_CHANGE.SET, states, params, target);

        return this.processQueue_();
    }

    /**
     * Deferred version of [[set]], returning a node-style callback for setting
     * the state. Errors are handled automatically and forwarded to the Exception
     * state.
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[set]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * setTimeout states.setByCallback 'B'
     * ```
     *
     */
    setByCallback(target: AsyncMachine, states: string[] | string, ...params: any[]): (err?: any, ...params) => void;
    setByCallback(target: string[] | string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    setByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.set.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[set]], returning a listener for setting
     * the state. Errors need to be handled manually by binding the exception
     * state to the 'error' event (or equivalent).
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[set]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.setByListener 'A'
     * emitter.on 'error', states.addByListener 'Exception'
     * ```
     */
    setByListener(target: AsyncMachine, states: string[] | string, ...params: any[]): (err?: any, ...params) => void;
    setByListener(target: string[] | string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    setByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createListener(this.createDeferred(this.set.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[set]], setting the requested states on the next event
     * loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[set]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.set 'A'
     * states.setNext 'B'
     * states.is() # -> ['A']
     * ```
     */
    setNext(target: AsyncMachine, states: string[] | string, ...params: any[]): (...params) => void;
    setNext(target: string[] | string, states: any, ...params: any[]): (...params) => void;
    setNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.set.bind(this);
        return this.setImmediate(fn, target, states, params);
    }

    /**
     * Adds specified states to the currently set ones.
     *
     * @param target OPTIONAL. Pass it if you want to execute a transition on an
     *   external machine, but using the local queue.
     * @param states Array of state names or a single state name.
     * @param params Params to be passed to the transition handlers (only ones from
     *   the specified states, not implied or auto states).
     * @return Result of the transition. FALSE means that states weren't accepted,
     *   or some of implied or auto states dropped some of the requested states
     *   after the transition.
     *
     * Basic usage
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.is() # -> ['A']
     * states.add 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = asyncmachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Adding a state on an external machine
     * ```
     * states1 = asyncmachine.factory ['A', 'B']
     * states2 = asyncmachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# fully finishes
     * 	states1.add states2, 'B'
     * ```
     */
    add(target: AsyncMachine, states: string[] | string, ...params: any[]): boolean;
    add(target: string[] | string, states?: any, ...params: any[]): boolean;
    add(target: any, states?: any, ...params: any[]): boolean {
        if (!(target instanceof AsyncMachine)) {
            if (states) {
                params = [states].concat(params);
            }
            states = target;
            target = null;
        }

        this.enqueue_(STATE_CHANGE.ADD, states, params, target);

        return this.processQueue_();
    }

    /**
     * Deferred version of [[add]], returning a node-style callback for adding
     * the state. Errors are handled automatically and forwarded to the Exception
     * state.
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[add]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * someNodeCallback 'foo.com', states.addByCallback 'B'
     * ```
     *
     */
    addByCallback(target: AsyncMachine, states: string[] | string, ...params: any[]): (err?: any, ...params) => void;
    addByCallback(target: string[] | string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    addByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.add.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[add]], returning a listener for adding
     * the state. Errors need to be handled manually by binding the exception
     * state to the 'error' event (or equivalent).
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[add]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.addByListener 'A'
     * emitter.on 'error', states.addByListener 'Exception'
     * ```
     */
    addByListener(target: AsyncMachine, states: string[] | string, ...params: any[]): (...params) => void;
    addByListener(target: string[] | string, states?: any, ...params: any[]): (...params) => void;
    addByListener(target: any, states?: any, ...params: any[]): (...params) => void {
        return this.createListener(this.createDeferred(this.add.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[add]], adding the requested states on the next event
     * loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[add]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.addNext 'B'
     * states.is() # -> ['A', 'B']
     * ```
     */
    addNext(target: AsyncMachine, states: string[] | string, ...params: any[]): (...params) => void;
    addNext(target: string[] | string, states: any, ...params: any[]): (...params) => void;
    addNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.add.bind(this);
        return this.setImmediate(fn, target, states, params);
    }

    /**
     * Drops specified states if they are currently set.
     *
     * @param target OPTIONAL. Pass it if you want to execute a transition on an
     *   external machine, but using the local queue.
     * @param states Array of state names or a single state name.
     * @param params Params to be passed to the transition handlers (only ones from
     *   the specified states, not implied or auto states).
     * @return Result of the transition. FALSE means that dropping the states
     *   wasn't accepted, or some of implied or auto states added some of the
     *   requested states after the transition.
     *
     * Basic usage
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.drop 'A'
     * states.is() # -> ['A']
     * states.drop 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = asyncmachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Dropping a state on an external machine
     * ```
     * states1 = asyncmachine.factory ['A', 'B']
     * states2 = asyncmachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# fully finishes
     * 	states1.add states2, 'B'
     * ```
     */
    drop(target: AsyncMachine, states: string[] | string, ...params: any[]): boolean;
    drop(target: string[] | string, states?: any, ...params: any[]): boolean;
    drop(target: any, states?: any, ...params: any[]): boolean {
        if (!(target instanceof AsyncMachine)) {
            if (states) {
                params = [states].concat(params);
            }
            states = target;
            target = null;
        }

        this.enqueue_(STATE_CHANGE.DROP, states, params, target);

        return this.processQueue_();
    }

    /**
     * Deferred version of [[drop]], returning a node-style callback for dropping
     * the state. Errors are handled automatically and forwarded to the Exception
     * state.
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[drop]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * someNodeCallback 'foo.com', states.dropByCallback 'B'
     * ```
     *
     */
    dropByCallback(target: AsyncMachine, states: string[] | string, ...params: any[]): (err?: any, ...params) => void;
    dropByCallback(target: string[] | string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    dropByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.drop.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[drop]], returning a listener for dropping
     * the state. Errors need to be handled manually by binding the exception
     * state to the 'error' event (or equivalent).
     *
     * After the call, the responsible promise object is available as the
     * [[last_promise]] attribute.
     *
     * See [[drop]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.dropByListener 'A'
     * emitter.on 'error', states.setByListener 'Exception'
     * ```
     */
    dropByListener(target: AsyncMachine, states: string[] | string, ...params: any[]): (err?: any, ...params) => void;
    dropByListener(target: string[] | string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    dropByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createListener(this.createDeferred(this.drop.bind(this), target, states, params));
    }

    /**
     * Deferred version of [[drop]], dropping the requested states on the next
     * event loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[drop]] for the params description.
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.dropNext 'A'
     * states.is('A') # -> true
     * ```
     */
    dropNext(target: AsyncMachine, states: string[] | string, ...params: any[]): (...params) => void;
    dropNext(target: string[] | string, states: any, ...params: any[]): (...params) => void;
    dropNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.drop.bind(this);
        return this.setImmediate(fn, target, states, params);
    }

    /**
     * Pipes (forwards) a state to another state machine.
     *
     * @param state Name of the state to pipe.
     * @param machine Target machine to which the state should be forwarded.
     * @param target_state If the target state name should be different, this is
     *   the name. Applicable if only one state is piped.
     * @param flags Different modes of piping. See [[PipeFlags]].
     *
     * Piping without negotiation
     * ```
     * states1 = asyncmachine.factory(['A', 'B', 'C'])
     * states2 = asyncmachine.factory(['A', 'B', 'C'])
     * states1.pipe('A', states2)
     * states1.add('A')
     * states2.is('A') // -> true
     * ```
     *
     * Piping with negotiation
     * ```
     * states1 = asyncmachine.factory(['A', 'B', 'C'])
     * states2 = asyncmachine.factory(['A', 'B', 'C'])
     * states2.A_enter = -> no
     * states1.pipe('A', states2, null, asyncmachine.PipeFlags.NEGOTIATION)
     * states1.add('A')
     * states2.is('A') // -> false
     * ```
     */
    pipe(state: string | string[], machine: AsyncMachine, target_state?: string, flags?: PipeFlags) {
        this.pipeBind(state, machine, target_state, flags)
    }

    /**
     * Pipes all the states from this machine to the passed one.
     * 
     * The exception state is never piped.
     * 
     * @param machine Target machine to which the state should be forwarded.
     */
    pipeAll(machine: AsyncMachine, flags?: PipeFlags) {
        // Do not forward the Exception state
        let states_all = this.states_all.filter( state => state !== 'Exception' )

        this.pipeBind(states_all, machine, null, flags)
    }

    /**
     * Removes an existing pipe. All params are optional.
     * 
     * @param states Source states. Empty means any state.
     * @param machine Target machine. Empty means any machine.
     * @param flags Pipe flags. Empty means any flags.
     * 
     * TODO optimise, if needed
     */
    pipeRemove(states?: string | string[], machine?: AsyncMachine, flags?: PipeFlags) {
        if (flags) {
            var bindings = this.getPipeBindings(flags)
            var event_types = Object.keys(bindings)
        }
        if (states) {
            var parsed_states = this.parseStates(states)
        }
        for (let state of Object.keys(this.piped)) {
            let pipes = this.piped[state]
            if (parsed_states && !~parsed_states.indexOf(state))
                continue
            for (let i = 0; i < pipes.length; i++) {
                let pipe = pipes[i]
                if (machine && machine !== pipe.machine)
                    continue
                if (flags && !~event_types.indexOf(pipe.event_type))
                    continue
                this.removeListener(`${state}_${pipe.event_type}`, pipe.listener)
                pipes.splice(i, 1)
                // stay on the same index
                i--
            }
            if (!pipes.length)
                delete this.piped[state]
        }
        // TODO emit an event on each of involved machines, once per machine
    }

    /**
     * TODO should remove binding returned by pipe() and pipeAll() methods.
     */
    pipeRemoveBinding(binding) {
        throw new Error('TODO')
    }

    /**
     * Returns the current tick of the passed state.
     *
     * State's clock starts with 0 and on each (successful) set it's incremented
     * by 1. Ticks lets you keep control flow's integrity across async listeners,
     * by aborting it once the state had changed. Easiest way to get the tick
     * abort function is to use [[getAbort]].
     *
     * @param state Name of the state
     * @return Current tick of the passed state
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.add 'A'
     * states.clock('A') # -> 1
     * states.drop 'A'
     * states.add 'A'
     * states.clock('A') # -> 2
     * ````
     */
    clock(state: string): number {
        return this.clock_[state];
    }

    /**
     * Creates a prototype child with dedicated active states, a clock and
     * a queue.
     *
     * Useful for creating new instances of dynamic classes (or factory created
     * instances).
     *
     * @param state Name of the state
     * @return Current tick of the passed state
     *
     * Example
     * ```
     * states1 = asyncmachine.factory ['A', 'B', 'C']
     * states2 = states1.createChild()
     *
     * states2.add 'A'
     * states2.is() # -> ['A']
     * states1.is() # -> []
     * ````
     */
    createChild(): this {
        var child = Object.create(this);
        var child_states_active = [];
        child.clock_ = {};
        child.queue = [];
        this.states_all.forEach((state) => child.clock[state] = 0);
        return child;
    }

    /**
     * Indicates if this instance is currently during a state transition.
     *
     * When a machine is during a transition, all state changes will be queued
     * and executed as a queue. See [[queue]].
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     *
     * states.A_enter = ->
     *   this.duringTransition() # -> true
     *
     * states.A_state = ->
     *   this.duringTransition() # -> true
     *
     * states.add 'A'
     * ````
     *
     * TODO expose the current transition entry (target states and autostate
     *   info are required)
     */
    duringTransition(): IPreparedTransitions {
        return this.current_transition;
    }

    /**
     * Returns the list of states from which the current transition started.
     * 
     * Requires [[duringTranstion]] to be true or it'll throw.
     */
    from() {
        let transition = this.duringTransition()
        if (!transition)
            throw new Error(`AsyncMachine ${this.id()} not during transition`)

        return transition.before
    }

    /**
     * Returns the list of states to which the current transition is heading.
     * 
     * Requires [[duringTranstion]] to be true or it'll throw.
     */
    to() {
        let transition = this.duringTransition()
        if (!transition)
            throw new Error(`AsyncMachine ${this.id()} not during transition`)

        return transition.states
    }

    /**
     * Returns the abort function, based on the current [[clock]] tick of the
     * passed state. Optionally allows to compose an existing abort function.
     *
     * The abort function is a boolean function returning TRUE once the flow
     * for the specific state should be aborted, because:
     * -the state has been unset (at least once)
     * -the composed abort function returns TRUE
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     *
     * states.A_state = ->
     *   abort = @getAbort 'A'
     *   setTimeout (->
     *       return if abort()
     *       console.log 'never reached'
     *     ), 0
     *
     * states.add 'A'
     * states.drop 'A'
     * ````
     *
     * TODO support multiple states
     * TODO support default values for state names
     *
     * @param state Name of the state
     * @param abort Existing abort function (optional)
     * @return A new abort function
     */
    getAbort(state: string, abort?: () => boolean): () => boolean {
        var tick = this.clock(state);

        return this.getAbortFunction(state, tick, abort);
    }

    /**
     * Resolves the returned promise when all passed states are set (at the same
     * time). Accepts an optional abort function.
     *
     * Example
     * ```
     * states = asyncmachine.factory(['A', 'B', 'C'])
     * states.when(['A', 'B']).then( () => {
     *   console.log()'A, B')
     * }
     *
     * states.add('A')
     * states.add('B') // prints 'A, B'
     * ```
     *
     * # TODO support push cancellation
     *
     * @param state List of state names
     * @param abort Existing abort function (optional)
     * @return Promise resolved once all states are set simultaneously.
     */
    when(states: string | string[], abort?: Function): Promise<any> {
        let states_parsed = this.parseStates(states)
        return new Promise((resolve, reject) => {
            this.bindToStates(states_parsed, resolve, abort)
        })
    }

    /**
     * Enabled debug messages sent to the console (or the custom handler).
     * 
     * There's 4 log levels:
     * - 0: logging is off
     * - 1: displays only the state changes in a diff format
     * - 2: displays all operations which happened along with rejected state
     *   changes
     * - 3: displays more decision logic
     * - 4: displays everything, including all possible operations
     *
     * Example
     * ```
     * states = asyncmachine.factory ['A', 'B', 'C']
     * states.logLevel(1)
     * states.add('A')
     * # -> [add] state Enabled
     * # -> [states] +Enabled
     * ````
     *
     * @param prefix Prefix before all console messages.
     * @param level Error level (1-3).
     */
    logLevel(log_level: number): this;
    logLevel(): number;
    logLevel(log_level?: number): this | number {
        if (log_level !== undefined) {
            this.print_exception = Boolean(log_level)
            this.log_level_ = log_level
            return this
        } else
            return this.log_level_
    }
    
    logHandler(log_handler: Function): this;
    logHandler(): Function;
    logHandler(log_handler?: Function): this | Function {
        if (log_handler) {
            this.log_handler_ = log_handler
            return this
        } else
            return this.log_handler_
    }
    
    id(id: string): this;
    id(): string;
    id(id?: string): this | string {
        if (id !== undefined) {
            this.id_ = id
            return this
        } else
            return this.id_
    }

    /**
     * TODO docs
     */
    on(event: string, listener: Function, context?: Object): this {
		// is event is a NAME_state event, fire immediately if the state is set
        if ((event.slice(-6) === "_state" || event.slice(-6) === "_enter") && this.is(event.slice(0, -6))) {
            this.catchPromise(listener.call(context));
		// is event is a NAME_end event, fire immediately if the state isnt set
        } else if ((event.slice(-4) === "_end" && !this.is(event.slice(0, -4))) ||
                event.slice(-5) === "_exit" && !this.is(event.slice(0, -5)) ) {
            this.catchPromise(listener.call(context));
        }

        super.on(event, listener, context);
        return this;
    }

    /**
     * TODO docs
     */
    once(event: string, listener: Function, context?: Object): this {
		// is event is a NAME_state event, fire immediately if the state is set
		// and dont register the listener
        if ((event.slice(-6) === "_state" || event.slice(-6) === "_enter") && this.is(event.slice(0, -6))) {
            this.catchPromise(listener.call(context));
		// is event is a NAME_end event, fire immediately if the state is not set
		// and dont register the listener
        } else if ((event.slice(-4) === "_end" && !this.is(event.slice(0, -4))) ||
                event.slice(-5) === "_exit" && !this.is(event.slice(0, -5)) ) {
            this.catchPromise(listener.call(context));
        } else {
            super.once(event, listener, context);
        }

        return this;
    }

    /**
     * Bind the Exception state to the promise error handler. Handy when working
     * with promises.
     *
     * See [[Exception_state]].
     *
     * @param promise The promise to handle
     * @param target_states States for which the promise was created (the
     *   one that failed).
     * @return The source promise, for piping.
     * 
     * TODO target_states are redundant
     */
    catchPromise(promise: Promise<any>, target_states?: string[]): Promise<any>;
    catchPromise(promise: any, target_states?: string[]): any {
        if ((promise != null ? promise.then : void 0) && (promise != null ? promise["catch"] : void 0)) {
            promise["catch"]((error) => this.add("Exception", error, target_states));
        }

        return promise;
    }

    /**
     * Diffs two state sets and returns the ones present only in the 1st one.
     *
     * @param states1 Source states list.
     * @param states2 Set to diff against (picking up the non existing ones).
     * @return List of states in states1 but not in states2.
     */
    diffStates(states1: string[], states2: string[]) {
        return states1.filter( name => !states2.includes(name) )
    }

    logHandlerDefault(msg, level) {
        if (level > this.log_level_)
            return;

        let prefix = this.id() ? `[${this.id()}] ` : ''
        msg = prefix + msg

        console.log(msg)
    }
    
    // PRIVATES

    protected log(msg: string, level: number = 1) {
        if (this.log_handler_)
            this.log_handler_(msg, level)
        else
            this.logHandlerDefault(msg, level)
    }

    protected getPipeBindings(flags): TPipeBindings {
        if (!flags) {
            return {
                state: "add",
                end: "drop"
            }
        } else if (flags & PipeFlags.INVERT && flags & PipeFlags.NEGOTIATION) {
            return {
                enter: "drop",
                exit: "add"
            }
        } else if (flags & PipeFlags.NEGOTIATION) {
            return {
                enter: "add",
                exit: "drop"
            }
        } else if (flags & PipeFlags.INVERT) {
            return {
                state: "drop",
                end: "add"
            }
        }
    }

    protected pipeBind(states: string | string[], machine?: AsyncMachine, 
            target_state?: string, flags?: PipeFlags) {
        var bindings = this.getPipeBindings(flags)
        let parsed_states = this.parseStates(states)

        if (target_state && typeof target_state !== 'string')
            throw new Error('target_state has to be string or null')

        let tags = ''
        if (flags & PipeFlags.INVERT)
            tags += ':invert'
        if (flags & PipeFlags.NEGOTIATION)
            tags += ':neg'

        if (parsed_states.length == 1 && target_state)
            this.log(`[pipe${tags}] ${parsed_states[0]} as ${target_state} to ${machine.id()}`, 2)
        else
            this.log(`[pipe${tags}] ${parsed_states.join(', ')} to ${machine.id()}`, 2)
        
        parsed_states.forEach( state => {
            // accept a different name only when one state is piped
            var target = (parsed_states.length == 1 && target_state) || state;

            Object.keys(bindings).forEach((event_type: TStateMethod) => {
                var method_name = bindings[event_type];
                let listener = () => {
                    if (flags & PipeFlags.LOCAL_QUEUE)
                        return this[method_name](machine, target)
                    else
                        return machine[method_name](target)
                }
                // TODO extract
                // TODO check for duplicates
                if (!this.piped[state])
                    this.piped[state] = []
                this.piped[state].push({
                    state: target,
                    machine: machine,
                    event_type,
                    listener,
                    flags
                })
                // assert target states
                machine.parseStates(target)
                // setup the forwarding listener
                // TODO support un-piping
                // TODO listener-less piping (read from #pipes directly)
                this.on(`${state}_${event_type}`, listener)
            })

            // TODO emit only once per machine
            this.emit('pipe')
            if (machine !== this)
                machine.emit('pipe')
        })
    }

    /**
     * Override for EventEmitter method calling a specific listener. Binds to
     * a promis if returned by the listener.
     * 
     * TODO incorporate into EE, saving one call stack frame
     */
    protected callListener(listener, context, params): Promise<any>;
    protected callListener(listener, context, params): any {
        var ret = listener.apply(context, params);

		// assume params[0] are the target states of the transition
        return this.catchPromise(ret, params[0]);
    }

	// TODO make it cancellable
    protected setImmediate(fn, ...params) {
        if (setImmediate) {
            return setImmediate.apply(null, [fn].concat(params));
        } else {
            return setTimeout(fn.apply(null, params), 0);
        }
    }

	// TODO log it better
	// Returns a queue entry with
    private prepareAutoStates(): IQueueRow {
        var add = [];
        this.states_all.forEach((state) => {
            var is_current = () => this.is(state);
            var is_blocked = () => this.is().some((item) => {
                    if (!(this.get(item)).drop) {
                        return false;
                    }
                    return Boolean(~(this.get(item)).drop.indexOf(state));
                });

            if (this[state].auto && !is_current() && !is_blocked()) {
                return add.push(state);
            }
        });

        if (add.length)
            return [STATE_CHANGE.ADD, add, [], true, null]
    }

    hasStateChanged(states_before: string[]): boolean {
        var length_equals = this.is().length === states_before.length;

        return !length_equals || Boolean(this.diffStates(states_before, this.is()).length);
    }

    private parseStates(states: string | string[]) {
        var states_parsed = [].concat(states);

        return states_parsed.filter((state) => {
            if (typeof state !== "string" || !this.get(state)) {
				// TODO trow a specific class once TS will stop complaining
                let id = this.id() ? ` for machine "${this.id()}"` : ""
                throw new Error(`Non existing state "${state}"${id}`);
            }

            return true;
        });
    }

    private prepareTransitions(type: number, states: string[], params: any[], is_autostate?: boolean): IPreparedTransitions {
        var type_label = STATE_CHANGE_LABELS[type].toLowerCase();
        if (is_autostate) {
            this.log(`[${type_label}:auto] state ${states.join(", ")}`, 3);
        } else {
            this.log(`[${type_label}] ${states.join(", ")}`, 2);
        }
        
        let transitions: IPreparedTransitions = {
            auto: is_autostate,
            before: this.is(),
            states: null,
            self: null,
            enters: null,
            exits: null,
            accepted: true
        }

        var states_to_set = (() => {
            switch (type) {
                case STATE_CHANGE.DROP:
                    return this.states_active.filter((state) => !~states.indexOf(state));
                case STATE_CHANGE.ADD:
                    return states.concat(this.states_active);
                case STATE_CHANGE.SET:
                    return states;
            }
        })()
        transitions.states = this.setupTargetStates_(states_to_set, null, is_autostate);

        let implied_states = this.diffStates(transitions.states, states_to_set)
        if (implied_states.length)
            this.log(`[${type_label}:implied] ${implied_states.join(', ')}`, 2);

        states_to_set = transitions.states

        if (type !== STATE_CHANGE.DROP)
            transitions.self = [states, states_to_set, params]

        // Dropping states doesnt require an acceptance
        // Autostates can be set partially
        if (type !== STATE_CHANGE.DROP && !is_autostate) {
            var not_accepted = this.diffStates(states, states_to_set)
            if (not_accepted.length) {
                this.log(`[cancelled:rejected] ${not_accepted.join(', ')}`, 2);
                transitions.accepted = false;
            }
        }

        Object.assign(transitions, this.transition_(states_to_set, states, params))
        
        return transitions;
    }

    /*
     * Puts a transition in the queue, handles a log msg and unifies the states
     * array.
     */
    private enqueue_(type: number, states: string[] | string, params?: any[], target?: AsyncMachine) {
        var type_label = STATE_CHANGE_LABELS[type].toLowerCase();
        let states_parsed = (target || this).parseStates(states);

        if (this.duringTransition()) {
            if (target) {
                this.log(`[queue:${type_label}] [${target.id()}] ${states_parsed.join(", ")}`, 2);
            } else {
                this.log(`[queue:${type_label}] ${states_parsed.join(", ")}`, 2);
            }
        }

        return this.queue.push([type, states_parsed, params, false, target]);
    }

	// Goes through the whole queue collecting return values.
    private processQueue_() {
        if (this.lock_queue) {
            return;
        }

        let ret: boolean[] = [];
        this.lock_queue = true;
        let row: IQueueRow;
        while (row = this.queue.shift()) {
            let target: AsyncMachine = row[QUEUE.TARGET] || this;
            let queue = target.queue;
            let transitions = target.prepareTransitions(row[QUEUE.STATE_CHANGE], target.parseStates(row[QUEUE.STATES]),
                    row[QUEUE.PARAMS], row[QUEUE.AUTO])
            let aborted = !transitions.accepted
            let hasStateChanged = false

            target.current_transition = transitions
            target.transition_events = []
            target.lock = true
            target.queue = [];
            
            try {
                // self transitions
                if (!aborted && transitions.self) {
                    aborted = (false === target.selfTransitionExec_(
                        transitions.self[0], transitions.self[1],
                        transitions.self[2]));
                }
                // exit transitions
                if (!aborted) {
                    for (let transition of transitions.exits) {
                        if (false === target.transitionExit_(transition[0],
                                transition[1], transition[2], transition[3])) {
                            aborted = true;
                            continue;
                        }
                    }
                }
                // enter transitions
                if (!aborted) {
                    for (let transition of transitions.enters) {
                        if (false === target.transitionEnter_(transition[0],
                                transition[1], transition[2])) {
                            aborted = true;
                            continue;
                        }
                    }
                }
                // state and end transitions (non-abortable)
                if (!aborted) {
                    target.setActiveStates_(
                        // TODO double parseStates
                        target.parseStates(row[QUEUE.STATES]),
                        transitions.states)
                    target.processPostTransition();
                    hasStateChanged = target.hasStateChanged(transitions.before)
                    if (hasStateChanged)
                        // TODO rename to "tick" 
                        target.emit("change", transitions.before)
                }
			    // if canceled then drop the queue created during the transition
                target.queue = aborted ? queue : queue.concat(target.queue)
            } catch (err) {
                aborted = true
                // Its an exception to an exception when the exception throws... an exception
                if (err.transition.match(/^Exception_/) || err.transition.match(/_Exception$/)) {
                    target.queue = queue
                    this.setImmediate( () => { throw err.err } )
                } else {
                    debugger
                    let queued_exception: IQueueRow = [STATE_CHANGE.ADD, ["Exception"], [err.err, 
                            transitions.states, transitions.before, err.transition]]
                    // drop the queue created during the transition
                    target.queue = [queued_exception].concat(queue);
                }
            }
            
            target.current_transition = null
            target.lock = false;
            
            if (aborted) {
                // TODO document, pass some params
                target.emit("cancelled");
            } else if (hasStateChanged && !row[QUEUE.AUTO]) {
			    // prepend auto states to the beginning of the queue
                var auto_states = target.prepareAutoStates();
                if (auto_states) {
                    target.queue.unshift(auto_states);
                }
            }

            // If this's a DROP transition, check if all explicite states has been dropped.
            if (row[QUEUE.STATE_CHANGE] === STATE_CHANGE.DROP) {
                ret.push(target.allStatesNotSet(row[QUEUE.STATES]))
            } else {
                ret.push(target.every(...transitions.states))
            }
        }
        this.lock_queue = false
        return ret[0] || false;
    }

    private allStatesNotSet(states): boolean {
        return states.every((state) => !this.is(state));
    }

    private createDeferred(fn: Function, target, states, state_params: any[]): Deferred {
		// TODO use the current transition's states if available (for enter/exit
		// transitons)
        var transition_states = this.is();

        var params = [target];
        if (states) {
            params.push(states);
        }
        if (state_params.length) {
            params.push.apply(params, state_params);
        }

        var deferred = new Deferred

        deferred.promise
            .then( callback_params => {
                return fn.apply(null, params.concat(callback_params))
            }).catch( err => {
                var async_states = [].concat(params[0] instanceof AsyncMachine ? params[1] : params[0]);
                return this.add("Exception", err, transition_states, async_states);
            });

        this.last_promise = deferred.promise;

        return deferred;
    }

    private createCallback(deferred: Deferred): (err?, ...params) => void {
        return (err : any = null, ...params) => {
            if (err) {
                return deferred.reject(err);
            } else {
                return deferred.resolve(params);
            }
        };
    }

    private createListener(deferred: Deferred): (...params) => void {
        return (...params) => deferred.resolve(params);
    }

    private setupTargetStates_(explicite_states: string[], exclude?: string[], is_auto = false): string[] {
        explicite_states = this.parseStates(explicite_states);

        if (exclude == null) {
            exclude = [];
        }

        var states = this.parseImplies_(explicite_states);
        states = this.removeDuplicateStates_(states);
        
		// Check if state is blocked or excluded
        var already_blocked = [];

		// Parsing required states allows to avoid cross-dropping of states
        states = this.parseRequires_(states, is_auto)

		// Remove states already blocked.
        states = states.reverse().filter((name) => {
            var blocked_by = this.isStateBlocked_(states, name);
            blocked_by = blocked_by.filter( blocker_name => !~already_blocked.indexOf(blocker_name));

            if (blocked_by.length) {
                already_blocked.push(name);
				// if state wasn't implied by another state (was one of the current
				// states) or was explicite (but not auto) then make it a higher priority log msg
                let level = this.is(name) || (explicite_states.includes(name) && !is_auto) ? 2 : 3
                this.log(`[rejected:drop] ${name} by ${blocked_by.join(", ")}`, level);
            }
            return !blocked_by.length && !~exclude.indexOf(name);
        });

		// Parsing required states allows to avoid cross-dropping of states
        return this.parseRequires_(states.reverse(), is_auto);
    }
    
	// Collect implied statestates: string[]): string[] {
    private parseImplies_(states: string[]): string[] {
        states.forEach((name) => {
            var state = this.get(name);
            if (!state.add) {
                return;
            }
            return states = states.concat(state.add);
        });

        return states;
    }

	// Check required states
	// Loop until no change happens, as states can require themselves in a vector.
    private parseRequires_(states: string[], is_auto = false): string[] {
        var length_before = 0;
        var not_found_by_states = {};
		// TODO compare states by name
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter((name) => {
                var state = this.get(name);
                var not_found = [];
                for (let req of state.require || [])
                    if (!~states.indexOf(req))
                        not_found.push(req)

                if (not_found.length) {
                    not_found_by_states[name] = not_found;
                }

                return !not_found.length;
            });
        }

        if (Object.keys(not_found_by_states).length) {
            var state = "";
            var not_found = [];
            var names = (() => {
                var _results;
                _results = [];
                for (state in not_found_by_states) {
                    not_found = not_found_by_states[state];
                    _results.push(state + "(-" + (not_found.join(" -")) + ")");
                }
                return _results;
            })();
            if (is_auto)
                this.log(`[rejected:auto] ${names.join(" ")}`, 3)
            else
                this.log(`[rejected] ${names.join(" ")}`, 2)
        }

        return states;
    }

    private removeDuplicateStates_(states: string[]): string[] {
        var states2 = [];
        states.forEach((name) => {
            if (!~states2.indexOf(name)) {
                return states2.push(name);
            }
        });

        return states2;
    }

    private isStateBlocked_(states: string[], name: string): string[] {
        var blocked_by = [];
        states.forEach((name2) => {
            var state = this.get(name2);
            if (state.drop && ~state.drop.indexOf(name)) {
                return blocked_by.push(name2);
            }
        });

        return blocked_by;
    }

    private transition_(to: string[], explicit_states: string[], params: any[] = []): {
        exits: any[],
        enters: any[]
    } {
        var from = this.states_active.filter((state) => !~to.indexOf(state));

        this.orderStates_(to);
        this.orderStates_(from);

        // queue the transitions
        var queue = {
            exits: [],
            enters: []
        }
        for (let state of from)
            queue.exits.push([state, to, explicit_states, params])
        // var ret = from.some((state) => false === this.transitionExit_(state, to, explicit_states, params))

        for (let state of to) {
            // dont enter to already set states, except when it's a MULTI state
			// TODO write tests for multi state
            if (this.is(state) && !this.get(state).multi)
                continue
            
            let transition_params = ~explicit_states.indexOf(state) ?
                params : [];
            // ret = this.transitionEnter_(state, to, transition_params);
            queue.enters.push([state, to, transition_params])
        }
        
        return queue
    }

    /**
     * Sets the new active states bumping the counters. Returns an array of
     * previously active states.
     */
    private setActiveStates_(explicite_states: string[], target: string[]): string[] {
        var previous = this.states_active;
        var new_states = this.diffStates(target, this.states_active);
        var removed_states = this.diffStates(this.states_active, target);
        var nochange_states = this.diffStates(target, new_states);
        this.states_active = target;
		// Tick all the new states and the explicite multi states
        for (let state of target) {
            let data = this.get(state)
            if (!~previous.indexOf(state) ||
                    (~explicite_states.indexOf(state) && data.multi)) {
                this.clock_[state]++;
            }
        }

		// construct a logging msg
        var log_msg = [];
        if (new_states.length) {
            log_msg.push("+" + (new_states.join(" +")));
        }
        if (removed_states.length) {
            log_msg.push("-" + (removed_states.join(" -")));
        }
		// TODO fix
        if (nochange_states.length && this.log_level_ > 2) {
            if (new_states.length || removed_states.length) {
                log_msg.push("\n    ");
            }
            log_msg.push(nochange_states.join(", "));
        }
        if (log_msg.length) {
            this.log("[states] " + (log_msg.join(" ")), 1);
        }

        return previous
    }

	// TODO this is hacky, should be integrated into processTransition
    private processPostTransition() {
        // TODO refactor this.transition_events to look more like the queue
        let transition
        while (transition = this.transition_events.shift()) {
            let name = transition[0];
            let params = transition[1];
            let is_enter = false
            let state, method;

            if (name.slice(-5) === "_exit") {
                state = name.slice(0, -5);
                method = state + "_end";
            } else if (name.slice(-6) === "_enter") {
                is_enter = true
                state = name.slice(0, -6);
                method = state + "_state";
            } else {
                // self transition
                continue
            }

            try {
                var context = this.getMethodContext(method)
                if (context) {
                    let ret
                    this.log("[transition] " + method, 2);
                    ret = context[method](...params);
                    this.catchPromise(ret, this.is());
                } else {
                    this.log("[transition] " + method, 4);
                }

                this.emit.apply(this, [method].concat(params));
            } catch (err) {
                err = new TransitionException(err, method)
                this.processPostTransitionException(state, is_enter)
                throw err;
            }
        }

        // TODO move to processQueue_
        this.transition_events = [];
    }

    // TODO REFACTOR
    private processPostTransitionException(state: string, is_enter: boolean) {
        var states_active = this.states_active
        let transition
        while (transition = this.transition_events.shift()) {
            let name = transition[0];
            let state

            if (name.slice(-5) === "_exit") {
                state = name.slice(0, -5);
                states_active.push(state)
            } else if (name.slice(-6) === "_enter") {
                state = name.slice(0, -6);
                states_active.splice(states_active.indexOf(state), 1)
            }
        }
        // handle the state which caused the exception
        if (is_enter) {
            states_active.splice(states_active.indexOf(state), 1)
        } else {
            states_active.push(state)
        }
        // override the active states, reverting the un-executed transitions
        this.states_active = states_active
        this.log(`[exception] from ${state}, forced states to ${states_active.join(', ')}`)
    }

    private getMethodContext(name) {
        if (this.target[name] && this.target[name] instanceof Function) {
            return this.target;
        } else if (this[name] && this[name] instanceof Function) {
            return this;
        }
    }

	// Executes self transitions (eg ::A_A) based on active states.
    // TODO pass explicite states, pass params only to those
    private selfTransitionExec_(explicite_states: string[], target_states: string[],
            params: any[] = []) {
        var transition_params = params;
        return !explicite_states.some((state) => {
            // only the active states
            if (!~this.states_active.indexOf(state))
                return false

            let ret;
            let name = `${state}_${state}`
            // pass the transition params only to the explicite states
            let params = ~explicite_states.indexOf(state) ?
                transition_params : []
            let context = this.getMethodContext(name)

            try {
                if (context) {
                    this.log("[transition] " + name, 2);
                    ret = context[name](...params);
                    this.catchPromise(ret, target_states);
                } else
                    this.log("[transition] " + name, 4);

                if (ret === false) {
                    this.log(`[cancelled:self] ${state}`, 2)
                    return true;
                }

                ret = this.emit.apply(this, [name].concat(params))
            } catch (err) {
                throw new TransitionException(err, name)
            }

            if (ret !== false)
                this.transition_events.push([name, params]);

            return ret === false;
        });
    }

	// Exit transition handles state-to-state methods.
    private transitionExit_(from: string, to: string[], explicit_states: string[], 
            params: any[]) {
        if (~explicit_states.indexOf(from)) {
            var transition_params = params;
        }
        if (transition_params == null) {
            transition_params = [];
        }
        var ret = this.transitionExec_(from + "_exit", to, transition_params);
        if (ret === false) {
            return false;
        }

		// TODO executes transitions which are beeing dropped now
        ret = to.some((state) => {
            var transition = from + "_" + state;
            if (~explicit_states.indexOf(state)) {
                transition_params = params;
            }
            if (transition_params == null) {
                transition_params = [];
            }
            ret = this.transitionExec_(transition, to, transition_params);
            return ret === false;
        });

        if (ret === true) {
            return false;
        }

		// TODO pass args to explicitly dropped states
        ret = (this.transitionExec_(from + "_any", to)) === false;

        return !ret;
    }

    private transitionEnter_(to: string, target_states: string[], params: any[]) {
        var ret = this.transitionExec_("any_" + to, target_states, params);
        if (ret === false) {
            return false;
        }

        return this.transitionExec_(to + "_enter", target_states, params);
    }

    // TODO target_states are redundant
    private transitionExec_(method: string, target_states: string[], params: string[] = []) {
        let context = this.getMethodContext(method)
        try {
            if (context) {
                this.log("[transition] " + method, 2)
                var ret = context[method](...params)
                this.catchPromise(ret, target_states)
            } else
                this.log("[transition] " + method, 4)

            if (ret !== false) {
                let is_exit = method.slice(-5) === "_exit";
                let is_enter = !is_exit && method.slice(-6) === "_enter";
                if (is_exit || is_enter) {
                    // TODO this is hacky
                    this.transition_events.push([method, params]);
                }
                ret = this.emit.apply(this, [method].concat(params));
                if (ret === false)
                    this.log(`[cancelled] ${target_states.join(", ")} by the event ${method}`, 2);
            } else {
                this.log(`[cancelled] ${target_states.join(", ")} by the method ${method}`, 2);
            }
        } catch (err) {
            throw new TransitionException(err, method)
        }

        return ret;
    }

    private orderStates_(states: string[]): void {
        states.sort((e1, e2) => {
            var state1 = this.get(e1);
            var state2 = this.get(e2);
            var ret = 0;
            if (state1.after && ~state1.after.indexOf(e2)) {
                ret = 1;
            } else {
                if (state2.after && ~state2.after.indexOf(e1)) {
                    ret = -1;
                }
            }
            return ret;
        });
        return null;
    }

	// TODO bind to _enter and _exit as well to support the negotiation phase in
	// piped events
    private bindToStates(states: string[], listener: Function, abort?: Function, once: boolean = false) {
        var enter = () => {
            let should_abort = abort && abort()
            if (!should_abort && this.is(states))
                listener()

            if (this.is(states)) {
                this.log(`[bind:off] ${states.join(', ')}`, 3)
                for (let state of states)
                    this.removeListener(`${state}_state`, enter)
            }
        }
        
        this.log(`[bind:on] ${states.join(', ')}`, 3)
        for (let state of states)
            this.on(`${state}_state`, enter)
    }

	// TODO compose the existing abort function without recursion
    private getAbortFunction(state: string, tick: number, abort?: () => boolean): () => boolean {
        return () => {
            if (typeof abort === "function" ? abort() : void 0) {
                return true;
            } else if (!this.is(state)) {
                this.log(("Aborted " + state + " listener as the state is not set. ") + ("Current states:\n    (" + (this.is().join(", ")) + ")"), 1);
                return true;
            } else if (!this.is(state, tick)) {
                this.log(("Aborted " + state + " listener as the tick changed. Current states:") + ("\n    (" + (this.is().join(", ")) + ")"), 1);
                return true;
            }

            return false;
        };
    }
}


export default AsyncMachine;