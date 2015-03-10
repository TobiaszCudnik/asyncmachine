var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
/// <reference path="../typings/settimeout.d.ts" />
/// <reference path="../typings/commonjs.d.ts" />
var __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item)
            return i;
    }
    return -1;
};
var eventemitter = require("eventemitter3-abortable");
var promise = require('es6-promise');
exports.STATE_CHANGE = {
    DROP: 0,
    ADD: 1,
    SET: 2
};
exports.STATE_CHANGE_LABELS = {
    0: "Drop",
    1: "Add",
    2: "Set"
};
/**
 * Queue enum defining param positions in queue's entries.
*/
exports.QUEUE = {
    STATE_CHANGE: 0,
    STATES: 1,
    PARAMS: 2,
    TARGET: 3
};
var Deferred = (function () {
    function Deferred() {
        var _this = this;
        this.promise = null;
        this.resolve = null;
        this.reject = null;
        this.promise = new promise.Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    return Deferred;
})();
exports.Deferred = Deferred;
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
 * - exposing currect state during transition (via the #duringTransition() method)
*/
var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
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
    function AsyncMachine(target, registerAll) {
        if (target === void 0) { target = null; }
        if (registerAll === void 0) { registerAll = false; }
        _super.call(this);
        this.states_all = null;
        this.states_active = null;
        this.queue = null;
        this.lock = false;
        this.last_promise = null;
        this.debug_prefix = "";
        this.debug_level = 1;
        this.clock_ = {};
        this.internal_fields = [];
        this.target = null;
        this.transition_events = [];
        this.debug_ = false;
        /**
            Empty Exception state properties. See [[Exception_state]] transition handler.
        */
        this.Exception = {};
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};
        this.setTarget(target || this);
        if (registerAll) {
            this.registerAll();
        }
        else {
            this.register("Exception");
        }
        this.internal_fields = ["_events", "states_all", "states_active", "queue", "lock", "last_promise", "debug_prefix", "debug_level", "clock_", "debug_", "target", "internal_fields"];
    }
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
    AsyncMachine.factory = function (states) {
        if (states == null) {
            states = [];
        }
        var instance = new AsyncMachine;
        states.forEach(function (state) {
            instance[state] = {};
            return instance.register(state);
        });
        return instance;
    };
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
    AsyncMachine.prototype.Exception_state = function (states, err, exception_states, async_target_states) {
        console.log("EXCEPTION from AsyncMachine");
        if ((exception_states != null ? exception_states.length : void 0) != null) {
            this.log(("Exception \"" + err + "\" when setting the following states:\n    ") + exception_states.join(", "));
        }
        if ((async_target_states != null ? async_target_states.length : void 0) != null) {
            this.log("Next states were supposed to be (add/drop/set):\n    " + exception_states.join(", "));
        }
        console.dir(err);
        return this.setImmediate(function () {
            throw err;
        });
    };
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
    AsyncMachine.prototype.setTarget = function (target) {
        return this.target = target;
    };
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
    AsyncMachine.prototype.registerAll = function () {
        var _results;
        var name = "";
        var value = null;
        for (name in this) {
            value = this[name];
            if ((this.hasOwnProperty(name)) && __indexOf.call(this.internal_fields, name) < 0) {
                this.register(name);
            }
        }
        var constructor = this.getInstance().constructor.prototype;
        _results = [];
        while (true) {
            for (name in constructor) {
                value = constructor[name];
                if ((constructor.hasOwnProperty(name)) && __indexOf.call(this.internal_fields, name) < 0) {
                    this.register(name);
                }
            }
            constructor = Object.getPrototypeOf(constructor);
            if (constructor === AsyncMachine.prototype) {
                break;
            }
            else {
                _results.push(void 0);
            }
        }
        return _results;
    };
    AsyncMachine.prototype.is = function (state, tick) {
        if (!state) {
            return [].concat(this.states_active);
        }
        var active = Boolean(~this.states_active.indexOf(state));
        if (!active) {
            return false;
        }
        if (tick === void 0) {
            return true;
        }
        else {
            return (this.clock(state)) === tick;
        }
    };
    AsyncMachine.prototype.any = function () {
        var _this = this;
        var states = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            states[_i - 0] = arguments[_i];
        }
        return states.some(function (name) {
            if (Array.isArray(name)) {
                return _this.every(name);
            }
            else {
                return _this.is(name);
            }
        });
    };
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
    AsyncMachine.prototype.every = function () {
        var _this = this;
        var states = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            states[_i - 0] = arguments[_i];
        }
        return states.every(function (name) { return !!~_this.states_active.indexOf(name); });
    };
    /**
         * Returns the current queue. For struct's meaning, see [[QUEUE]].
    */
    AsyncMachine.prototype.futureQueue = function () {
        return this.queue;
    };
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
    AsyncMachine.prototype.register = function () {
        var _this = this;
        var states = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            states[_i - 0] = arguments[_i];
        }
        return states.map(function (state) {
            _this.states_all.push(state);
            return _this.clock_[state] = 0;
        });
    };
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
    AsyncMachine.prototype.get = function (state) {
        return this[state];
    };
    AsyncMachine.prototype.set = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued SET state(s) " + states + " for an external machine", 2);
                this.queue.push([exports.STATE_CHANGE.SET, states, params, target]);
                return true;
            }
            else {
                return target.add(states, params);
            }
        }
        if (states) {
            params = [states].concat(params);
        }
        states = target;
        return this.processStateChange_(exports.STATE_CHANGE.SET, states, params);
    };
    AsyncMachine.prototype.setByCallback = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createCallback(this.createDeferred(this.set.bind(this), target, states, params));
    };
    AsyncMachine.prototype.setByListener = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createListener(this.createDeferred(this.set.bind(this), target, states, params));
    };
    AsyncMachine.prototype.setNext = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var fn = this.set.bind(this);
        return this.setImmediate(fn, target, states, params);
    };
    AsyncMachine.prototype.add = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued ADD state(s) " + states + " for an external machine", 2);
                this.queue.push([exports.STATE_CHANGE.ADD, states, params, target]);
                return true;
            }
            else {
                return target.add(states, params);
            }
        }
        if (states) {
            params = [states].concat(params);
        }
        states = target;
        return this.processStateChange_(exports.STATE_CHANGE.ADD, states, params);
    };
    AsyncMachine.prototype.addByCallback = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createCallback(this.createDeferred(this.add.bind(this), target, states, params));
    };
    AsyncMachine.prototype.addByListener = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createListener(this.createDeferred(this.add.bind(this), target, states, params));
    };
    AsyncMachine.prototype.addNext = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var fn = this.add.bind(this);
        return this.setImmediate(fn, target, states, params);
    };
    AsyncMachine.prototype.drop = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued DROP state(s) " + states + " for an external machine", 2);
                this.queue.push([exports.STATE_CHANGE.DROP, states, params, target]);
                return true;
            }
            else {
                return target.drop(states, params);
            }
        }
        if (states) {
            params = [states].concat(params);
        }
        states = target;
        return this.processStateChange_(exports.STATE_CHANGE.DROP, states, params);
    };
    AsyncMachine.prototype.dropByCallback = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createCallback(this.createDeferred(this.drop.bind(this), target, states, params));
    };
    AsyncMachine.prototype.dropByListener = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        return this.createListener(this.createDeferred(this.drop.bind(this), target, states, params));
    };
    AsyncMachine.prototype.dropNext = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var fn = this.drop.bind(this);
        return this.setImmediate(fn, target, states, params);
    };
    AsyncMachine.prototype.pipe = function (state, machine, target_state, local_queue) {
        var bindings = {
            state: "add",
            end: "drop"
        };
        return this.pipeBind(state, machine, target_state, local_queue, bindings);
    };
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
    AsyncMachine.prototype.pipeInverted = function (state, machine, target_state, local_queue) {
        var bindings = {
            state: "drop",
            end: "add"
        };
        return this.pipeBind(state, machine, target_state, local_queue, bindings);
    };
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
    AsyncMachine.prototype.pipeNegotiation = function (state, machine, target_state, local_queue) {
        var bindings = {
            enter: "add",
            exit: "drop"
        };
        return this.pipeBind(state, machine, target_state, local_queue, bindings);
    };
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
    AsyncMachine.prototype.pipeNegotiationInverted = function (state, machine, target_state, local_queue) {
        var bindings = {
            enter: "drop",
            exit: "add"
        };
        return this.pipeBind(state, machine, target_state, local_queue, bindings);
    };
    AsyncMachine.prototype.pipeOff = function () {
        throw new Error("not implemented yet");
    };
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
    AsyncMachine.prototype.clock = function (state) {
        return this.clock_[state];
    };
    /**
         * Creates a prototype child with dedicated active states, a clock and
         * a queue.
         *
         * Useful for creating new instances of dynamic classes (or factory created
         * instances)
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
    AsyncMachine.prototype.createChild = function () {
        var child = Object.create(this);
        var child_states_active = [];
        child.clock = {};
        child.queue = [];
        this.states_all.forEach(function (state) { return child.clock[state] = 0; });
        return child;
    };
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
    AsyncMachine.prototype.duringTransition = function () {
        return this.lock;
    };
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
    AsyncMachine.prototype.getAbort = function (state, abort) {
        var tick = this.clock(state);
        return this.getAbortFunction(state, tick, abort);
    };
    AsyncMachine.prototype.when = function (states, abort) {
        var _this = this;
        states = [].concat(states);
        return new promise.Promise(function (resolve, reject) { return _this.bindToStates(states, resolve, abort); });
    };
    AsyncMachine.prototype.whenOnce = function (states, abort) {
        var _this = this;
        states = [].concat(states);
        return new promise.Promise(function (resolve, reject) { return _this.bindToStates(states, resolve, abort, true); });
    };
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
    AsyncMachine.prototype.debug = function (prefix, level) {
        if (prefix === void 0) { prefix = ""; }
        if (level === void 0) { level = 1; }
        this.debug_ = true;
        this.debug_prefix = prefix;
        this.debug_level = level;
        return null;
    };
    AsyncMachine.prototype.debugOff = function () {
        this.debug_ = false;
        return null;
    };
    AsyncMachine.prototype.on = function (event, listener, context) {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            this.catchPromise(listener.call(context));
        }
        _super.prototype.on.call(this, event, listener, context);
        return this;
    };
    AsyncMachine.prototype.once = function (event, listener, context) {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            this.catchPromise(listener.call(context));
        }
        else {
            _super.prototype.once.call(this, event, listener, context);
        }
        return this;
    };
    AsyncMachine.prototype.catchPromise = function (promise, target_states) {
        var _this = this;
        if ((promise != null ? promise.then : void 0) && (promise != null ? promise["catch"] : void 0)) {
            promise["catch"](function (error) { return _this.add("Exception", error, target_states); });
        }
        return promise;
    };
    AsyncMachine.prototype.log = function (msg, level) {
        if (level == null) {
            level = 1;
        }
        if (!this.debug_) {
            return;
        }
        if (level > this.debug_level) {
            return;
        }
        return console.log(this.debug_prefix + msg);
    };
    AsyncMachine.prototype.pipeBind = function (state, machine, target_state, local_queue, bindings) {
        var _this = this;
        if (state instanceof AsyncMachine) {
            if (target_state == null) {
                target_state = true;
            }
            return this.pipeBind(this.states_all, state, machine, target_state, bindings);
        }
        if (local_queue == null) {
            local_queue = true;
        }
        this.log("Piping state " + state, 3);
        return [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            return Object.keys(bindings).forEach(function (event_type) {
                var method_name = bindings[event_type];
                return _this.on(state + "_" + event_type, function () {
                    if (local_queue) {
                        return _this[method_name](machine, new_state);
                    }
                    else {
                        return machine[method_name](new_state);
                    }
                });
            });
        });
    };
    AsyncMachine.prototype.callListener = function (listener, context, params) {
        var ret = listener.apply(context, params);
        return this.catchPromise(ret, params[0]);
    };
    AsyncMachine.prototype.getInstance = function () {
        return this;
    };
    AsyncMachine.prototype.setImmediate = function (fn) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (setImmediate) {
            return setImmediate.apply(null, [fn].concat(params));
        }
        else {
            return setTimeout(fn.apply(null, params), 0);
        }
    };
    AsyncMachine.prototype.processAutoStates = function (skip_queue) {
        var _this = this;
        var add = [];
        this.states_all.forEach(function (state) {
            var is_current = function () { return _this.is(state); };
            var is_blocked = function () { return _this.is().some(function (item) {
                if (!(_this.get(item)).blocks) {
                    return false;
                }
                return Boolean(~(_this.get(item)).blocks.indexOf(state));
            }); };
            if (_this[state].auto && !is_current() && !is_blocked()) {
                return add.push(state);
            }
        });
        return this.processStateChange_(exports.STATE_CHANGE.ADD, add, [], true, skip_queue);
    };
    AsyncMachine.prototype.hasStateChanged = function (states_before) {
        var length_equals = this.is().length === states_before.length;
        return !length_equals || Boolean(this.diffStates(states_before, this.is()).length);
    };
    AsyncMachine.prototype.processStateChange_ = function (type, states, params, autostate, skip_queue) {
        var _this = this;
        states = [].concat(states);
        states = states.filter(function (state) {
            if (typeof state !== "string" || !_this.get(state)) {
                throw new Error("Non existing state: " + state);
            }
            return true;
        });
        if (!states.length) {
            return;
        }
        try {
            var type_label = exports.STATE_CHANGE_LABELS[type].toLowerCase();
            if (this.lock) {
                this.log("Queued " + type_label + " state(s) " + (states.join(", ")), 2);
                this.queue.push([type, states, params]);
                return;
            }
            this.lock = true;
            var queue = this.queue;
            this.queue = [];
            var states_before = this.is();
            if (autostate) {
                this.log("[" + type_label + "] AUTO state " + (states.join(", ")), 3);
            }
            else {
                this.log("[" + type_label + "] state " + (states.join(", ")), 2);
            }
            var ret = this.selfTransitionExec_(states, params);
            if (ret !== false) {
                var states_to_set = (function () {
                    switch (type) {
                        case exports.STATE_CHANGE.DROP:
                            return this.states_active.filter(function (state) { return !~states.indexOf(state); });
                        case exports.STATE_CHANGE.ADD:
                            return states.concat(this.states_active);
                        case exports.STATE_CHANGE.SET:
                            return states;
                    }
                }).call(this);
                states_to_set = this.setupTargetStates_(states_to_set);
                if (type !== exports.STATE_CHANGE.DROP && !autostate) {
                    var states_accepted = states.every(function (state) { return ~states_to_set.indexOf(state); });
                    if (!states_accepted) {
                        this.log("Cancelled the transition, as not all target states were accepted", 3);
                        ret = false;
                    }
                }
            }
            if (ret !== false) {
                ret = this.transition_(states_to_set, states, params);
            }
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
        }
        catch (_error) {
            var err = _error;
            this.queue = queue;
            this.lock = false;
            this.add("Exception", err, states);
            return;
        }
        if (ret === false) {
            this.emit("cancelled");
        }
        else if ((this.hasStateChanged(states_before)) && !autostate) {
            this.processAutoStates(skip_queue);
        }
        if (!(skip_queue || this.duringTransition())) {
            this.processQueue_();
        }
        if (type === exports.STATE_CHANGE.DROP) {
            return this.allStatesNotSet(states);
        }
        else {
            return this.allStatesSet(states);
        }
    };
    AsyncMachine.prototype.processQueue_ = function () {
        var ret = [];
        var row = void 0;
        while (row = this.queue.shift()) {
            var target = row[exports.QUEUE.TARGET] || this;
            var params = [row[exports.QUEUE.STATE_CHANGE], row[exports.QUEUE.STATES], row[exports.QUEUE.PARAMS], false, target === this];
            ret.push(target.processStateChange_.apply(target, params));
        }
        return !~ret.indexOf(false);
    };
    AsyncMachine.prototype.allStatesSet = function (states) {
        var _this = this;
        return states.every(function (state) { return _this.is(state); });
    };
    AsyncMachine.prototype.allStatesNotSet = function (states) {
        var _this = this;
        return states.every(function (state) { return !_this.is(state); });
    };
    AsyncMachine.prototype.createDeferred = function (fn, target, states, state_params) {
        var _this = this;
        var transition_states = this.is();
        var params = [target];
        if (states) {
            params.push(states);
        }
        if (state_params.length) {
            params.push.apply(params, state_params);
        }
        var deferred = new Deferred;
        deferred.promise.then(function (callback_params) { return fn.apply(null, params.concat(callback_params)); })["catch"](function (err) {
            var async_states = [].concat(params[0] instanceof AsyncMachine ? params[1] : params[0]);
            return _this.add("Exception", err, transition_states, async_states);
        });
        this.last_promise = deferred.promise;
        return deferred;
    };
    AsyncMachine.prototype.createCallback = function (deferred) {
        return function (err) {
            if (err === void 0) { err = null; }
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (err) {
                return deferred.reject(err);
            }
            else {
                return deferred.resolve(params);
            }
        };
    };
    AsyncMachine.prototype.createListener = function (deferred) {
        return function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i - 0] = arguments[_i];
            }
            return deferred.resolve(params);
        };
    };
    AsyncMachine.prototype.selfTransitionExec_ = function (states, params) {
        var _this = this;
        if (params == null) {
            params = [];
        }
        var ret = states.some(function (state) {
            ret = void 0;
            var name = state + "_" + state;
            if (~_this.states_active.indexOf(state)) {
                var transition_params = [];
                transition_params = [states].concat(params);
                var context = _this.getMethodContext(name);
                if (context) {
                    _this.log("[transition] " + name, 2);
                    ret = context[name].apply(context, transition_params);
                    _this.catchPromise(ret, states);
                }
                else {
                    _this.log("[transition] " + name, 3);
                }
                if (ret === false) {
                    _this.log("Self transition for " + state + " cancelled", 2);
                    return true;
                }
                var a = _this.emit.apply(_this, [name].concat(transition_params));
                if (ret !== false) {
                    _this.transition_events.push([name, transition_params]);
                }
                return ret === false;
            }
        });
        return !ret;
    };
    AsyncMachine.prototype.setupTargetStates_ = function (states, exclude) {
        var _this = this;
        if (exclude == null) {
            exclude = [];
        }
        states = states.filter(function (name) {
            var ret = ~_this.states_all.indexOf(name);
            if (!ret) {
                _this.log("State " + name + " doesn't exist", 2);
            }
            return Boolean(ret);
        });
        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);
        var already_blocked = [];
        states = this.parseRequires_(states);
        states = states.reverse().filter(function (name) {
            var blocked_by = _this.isStateBlocked_(states, name);
            blocked_by = blocked_by.filter(function (blocker_name) { return !~already_blocked.indexOf(blocker_name); });
            if (blocked_by.length) {
                already_blocked.push(name);
                if (_this.is(name)) {
                    _this.log("State " + name + " dropped by " + (blocked_by.join(", ")), 2);
                }
                else {
                    _this.log("State " + name + " ignored because of " + (blocked_by.join(", ")), 3);
                }
            }
            return !blocked_by.length && !~exclude.indexOf(name);
        });
        return this.parseRequires_(states.reverse());
    };
    AsyncMachine.prototype.parseImplies_ = function (states) {
        var _this = this;
        states.forEach(function (name) {
            var state = _this.get(name);
            if (!state.implies) {
                return;
            }
            return states = states.concat(state.implies);
        });
        return states;
    };
    AsyncMachine.prototype.parseRequires_ = function (states) {
        var _this = this;
        var length_before = 0;
        var not_found_by_states = {};
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter(function (name) {
                var state = _this.get(name);
                var not_found = [];
                !(state.requires != null ? state.requires.forEach(function (req) {
                    var found = ~states.indexOf(req);
                    if (!found) {
                        return not_found.push(req);
                    }
                }) : void 0);
                if (not_found.length) {
                    not_found_by_states[name] = not_found;
                }
                return !not_found.length;
            });
        }
        if (Object.keys(not_found_by_states).length) {
            var state = "";
            var not_found = [];
            var names = (function () {
                var _results;
                _results = [];
                for (state in not_found_by_states) {
                    not_found = not_found_by_states[state];
                    _results.push(state + "(-" + (not_found.join(" -")) + ")");
                }
                return _results;
            })();
            this.log("Can't set the following states " + (names.join(", ")), 2);
        }
        return states;
    };
    AsyncMachine.prototype.removeDuplicateStates_ = function (states) {
        var states2 = [];
        states.forEach(function (name) {
            if (!~states2.indexOf(name)) {
                return states2.push(name);
            }
        });
        return states2;
    };
    AsyncMachine.prototype.isStateBlocked_ = function (states, name) {
        var _this = this;
        var blocked_by = [];
        states.forEach(function (name2) {
            var state = _this.get(name2);
            if (state.blocks && ~state.blocks.indexOf(name)) {
                return blocked_by.push(name2);
            }
        });
        return blocked_by;
    };
    AsyncMachine.prototype.transition_ = function (to, explicit_states, params) {
        var _this = this;
        if (params == null) {
            params = [];
        }
        this.transition_events = [];
        var from = this.states_active.filter(function (state) { return !~to.indexOf(state); });
        this.orderStates_(to);
        this.orderStates_(from);
        var ret = from.some(function (state) { return false === _this.transitionExit_(state, to, explicit_states, params); });
        if (ret === true) {
            return false;
        }
        ret = to.some(function (state) {
            if (~_this.states_active.indexOf(state)) {
                return false;
            }
            if (~explicit_states.indexOf(state)) {
                var transition_params = params;
            }
            else {
                transition_params = [];
            }
            ret = _this.transitionEnter_(state, to, transition_params);
            return ret === false;
        });
        if (ret === true) {
            return false;
        }
        this.setActiveStates_(to);
        return true;
    };
    AsyncMachine.prototype.setActiveStates_ = function (target) {
        var _this = this;
        var previous = this.states_active;
        var new_states = this.diffStates(target, this.states_active);
        var removed_states = this.diffStates(this.states_active, target);
        var nochange_states = this.diffStates(target, new_states);
        this.states_active = target;
        target.forEach(function (state) {
            if (!~previous.indexOf(state)) {
                return _this.clock_[state]++;
            }
        });
        var log_msg = [];
        if (new_states.length) {
            log_msg.push("+" + (new_states.join(" +")));
        }
        if (removed_states.length) {
            log_msg.push("-" + (removed_states.join(" -")));
        }
        if (nochange_states.length && this.debug_level > 2) {
            if (new_states.length || removed_states.length) {
                log_msg.push("\n    ");
            }
            log_msg.push(nochange_states.join(", "));
        }
        if (log_msg.length) {
            this.log("[states] " + (log_msg.join(" ")), 1);
        }
        this.processPostTransition();
        return this.emit("change", previous);
    };
    AsyncMachine.prototype.processPostTransition = function () {
        var _this = this;
        var _ref;
        this.transition_events.forEach(function (transition) {
            var name = transition[0];
            var params = transition[1];
            if (name.slice(-5) === "_exit") {
                var state = name.slice(0, -5);
                var method = state + "_end";
            }
            else if (name.slice(-6) === "_enter") {
                state = name.slice(0, -6);
                method = state + "_state";
            }
            var context = _this.getMethodContext(method);
            if (context) {
                _this.log("[transition] " + method, 2);
                try {
                    var ret = (_ref = context[method]) != null ? _ref.apply(context, params) : void 0;
                }
                catch (_error) {
                    var err = _error;
                    _this.drop(state);
                    throw err;
                }
                _this.catchPromise(ret, _this.is());
            }
            else {
                _this.log("[transition] " + method, 3);
            }
            return _this.emit.apply(_this, [method].concat(params));
        });
        return this.transition_events = [];
    };
    AsyncMachine.prototype.getMethodContext = function (name) {
        if (this.target[name]) {
            return this.target;
        }
        else if (this[name]) {
            return this;
        }
    };
    AsyncMachine.prototype.diffStates = function (states1, states2) {
        return states1.filter(function (name) { return __indexOf.call(states2, name) < 0; }).map(function (name) { return name; });
    };
    AsyncMachine.prototype.transitionExit_ = function (from, to, explicit_states, params) {
        var _this = this;
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
        ret = to.some(function (state) {
            var transition = from + "_" + state;
            if (~explicit_states.indexOf(state)) {
                transition_params = params;
            }
            if (transition_params == null) {
                transition_params = [];
            }
            ret = _this.transitionExec_(transition, to, transition_params);
            return ret === false;
        });
        if (ret === true) {
            return false;
        }
        ret = (this.transitionExec_(from + "_any", to)) === false;
        return !ret;
    };
    AsyncMachine.prototype.transitionEnter_ = function (to, target_states, params) {
        var ret = this.transitionExec_("any_" + to, target_states, params);
        if (ret === false) {
            return false;
        }
        return this.transitionExec_(to + "_enter", target_states, params);
    };
    AsyncMachine.prototype.transitionExec_ = function (method, target_states, params) {
        var _ref;
        if (params == null) {
            params = [];
        }
        var transition_params = [];
        transition_params = [target_states].concat(params);
        var ret = void 0;
        var context = this.getMethodContext(method);
        if (context) {
            this.log("[transition] " + method, 2);
            ret = (_ref = context[method]) != null ? typeof _ref.apply === "function" ? _ref.apply(context, transition_params) : void 0 : void 0;
            this.catchPromise(ret, target_states);
        }
        else {
            this.log("[transition] " + method, 3);
        }
        if (ret !== false) {
            var is_exit = method.slice(-5) === "_exit";
            var is_enter = !is_exit && method.slice(-6) === "_enter";
            if (is_exit || is_enter) {
                this.transition_events.push([method, transition_params]);
            }
            ret = this.emit.apply(this, [method].concat(transition_params));
            if (ret === false) {
                this.log(("Cancelled transition to " + (target_states.join(", ")) + " by ") + ("the event " + method), 2);
            }
        }
        else {
            this.log(("Cancelled transition to " + (target_states.join(", ")) + " by ") + ("the method " + method), 2);
        }
        return ret;
    };
    AsyncMachine.prototype.orderStates_ = function (states) {
        var _this = this;
        states.sort(function (e1, e2) {
            var state1 = _this.get(e1);
            var state2 = _this.get(e2);
            var ret = 0;
            if (state1.depends && ~state1.depends.indexOf(e2)) {
                ret = 1;
            }
            else {
                if (state2.depends && ~state2.depends.indexOf(e1)) {
                    ret = -1;
                }
            }
            return ret;
        });
        return null;
    };
    AsyncMachine.prototype.bindToStates = function (states, listener, abort, once) {
        var _this = this;
        var fired = 0;
        var enter = function () {
            fired += 1;
            if (!(typeof abort === "function" ? abort() : void 0) && fired === states.length) {
                listener();
            }
            if (once || (typeof abort === "function" ? abort() : void 0)) {
                return states.map(function (state) {
                    _this.removeListener(state + "_state", enter);
                    return _this.removeListener(state + "_end", exit);
                });
            }
        };
        function exit() {
            return fired -= 1;
        }
        return states.map(function (state) {
            _this.log("Binding to event " + state, 3);
            _this.on(state + "_state", enter);
            return _this.on(state + "_end", exit);
        });
    };
    AsyncMachine.prototype.getAbortFunction = function (state, tick, abort) {
        var _this = this;
        return function () {
            if (typeof abort === "function" ? abort() : void 0) {
                return true;
            }
            else if (!_this.is(state)) {
                _this.log(("Aborted " + state + " listener as the state is not set. ") + ("Current states:\n    (" + (_this.is().join(", ")) + ")"), 1);
                return true;
            }
            else if (!_this.is(state, tick)) {
                _this.log(("Aborted " + state + " listener as the tick changed. Current states:") + ("\n    (" + (_this.is().join(", ")) + ")"), 1);
                return true;
            }
            return false;
        };
    };
    return AsyncMachine;
})(eventemitter.EventEmitter);
exports.AsyncMachine = AsyncMachine;
module.exports.AsyncMachine = AsyncMachine;
//# sourceMappingURL=asyncmachine.js.map