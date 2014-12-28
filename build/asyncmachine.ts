/// <reference path="../d.ts/settimeout.d.ts" />
/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/commonjs.d.ts" />
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

import lucidjs = require("lucidjs");
import rsvp = require("rsvp");
export var Promise = rsvp.Promise;
require("es5-shim");

export var STATE_CHANGE = {
    DROP: 0,
    ADD: 1,
    SET: 2
};

export var STATE_CHANGE_LABELS = {
    0: "Drop",
    1: "Add",
    2: "Set"
};

export var QUEUE = {
    STATE_CHANGE: 0,
    STATES: 1,
    PARAMS: 2,
    TARGET: 3
};

export class AsyncMachine extends lucidjs.EventEmitter {
    private states_all: string[] = null;

    private states_active: string[] = null;

    private queue: Array<Array<any>> = null;

    private lock: boolean = false;

    public last_promise: rsvp.Promise = null;

    log_handler_ = null;

    debug_prefix = "";

    debug_level = 1;

    private clock_: { [state: string]: number } = {};

    internal_fields = [];

    target = null;

    transition_events = [];

    private debug_: boolean = false;

    Exception = {};

    constructor(public config : any = {}) {
        super();
        this.debug_ = !!config.debug;
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};

        this.setTarget(this);
        this.register("Exception");
        this.internal_fields = ["_listeners", "_eventEmitters", "_flags", "source", "event", "cancelBubble", "config", "states_all", "states_active", "queue", "lock", "last_promise", "log_handler_", "debug_prefix", "debug_level", "clock_", "debug_", "target", "internal_fields"];
    }

    public Exception_enter(states: string[], err: Error, exception_states?: string[]): boolean {
        if (exception_states != null ? exception_states.length : void 0) {
            this.log("Exception when tried to set the following states: " + exception_states.join(", "));
        }
        this.setImmediate(() => {
            throw err;
        });

        return true;
    }

    setTarget(target) {
        return this.target = target;
    }

    registerAll() {
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
            } else {
                _results.push(void 0);
            }
        }
        return _results;
    }

    public is(state: string): boolean;
    public is(state: string[]): boolean;
    public is(state: string, tick?: number): boolean;
    public is(state: string[], tick?: number): boolean;
    public is(): string[];
    public is(state?: any, tick?: number): any {
        if (!state) {
            return this.states_active;
        }
        var active = !!~this.states_active.indexOf(state);
        if (!active) {
            return false;
        }
        if (tick === void 0) {
            return true;
        } else {
            return (this.clock(state)) === tick;
        }
    }

    public any(...names: string[]): boolean;
    public any(...names: string[][]): boolean;
    public any(...names: any[]): boolean {
        return names.some((name) => {
            if (Array.isArray(name)) {
                return this.every(name);
            } else {
                return this.is(name);
            }
        });
    }

    public every(...names: string[]): boolean {
        return names.every((name) => !!~this.states_active.indexOf(name));
    }

    futureQueue() {
        return this.queue;
    }

    public register(...states: string[]) {
        return states.map((state) => {
            this.states_all.push(state);
            return this.clock_[state] = 0;
        });
    }

    public get(state: string): IState {
        return this[state];
    }

    public set(states: string[], ...params: any[]): boolean;
    public set(states: string, ...params: any[]): boolean;
    public set(states: any, ...params: any[]): boolean {
        return this.processStateChange_(STATE_CHANGE.SET, states, params);
    }

    public setLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public setLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public setLater(states: any, ...params: any[]): (err?: any, ...params: any[]) => void {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            try {
                return this.processStateChange_(STATE_CHANGE.SET, states, params);
            } catch (_error) {
                var err = _error;
                return this.set("Exception", err, states);
            }
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    public add(target: AsyncMachine, states?: string[], ...params: any[]): boolean;
    public add(target: AsyncMachine, states?: string, ...params: any[]): boolean;
    public add(target: string[], states?: any, ...params: any[]): boolean;
    public add(target: string, states?: any, ...params: any[]): boolean;
    public add(target: any, states?: any, ...params: any[]): boolean {
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.queue.push([STATE_CHANGE.ADD, states, params, target]);
                return true;
            } else {
                return target.add(states, params);
            }
        }

        states = target;
        params = [states].concat(params);
        return this.processStateChange_(STATE_CHANGE.ADD, states, params);
    }

    public addByCallback(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public addByCallback(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public addByCallback(states: any, ...params: any[]): (err?: any, ...params: any[]) => void {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            try {
                return this.processStateChange_(STATE_CHANGE.ADD, states, params);
            } catch (_error) {
                var err = _error;
                return this.add("Exception", err, states);
            }
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    public addByListener(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public addByListener(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public addByListener(states: any, ...params: any[]): (err?: any, ...params: any[]) => void {
        var deferred = rsvp.defer();
        deferred.promise.then((listener_params) => {
            params.push.apply(params, listener_params);
            try {
                return this.processStateChange_(STATE_CHANGE.ADD, states, params);
            } catch (_error) {
                var err = _error;
                return this.add("Exception", err, states);
            }
        });

        this.last_promise = deferred.promise;
        return this.createListener(deferred);
    }

    addNext(states, ...params) {
        var fn = this.processStateChange_.bind(this, STATE_CHANGE.ADD);
        return this.setImmediate(fn, states, params);
    }

    addLater(...params) {
        return this.addByCallback.apply(this, params);
    }

    public drop(states: string[], ...params: any[]): boolean;
    public drop(states: string, ...params: any[]): boolean;
    public drop(states: any, ...params: any[]): boolean {
        return this.processStateChange_(STATE_CHANGE.DROP, states, params);
    }

    public dropLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public dropLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public dropLater(states: any, ...params: any[]): (err?: any, ...params: any[]) => void {
        var deferred = rsvp.defer();
        deferred.promise.then((callback_params) => {
            params.push.apply(params, callback_params);
            try {
                return this.processStateChange_(STATE_CHANGE.DROP, states, params);
            } catch (_error) {
                var err = _error;
                return this.drop("Exception", err, states);
            }
        });

        this.last_promise = deferred.promise;
        return this.createCallback(deferred);
    }

    public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: AsyncMachine, machine?: string);
    public pipeForward(state: any, machine?: any, target_state?: any) {
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }

        this.log("Piping state " + state, 3);
        return [].concat(state).forEach((state) => {
            var new_state = target_state || state;
            var namespace = this.namespaceName(state);

            this.on(namespace, () => this.add(machine, new_state));

            return this.on(namespace + ".end", function() {
                return this.drop(machine, new_state);
            });
        });
    }

    public pipeInvert(state: string, machine: AsyncMachine, target_state: string) {
        throw new Error("not implemented yet");
        return [].concat(state).forEach((state) => {
            state = this.namespaceName(state);
            this.on(state + ".enter", () => machine.drop(target_state));

            return this.on(state + ".exit", () => machine.add(target_state));
        });
    }

    public pipeOff(): void {
        throw new Error("not implemented yet");
    }

    clock(state) {
        return this.clock_[state];
    }

    createChild() {
        var child = Object.create(this);
        child.states_active = [];
        child.clock = {};
        this.states_all.forEach((state) => child.clock[state] = 0);
        return child;
    }

    public duringTransition(): boolean {
        return this.lock;
    }

    continueEnter(state, func) {
        var tick = this.clock(state);
        return () => {
            if (!this.is(state, tick + 1)) {
                return;
            }
            return func();
        };
    }

    continueState(state, func) {
        var tick = this.clock(state);
        return () => {
            if (!this.is(state, tick)) {
                return;
            }
            return func();
        };
    }

    getInterrupt(state, interrupt) {
        var tick = this.clock(state);
        return () => {
            if (interrupt && !interrupt()) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !this.is(state, tick);
            }
            if (should_abort) {
                return this.log("Aborted " + state + " listener, while in states (" + (this.is().join(", ")) + ")", 1);
            }
        };
    }

    getInterruptEnter(state, interrupt) {
        var tick = this.clock(state);
        return () => {
            if (interrupt && !interrupt()) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !this.is(state, tick + 1);
            }
            if (should_abort) {
                return this.log(("Aborted " + state + ".enter listener, while in states ") + ("(" + (this.is().join(", ")) + ")"), 1);
            }
        };
    }

    public when(states: string, abort?: Function): rsvp.Promise;
    public when(states: string[], abort?: Function): rsvp.Promise;
    public when(states: any, abort?: Function): rsvp.Promise {
        states = [].concat(states);
        return new rsvp.Promise((resolve, reject) => this.bindToStates(states, resolve, abort));
    }

    public whenOnce(states: string, abort?: Function): rsvp.Promise;
    public whenOnce(states: string[], abort?: Function): rsvp.Promise;
    public whenOnce(states: any, abort?: Function): rsvp.Promise {
        states = [].concat(states);
        return new rsvp.Promise((resolve, reject) => this.bindToStates(states, resolve, abort, true));
    }

    debug(prefix : any = "", level : any = 1, handler : any = null) {
        this.debug_ = !this.debug_;
        this.debug_prefix = prefix;
        this.debug_level = level;
        return null;
    }

    public log(msg: string, level?: number): void {
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

    public namespaceName(state: string): string {
        return state.replace(/([a-zA-Z])([A-Z])/g, "$1.$2");
    }

    setImmediate(fn, ...params) {
        if (setImmediate) {
            return setImmediate(fn.apply(null, params));
        } else {
            return setTimeout(fn.apply(null, params), 0);
        }
    }

    private processAutoStates(excluded?: string[]) {
        if (excluded == null) {
            excluded = [];
        }
        var add = [];
        this.states_all.forEach((state) => {
            var is_excluded = () => ~excluded.indexOf(state);
            var is_current = () => this.is(state);
            var is_blocked = () => this.is().some((item) => {
                    if (!(this.get(item)).blocks) {
                        return false;
                    }
                    return Boolean(~(this.get(item)).blocks.indexOf(state));
                });
            if (this[state].auto && !is_excluded() && !is_current() && !is_blocked()) {
                return add.push(state);
            }
        });

        return this.processStateChange_(STATE_CHANGE.ADD, add, [], true);
    }

    private statesChanged(states_before: string[]): boolean {
        var length_equals = this.is().length === states_before.length;

        return !length_equals || this.diffStates(states_before, this.is()).length;
    }

    private processStateChange_(type: number, states: string, params: any[], autostate?: boolean, skip_queue?: boolean);
    private processStateChange_(type: number, states: string[], params: any[], autostate?: boolean, skip_queue?: boolean);
    private processStateChange_(type: number, states: any, params: any[], autostate?: boolean, skip_queue?: boolean): boolean {
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
            var type_label = STATE_CHANGE_LABELS[type];
            if (autostate) {
                this.log("[+] " + type_label + " AUTO state " + (states.join(", ")), 3);
            } else {
                this.log("[+] " + type_label + " state " + (states.join(", ")), 2);
            }
            var ret = this.selfTransitionExec_(states, params);
            if (ret === false) {
                return false;
            }
            var states_to_set = (function() {
                switch (type) {
                    case STATE_CHANGE.DROP:
                        return this.states_active.filter((state) => !~states.indexOf(state));
                    case STATE_CHANGE.ADD:
                        return states.concat(this.states_active);
                    case STATE_CHANGE.SET:
                        return states;
                }
            }).call(this);
            states_to_set = this.setupTargetStates_(states_to_set);
            if (type !== STATE_CHANGE.DROP) {
                var states_accepted = states_to_set.some((state) => ~states.indexOf(state));
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
        } catch (_error) {
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

        if (type === STATE_CHANGE.DROP) {
            return this.allStatesNotSet(states);
        } else {
            return this.allStatesSet(states);
        }
    }

    private processQueue_() {
        var ret = [];
        var row = void 0;
        while (row = this.queue.shift()) {
            var target = row[QUEUE.TARGET] || this;
            var params = [row[QUEUE.STATE_CHANGE], row[QUEUE.STATES], row[QUEUE.PARAMS], false, true];
            ret.push(target.processStateChange_.apply(target, params));
        }

        return !~ret.indexOf(false);
    }

    private allStatesSet(states): boolean {
        return states.every((state) => this.is(state));
    }

    private allStatesNotSet(states): boolean {
        return states.every((state) => !this.is(state));
    }

    private createCallback(deferred: rsvp.Defered): (err?, ...params) => void {
        return (err : any = null, ...params) => {
            if (err) {
                this.add("Exception", err);
                return deferred.reject(err);
            } else {
                return deferred.resolve(params);
            }
        };
    }

    private createListener(deferred: rsvp.Defered): (...params) => void {
        return (...params) => deferred.resolve(params);
    }

    private namespaceTransition_(transition: string): string {
        return this.namespaceName(transition).replace(/_(exit|enter)$/, ".$1").replace("_", "._.");
    }

    private selfTransitionExec_(states: string[], params?: any[]) {
        if (params == null) {
            params = [];
        }
        var ret = states.some((state) => {
            ret = void 0;
            var name = state + "_" + state;
            var method = this.target[name];
            var context = this.target;
            if (!method && this[name]) {
                context = this;
            }
            if (method && ~this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                ret = method.apply(context, transition_params);
                if (ret === false) {
                    return true;
                }
                var event = this.namespaceTransition_(name);
                this.transition_events.push(event);
                var transition_params2 = [event, states].concat(params);
                return (this.trigger.apply(this, transition_params2)) === false;
            }
        });

        return !ret;
    }

    private setupTargetStates_(states: string[], exclude?: string[]) {
        if (exclude == null) {
            exclude = [];
        }
        states = states.filter((name) => {
            var ret = ~this.states_all.indexOf(name);
            if (!ret) {
                this.log("State " + name + " doesn't exist", 2);
            }

            return Boolean(ret);
        });

        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);
        var already_blocked = [];
        states = this.parseRequires_(states);
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

    private parseImplies_(states: string[]): string[] {
        states.forEach((name) => {
            var state = this.get(name);
            if (!state.implies) {
                return;
            }
            return states = states.concat(state.implies);
        });

        return states;
    }

    private parseRequires_(states: string[]): string[] {
        var length_before = 0;
        var not_found_by_states = {};
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter((name) => {
                var state = this.get(name);
                var not_found = [];
                var ret = !(state.requires != null ? state.requires.some((req) => {
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
            var names = (() => {
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
            if (state.blocks && ~state.blocks.indexOf(name)) {
                return blocked_by.push(name2);
            }
        });

        return blocked_by;
    }

    private transition_(to: string[], explicit_states: string[], params?: any[]) {
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

    private setActiveStates_(target: string[]) {
        var _base, _base1, _name, _name1;
        var previous = this.states_active;
        var all = this.states_all;
        var new_states = this.diffStates(target, this.states_active);
        var removed_states = this.diffStates(this.states_active, target);
        var nochange_states = this.diffStates(target, new_states);
        this.states_active = target;
        target.forEach((state) => {
            if (!~previous.indexOf(state)) {
                return this.clock_[state]++;
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

        this.transition_events.forEach((transition) => {
            if (transition.slice(-5) === ".exit") {
                var event = transition.slice(0, -5);
                var state = event.replace(/\./g, "");
                this.unflag(event);
                this.flag(event + ".end");
                this.trigger(event + ".end");
                this.log("[flag] " + event + ".end", 2);
                return typeof (_base = this.target)[_name = state + "_end"] === "function" ? _base[_name](previous) : void 0;
            } else if (transition.slice(-6) === ".enter") {
                event = transition.slice(0, -6);
                state = event.replace(/\./g, "");
                this.unflag(event + ".end");
                this.flag(event);
                this.trigger(event);
                this.log("[flag] " + event, 2);
                return typeof (_base1 = this.target)[_name1 = state + "_state"] === "function" ? _base1[_name1](previous) : void 0;
            }
        });

        return this.transition_events = [];
    }

    diffStates(states1, states2) {
        return states1.filter((name) => __indexOf.call(states2, name) < 0).map((name) => name);
    }

    private transitionExit_(from: string, to: string[], 
		explicit_states: string[], params: any[]) {
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

    private transitionEnter_(to: string, target_states: string[], 
		params: any[]) {
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

    private transitionExec_(method: string, target_states: string[], 
		params?: string[]) {
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
        } else if (this[method] instanceof Function) {
            ret = (_ref1 = this[method]) != null ? typeof _ref1.apply === "function" ? _ref1.apply(this, transition_params) : void 0 : void 0;
        }

        if (ret !== false) {
            if (!~event.indexOf("_")) {
                this.transition_events.push(event);
                if (event.slice(-5) === ".exit") {
                    this.unflag(event.slice(0, -5) + ".enter");
                } else if (event.slice(-6) === ".enter") {
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
    }

    private orderStates_(states: string[]): void {
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

    private bindToStates(states: string[], listener: Function, abort?: Function, once?: boolean) {
        var fired = 0;
        var enter = () => {
            fired += 1;
            if (!(typeof abort === "function" ? abort() : void 0)) {
                if (fired === states.length) {
                    listener();
                }
            }
            if (once || (typeof abort === "function" ? abort() : void 0)) {
                return states.map((state) => {
                    this.removeListener(state, enter);
                    return this.removeListener(state + ".end", exit);
                });
            }
        };
        function exit() {
            return fired -= 1;
        }
        return states.map((state) => {
            var event = this.namespaceName(state);
            this.log("Binding to event " + event, 3);
            this.on(event, enter);
            return this.on(event + ".end", exit);
        });
    }
}

module.exports.AsyncMachine = AsyncMachine;

export interface IState {
	depends?: string[];
	implies?: string[];
	blocks?: string[];
	requires?: string[];
	auto?: boolean;
}
export interface IConfig {
	debug: boolean;
}
export interface ITransition {
	call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
	apply(context, args): any;
}