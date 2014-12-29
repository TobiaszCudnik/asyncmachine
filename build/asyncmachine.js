var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../d.ts/settimeout.d.ts" />
/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/commonjs.d.ts" />
var __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item)
            return i;
    }
    return -1;
};
var lucidjs = require("lucidjs");
var rsvp = require("rsvp");
exports.Promise = rsvp.Promise;
require("es5-shim");
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
exports.QUEUE = {
    STATE_CHANGE: 0,
    STATES: 1,
    PARAMS: 2,
    TARGET: 3
};
var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
    function AsyncMachine(config) {
        if (config === void 0) { config = {}; }
        _super.call(this);
        this.config = config;
        this.states_all = null;
        this.states_active = null;
        this.queue = null;
        this.lock = false;
        this.last_promise = null;
        this.log_handler_ = null;
        this.debug_prefix = "";
        this.debug_level = 1;
        this.clock_ = {};
        this.internal_fields = [];
        this.target = null;
        this.transition_events = [];
        this.debug_ = false;
        this.Exception = {};
        this.debug_ = !!config.debug;
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};
        this.setTarget(this);
        this.register("Exception");
        this.internal_fields = ["_listeners", "_eventEmitters", "_flags", "source", "event", "cancelBubble", "config", "states_all", "states_active", "queue", "lock", "last_promise", "log_handler_", "debug_prefix", "debug_level", "clock_", "debug_", "target", "internal_fields"];
    }
    AsyncMachine.prototype.Exception_enter = function (states, err, exception_states) {
        if (exception_states != null ? exception_states.length : void 0) {
            this.log("Exception when tried to set the following states: " + exception_states.join(", "));
        }
        this.setImmediate(function () {
            throw err;
        });
        return true;
    };
    AsyncMachine.prototype.setTarget = function (target) {
        return this.target = target;
    };
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
        var constructor = this.constructor.prototype;
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
            return this.states_active;
        }
        var active = !!~this.states_active.indexOf(state);
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
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i - 0] = arguments[_i];
        }
        return names.some(function (name) {
            if (Array.isArray(name)) {
                return _this.every(name);
            }
            else {
                return _this.is(name);
            }
        });
    };
    AsyncMachine.prototype.every = function () {
        var _this = this;
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i - 0] = arguments[_i];
        }
        return names.every(function (name) { return !!~_this.states_active.indexOf(name); });
    };
    AsyncMachine.prototype.futureQueue = function () {
        return this.queue;
    };
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
    AsyncMachine.prototype.get = function (state) {
        return this[state];
    };
    AsyncMachine.prototype.set = function (states) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return this.processStateChange_(exports.STATE_CHANGE.SET, states, params);
    };
    AsyncMachine.prototype.setLater = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            try {
                return _this.processStateChange_(exports.STATE_CHANGE.SET, states, params);
            }
            catch (_error) {
                var err = _error;
                return _this.set("Exception", err, states);
            }
        });
        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };
    AsyncMachine.prototype.add = function (target, states) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.queue.push([exports.STATE_CHANGE.ADD, states, params, target]);
                return true;
            }
            else {
                return target.add(states, params);
            }
        }
        states = target;
        params = [states].concat(params);
        return this.processStateChange_(exports.STATE_CHANGE.ADD, states, params);
    };
    AsyncMachine.prototype.addByCallback = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            try {
                return _this.processStateChange_(exports.STATE_CHANGE.ADD, states, params);
            }
            catch (_error) {
                var err = _error;
                return _this.add("Exception", err, states);
            }
        });
        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };
    AsyncMachine.prototype.addByListener = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (listener_params) {
            params.push.apply(params, listener_params);
            try {
                return _this.processStateChange_(exports.STATE_CHANGE.ADD, states, params);
            }
            catch (_error) {
                var err = _error;
                return _this.add("Exception", err, states);
            }
        });
        this.last_promise = deferred.promise;
        return this.createListener(deferred);
    };
    AsyncMachine.prototype.addNext = function (states) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        var fn = this.processStateChange_.bind(this, exports.STATE_CHANGE.ADD);
        return this.setImmediate(fn, states, params);
    };
    AsyncMachine.prototype.addLater = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        return this.addByCallback.apply(this, params);
    };
    AsyncMachine.prototype.drop = function (states) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return this.processStateChange_(exports.STATE_CHANGE.DROP, states, params);
    };
    AsyncMachine.prototype.dropLater = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            try {
                return _this.processStateChange_(exports.STATE_CHANGE.DROP, states, params);
            }
            catch (_error) {
                var err = _error;
                return _this.drop("Exception", err, states);
            }
        });
        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };
    AsyncMachine.prototype.pipeForward = function (state, machine, target_state) {
        var _this = this;
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }
        this.log("Piping state " + state, 3);
        return [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            var namespace = _this.namespaceName(state);
            _this.on(namespace, function () { return _this.add(machine, new_state); });
            return _this.on(namespace + ".end", function () {
                return this.drop(machine, new_state);
            });
        });
    };
    AsyncMachine.prototype.pipeInvert = function (state, machine, target_state) {
        var _this = this;
        throw new Error("not implemented yet");
        return [].concat(state).forEach(function (state) {
            state = _this.namespaceName(state);
            _this.on(state + ".enter", function () { return machine.drop(target_state); });
            return _this.on(state + ".exit", function () { return machine.add(target_state); });
        });
    };
    AsyncMachine.prototype.pipeOff = function () {
        throw new Error("not implemented yet");
    };
    AsyncMachine.prototype.clock = function (state) {
        return this.clock_[state];
    };
    AsyncMachine.prototype.createChild = function () {
        var child = Object.create(this);
        child.states_active = [];
        child.clock = {};
        this.states_all.forEach(function (state) { return child.clock[state] = 0; });
        return child;
    };
    AsyncMachine.prototype.duringTransition = function () {
        return this.lock;
    };
    AsyncMachine.prototype.continueEnter = function (state, func) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (!_this.is(state, tick + 1)) {
                return;
            }
            return func();
        };
    };
    AsyncMachine.prototype.continueState = function (state, func) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (!_this.is(state, tick)) {
                return;
            }
            return func();
        };
    };
    AsyncMachine.prototype.getAbort = function (state, interrupt) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (interrupt && !interrupt()) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !_this.is(state, tick);
            }
            if (should_abort) {
                return _this.log("Aborted " + state + " listener, while in states (" + (_this.is().join(", ")) + ")", 1);
            }
        };
    };
    AsyncMachine.prototype.getAbortEnter = function (state, interrupt) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (interrupt && !interrupt()) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !_this.is(state, tick + 1);
            }
            if (should_abort) {
                return _this.log(("Aborted " + state + ".enter listener, while in states ") + ("(" + (_this.is().join(", ")) + ")"), 1);
            }
        };
    };
    AsyncMachine.prototype.when = function (states, abort) {
        var _this = this;
        states = [].concat(states);
        return new rsvp.Promise(function (resolve, reject) { return _this.bindToStates(states, resolve, abort); });
    };
    AsyncMachine.prototype.whenOnce = function (states, abort) {
        var _this = this;
        states = [].concat(states);
        return new rsvp.Promise(function (resolve, reject) { return _this.bindToStates(states, resolve, abort, true); });
    };
    AsyncMachine.prototype.debug = function (prefix, level, handler) {
        if (prefix === void 0) { prefix = ""; }
        if (level === void 0) { level = 1; }
        if (handler === void 0) { handler = null; }
        this.debug_ = !this.debug_;
        this.debug_prefix = prefix;
        this.debug_level = level;
        return null;
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
    AsyncMachine.prototype.namespaceName = function (state) {
        return state.replace(/([a-zA-Z])([A-Z])/g, "$1.$2");
    };
    AsyncMachine.prototype.setImmediate = function (fn) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (setImmediate) {
            return setImmediate(fn.apply(null, params));
        }
        else {
            return setTimeout(fn.apply(null, params), 0);
        }
    };
    AsyncMachine.prototype.processAutoStates = function (excluded) {
        var _this = this;
        if (excluded == null) {
            excluded = [];
        }
        var add = [];
        this.states_all.forEach(function (state) {
            var is_excluded = function () { return ~excluded.indexOf(state); };
            var is_current = function () { return _this.is(state); };
            var is_blocked = function () { return _this.is().some(function (item) {
                if (!(_this.get(item)).blocks) {
                    return false;
                }
                return Boolean(~(_this.get(item)).blocks.indexOf(state));
            }); };
            if (_this[state].auto && !is_excluded() && !is_current() && !is_blocked()) {
                return add.push(state);
            }
        });
        return this.processStateChange_(exports.STATE_CHANGE.ADD, add, [], true);
    };
    AsyncMachine.prototype.statesChanged = function (states_before) {
        var length_equals = this.is().length === states_before.length;
        return !length_equals || this.diffStates(states_before, this.is()).length;
    };
    AsyncMachine.prototype.processStateChange_ = function (type, states, params, autostate, skip_queue) {
        states = [].concat(states);
        if (!states.length) {
            return;
        }
        try {
            if (this.lock) {
                this.queue.push([type, states, params]);
                return;
            }
            this.lock = true;
            var states_before = this.is();
            var type_label = exports.STATE_CHANGE_LABELS[type];
            if (autostate) {
                this.log("[" + type_label + "] AUTO state " + (states.join(", ")), 3);
            }
            else {
                this.log("[" + type_label + "] state " + (states.join(", ")), 2);
            }
            var ret = this.selfTransitionExec_(states, params);
            if (ret === false) {
                return false;
            }
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
            if (type !== exports.STATE_CHANGE.DROP) {
                var states_accepted = states_to_set.some(function (state) { return ~states.indexOf(state); });
                if (!states_accepted) {
                    this.log("Transition cancelled, as target states weren't accepted", 3);
                    return this.lock = false;
                }
            }
            var queue = this.queue;
            this.queue = [];
            ret = this.transition_(states_to_set, states, params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
        }
        catch (_error) {
            var err = _error;
            this.lock = false;
            this.add("Exception", err, states);
            throw err;
        }
        if (this.statesChanged(states_before)) {
            this.processAutoStates(states_before);
        }
        if (!skip_queue) {
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
            var params = [row[exports.QUEUE.STATE_CHANGE], row[exports.QUEUE.STATES], row[exports.QUEUE.PARAMS], false, true];
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
    AsyncMachine.prototype.createCallback = function (deferred) {
        var _this = this;
        return function (err) {
            if (err === void 0) { err = null; }
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (err) {
                _this.add("Exception", err);
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
    AsyncMachine.prototype.namespaceTransition_ = function (transition) {
        return this.namespaceName(transition).replace(/_(exit|enter)$/, ".$1").replace("_", "._.");
    };
    AsyncMachine.prototype.selfTransitionExec_ = function (states, params) {
        var _this = this;
        if (params == null) {
            params = [];
        }
        var ret = states.some(function (state) {
            ret = void 0;
            var name = state + "_" + state;
            var method = _this.target[name];
            var context = _this.target;
            if (!method && _this[name]) {
                context = _this;
            }
            if (method && ~_this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                ret = method.apply(context, transition_params);
                if (ret === false) {
                    return true;
                }
                var event = _this.namespaceTransition_(name);
                _this.transition_events.push(event);
                var transition_params2 = [event, states].concat(params);
                return (_this.trigger.apply(_this, transition_params2)) === false;
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
                var ret = !(state.requires != null ? state.requires.some(function (req) {
                    var found = ~states.indexOf(req);
                    if (!found) {
                        not_found.push(req);
                    }
                    return !found;
                }) : void 0);
                if (not_found.length) {
                    not_found_by_states[name] = not_found;
                }
                return ret;
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
                    _results.push(state + "(-" + (not_found.join("-")) + ")");
                }
                return _results;
            })();
            this.log("Can't set following states " + (names.join(", ")) + " ", 2);
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
        if (!to.length) {
            return true;
        }
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
        var _base, _base1, _name, _name1;
        var previous = this.states_active;
        var all = this.states_all;
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
        if (nochange_states.length && this.config.debug > 1) {
            if (new_states.length || removed_states.length) {
                log_msg.push("\n    ");
            }
            log_msg.push(nochange_states.join(", "));
        }
        if (log_msg.length) {
            this.log("[states] " + (log_msg.join(" ")), 1);
        }
        this.transition_events.forEach(function (transition) {
            if (transition.slice(-5) === ".exit") {
                var event = transition.slice(0, -5);
                var state = event.replace(/\./g, "");
                _this.unflag(event);
                _this.flag(event + ".end");
                _this.trigger(event + ".end");
                _this.log("[flag] " + event + ".end", 2);
                return typeof (_base = _this.target)[_name = state + "_end"] === "function" ? _base[_name](previous) : void 0;
            }
            else if (transition.slice(-6) === ".enter") {
                event = transition.slice(0, -6);
                state = event.replace(/\./g, "");
                _this.unflag(event + ".end");
                _this.flag(event);
                _this.trigger(event);
                _this.log("[flag] " + event, 2);
                return typeof (_base1 = _this.target)[_name1 = state + "_state"] === "function" ? _base1[_name1](previous) : void 0;
            }
        });
        return this.transition_events = [];
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
        var transition = "exit." + this.namespaceName(from);
        ret = this.transitionExec_(transition, to, transition_params);
        if (ret === false) {
            return false;
        }
        ret = to.some(function (state) {
            transition = from + "_" + state;
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
        ret = this.transitionExec_(to + "_enter", target_states, params);
        if (ret === false) {
            return false;
        }
        var event_args = ["enter." + (this.namespaceName(to)), target_states];
        ret = this.trigger.apply(this, event_args.concat(params));
        return ret;
    };
    AsyncMachine.prototype.transitionExec_ = function (method, target_states, params) {
        var _ref, _ref1;
        if (params == null) {
            params = [];
        }
        var transition_params = [target_states].concat(params);
        var ret = void 0;
        var event = this.namespaceTransition_(method);
        this.log("[event] " + event, 3);
        if (this.target[method] instanceof Function) {
            ret = (_ref = this.target[method]) != null ? typeof _ref.apply === "function" ? _ref.apply(this.target, transition_params) : void 0 : void 0;
        }
        else if (this[method] instanceof Function) {
            ret = (_ref1 = this[method]) != null ? typeof _ref1.apply === "function" ? _ref1.apply(this, transition_params) : void 0 : void 0;
        }
        if (ret !== false) {
            if (!~event.indexOf("_")) {
                this.transition_events.push(event);
                if (event.slice(-5) === ".exit") {
                    this.unflag(event.slice(0, -5) + ".enter");
                }
                else if (event.slice(-6) === ".enter") {
                    this.unflag(event.slice(0, -6) + ".exit");
                }
                this.log("[flag] " + event, 3);
                this.flag(event);
            }
            ret = this.trigger(event, transition_params);
            if (ret === false) {
                this.log("Transition event " + event + " cancelled", 2);
            }
        }
        if (ret === false) {
            this.log("Transition method " + method + " cancelled", 2);
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
            if (!(typeof abort === "function" ? abort() : void 0)) {
                if (fired === states.length) {
                    listener();
                }
            }
            if (once || (typeof abort === "function" ? abort() : void 0)) {
                return states.map(function (state) {
                    _this.removeListener(state, enter);
                    return _this.removeListener(state + ".end", exit);
                });
            }
        };
        function exit() {
            return fired -= 1;
        }
        return states.map(function (state) {
            var event = _this.namespaceName(state);
            _this.log("Binding to event " + event, 3);
            _this.on(event, enter);
            return _this.on(event + ".end", exit);
        });
    };
    return AsyncMachine;
})(lucidjs.EventEmitter);
exports.AsyncMachine = AsyncMachine;
module.exports.AsyncMachine = AsyncMachine;
//# sourceMappingURL=asyncmachine.js.map