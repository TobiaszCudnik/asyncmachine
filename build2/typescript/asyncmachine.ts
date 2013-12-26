///<reference path="headers/commonjs.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />


var Promise;

import lucidjs = require("lucidjs");
import rsvp = require("rsvp");
Promise = rsvp.Promise;
require("es5-shim");

// TODO merge with definition

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
;
export class AsyncMachine extends lucidjs.EventEmitter {
    private $: Object = null;

    private states_all: string[] = null;

    private states_active: string[] = null;

    private queue: Object[] = null;

    private lock: boolean = false;

    public last_promise: rsvp.Promise = null;

    private log_handler_: Function = null;

    private debug_: boolean = false;

    constructor(parent, public config) {
        super();
        if (parent) {
            this.$ = parent;
        }
        this.debug_ = false;
        this.queue = [];
        this.states_all = [];
        this.states_active = [];
        if (config != null ? config.debug : void 0) {
            this.debug();
        }
    }

    	// Prepare class'es states. Required to be called manually for inheriting classes.

    public initScan_(obj) {
        var name, parent, _i, _len;
        for (_i = 0, _len = obj.length; _i < _len; _i++) {
            name = obj[_i];
            if (name instanceof Function) {
                continue;
            }
            if (!this.hasOwnProperty(name)) {
                continue;
            }
            this.states_all.push(name);
        }
        parent = obj.constructor.prototype.constructor;
        if (parent === AsyncMachine) {
            return;
        }
        return this.initScan_(parent);
    }

    public init(state: string);
    public init(state: string[]);
    public init(state: any) {
        this.states_all = [];
        this.initScan_(this);
        if (state) {
            this.setState(state);
        }
        return null;
    }

    public getState(name: string): IState {
        console.log("#getState is deprecated, use #get");  //getState is deprecated, use #get'
        return this.get(name);
    }

    public get(state: string): IState {
        return this[state];
    }

    public state(name: string): boolean;
    public state(name: string[]): boolean;
    public state(): string[];
    public state(name?: any): any {
        console.log("#state is deprecated, use #is");  //state is deprecated, use #is'
        return this.any(name);
    }

    	// Returns active states or if passed a state, returns if its set.

    public is(state: string): boolean;
    public is(state: string[]): boolean;
    public is(): string[];
    public is(state?: any): any {
        if (!state) {
            return this.states_active;
        }
        !!~this.states_active.indexOf(state);
        return !!~this.states_active.indexOf(state);
    }

    	// Tells if any of the parameters is set, where if param is an array, checks if
    	//   all states in array are set.

    public any(...names: string[]): boolean {
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

    	// Activate certain states and deactivate the current ones.

    public setState(states: string[], ...params: any[]): boolean;
    public setState(states: string, ...params: any[]): boolean;
    public setState(states: any, ...params: any[]): boolean {
        return this.setState_(states, params);
    }

    	// Curried version of setState.

    public setLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public setLater(states: string, ...params: any[]): (...params: any[]) => void;
    public setLater(states: any, ...params: any[]): (...params: any[]) => void {
        var promise;
        promise = new Promise();
        promise.then((...callback_params) => this.setState_(states, params, callback_params));

        this.last_promise = promise;
        return (...params) => promise.resolve(params);
    }

    	// Activate certain states and keep the current ones.

    public add(states: string[], ...params: any[]): boolean;
    public add(states: string, ...params: any[]): boolean;
    public add(states: any, ...params: any[]): boolean {
        return this.addState_(states, params);
    }

    	// Curried version of add

    public addLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public addLater(states: string, ...params: any[]): (...params: any[]) => void;
    public addLater(states: any, ...params: any[]): (...params: any[]) => void {
        var promise;
        promise = new Promise();
        promise.then((...callback_params) => this.addState_(states, params, callback_params));

        this.last_promise = promise;
        return (...params) => promise.resolve(params);
    }

    	// Deactivate certain states.

    public drop(states: string[], ...params: any[]): boolean;
    public drop(states: string, ...params: any[]): boolean;
    public drop(states: any, ...params: any[]): boolean {
        return this.dropState_(states, params);
    }

    	// Deactivate certain states.

    public dropLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public dropLater(states: string, ...params: any[]): (...params: any[]) => void;
    public dropLater(states: any, ...params: any[]): (...params: any[]) => void {
        var promise;
        promise = new Promise();
        promise.then((...callback_params) => this.dropState_(states, params, callback_params));

        this.last_promise = promise;
        return (...params) => promise.resolve(params);
    }

    public pipeForward(state: AsyncMachine, machine?: string);
    public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: any, machine?: any, target_state?: any) {
        		// switch params order
        if (state instanceof AsyncMachine) {
            return this.pipeForward(this.states_all, state, machine);
        }

        		// cast to an array
        return [].concat(state).forEach((state) => {
            var namespace, new_state;
            new_state = target_state || state;
            namespace = this.namespaceName(state);

            this.on(namespace + ".enter", () => machine.add(new_state));

            return this.on(namespace + ".exit", () => machine.drop(new_state));
        });
    }

