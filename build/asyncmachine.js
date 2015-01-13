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
var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
    function AsyncMachine(target) {
        _super.call(this);
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
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};
        this.setTarget(target || this);
        this.register("Exception");
        this.internal_fields = ["_events", "states_all", "states_active", "queue", "lock", "last_promise", "log_handler_", "debug_prefix", "debug_level", "clock_", "debug_", "target", "internal_fields"];
    }
    AsyncMachine.prototype.Exception_state = function (states, err, exception_states) {
        if (exception_states.length != null) {
            this.log("Exception when tried to set following states: " + exception_states.join(", "));
        }
        return this.setImmediate(function () {
            throw err;
        });
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
        params = [states].concat(params);
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
        params = [states].concat(params);
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
        params = [states].concat(params);
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
    AsyncMachine.prototype.pipeForward = function (state, machine, target_state) {
        var _this = this;
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }
        this.log("Piping state " + state, 3);
        return [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            _this.on(state + "_state", function () { return _this.add(machine, new_state); });
            return _this.on(state + "_end", function () { return _this.drop(machine, new_state); });
        });
    };
    AsyncMachine.prototype.pipeInvert = function (state, machine, target_state) {
        var _this = this;
        if (state instanceof AsyncMachine) {
            return this.pipeInvert(this.states_all, state, machine);
        }
        this.log("Piping inverted state " + state, 3);
        return [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            _this.on(state + "_state", function () { return _this.drop(machine, new_state); });
            return _this.on(state + "_end", function () { return _this.add(machine, new_state); });
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
        var child_states_active = [];
        child.clock = {};
        this.states_all.forEach(function (state) { return child.clock[state] = 0; });
        return child;
    };
    AsyncMachine.prototype.duringTransition = function () {
        return this.lock;
    };
    AsyncMachine.prototype.getAbort = function (state, abort) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (abort && !(typeof abort === "function" ? abort() : void 0)) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !_this.is(state, tick);
            }
            if (should_abort) {
                _this.log("Aborted " + state + " listener, while in states (" + (_this.is().join(", ")) + ")", 1);
            }
            return should_abort;
        };
    };
    AsyncMachine.prototype.getAbortEnter = function (state, abort) {
        var _this = this;
        var tick = this.clock(state);
        return function () {
            if (abort && !(typeof abort === "function" ? abort() : void 0)) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !_this.is(state, tick + 1);
            }
            if (should_abort) {
                _this.log(("Aborted " + state + "_enter listener, while in states ") + ("(" + (_this.is().join(", ")) + ")"), 1);
            }
            return should_abort;
        };
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
    AsyncMachine.prototype.on = function (event, listener, context) {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            listener.call(context);
        }
        return _super.prototype.on.call(this, event, listener, context);
    };
    AsyncMachine.prototype.once = function (event, listener, context) {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            return listener.call(context);
        }
        else {
            return _super.prototype.once.call(this, event, listener, context);
        }
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
        return !length_equals || this.diffStates(states_before, this.is()).length;
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
        else if (this.hasStateChanged(states_before)) {
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
        var deferred = new Deferred;
        deferred.promise.then(function (callback_params) {
            var params = [target];
            if (states) {
                params.push(states);
            }
            if (state_params.length) {
                params.push.apply(params, state_params);
            }
            return fn.apply(null, params.concat(callback_params));
        });
        this.last_promise = deferred.promise;
        return deferred;
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
    AsyncMachine.prototype.selfTransitionExec_ = function (states, params) {
        var _this = this;
        if (params == null) {
            params = [];
        }
        var ret = states.some(function (state) {
            ret = void 0;
            var name = state + "_" + state;
            if (~_this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                var context = _this.getMethodContext(name);
                if (context) {
                    _this.log("[transition] " + name, 2);
                    ret = context[name].apply(context, transition_params);
                }
                else {
                    _this.log("[transition] " + name, 3);
                }
                if (ret === false) {
                    _this.log("Self transition for " + state + " cancelled", 2);
                    return true;
                }
                ret = _this.emit.apply(_this, [name].concat(params));
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
            this.log("Can't set following states " + (names.join(", ")), 2);
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
                _this.log("[transition] " + state + "_end", 2);
                if ((_ref = context[method]) != null) {
                    _ref.apply(context, params);
                }
            }
            else {
                _this.log("[transition] " + state + "_end", 3);
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
        var transition_params = [target_states].concat(params);
        var ret = void 0;
        var context = this.getMethodContext(method);
        if (context) {
            this.log("[transition] " + method, 2);
            ret = (_ref = context[method]) != null ? typeof _ref.apply === "function" ? _ref.apply(context, transition_params) : void 0 : void 0;
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
            ret = this.emit(method, transition_params);
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
    return AsyncMachine;
})(eventemitter.EventEmitter);
exports.AsyncMachine = AsyncMachine;
module.exports.AsyncMachine = AsyncMachine;
//# sourceMappingURL=asyncmachine.js.map