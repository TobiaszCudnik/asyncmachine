/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
/// <reference path="../typings/settimeout.d.ts" />
/// <reference path="../typings/commonjs.d.ts" />
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

import eventemitter = require("eventemitter3-abortable");
import promise = require('es6-promise');

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

export class Deferred {
    promise: Promise<any> = null;

    resolve: Function = null;

    reject: Function = null;

    constructor() {
        this.promise = new promise.Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

export class AsyncMachine extends eventemitter.EventEmitter {
    private states_all: string[] = null;

    private states_active: string[] = null;

    private queue: Array<Array<any>> = null;

    private lock: boolean = false;

    public last_promise: Promise<any> = null;

    log_handler_ = null;

    debug_prefix = "";

    debug_level = 1;

    private clock_: { [state: string]: number } = {};

    internal_fields = [];

    target = null;

    transition_events = [];

    private debug_: boolean = false;

    Exception = {};

    constructor(target?: AsyncMachine) {
        super();
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        this.clock_ = {};

        this.setTarget(target || this);
        this.register("Exception");
        this.internal_fields = ["_events", "states_all", "states_active", "queue", "lock", "last_promise", "log_handler_", "debug_prefix", "debug_level", "clock_", "debug_", "target", "internal_fields"];
    }

    public Exception_state(states: string[], err: Error, exception_states?: string[]): boolean {
        if (exception_states.length != null) {
            this.log("Exception when tried to set following states: " + exception_states.join(", "));
        }
        return this.setImmediate(() => {
            throw err;
        });
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

    public set(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    public set(target: AsyncMachine, states: string, ...params: any[]): boolean;
    public set(target: string[], states?: any, ...params: any[]): boolean;
    public set(target: string, states?: any, ...params: any[]): boolean;
    public set(target: any, states?: any, ...params: any[]): boolean {
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued SET state(s) " + states + " for an external machine", 2);
                this.queue.push([STATE_CHANGE.SET, states, params, target]);
                return true;
            } else {
                return target.add(states, params);
            }
        }

        params = [states].concat(params);
        states = target;

        return this.processStateChange_(STATE_CHANGE.SET, states, params);
    }

    public setByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public setByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public setByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public setByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public setByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.set.bind(this), target, states, params));
    }

    public setByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public setByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public setByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public setByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public setByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createListener(this.createDeferred(this.set.bind(this), target, states, params));
    }

    public setNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    public setNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    public setNext(target: string, states: any, ...params: any[]): (...params) => void;
    public setNext(target: string[], states: any, ...params: any[]): (...params) => void;
    public setNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.set.bind(this);
        return this.setImmediate(fn, target, states, params);
    }

    public add(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    public add(target: AsyncMachine, states: string, ...params: any[]): boolean;
    public add(target: string[], states?: any, ...params: any[]): boolean;
    public add(target: string, states?: any, ...params: any[]): boolean;
    public add(target: any, states?: any, ...params: any[]): boolean {
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued ADD state(s) " + states + " for an external machine", 2);
                this.queue.push([STATE_CHANGE.ADD, states, params, target]);
                return true;
            } else {
                return target.add(states, params);
            }
        }

        params = [states].concat(params);
        states = target;
        return this.processStateChange_(STATE_CHANGE.ADD, states, params);
    }

    public addByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public addByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public addByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public addByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public addByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.add.bind(this), target, states, params));
    }

    public addByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public addByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public addByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public addByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public addByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createListener(this.createDeferred(this.add.bind(this), target, states, params));
    }

    public addNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    public addNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    public addNext(target: string, states: any, ...params: any[]): (...params) => void;
    public addNext(target: string[], states: any, ...params: any[]): (...params) => void;
    public addNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.add.bind(this);
        return this.setImmediate(fn, target, states, params);
    }

    public drop(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    public drop(target: AsyncMachine, states: string, ...params: any[]): boolean;
    public drop(target: string[], states?: any, ...params: any[]): boolean;
    public drop(target: string, states?: any, ...params: any[]): boolean;
    public drop(target: any, states?: any, ...params: any[]): boolean {
        if (target instanceof AsyncMachine) {
            if (this.duringTransition()) {
                this.log("Queued DROP state(s) " + states + " for an external machine", 2);
                this.queue.push([STATE_CHANGE.DROP, states, params, target]);
                return true;
            } else {
                return target.drop(states, params);
            }
        }

        params = [states].concat(params);
        states = target;

        return this.processStateChange_(STATE_CHANGE.DROP, states, params);
    }

    public dropByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public dropByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public dropByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public dropByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public dropByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createCallback(this.createDeferred(this.drop.bind(this), target, states, params));
    }

    public dropByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
    public dropByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
    public dropByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
    public dropByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
    public dropByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void {
        return this.createListener(this.createDeferred(this.drop.bind(this), target, states, params));
    }

    public dropNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
    public dropNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
    public dropNext(target: string, states: any, ...params: any[]): (...params) => void;
    public dropNext(target: string[], states: any, ...params: any[]): (...params) => void;
    public dropNext(target: any, states: any, ...params: any[]): (...params) => void {
        var fn = this.drop.bind(this);
        return this.setImmediate(fn, target, states, params);
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

            this.on(state + "_state", () => this.add(machine, new_state));

            return this.on(state + "_end", () => this.drop(machine, new_state));
        });
    }

    public pipeInvert(state: string, machine?: AsyncMachine, target_state?: string);
    public pipeInvert(state: string[], machine?: AsyncMachine, target_state?: string);
    public pipeInvert(state: AsyncMachine, machine?: string);
    public pipeInvert(state: any, machine?: any, target_state?: any) {
        if (state instanceof AsyncMachine) {
            return this.pipeInvert(this.states_all, state, machine);
        }

        this.log("Piping inverted state " + state, 3);
        return [].concat(state).forEach((state) => {
            var new_state = target_state || state;

            this.on(state + "_state", () => this.drop(machine, new_state));

            return this.on(state + "_end", () => this.add(machine, new_state));
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
        var child_states_active = [];
        child.clock = {};
        this.states_all.forEach((state) => child.clock[state] = 0);
        return child;
    }

    public duringTransition(): boolean {
        return this.lock;
    }

    public getAbort(state: string, abort?: () => boolean): () => boolean {
        var tick = this.clock(state);
        return () => {
            if (abort && !(typeof abort === "function" ? abort() : void 0)) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !this.is(state, tick);
            }
            if (should_abort) {
                this.log("Aborted " + state + " listener, while in states (" + (this.is().join(", ")) + ")", 1);
            }

            return should_abort;
        };
    }

    public getAbortEnter(state: string, abort?: () => boolean): () => boolean {
        var tick = this.clock(state);
        return () => {
            if (abort && !(typeof abort === "function" ? abort() : void 0)) {
                var should_abort = true;
            }
            if (should_abort == null) {
                should_abort = !this.is(state, tick + 1);
            }
            if (should_abort) {
                this.log(("Aborted " + state + "_enter listener, while in states ") + ("(" + (this.is().join(", ")) + ")"), 1);
            }

            return should_abort;
        };
    }

    public when(states: string, abort?: Function): Promise<any>;
    public when(states: string[], abort?: Function): Promise<any>;
    public when(states: any, abort?: Function): Promise<any> {
        states = [].concat(states);
        return new promise.Promise((resolve, reject) => this.bindToStates(states, resolve, abort));
    }

    public whenOnce(states: string, abort?: Function): Promise<any>;
    public whenOnce(states: string[], abort?: Function): Promise<any>;
    public whenOnce(states: any, abort?: Function): Promise<any> {
        states = [].concat(states);
        return new promise.Promise((resolve, reject) => this.bindToStates(states, resolve, abort, true));
    }

    debug(prefix : any = "", level : any = 1) {
        this.debug_ = true;
        this.debug_prefix = prefix;
        this.debug_level = level;
        return null;
    }

    debugOff() {
        return this.debug_ = false;
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

    on(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            listener.call(context);
        }

        return super.on(event, listener, context);
    }

    once(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter {
        if (event.slice(-6) === "_state" && this.is(event.slice(0, -6))) {
            return listener.call(context);
        } else {
            return super.once(event, listener, context);
        }
    }

    private getInstance(): any {
        return this;
    }

    setImmediate(fn, ...params) {
        if (setImmediate) {
            return setImmediate.apply(null, [fn].concat(params));
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

    hasStateChanged(states_before) {
        var length_equals = this.is().length === states_before.length;

        return !length_equals || this.diffStates(states_before, this.is()).length;
    }

    private processStateChange_(type: number, states: string, params: any[], autostate?: boolean, skip_queue?: boolean);
    private processStateChange_(type: number, states: string[], params: any[], autostate?: boolean, skip_queue?: boolean);
    private processStateChange_(type: number, states: any, params: any[], autostate?: boolean, skip_queue?: boolean): boolean {
        states = [].concat(states);
        states = states.filter((state) => {
            if (typeof state !== "string" || !this.get(state)) {
                throw new Error("Non existing state: " + state);
            }

            return true;
        });

        if (!states.length) {
            return;
        }
        try {
            var type_label = STATE_CHANGE_LABELS[type].toLowerCase();
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
            } else {
                this.log("[" + type_label + "] state " + (states.join(", ")), 2);
            }
            var ret = this.selfTransitionExec_(states, params);

            if (ret !== false) {
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
                if (type !== STATE_CHANGE.DROP && !autostate) {
                    var states_accepted = states.every((state) => ~states_to_set.indexOf(state));
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
        } catch (_error) {
            var err = _error;
            this.queue = queue;
            this.lock = false;
            this.add("Exception", err, states);
            return;
        }

        if (ret === false) {
            this.emit("cancelled");
        } else if (this.hasStateChanged(states_before)) {
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
            var params = [row[QUEUE.STATE_CHANGE], row[QUEUE.STATES], row[QUEUE.PARAMS], false, target === this || target.duringTransition()];
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

    private createDeferred(fn: Function, target, states, state_params: any[]): Deferred {
        var deferred = new Deferred;

        deferred.promise.then((callback_params) => {
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
    }

    private createCallback(deferred: Deferred): (err?, ...params) => void {
        return (err : any = null, ...params) => {
            if (err) {
                this.add("Exception", err);
                return deferred.reject(err);
            } else {
                return deferred.resolve(params);
            }
        };
    }

    private createListener(deferred: Deferred): (...params) => void {
        return (...params) => deferred.resolve(params);
    }

    private selfTransitionExec_(states: string[], params?: any[]) {
        if (params == null) {
            params = [];
        }
        var ret = states.some((state) => {
            ret = void 0;
            var name = state + "_" + state;
            if (~this.states_active.indexOf(state)) {
                var transition_params = [states].concat(params);
                var context = this.getMethodContext(name);
                if (context) {
                    this.log("[transition] " + name, 2);
                    ret = context[name].apply(context, transition_params);
                } else {
                    this.log("[transition] " + name, 3);
                }

                if (ret === false) {
                    this.log("Self transition for " + state + " cancelled", 2);
                    return true;
                }

                ret = this.emit.apply(this, [name].concat(params));
                if (ret !== false) {
                    this.transition_events.push([name, transition_params]);
                }

                return ret === false;
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
            this.log("Can't set following states " + (names.join(", ")), 2);
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
        this.transition_events = [];
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
        var previous = this.states_active;
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
    }

    processPostTransition() {
        var _ref;
        this.transition_events.forEach((transition) => {
            var name = transition[0];
            var params = transition[1];

            if (name.slice(-5) === "_exit") {
                var state = name.slice(0, -5);
                var method = state + "_end";
            } else if (name.slice(-6) === "_enter") {
                state = name.slice(0, -6);
                method = state + "_state";
            }

            var context = this.getMethodContext(method);
            if (context) {
                this.log("[transition] " + state + "_end", 2);
                if ((_ref = context[method]) != null) {
                    _ref.apply(context, params);
                }
            } else {
                this.log("[transition] " + state + "_end", 3);
            }

            return this.emit.apply(this, [method].concat(params));
        });

        return this.transition_events = [];
    }

    getMethodContext(name) {
        if (this.target[name]) {
            return this.target;
        } else if (this[name]) {
            return this;
        }
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
        ret = (this.transitionExec_(from + "_any", to)) === false;

        return !ret;
    }

    private transitionEnter_(to: string, target_states: string[], 
		params: any[]) {
        var ret = this.transitionExec_("any_" + to, target_states, params);
        if (ret === false) {
            return false;
        }

        return this.transitionExec_(to + "_enter", target_states, params);
    }

    private transitionExec_(method: string, target_states: string[], 
		params?: string[]) {
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
        } else {
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
        } else {
            this.log(("Cancelled transition to " + (target_states.join(", ")) + " by ") + ("the method " + method), 2);
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
            if (!(typeof abort === "function" ? abort() : void 0) && fired === states.length) {
                listener();
            }
            if (once || (typeof abort === "function" ? abort() : void 0)) {
                return states.map((state) => {
                    this.removeListener(state + "_state", enter);
                    return this.removeListener(state + "_end", exit);
                });
            }
        };
        function exit() {
            return fired -= 1;
        }
        return states.map((state) => {
            this.log("Binding to event " + state, 3);
            this.on(state + "_state", enter);
            return this.on(state + "_end", exit);
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
export interface ITransition {
	call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
	apply(context, args): any;
}