    public pipeInvert(state: string, machine: AsyncMachine, target_state: string) {
        state = this.namespaceName(state);
        this.on(state + ".enter", () => machine.drop(target_state));

        return this.on(state + ".exit", () => machine.add(target_state));
    }

    public pipeOff(): void {
        throw new Error("not implemented yet");
    }

    	// TODO use a regexp lib for IE8's 'g' flag compat?
    	// CamelCase to Camel.Case

    public namespaceName(state: string): string {
        return state.replace(/([a-zA-Z])([A-Z])/g, "$1.$2");
    }

    public debug(prefix?: string, log_handler?: (...msgs: string[]) => void): void {
        this.debug_ = !this.debug_;
        if (this.debug_) {
            this.log_handler_ = (...msgs) => {
                var args;
                args = prefix ? [prefix].concat(msgs) : msgs;
                return log_handler.apply(null, args);
            };
        }
        return null;
    }

    public log(...msgs) {
        var _base;
        if (!this.debug_) {
            return;
        }

        return typeof (_base = console.log).apply === "function" ? _base.apply(console, msgs) : void 0;
    }

    	// TODO merge a state with the given name with the super
    	// class' state
    	// TODO2 merge by a definition

    	////////////////////////////
    	// PRIVATES
    	////////////////////////////

    private processAutoStates(excluded?: string[]) {
        var add;
        if (excluded == null) {
            excluded = [];
        }
        add = [];
        this.states_all.forEach((state) => {
            var is_current, is_excluded;
            is_excluded = ~excluded.indexOf(state);
            is_current = this.is(state);
            if (this[state].auto && !is_excluded && !is_current) {
                return add.push(state);
            }
        });

        return this.add(add);
    }

    private setState_(states: string, exec_params: any[], 
			callback_params?: any[]);
    private setState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
    private setState_(states: any, exec_params: any[],
			callback_params?: any[]): boolean {
        var length_equals, queue, ret, states_before, states_to_set, states_to_set_valid;
        if (callback_params == null) {
            callback_params = [];
        }
        states_to_set = [].concat(states);
        if (!states_to_set.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([2, states_to_set, exec_params, callback_params]);
            return;
        }
        this.lock = true;
        this.log_handler_("[*] Set state " + states_to_set.join(", "));
        states_before = this.is();
        ret = this.selfTransitionExec_(states_to_set, exec_params, callback_params);
        if (ret === false) {
            return false;
        }
        states = this.setupTargetStates_(states_to_set);
        states_to_set_valid = states_to_set.some((state) => ~states.indexOf(state));

        if (!states_to_set_valid) {
            if (this.log_handler_) {
                this.log_handler_("[i] Transition cancelled, as target states wasn't accepted");
            }
            return this.lock = false;
        }
        queue = this.queue;
        this.queue = [];
        ret = this.transition_(states, states_to_set, exec_params, callback_params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);

        		// If length equals and all previous states are set, we assume there
        		// wasnt any change
        length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        if (ret === false) {
            return false;
        } else {
            return this.allStatesSet(states_to_set);
        }
    }

