/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
import { EventEmitter } from "eventemitter3-abortable";
export declare var STATE_CHANGE: {
    DROP: number;
    ADD: number;
    SET: number;
};
export declare var STATE_CHANGE_LABELS: {
    0: string;
    1: string;
    2: string;
};
/**
 * Queue enum defining param positions in queue's entries.
 * TODO enum
 */
export declare enum QUEUE {
    STATE_CHANGE = 0,
    STATES = 1,
    PARAMS = 2,
    TARGET = 3,
    AUTO = 4,
}
export interface IQueueRow {
    0: number;
    1: string[];
    2: any[];
    3?: boolean;
    4?: AsyncMachine;
}
export declare class Deferred {
    promise: Promise<any>;
    resolve: (...params: any[]) => void;
    reject: (err?) => void;
    constructor();
}
/**
 * Base class which you extend with your own one defining the states.
 * The [[Exception]] state is already provided.
 *
 * ```
 * class FooStates extends AsyncMachine
 *   Enabled: {}
 *
 *   Downloading: blocks: 'Downloaded'
 *   Downloaded: blocks: 'Downloading'
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
export declare class AsyncMachine extends EventEmitter {
    private states_all;
    private states_active;
    private queue;
    private lock;
    last_promise: Promise<any>;
    private debug_prefix;
    private debug_level;
    private clock_;
    private target;
    private transition_events;
    private debug_;
    piped: {};
    lock_queue: boolean;
    /**
     * TODO this have to go
     */
    private internal_fields;
    /**
     * Empty Exception state properties. See [[Exception_state]] transition handler.
     */
    Exception: {};
    /**
     * Creates an AsyncMachine instance (not a constructor) with specified states.
     * States properties are empty, so you'd need to set it by yourself.
     *
     * @param states List of state names to register on the new instance.
     * @return
     *
     * ```
     * states = AsyncMachine.factory ['A', 'B','C']
     * states.A = implies: ['B']
     * states.add 'A'
     * states.is() # -> ['A', 'B']
     * ```
     */
    static factory(states: any, constructor: any): any;
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
    constructor(target?: any, register_all?: any);
    /**
     * All exceptions are caught into this state, including both synchronous and
     * asynchronous from promises and callbacks. You can overcreateride it and
     * handle exceptions based on their type and target states of the transition
     * during which they appeared.
     *
     * @param states States to which the machine is transitioning rigt now.
     * 	This means post-exception states.
     * @param err The exception object.
     * @param exception_states Target states of the transition during
     * 	which the exception was thrown.
     * @param async_target_states Only for async transitions like
     * [[addByCallback]], these are states which we're supposed to be set by the
     * callback.
     * @return
     *
     * Example of exception handling
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.Exception_state = (states, err, exception_states) ->
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
     * 		@add 'Exception', error, states
     * ```
     */
    Exception_state(states: string[], err: Error, exception_states: string[], async_target_states?: string[]): void;
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
     * 		@states = AsyncMachine.factory ['A', 'B', 'C']
     * 		@states.setTarget this
     * 		@states.add 'A'
     *
     * 	A_state: ->
     * 		console.log 'State A set'
     * ```
     */
    setTarget(target: any): any;
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
     * 		@states = new States
     * 		@states.registerAll()
     * ```
     */
    registerAll(): any;
    /**
     * Returns an array of relations from one state to another.
     * Maximum set is ['blocks', 'drops', 'implies', 'requires'].
     *
     * TODO code sample
     */
    getRelations(from_state: string, to_state: string): string[];
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
     * @return
     *
     * ```
     * states = AsyncMachine.factory ['A', 'B']
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
    /**
     * Checks if any of the passed states is set. State can also be an array, then
     * all states from this param has to be set.
     *
     * @param states State names and/or lists of state names.
     * @return
     *
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add ['A', 'B']
     *
     * states.any 'A', 'C' # -> true
     * states.any ['A', 'C'], 'C' # -> false
     * ```
     */
    any(...states: string[]): boolean;
    any(...states: string[][]): boolean;
    /**
     * Checks if all the passed states are set.
     *
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add ['A', 'B']
     *
     * states.every 'A', 'B' # -> true
     * states.every 'A', 'B', 'C' # -> false
     * ```
     */
    every(...states: string[]): boolean;
    /**
     * Returns the current queue. For struct's meaning, see [[QUEUE]].
     */
    futureQueue(): IQueueRow[];
    /**
     * Register the passed state names. State properties should be already defined.
     *
     * @param states State names.
     * @return
     *
     * ```
     * states = new AsyncMachine
     * states.Enabled = {}
     * states.Disposed = blocks: 'Enabled'
     *
     * states.register 'Enabled', 'Disposed'
     *
     * states.add 'Enabled'
     * states.is() # -> 'Enabled'
     * ```
     */
    register(...states: string[]): number[];
    /**
     * Returns state's properties.
     *
     * @param state State name.
     * @return
     *
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.A = blocks: ['B']
     *
     * states.get('A') # -> { blocks: ['B'] }
     * ```
     */
    get(state: string): IState;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.set 'A'
     * states.is() # -> ['A']
     * states.set 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = AsyncMachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Setting a state on an external machine
     * ```
     * states1 = AsyncMachine.factory ['A', 'B']
     * states2 = AsyncMachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# is fully finished
     * 	states1.add states2, 'B'
     * ```
     */
    set(target: AsyncMachine, states: string[] | string, ...params: any[]): boolean;
    set(target: string[] | string, states?: any, ...params: any[]): boolean;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * setTimeout states.setByCallback 'B'
     * ```
     *
     */
    setByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    setByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    setByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    setByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.setByListener 'A'
     * emitter.on 'error', states.addByListener 'Exception'
     * ```
     */
    setByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    setByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    setByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    setByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    /**
     * Deferred version of [[set]], setting the requested states on the next event
     * loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[set]] for the params description.
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.set 'A'
     * states.setNext 'B'
     * states.is() # -> ['A']
     * ```
     */
    setNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    setNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    setNext(target: string, states: any, ...params: any[]): (...params) => void;
    setNext(target: string[], states: any, ...params: any[]): (...params) => void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.is() # -> ['A']
     * states.add 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = AsyncMachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Adding a state on an external machine
     * ```
     * states1 = AsyncMachine.factory ['A', 'B']
     * states2 = AsyncMachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# fully finishes
     * 	states1.add states2, 'B'
     * ```
     */
    add(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    add(target: AsyncMachine, states: string, ...params: any[]): boolean;
    add(target: string[], states?: any, ...params: any[]): boolean;
    add(target: string, states?: any, ...params: any[]): boolean;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * someNodeCallback 'foo.com', states.addByCallback 'B'
     * ```
     *
     */
    addByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    addByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    addByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    addByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.addByListener 'A'
     * emitter.on 'error', states.addByListener 'Exception'
     * ```
     */
    addByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    addByListener(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    addByListener(target: string[], states?: any, ...params: any[]): (...params) => void;
    addByListener(target: string, states?: any, ...params: any[]): (...params) => void;
    /**
     * Deferred version of [[add]], adding the requested states on the next event
     * loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[add]] for the params description.
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.addNext 'B'
     * states.is() # -> ['A', 'B']
     * ```
     */
    addNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    addNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    addNext(target: string, states: any, ...params: any[]): (...params) => void;
    addNext(target: string[], states: any, ...params: any[]): (...params) => void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.drop 'A'
     * states.is() # -> ['A']
     * states.drop 'B'
     * states.is() # -> ['B']
     * ```
     *
     * State negotiation
     * ```
     * states = AsyncMachine.factory ['A', 'B']
     * # Transition enter negotiation
     * states.A_enter = -> no
     * states.add 'A' # -> false
     * ```
     *
     * Dropping a state on an external machine
     * ```
     * states1 = AsyncMachine.factory ['A', 'B']
     * states2 = AsyncMachine.factory ['C', 'D']
     *
     * states1.A_enter ->
     * 	# this transition will be queued and executed after the current transition
     * 	# fully finishes
     * 	states1.add states2, 'B'
     * ```
     */
    drop(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    drop(target: AsyncMachine, states: string, ...params: any[]): boolean;
    drop(target: string[], states?: any, ...params: any[]): boolean;
    drop(target: string, states?: any, ...params: any[]): boolean;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * someNodeCallback 'foo.com', states.dropByCallback 'B'
     * ```
     *
     */
    dropByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    dropByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    dropByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    dropByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * emitter = new EventEmitter
     * emitter.on 'ready', states.dropByListener 'A'
     * emitter.on 'error', states.setByListener 'Exception'
     * ```
     */
    dropByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    dropByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    dropByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    dropByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    /**
     * Deferred version of [[drop]], dropping the requested states on the next
     * event loop's tick. Useful if you want to start with a fresh stack trace.
     *
     * See [[drop]] for the params description.
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.dropNext 'A'
     * states.is('A') # -> true
     * ```
     */
    dropNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    dropNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    dropNext(target: string, states: any, ...params: any[]): (...params) => void;
    dropNext(target: string[], states: any, ...params: any[]): (...params) => void;
    /**
     * Pipes (forwards) the state to other instance.
     *
     * Piped are "_state" and "_end" methods, not the negotiation ones
     * (see pipeNegotiation]] for these).
     *
     * @param state Source state's name. Optional - if none is given, all states
     * from the source asyncmachine are piped.
     * @param machine Target machine to which the state(s) should be forwarded.
     * @param target_state If the target state name should be different, this is
     * the name.
     * @param local_queue Append the piped stated transition to the END of the
     *   local queue if one exists at the moment, altering the order of the
     *   transition.
     *
     * Example
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states1.pipe 'A', states2
     * states1.add 'A'
     * states2.is('A') # -> true
     * ```
     */
    pipe(state: string, machine?: AsyncMachine, target_state?: string, local_queue?: boolean): any;
    pipe(state: string[], machine?: AsyncMachine, target_state?: string, local_queue?: boolean): any;
    pipe(state: AsyncMachine, machine?: string, target_state?: boolean): any;
    /**
     * Pipes (forwards) the state to other instance in an inverted manner.
     *
     * Piped are "_state" and "_end" methods, not the negatiation ones
     * (see pipeNegotiation]] for these).
     *
     * @param state Source state's name. Optional - if none is given, all states
     * from the source asyncmachine are forwarded.
     * @param machine Target machine to which the state(s) should be forwarded.
     * @param target_state If the target state name should be different, this is
     * the name.
     * @param local_queue Append the piped stated to the end of the local queue
     *   if any exists at the moment. This will alter the order of the transition.
     *
     * Example
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states1.pipeInverted 'A', states2
     * states2.is('A') # -> true
     * states1.add 'A'
     * states2.is('A') # -> false
     * ```
     */
    pipeInverted(state: any, machine: any, target_state: any, local_queue: any): any;
    /**
     * Pipes (forwards) the state to other instance.
     *
     * Piped are "_enter" and "_exit" methods, which returned values can manage
     * the state negotiation, but also can be executed in random order (relatively
     * to other states from the same transition).
     *
     * @param state Source state's name. Optional - if none is given, all states
     * from the source asyncmachine are piped.
     * @param machine Target machine to which the state(s) should be forwarded.
     * @param target_state If the target state name should be different, this is
     * the name.
     * @param local_queue Append the piped stated to the end of the local queue
     *   if any exists at the moment. This will alter the order of the transition.
     *
     * Piping without negotiation
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states1.pipeNegotiation 'A', states2
     * states1.add 'A'
     * states2.is('A') # -> true
     * ```
     *
     * Piping with negotiation
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states2.A_enter = -> no
     * states1.pipeNegotiation 'A', states2
     * states1.add 'A'
     * states2.is('A') # -> false
     * ```
     */
    pipeNegotiation(state: any, machine: any, target_state: any, local_queue: any): any;
    /**
     * Pipes (forwards) the state to other instance in an inverted manner.
     *
     * Piped are "_enter" and "_exit" methods, which returned values can manage
     * the state negotiation, but also can be executed in random order (relatively
     * to other states from the same transition).
     *
     * @param state Source state's name. Optional - if none is given, all states
     * from the source asyncmachine are piped.
     * @param machine Target machine to which the state(s) should be forwarded.
     * @param target_state If the target state name should be different, this is
     * the name.
     * @param local_queue Append the piped stated to the end of the local queue
     *   if any exists at the moment. This will alter the order of the transition.
     *
     * Inverted piping without negotiation
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states1.pipeNegotiationInverted 'A', states2
     * states1.add 'A'
     * states2.is('A') # -> true
     * ```
     *
     * Inverted piping with negotiation
     * ```
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = AsyncMachine.factory ['A', 'B', 'C']
     * states2.A_enter = -> no
     * states1.pipeNegotiationInverted 'A', states2
     * states1.add 'A'
     * states2.is('A') # -> false
     * ```
     */
    pipeNegotiationInverted(state: any, machine: any, target_state: any, local_queue: any): any;
    pipeOff(): void;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.add 'A'
     * states.add 'A'
     * states.clock('A') # -> 1
     * states.drop 'A'
     * states.add 'A'
     * states.clock('A') # -> 2
     * ````
     */
    clock(state: string): number;
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
     * states1 = AsyncMachine.factory ['A', 'B', 'C']
     * states2 = states1.createChild()
     *
     * states2.add 'A'
     * states2.is() # -> ['A']
     * states1.is() # -> []
     * ````
     */
    createChild(): this;
    /**
     * Indicates if this instance is currently during a state transition.
     *
     * When a machine is during a transition, all state changes will be queued
     * and executed as a queue. See [[queue]].
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     *
     * states.A_enter = ->
     *   @duringTransition() # -> true
     *
     * states.A_state = ->
     *   @duringTransition() # -> true
     *
     * states.add 'A'
     * ````
     */
    duringTransition(): boolean;
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
     * states = AsyncMachine.factory ['A', 'B', 'C']
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
    getAbort(state: string, abort?: () => boolean): () => boolean;
    /**
     * Resolves the returned promise when all passed states are set (at the same
     * time). Accepts an optional abort function.
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.when(['A', 'B']).then ->
     *   console.log 'A, B'
     *
     * states.add 'A'
     * states.add('B') # -> prints 'A, B'
     * ````
     *
     * # TODO support push cancellation
     *
     * @param state List of state names
     * @param abort Existing abort function (optional)
     * @return Promise resolved once all states are set concurrently.
     */
    when(states: string | string[], abort?: Function): Promise<any>;
    /**
     * Resolves the returned promise when all passed states are set (at the same
     * time), but triggers the listeners only once. Accepts an optional abort
     * function.
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.whenOnce(['A', 'B']).then ->
     *   console.log 'A, B'
     *
     * states.add 'A'
     * states.add('B') # -> prints 'A, B'
     * states.drop 'B'
     * states.add 'B' # listener is already disposed
     * ````
     *
     * # TODO support push cancellation
     *
     * @param state List of state names
     * @param abort Existing abort function (optional)
     * @return Promise resolved once all states are set concurrently.
     */
    whenOnce(states: string | string[], abort?: Function): Promise<any>;
    /**
     * Enabled debug messages sent to the console. There're 3 log levels:
     *
     * - 1 - displays only the state changes in a diff format
     * - 2 - displays all operations which happened along with refused state
     *   changes
     * - 3 - displays pretty much everything, including all possible operations
     *
     * Example
     * ```
     * states = AsyncMachine.factory ['A', 'B', 'C']
     * states.debug 'FOO ', 1
     * states.add 'A'
     * # -> FOO [add] state Enabled
     * # -> FOO [states] +Enabled
     * ````
     *
     * @param prefix Prefix before all console messages.
     * @param level Error level (1-3).
     */
    debug(prefix?: any, level?: any): any;
    debugOff(): void;
    /**
     * TODO docs
     * TODO unify event name with transition name (remove the _state suffix if possible)
     */
    on(event: string, listener: Function, context?: Object): AsyncMachine;
    /**
     * TODO docs
     * TODO unify event name with transition name (remove the _state suffix if possible)
     */
    once(event: string, listener: Function, context?: Object): AsyncMachine;
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
     */
    catchPromise(promise: Promise<any>, target_states?: string[]): Promise<any>;
    /**
     * Diffs two state sets and returns the ones present in the 1st only.
     *
     * @param states1 Source states list.
     * @param states2 Set to diff against (picking up the non existing ones).
     * @return List of states in states1 but not in states2.
     */
    diffStates(states1: string[], states2: string[]): string[];
    private log(msg, level?);
    pipeBind(state: any, machine: any, target_state: any, local_queue: any, bindings: any): any;
    /**
     * Override for EventEmitter method calling a specific listener. Binds to
     * a promis if returned by the listener.
     */
    private callListener(listener, context, params);
    private getInstance();
    setImmediate(fn: any, ...params: any[]): any;
    private prepareAutoStates();
    hasStateChanged(states_before: string[]): boolean;
    private parseStates(states);
    private prepareTransitions(type, states, params, is_autostate?);
    private enqueue_(type, states, params?, target?);
    private processQueue_();
    private allStatesNotSet(states);
    private createDeferred(fn, target, states, state_params);
    private createCallback(deferred);
    private createListener(deferred);
    private selfTransitionExec_(states, params?);
    private setupTargetStates_(states, exclude?);
    private parseImplies_(states);
    private parseRequires_(states);
    private removeDuplicateStates_(states);
    private isStateBlocked_(states, name);
    private transition_(to, explicit_states, params?);
    private setActiveStates_(target);
    processPostTransition(): any;
    getMethodContext(name: any): AsyncMachine;
    private transitionExit_(from, to, explicit_states, params);
    private transitionEnter_(to, target_states, params);
    private transitionExec_(method, target_states, params?);
    private orderStates_(states);
    private bindToStates(states, listener, abort?, once?);
    private getAbortFunction(state, tick, abort?);
}
export interface IState {
    depends?: string[];
    implies?: string[];
    blocks?: string[];
    requires?: string[];
    auto?: boolean;
    multi?: boolean;
}
export interface ITransitionHandler {
    (states: string[], ...params: any[]): boolean;
}
export default AsyncMachine;
