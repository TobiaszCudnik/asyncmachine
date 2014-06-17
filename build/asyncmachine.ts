/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/es5-shim.d.ts" />
"TODO:\n- queue enum\n- log enum";

import lucidjs = require("lucidjs");
import rsvp = require("rsvp");
export var Promise = rsvp.Promise;
require("es5-shim");

export class AsyncMachine extends lucidjs.EventEmitter {
    states_all = null;

    states_active = null;

    queue = null;

    lock = false;

    last_promise = null;

    log_handler_ = null;

    debug_prefix = "";

    debug_level = 1;

    clock_ = null;

    debug_ = false;

    constructor(public config : any = {}) {
        super();
        this.debug_ = !!config.debug;
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};
    }

    is(state) {
        if (!state) {
            return this.states_active;
        }
        return !!~this.states_active.indexOf(state);
    }

    any(...names) {
        return names.some((name) => {
            if (Array.isArray(name)) {
                return this.every(name);
            } else {
                return this.is(name);
            }
        });
    }

    every(...names) {
        return names.every((name) => !!~this.states_active.indexOf(name));
    }

    futureQueue() {
        return this.queue;
    }

    register(...states) {
        return states.map((state) => {
            this.states_all.push(state);
            return this.clock[state] = 0;
        });
    }

    get(state) {
        return this[state];
    }

    set(states, ...params) {
        return this.setState_(states, params);
    }

    setLater(states, ...params) {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            return this.setState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    add(states, ...params) {
        return this.addState_(states, params);
    }

    addLater(states, ...params) {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            return this.addState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    drop(states, ...params) {
        return this.dropState_(states, params);
    }

    dropLater(states, ...params) {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            return this.dropState_(states, params);
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    pipeForward(state, machine, target_state) {
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }
        return [].concat(state).forEach((state) => {
            var new_state = target_state || state;
            var namespace = this.namespaceName(state);

            this.on(namespace + ".enter", () => machine.add(new_state));

            return this.on(namespace + ".exit", () => machine.drop(new_state));
        });
    }

    createChild() {
        var child = Object.create(this);
        child.states_active = [];
        child.clock = {};
        this.states_all.forEach((state) => child.clock[state] = 0);
        return child;
    }

    clock(state) {
        return this.clock[state];
    }

    pipeInvert(state, machine, target_state) {
        state = this.namespaceName(state);
        this.on(state + ".enter", () => machine.drop(target_state));

        return this.on(state + ".exit", () => machine.add(target_state));
    }

    pipeOff() {
        throw new Error("not implemented yet");
    }

    duringTransition() {
        return this.lock;
    }

    namespaceName(state) {
        return state.replace(/([a-zA-Z])([A-Z])/g, "$1.$2");
    }

    debug(prefix : any = "", level : any = 1, handler : any = null) {
        this.debug_ = !this.debug_;
        this.debug_prefix = prefix;
        this.debug_level = level;
        return null;
    }

    log(msg, level) {
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
    }

    processAutoStates(excluded) {
        if (excluded == null) {
            excluded = [];
        }
        var add = [];
        this.states_all.forEach((state) => {
            var is_excluded = ~excluded.indexOf(state);
            var is_current = this.is(state);
            if (this[state].auto && !is_excluded && !is_current) {
                return add.push(state);
            }
        });

        return this.add(add);
    }

    setState_(states, params) {
        var states_to_set = [].concat(states);
        states_to_set.forEach((state) => {
            if (!~this.states_all.indexOf(state)) {
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
        var states_to_set_valid = states_to_set.some((state) => !!~states.indexOf(state));

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
    }

    addState_(states, params) {
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
        var states_to_add_valid = states_to_add.some((state) => !!~states.indexOf(state));

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
    }

    dropState_(states, params) {
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
        states = this.states_active.filter((state) => !~states_to_drop.indexOf(state));
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
    }

    processQueue_(previous_ret) {
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
    }

    allStatesSet(states) {
        return states.every(this.is.bind(this));
    }

    allStatesNotSet(states) {
        return states.every((state) => !this.is(state));
    }

    createCallback(deferred) {
        return (err : any = null, ...params) => {
            if (err) {
                return deferred.reject(err);
            } else {
                return deferred.resolve(params);
            }
        };
    }

    namespaceTransition_(transition) {
        return this.namespaceName(transition).replace(/_(exit|enter)$/, ".$1").replace("_", "._.");
    }

    selfTransitionExec_(states, params) {
        if (params == null) {
            params = [];
        }
        var ret = states.some((state) => {
            ret = void 0;
            var name = state + "_" + state;
            var method = this[name];
            if (method && ~this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                ret = method.apply(this, transition_params);
                if (ret === false) {
                    return true;
                }
                var event = this.namespaceTransition_(name);
                var transition_params2 = [event, states].concat(params);
                return (this.trigger.apply(this, transition_params2)) === false;
            }
        });
        return !ret;
    }

    setupTargetStates_(states, exclude) {
        if (exclude == null) {
            exclude = [];
        }
        states = states.filter((name) => {
            var ret = ~this.states_all.indexOf(name);
            if (!ret) {
                this.log("State " + name + " doesn't exist", 2);
            }
            return !!ret;
        });

        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);
        var already_blocked = [];
        states = states.reverse().filter((name) => {
            var blocked_by = this.isStateBlocked_(states, name);
            blocked_by = blocked_by.filter((blocker_name) => !~already_blocked.indexOf(blocker_name));

            if (blocked_by.length) {
                already_blocked.push(name);
                if (this.is(name)) {
                    this.log("State " + name + " dropped by " + (blocked_by.join(", ")), 2);
                } else {
                    this.log("State " + name + " ignored because of " + (blocked_by.join(", ")), 3);
                }
            }
            return !blocked_by.length && !~exclude.indexOf(name);
        });

        return this.parseRequires_(states.reverse());
    }

    parseImplies_(states) {
        states.forEach((name) => {
            var state = this.get(name);
            if (!state.implies) {
                return;
            }
            return states = states.concat(state.implies);
        });

        return states;
    }

    parseRequires_(states) {
        var length_before = 0;
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter((name) => {
                var state = this.get(name);
                return !(state.requires != null ? state.requires.some((req) => {
                    var found = ~states.indexOf(req);
                    if (!found) {
                        this.log(("State " + name + " dropped as required state " + req + " ") + "is missing", 2);
                    }
                    return !found;
                }) : void 0);
            });
        }
        return states;
    }

    removeDuplicateStates_(states) {
        var states2 = [];
        states.forEach((name) => {
            if (!~states2.indexOf(name)) {
                return states2.push(name);
            }
        });

        return states2;
    }

    isStateBlocked_(states, name) {
        var blocked_by = [];
        states.forEach((name2) => {
            var state = this.get(name2);
            if (state.blocks && ~state.blocks.indexOf(name)) {
                return blocked_by.push(name2);
            }
        });

        return blocked_by;
    }

    transition_(to, explicit_states, params) {
        if (params == null) {
            params = [];
        }
        if (!to.length) {
            return true;
        }
        var from = this.states_active.filter((state) => !~to.indexOf(state));

        this.orderStates_(to);
        this.orderStates_(from);

        var ret = from.some((state) => false === this.transitionExit_(state, to, explicit_states, params));

        if (ret === true) {
            return false;
        }
        ret = to.some((state) => {
            if (~this.states_active.indexOf(state)) {
                return false;
            }
            if (~explicit_states.indexOf(state)) {
                var transition_params = params;
            } else {
                transition_params = [];
            }
            ret = this.transitionEnter_(state, to, transition_params);
            return ret === false;
        });

        if (ret === true) {
            return false;
        }
        this.setActiveStates_(to);
        return true;
    }

    setActiveStates_(target) {
        var previous = this.states_active;
        var all = this.states_all;
        this.states_active = target;
        target.forEach((state) => {
            if (!~previous.indexOf(state)) {
                return this.clock[state]++;
            }
        });
        return all.forEach((state) => {
            if (~target.indexOf(state)) {
                return this.unflag(state + ".exit");
            } else {
                return this.unflag(state + ".enter");
            }
        });
    }

    transitionExit_(from, to, explicit_states, params) {
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
        ret = to.some((state) => {
            transition = from + "_" + state;
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
        ret = (this.transitionExec_(from + "_any", to)) === false;
        return !ret;
    }

    transitionEnter_(to, target_states, params) {
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
    }

    transitionExec_(method, target_states, params) {
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
    }

    orderStates_(states) {
        states.sort((e1, e2) => {
            var state1 = this.get(e1);
            var state2 = this.get(e2);
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
    }
}

module.exports.AsyncMachine = AsyncMachine;