    	// TODO Maybe avoid double concat of states_active

    private addState_(states: string, exec_params: any[], 
			callback_params?: any[]);
    private addState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
    private addState_(states: any, exec_params: any[],
			callback_params?: any[]): boolean {
        var length_equals, queue, ret, states_before, states_to_add, states_to_addState_valid;
        if (typeof callback_params === "undefined") {
            callback_params = [];
        }
        states_to_add = [].concat(states);
        if (!states_to_add.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([1, states_to_add, exec_params, callback_params]);
            return;
        }
        this.lock = true;
        this.log_handler_("[*] Add state " + states_to_add.join(", "));
        states_before = this.is();
        ret = this.selfTransitionExec_(states_to_add, exec_params, callback_params);
        if (ret === false) {
            return false;
        }
        states = states_to_add.concat(this.states_active);
        states = this.setupTargetStates_(states);
        states_to_addState_valid = states_to_add.some((state) => ~states.indexOf(state));

        if (!states_to_addState_valid) {
            if (this.log_handler_) {
                this.log_handler_("[i] Transition cancelled, as target states wasn't accepted");
            }
            return this.lock = false;
        }

        queue = this.queue;
        this.queue = [];
        ret = this.transition_(states, states_to_add, exec_params, callback_params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);

        		// If length equals and all previous states are set, we assume there
        		// wasnt any change
        length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        if (ret === false) {
            return false;
        } else {
            return this.allStatesSet(states_to_add);
        }
    }

    private dropState_(states: string, exec_params: any[], 
			callback_params?: any[]);
    private dropState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
    private dropState_(states: any, exec_params: any[],
			callback_params?: any[] ): boolean {
        var length_equals, queue, ret, states_before, states_to_drop;
        if (typeof callback_params === "undefined") {
            callback_params = [];
        }
        states_to_drop = [].concat(states);
        if (!states_to_drop.length) {
            return;
        }
        if (this.lock) {
            this.queue.push([0, states_to_drop, exec_params, callback_params]);
            return;
        }
        this.lock = true;
        this.log_handler_("[*] Drop state " + states_to_drop.join(", "));
        states_before = this.is();

        		// Invert states to target ones.
        states = this.states_active.filter((state) => !~states_to_drop.indexOf(state));
        states = this.setupTargetStates_(states);

        		// TODO validate if transition still makes sense? like in set/add
        queue = this.queue;
        this.queue = [];
        ret = this.transition_(states, states_to_drop, exec_params, callback_params);
        this.queue = ret === false ? queue : queue.concat(this.queue);
        this.lock = false;
        ret = this.processQueue_(ret);

        		// If length equals and all previous states are set, we assume there
        		// wasnt any change
        length_equals = this.is().length === states_before.length;
        if (!(this.any(states_before)) || !length_equals) {
            this.processAutoStates();
        }
        return ret === false || this.allStatesNotSet(states_to_drop);
    }

    private processQueue_(previous_ret) {
        var ret, row;
        if (previous_ret === false) {
            			// Cancel the current queue.
            this.queue = [];
            return false;
        }
        ret = [];
        row = void 0;
        while (row = this.queue.shift()) {
            switch (row[0]) {
                case 0:
                    ret.push(this.drop(row[1], row[2], row[3]));
                    break;
                case 1:
                    ret.push(this.add(row[1], row[2], row[3]));
                    break;
                case 2:
                    ret.push(this.setState(row[1], row[2], row[3]));
                    break;
            }
        }
        return !~ret.indexOf(false);
    }

    private allStatesSet(states): boolean {
        return !states.reduce(((ret, state) => ret || !this.state(state)), false);
    }

