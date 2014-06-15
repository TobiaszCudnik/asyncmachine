/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/commonjs.d.ts" />
"TODO:\n- queue enum\n- log enum";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var lucidjs = require("lucidjs");
var rsvp = require("rsvp");
exports.Promise = rsvp.Promise;
require("es5-shim");

var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
    function AsyncMachine(config) {
        if (typeof config === "undefined") { config = {}; }
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
        this.clock_ = null;
        this.debug_ = false;
        this.debug_ = !!config.debug;
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};
    }
    AsyncMachine.prototype.register = function () {
        var _this = this;
        var states = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            states[_i] = arguments[_i + 0];
        }
        return states.map(function (state) {
            _this.states_all.push(state);
            return _this.clock[state] = 0;
        });
    };

    AsyncMachine.prototype.get = function (state) {
        return this[state];
    };

    AsyncMachine.prototype.is = function (state) {
        if (!state) {
            return this.states_active;
        }
        return !!~this.states_active.indexOf(state);
    };

    AsyncMachine.prototype.any = function () {
        var _this = this;
        var names = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            names[_i] = arguments[_i + 0];
        }
        return names.some(function (name) {
            if (Array.isArray(name)) {
                return _this.every(name);
            } else {
                return _this.is(name);
            }
        });
    };

    AsyncMachine.prototype.every = function () {
        var _this = this;
        var names = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            names[_i] = arguments[_i + 0];
        }
        return names.every(function (name) {
            return !!~_this.states_active.indexOf(name);
        });
    };

    AsyncMachine.prototype.set = function (states) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        return this.setState_(states, params);
    };

    AsyncMachine.prototype.setLater = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            return _this.setState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };

    AsyncMachine.prototype.add = function (states) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        return this.addState_(states, params);
    };

    AsyncMachine.prototype.addLater = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            return _this.addState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };

    AsyncMachine.prototype.drop = function (states) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        return this.dropState_(states, params);
    };

    AsyncMachine.prototype.dropLater = function (states) {
        var _this = this;
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        var deferred = rsvp.defer();
        deferred.promise.then(function (callback_params) {
            params.push.apply(params, callback_params);
            return _this.dropState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    };

    AsyncMachine.prototype.pipeForward = function (state, machine, target_state) {
        var _this = this;
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }
        return [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            var namespace = _this.namespaceName(state);

            _this.on(namespace + ".enter", function () {
                return machine.add(new_state);
            });

            return _this.on(namespace + ".exit", function () {
                return machine.drop(new_state);
            });
        });
    };

    AsyncMachine.prototype.createChild = function () {
        var child = Object.create(this);
        child.states_active = [];
        child.clock = {};
        this.states_all.forEach(function (state) {
            return child.clock[state] = 0;
        });
        return child;
    };

    AsyncMachine.prototype.clock = function (state) {
        return this.clock[state];
    };

    AsyncMachine.prototype.pipeInvert = function (state, machine, target_state) {
        state = this.namespaceName(state);
        this.on(state + ".enter", function () {
            return machine.drop(target_state);
        });

        return this.on(state + ".exit", function () {
            return machine.add(target_state);
        });
    };

    AsyncMachine.prototype.pipeOff = function () {
        throw new Error("not implemented yet");
    };

    AsyncMachine.prototype.duringTransition = function () {
        return this.lock;
    };

    AsyncMachine.prototype.namespaceName = function (state) {
        return state.replace(/([a-zA-Z])([A-Z])/g, "$1.$2");
    };

    AsyncMachine.prototype.debug = function (prefix, level, handler) {
        if (typeof prefix === "undefined") { prefix = ""; }
        if (typeof level === "undefined") { level = 1; }
        if (typeof handler === "undefined") { handler = null; }
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

    AsyncMachine.prototype.processAutoStates = function (excluded) {
        var _this = this;
        if (excluded == null) {
            excluded = [];
        }
        var add = [];
        this.states_all.forEach(function (state) {
            var is_excluded = ~excluded.indexOf(state);
            var is_current = _this.is(state);
            if (_this[state].auto && !is_excluded && !is_current) {
                return add.push(state);
            }
        });

        return this.add(add);
    };

    AsyncMachine.prototype.setState_ = function (states, params) {
        var _this = this;
        var states_to_set = [].concat(states);
        states_to_set.forEach(function (state) {
            if (!~_this.states_all.indexOf(state)) {
                throw new Error("Can't set a non-existing state " + state);
            }
        });
        if (!states_to_set.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([2, states_to_set, params]);
            return;
        }
        this.lock = true;
        this.log("[=] Set state " + (states_to_set.join(", ")), 1);
        var states_before = this.is();
        var ret = this.selfTransitionExec_(states_to_set, params);
        if (ret === false) {
            return false;
        }
        states = this.setupTargetStates_(states_to_set);
        var states_to_set_valid = states_to_set.some(function (state) {
            return !!~states.indexOf(state);
        });

        if (!states_to_set_valid) {
            this.log("Transition cancelled, as target states weren't accepted", 2);
            return this.lock = false;
        }
        var queue = this.queue;
        this.queue = [];
        ret = this.transition_(states, states_to_set, params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);
        var length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        if (!ret) {
            return false;
        }
        return this.allStatesSet(states_to_set);
    };

    AsyncMachine.prototype.addState_ = function (states, params) {
        var states_to_add = [].concat(states);
        if (!states_to_add.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([1, states_to_add, params]);
            return;
        }
        this.lock = true;
        this.log("[+] Add state " + (states_to_add.join(", ")), 1);
        var states_before = this.is();
        var ret = this.selfTransitionExec_(states_to_add, params);
        if (ret === false) {
            return false;
        }
        states = states_to_add.concat(this.states_active);
        states = this.setupTargetStates_(states);
        var states_to_add_valid = states_to_add.some(function (state) {
            return !!~states.indexOf(state);
        });

        if (!states_to_add_valid) {
            this.log("Transition cancelled, as target states weren't accepted", 2);
            return this.lock = false;
        }

        var queue = this.queue;
        this.queue = [];
        ret = this.transition_(states, states_to_add, params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);
        var length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        if (ret === false) {
            return false;
        } else {
            return this.allStatesSet(states_to_add);
        }
    };

    AsyncMachine.prototype.dropState_ = function (states, params) {
        var states_to_drop = [].concat(states);
        if (!states_to_drop.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([0, states_to_drop, params]);
            return;
        }
        this.lock = true;
        this.log("[-] Drop state " + (states_to_drop.join(", ")), 1);
        var states_before = this.is();
        states = this.states_active.filter(function (state) {
            return !~states_to_drop.indexOf(state);
        });
        states = this.setupTargetStates_(states);
        var queue = this.queue;
        this.queue = [];
        var ret = this.transition_(states, states_to_drop, params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);
        var length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        return ret === false || this.allStatesNotSet(states_to_drop);
    };

    AsyncMachine.prototype.processQueue_ = function (previous_ret) {
        if (previous_ret === false) {
            this.queue = [];
            return false;
        }
        var ret = [];
        var row = void 0;
        while (row = this.queue.shift()) {
            switch (row[0]) {
                case 0:
                    ret.push(this.drop(row[1], row[2], row[3]));
                    break;
                case 1:
                    ret.push(this.add(row[1], row[2], row[3]));
                    break;
                case 2:
                    ret.push(this.set(row[1], row[2], row[3]));
                    break;
            }
        }
        return !~ret.indexOf(false);
    };

    AsyncMachine.prototype.allStatesSet = function (states) {
        return states.every(this.is.bind(this));
    };

    AsyncMachine.prototype.allStatesNotSet = function (states) {
        var _this = this;
        return states.every(function (state) {
            return !_this.is(state);
        });
    };

    AsyncMachine.prototype.createCallback = function (deferred) {
        return function (err) {
            if (typeof err === "undefined") { err = null; }
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            if (err) {
                return deferred.reject(err);
            } else {
                return deferred.resolve(params);
            }
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
            var method = _this[name];
            if (method && ~_this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                ret = method.apply(_this, transition_params);
                if (ret === false) {
                    return true;
                }
                var event = _this.namespaceTransition_(name);
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
            return !!ret;
        });

        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);
        var already_blocked = [];
        states = states.reverse().filter(function (name) {
            var blocked_by = _this.isStateBlocked_(states, name);
            blocked_by = blocked_by.filter(function (blocker_name) {
                return !~already_blocked.indexOf(blocker_name);
            });

            if (blocked_by.length) {
                already_blocked.push(name);
                var log_level = 3;
                if (_this.is(name)) {
                    log_level = 2;
                }
                _this.log("State " + name + " removed by " + (blocked_by.join(", ")), log_level);
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
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter(function (name) {
                var state = _this.get(name);
                return !(state.requires != null ? state.requires.some(function (req) {
                    var found = ~states.indexOf(req);
                    if (!found) {
                        _this.log(("State " + name + " dropped as required state " + req + " ") + "is missing", 2);
                    }
                    return !found;
                }) : void 0);
            });
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
        var from = this.states_active.filter(function (state) {
            return !~to.indexOf(state);
        });

        this.orderStates_(to);
        this.orderStates_(from);

        var ret = from.some(function (state) {
            return false === _this.transitionExit_(state, to, explicit_states, params);
        });

        if (ret === true) {
            return false;
        }
        ret = to.some(function (state) {
            if (~_this.states_active.indexOf(state)) {
                return false;
            }
            if (~explicit_states.indexOf(state)) {
                var transition_params = params;
            } else {
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
        var all = this.states_all;
        this.states_active = target;
        target.forEach(function (state) {
            if (!~previous.indexOf(state)) {
                return _this.clock[state]++;
            }
        });
        return all.forEach(function (state) {
            if (~target.indexOf(state)) {
                return _this.unflag(state + ".exit");
            } else {
                return _this.unflag(state + ".enter");
            }
        });
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
        var _ref;
        if (params == null) {
            params = [];
        }
        var transition_params = [target_states].concat(params);
        var ret = void 0;
        var event = this.namespaceTransition_(method);
        this.log("[event] " + event, 3);
        if (this[method] instanceof Function) {
            ret = (_ref = this[method]) != null ? typeof _ref.apply === "function" ? _ref.apply(this, transition_params) : void 0 : void 0;
        }

        if (ret !== false) {
            if (!~event.indexOf("_")) {
                if (event.slice(-5) === ".exit") {
                    this.log("[unflag] " + event.slice(0, -5) + ".enter", 3);
                    this.unflag(event.slice(0, -5) + ".enter");
                } else if (event.slice(-5, -1) === ".enter") {
                    this.log("[unflag] " + event.slice(0, -5) + ".exit", 3);
                    this.unflag(event.slice(0, -5) + ".exit");
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
            } else {
                if (state2.depends && ~state2.depends.indexOf(e1)) {
                    ret = -1;
                }
            }
            return ret;
        });
        return null;
    };
    return AsyncMachine;
})(lucidjs.EventEmitter);
exports.AsyncMachine = AsyncMachine;

module.exports.AsyncMachine = AsyncMachine;
//# sourceMappingURL=asyncmachine.js.map