    private allStatesNotSet(states): boolean {
        return !states.reduce(((ret, state) => ret || this.state(state)), false);
    }

    private namespaceTransition_(transition: string) {
        		// CamelCase to Camel.Case
        		// A_exit -> A.exit
        		// A_B -> A._.B
        return this.namespaceName(transition).replace(/_([a-z]+)$/, ".$1").replace("_", "._.");
    }

    	// Executes self transitions (eg ::A_A) based on active states.

    private selfTransitionExec_(states: string[], exec_params?: any[],
				callback_params?: any[] ) {
        var ret;
        if (exec_params == null) {
            exec_params = [];
        }
        if (callback_params == null) {
            callback_params = [];
        }
        ret = states.some((state) => {
            var event, method, name, transition_params;
            ret = void 0;
            name = state + "_" + state;
            method = this[name];
            if (method && ~this.states_active.indexOf(state)) {
                transition_params = [states].concat([exec_params], callback_params);
                ret = method.apply(this, transition_params);
                if (ret === false) {
                    return true;
                }
                event = this.namespaceTransition_(name);
                transition_params = [event, states].concat([exec_params], callback_params);
                return (this.trigger.apply(this, transition_params)) === false;
            }
        });
        return !ret;
    }

    private setupTargetStates_(states: string[], exclude?: string[]) {
        var already_blocked;
        if (exclude == null) {
            exclude = [];
        }

        		// Remove non existing states
        states = states.filter((name) => {
            var ret;
            ret = ~this.states_all.indexOf(name);
            if (!ret) {
                this.log_handler_("[i] State " + name + " doesn't exist");
            }
            return ret;
        });

        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);

        		// Check if state is blocked or excluded
        already_blocked = [];

        		// Remove states already blocked.
        states = states.reverse().filter((name) => {
            var blocked_by;
            blocked_by = this.isStateBlocked_(states, name);
            blocked_by = blocked_by.filter((blocker_name) => !~already_blocked.indexOf(blocker_name));

            if (blocked_by.length) {
                already_blocked.push(name);
                this.log_handler_("[i] State " + name + " blocked by " + (blocked_by.join(", ")));
            }
            return !blocked_by.length && !~exclude.indexOf(name);
        });

        return this.parseRequires_(states.reverse());
    }

    	// Collect implied states

    private parseImplies_(states: string[]): string[] {
        states.forEach((name) => {
            var state;
            state = this.get(name);
            if (!state.implies) {
                return;
            }
            return states = states.concat(state.implies);
        });

        return states;
    }

    	// Check required states
    	// Loop until no change happens, as state can requires themselves in a vector.

    private parseRequires_(states: string[]): string[] {
        var length_before;
        length_before = 0;
        while (length_before !== states.length) {
            length_before = states.length;
            states = states.filter((name) => {
                var state;
                state = this.get(name);
                return !(state.requires != null ? state.requires.reduce((function(memo, req) {
                    var found;
                    found = ~states.indexOf(req);
                    if (!found) {
                        this.log_handler_("[i] State " + name + " dropped as required state " + req + " 								is missing");
                    }
                    return memo || !found;
                }), false) : void 0);
            });
        }
        return states;
    }

    private removeDuplicateStates_(states: string[]): string[] {
        		// Remove duplicates.
        var states2;
        states2 = [];
        states.forEach((name) => {
            if (!~states2.indexOf(name)) {
                return states2.push(name);
            }
        });

        return states2;
    }

    private isStateBlocked_(states: string[], name: string): string[] {
        var blocked_by;
        blocked_by = [];
        states.forEach((name2) => {
            var state;
            state = this.get(name2);
            if (state.blocks && ~state.blocks.indexOf(name)) {
                return blocked_by.push(name2);
            }
        });

        return blocked_by;
    }

    private transition_(to: string[], explicit_states: string[], 
			exec_params?: any[], callback_params?: any[]) {
        var from, params, ret;
        if (exec_params == null) {
            exec_params = [];
        }
        if (callback_params == null) {
            callback_params = [];
        }

        		// TODO handle args
        if (!to.length) {
            return true;
        }

        		// Remove active states.
        from = this.states_active.filter((state) => !~to.indexOf(state));

        this.orderStates_(to);
        this.orderStates_(from);
        params = [exec_params].concat(callback_params);

        		// var wait = <Function[]>[]
        ret = from.some((state) => false === this.transitionExit_(state, to, explicit_states, params));

        if (ret === true) {
            return false;
        }
        ret = to.some((state) => {
            			// Skip transition if state is already active.
            var transition_params;
            if (~this.states_active.indexOf(state)) {
                return false;
            }
            if (~explicit_states.indexOf(state)) {
                transition_params = params;
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
        var all, previous;
        previous = this.states_active;
        all = this.states_all;
        this.states_active = target;
        		// Set states in LucidJS emitter
        		// TODO optimise these loops
        return all.forEach((state) => {
            if (~target.indexOf(state)) {
                				// if ( ! ~previous.indexOf( state ) )
                				// this.set( state + '.enter' );
                return this.set.clear(state + ".exit");
            } else {
                				// if ( ~previous.indexOf( state ) )
                return this.set.clear(state + ".enter");
                				// this.set( state + '.exit'
            }
        });
    }

    	// Exit transition handles state-to-state methods.

    private transitionExit_(from: string, to: string[], 
			explicit_states: string[], params: any[]) {
        var ret, transition, transition_params;
        if (~explicit_states.indexOf(from)) {
            transition_params = params;
        }
        if (transition_params == null) {
            transition_params = [];
        }
        ret = this.transitionExec_(from + "_exit", to, transition_params);
        if (ret === false) {
            return false;
        }

        		// Duplicate event for namespacing.
        transition = "exit." + this.namespaceName(from);
        ret = this.transitionExec_(transition, to, transition_params);
        if (ret === false) {
            return false;
        }
        ret = to.some(function(state) {
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

        		// TODO pass args to explicitly dropped states
        ret = (this.transitionExec_(from + "_any", to)) === false;
        return !ret;
    }

    private transitionEnter_(to: string, target_states: string[], 
			params: any[]) {
        var event_args, ret;
        ret = this.transitionExec_("any_" + to, target_states, params);
        if (ret === false) {
            return false;
        }
        ret = this.transitionExec_(to + "_enter", target_states, params);
        if (ret === false) {
            return false;
        }

        		// Duplicate event for namespacing.
        event_args = ["enter." + (this.namespaceName(to)), target_states];
        ret = this.trigger.apply(this, event_args.concat(params));
        return ret;
    }

    private transitionExec_(method: string, target_states: string[], 
			params?: string[]) {
        var event, fn, ret, transition_params;
        if (params == null) {
            params = [];
        }
        transition_params = [target_states].concat(params);
        ret = void 0;
        event = this.namespaceTransition_(method);
        if (this.log_handler_) {
            this.log_handler_(event);
        }
        if (this[method] instanceof Function) {
            ret = this[method].apply(this, transition_params);
        }

        		// TODO reduce this 2 log msgs to 1
        if (ret !== false) {
            if (~event.indexOf("_")) {
                fn = "trigger";
            }
            if (fn == null) {
                fn = "set";
            }
            ret = this[fn](event, transition_params);
            if (ret === false) {
                this.log_handler_("[i] Transition event " + event + " cancelled");
            }
        }
        if (ret === false) {
            this.log_handler_("[i] Transition method " + method + " cancelled");
        }
        return ret;
    }

    	// is_exit tells that the order is exit transitions

    private orderStates_(states: string[]): void {
        states.sort(function(e1, e2) {
            var ret, state1, state2;
            state1 = this.get(e1);
            state2 = this.get(e2);
            ret = 0;
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
