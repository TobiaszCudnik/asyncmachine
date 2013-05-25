var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="headers/commonjs.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />
(function (asyncmachine) {
    var LucidJS = require('lucidjs')//; required!
    
    var rsvp = require('rsvp')
    var Promise = rsvp.Promise;
    require('es5-shim');
    //export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
    var AsyncMachine = (function () {
        function AsyncMachine(state, config) {
            this.config = config;
            this.debug_states_ = false;
            this.queue = [];
            this.states = [];
            this.states_active = [];
            this.lock = false;
            LucidJS.emitter(this);
            if(config && config.debug) {
                this.debugStates();
            }
            if(state) {
                state = Array.isArray(state) ? state : [
                    state
                ];
                this.initStates(state);
            }
        }
        // Prepare class'es states. Required to be called manually for inheriting classes.
                AsyncMachine.prototype.initStates = function (state) {
            var states = [];
            for(var name in this) {
                var match = name.match(/^state_(.+)/);
                if(match) {
                    states.push(match[1]);
                }
            }
            this.states = states;
            this.setState(state);
        };
        AsyncMachine.prototype.getState = function (name) {
            return this['state_' + name] || (this).constructor['state_' + name];
        }// Tells if a state is active now.
        ;
        AsyncMachine.prototype.state = function (name) {
            var _this = this;
            if(name) {
                if(Array.isArray(name)) {
                    return name.every(function (name) {
                        return ~_this.states_active.indexOf(name);
                    });
                } else {
                    return !!~this.states_active.indexOf(name);
                }
            }
            return this.states_active;
        }// Activate certain states and deactivate the current ones.
        ;
        AsyncMachine.prototype.setState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.setState_(states, params);
        }// Curried version of setState.
        ;
        AsyncMachine.prototype.setStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.setState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        }// Activate certain states and keep the current ones.
        ;
        AsyncMachine.prototype.addState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.addState_(states, params);
        }// Curried version of addState
        ;
        AsyncMachine.prototype.addStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.addState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        }// Deactivate certain states.
        ;
        AsyncMachine.prototype.dropState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.dropState_(states, params);
        }// Deactivate certain states.
        ;
        AsyncMachine.prototype.dropStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.dropState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        };
        AsyncMachine.prototype.pipeForward = function (state, machine, target_state) {
            var _this = this;
            if(state instanceof AsyncMachine) {
                target_state = machine;
                machine = state;
                state = this.states;
            }
            [].concat(state).forEach(function (state) {
                var new_state = target_state || state;
                state = _this.namespaceStateName(state);
                _this.on(state + '.enter', function () {
                    return machine.addState(new_state);
                });
                _this.on(state + '.exit', function () {
                    return machine.dropState(new_state);
                });
            });
        };
        AsyncMachine.prototype.pipeInvert = function (state, machine, target_state) {
            state = this.namespaceStateName(state);
            this.on(state + '.enter', function () {
                machine.dropState(target_state);
            });
            this.on(state + '.exit', function () {
                machine.addState(target_state);
            });
        };
        AsyncMachine.prototype.pipeOff = function () {
            throw new Error('not implemented yet');
        }// TODO use a regexp lib for IE8's 'g' flag compat?
        ;
        AsyncMachine.prototype.namespaceStateName = function (state) {
            // CamelCase to Camel.Case
            return state.replace(/([a-zA-Z])([A-Z])/g, '$1.$2');
        };
        AsyncMachine.prototype.defineState = function (name, config) {
            throw new Error('not implemented yet');
        };
        AsyncMachine.prototype.debugStates = function (prefix, log_handler) {
            this.debug_states_ = !this.debug_states_;
            if(this.debug_states_) {
                this.log_handler_ = function () {
                    var msgs = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        msgs[_i] = arguments[_i + 0];
                    }
                    var args = prefix ? [
                        prefix
                    ].concat(msgs) : msgs;
                    log_handler.apply(null, args);
                };
            }
        };
        AsyncMachine.prototype.amLog = function () {
            var msgs = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                msgs[_i] = arguments[_i + 0];
            }
            if(!this.debug_states_) {
                return;
            }
            var a = arguments;
            // ie6 love
            if(console.log.apply) {
                console.log.apply(console, arguments);
            } else {
                console.log(a[0], a[1]);
            }
        }// Initializes the mixin.
        ;
        AsyncMachine.prototype.initAsyncMachine = function (state, config) {
            AsyncMachine.apply(this, arguments);
        }// Mixin asyncmachine into a prototype of another constructor.
        ;
        AsyncMachine.mixin = function mixin(prototype) {
            var _this = this;
            Object.keys(this.prototype).forEach(function (key) {
                prototype[key] = _this.prototype[key];
            });
        }
        AsyncMachine.mergeState = function mergeState(name) {
            // TODO merge a state with the given name with the super
            // class' state
            // TODO2 merge by a definition
                    }
        ////////////////////////////
        // PRIVATES
        ////////////////////////////
                AsyncMachine.prototype.processAutoStates = function (excluded) {
            if (typeof excluded === "undefined") { excluded = []; }
            var _this = this;
            var add = [];
            this.states.forEach(function (state) {
                var is_excluded = ~excluded.indexOf(state);
                var is_current = _this.state(state);
                if(_this.getState(state).auto && !is_excluded && !is_current) {
                    add.push(state);
                }
            });
            return this.addState(add);
        };
        AsyncMachine.prototype.setState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_set = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_set.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    2, 
                    states_to_set, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Set state ' + states_to_set.join(', '));
            }
            var states_before = this.state();
            var ret = this.selfTransitionExec_(states_to_set, exec_params, callback_params);
            if(ret === false) {
                return false;
            }
            states = this.setupTargetStates_(states_to_set);
            var states_to_set_valid = states_to_set.some(function (state) {
                return ~states.indexOf(state);
            });
            if(!states_to_set_valid) {
                if(this.log_handler_) {
                    this.log_handler_('[i] Transition cancelled, as target ' + 'states wasn\'t accepted');
                }
                return this.lock = false;
            }
            var queue = this.queue;
            this.queue = [];
            ret = this.transition_(states, states_to_set, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false ? false : this.allStatesSet(states_to_set);
        }// TODO Maybe avoid double concat of states_active
        ;
        AsyncMachine.prototype.addState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_add = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_add.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    1, 
                    states_to_add, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Add state ' + states_to_add.join(', '));
            }
            var states_before = this.state();
            var ret = this.selfTransitionExec_(states_to_add, exec_params, callback_params);
            if(ret === false) {
                return false;
            }
            states = states_to_add.concat(this.states_active);
            states = this.setupTargetStates_(states);
            var states_to_add_valid = states_to_add.some(function (state) {
                return ~states.indexOf(state);
            });
            if(!states_to_add_valid) {
                if(this.log_handler_) {
                    this.log_handler_('[i] Transition cancelled, as target ' + 'states wasn\'t accepted');
                }
                return this.lock = false;
            }
            var queue = this.queue;
            this.queue = [];
            ret = this.transition_(states, states_to_add, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false ? false : this.allStatesSet(states_to_add);
        };
        AsyncMachine.prototype.dropState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_drop = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_drop.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    0, 
                    states_to_drop, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Drop state ' + states_to_drop.join(', '));
            }
            var states_before = this.state();
            // Invert states to target ones.
            states = this.states_active.filter(function (state) {
                return !~states_to_drop.indexOf(state);
            });
            states = this.setupTargetStates_(states);
            // TODO validate if transition still makes sense? like in set/add
            var queue = this.queue;
            this.queue = [];
            var ret = this.transition_(states, states_to_drop, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false || this.allStatesNotSet(states_to_drop);
        };
        AsyncMachine.prototype.processQueue_ = function (previous_ret) {
            if(previous_ret === false) {
                // Cancel the current queue.
                this.queue = [];
                return false;
            }
            var ret = [], row;
            while(row = this.queue.shift()) {
                switch(row[0]) {
                    case 0: {
                        ret.push(this.dropState(row[1], row[2], row[3]));
                        break;

                    }
                    case 1: {
                        ret.push(this.addState(row[1], row[2], row[3]));
                        break;

                    }
                    case 2: {
                        ret.push(this.setState(row[1], row[2], row[3]));
                        break;

                    }
                }
            }
            return !~ret.indexOf(false);
        };
        AsyncMachine.prototype.allStatesSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || !_this.state(state);
            }, false);
        };
        AsyncMachine.prototype.allStatesNotSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || _this.state(state);
            }, false);
        };
        AsyncMachine.prototype.namespaceTransition_ = function (transition) {
            // CamelCase to Camel.Case
            return this.namespaceStateName(transition).replace(// A_exit -> A.exit
            /_([a-z]+)$/, '.$1').replace(// A_B -> A._.B
            '_', '._.');
        }// Executes self transitions (eg ::A_A) based on active states.
        ;
        AsyncMachine.prototype.selfTransitionExec_ = function (states, exec_params, callback_params) {
            if (typeof exec_params === "undefined") { exec_params = []; }
            if (typeof callback_params === "undefined") { callback_params = []; }
            var _this = this;
            var ret = states.some(function (state) {
                var ret, name = state + '_' + state;
                var method = _this[name];
                if(method && ~_this.states_active.indexOf(state)) {
                    var transition_params = [
                        states
                    ].concat([
                        exec_params
                    ], callback_params);
                    ret = method.apply(_this, transition_params);
                    if(ret === false) {
                        return true;
                    }
                    var event = _this.namespaceTransition_(name);
                    transition_params = [
                        event, 
                        states
                    ].concat([
                        exec_params
                    ], callback_params);
                    return _this.trigger.apply(_this, transition_params) === false;
                }
            });
            return ret === true ? false : true;
        };
        AsyncMachine.prototype.setupTargetStates_ = function (states, exclude) {
            if (typeof exclude === "undefined") { exclude = []; }
            var _this = this;
            // Remove non existing states
            states = states.filter(function (name) {
                var ret = ~_this.states.indexOf(name);
                if(!ret && _this.log_handler_) {
                    _this.log_handler_('[i] State ' + name + ' doesn\'t exist');
                }
                return ret;
            });
            states = this.parseImplies_(states);
            states = this.removeDuplicateStates_(states);
            // Check if state is blocked or excluded
            var already_blocked = [];
            states = states.reverse().filter(function (name) {
                var blocked_by = _this.isStateBlocked_(states, name);
                // Remove states already blocked.
                blocked_by = blocked_by.filter(function (blocker_name) {
                    return !~already_blocked.indexOf(blocker_name);
                });
                if(blocked_by.length) {
                    already_blocked.push(name);
                    if(_this.log_handler_) {
                        _this.log_handler_('[i] State ' + name + ' blocked by ' + blocked_by.join(', '));
                    }
                }
                return !blocked_by.length && !~exclude.indexOf(name);
            }).reverse();
            return this.parseRequires_(states);
        }// Collect implied states
        ;
        AsyncMachine.prototype.parseImplies_ = function (states) {
            var _this = this;
            states.forEach(function (name) {
                var state = _this.getState(name);
                if(!state.implies) {
                    return;
                }
                states = states.concat(state.implies);
            });
            return states;
        }// Check required states
        // Loop until no change happens, as state can requires themselves in a vector.
        ;
        AsyncMachine.prototype.parseRequires_ = function (states) {
            var _this = this;
            var length_before = 0, length_after;
            while(length_before != states.length) {
                length_before = states.length;
                states = states.filter(function (name) {
                    var state = _this.getState(name);
                    return !(state.requires || []).reduce(function (memo, req) {
                        var found = ~states.indexOf(req);
                        if(!found && _this.log_handler_) {
                            _this.log_handler_('[i] State ' + name + ' dropped as required state ' + req + ' is missing');
                        }
                        return memo || !found;
                    }, false);
                });
            }
            return states;
        };
        AsyncMachine.prototype.removeDuplicateStates_ = function (states) {
            // Remove duplicates.
            var states2 = [];
            states.forEach(function (name) {
                if(!~states2.indexOf(name)) {
                    states2.push(name);
                }
            });
            return states2;
        };
        AsyncMachine.prototype.isStateBlocked_ = function (states, name) {
            var _this = this;
            var blocked_by = [];
            states.forEach(function (name2) {
                var state = _this.getState(name2);
                if(state.blocks && ~state.blocks.indexOf(name)) {
                    blocked_by.push(name2);
                }
            });
            return blocked_by;
        };
        AsyncMachine.prototype.transition_ = function (to, explicit_states, exec_params, callback_params) {
            if (typeof exec_params === "undefined") { exec_params = []; }
            if (typeof callback_params === "undefined") { callback_params = []; }
            var _this = this;
            // TODO handle args
            if(!to.length) {
                return true;
            }
            // Remove active states.
            var from = this.states_active.filter(function (state) {
                return !~to.indexOf(state);
            });
            this.orderStates_(to);
            this.orderStates_(from);
            var params = [
                exec_params
            ].concat(callback_params);
            // var wait = <Function[]>[]
            var ret = from.some(function (state) {
                var ret = _this.transitionExit_(state, to, explicit_states, params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            ret = to.some(function (state) {
                // Skip transition if state is already active.
                if(~_this.states_active.indexOf(state)) {
                    return false;
                }
                var transition_params = ~explicit_states.indexOf(state) ? params : [];
                var ret = _this.transitionEnter_(state, to, transition_params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            this.setActiveStates_(to);
            return true;
        };
        AsyncMachine.prototype.setActiveStates_ = function (target) {
            var _this = this;
            var previous = this.states_active;
            var all = this.states;
            this.states_active = target;
            // Set states in LucidJS emitter
            // TODO optimise these loops
            all.forEach(function (state) {
                if(~target.indexOf(state)) {
                    //					if ( ! ~previous.indexOf( state ) )
                    //						this.set( state + '.enter' );
                    (_this.set).clear(state + '.exit');
                } else {
                    //					if ( ~previous.indexOf( state ) )
                    (_this.set).clear(state + '.enter');
                    //					this.set( state + '.exit' )
                                    }
            });
        }// Exit transition handles state-to-state methods.
        ;
        AsyncMachine.prototype.transitionExit_ = function (from, to, explicit_states, params) {
            var _this = this;
            var method, callbacks = [];
            var transition_params = ~explicit_states.indexOf(from) ? params : [];
            var ret = this.transitionExec_(from + '_exit', to, transition_params);
            if(ret === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var transition = 'exit.' + this.namespaceStateName(from);
            ret = this.transitionExec_(transition, to, transition_params);
            if(ret === false) {
                return false;
            }
            ret = to.some(function (state) {
                var transition = from + '_' + state;
                var transition_params = ~explicit_states.indexOf(state) ? params : [];
                var ret = _this.transitionExec_(transition, to, transition_params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            // TODO pass args to explicitly dropped states
            ret = this.transitionExec_(from + '_any', to) === false;
            return ret === true ? false : true;
        };
        AsyncMachine.prototype.transitionEnter_ = function (to, target_states, params) {
            var method, callbacks = [];
            var ret = this.transitionExec_('any_' + to, target_states, params);
            if(ret === false) {
                return false;
            }
            ret = this.transitionExec_(to + '_enter', target_states, params);
            if(ret === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var event_args = [
                'enter.' + this.namespaceStateName(to), 
                target_states
            ];
            ret = this.trigger.apply(this, event_args.concat(params));
            return ret === false ? false : true;
        };
        AsyncMachine.prototype.transitionExec_ = function (method, target_states, params) {
            if (typeof params === "undefined") { params = []; }
            params = [].concat([
                target_states
            ], params);
            var ret, event = this.namespaceTransition_(method);
            if(this.log_handler_) {
                this.log_handler_(event);
            }
            if(this[method] instanceof Function) {
                ret = this[method].apply(this, params);
            }
            // TODO reduce this 2 log msgs to 1
            if(ret !== false) {
                var fn = ~event.indexOf('_') ? 'trigger' : 'set';
                ret = this[fn](event, params);
                if(ret === false && this.log_handler_) {
                    this.log_handler_('[i] Transition event ' + event + ' cancelled');
                }
            }
            if(ret === false && this.log_handler_) {
                this.log_handler_('[i] Transition method ' + method + ' cancelled');
            }
            return ret;
        }// is_exit tells that the order is exit transitions
        ;
        AsyncMachine.prototype.orderStates_ = function (states) {
            var _this = this;
            states.sort(function (e1, e2) {
                var state1 = _this.getState(e1);
                var state2 = _this.getState(e2);
                var ret = 0;
                if(state1.depends && ~state1.depends.indexOf(e2)) {
                    ret = 1;
                } else {
                    if(state2.depends && ~state2.depends.indexOf(e1)) {
                        ret = -1;
                    }
                }
                return ret;
            });
        }// Event Emitter interface
        // TODO cover as mixin in the d.ts file
        ;
        AsyncMachine.prototype.on = function (event, VarArgsBoolFn) {
            return {
            };
        };
        AsyncMachine.prototype.once = function (event, VarArgsBoolFn) {
            return {
            };
        };
        AsyncMachine.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return true;
        };
        AsyncMachine.prototype.set = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return {
            };
        };
        return AsyncMachine;
    })();
    asyncmachine.AsyncMachine = AsyncMachine;    
    // Support LucidJS mixin
    // TODO make it sucks less
    delete AsyncMachine.prototype.on;
    delete AsyncMachine.prototype.once;
    delete AsyncMachine.prototype.trigger;
    delete AsyncMachine.prototype.set;
})(exports.asyncmachine || (exports.asyncmachine = {}));
var asyncmachine = exports.asyncmachine;
// Fake class for sane export.
var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
    function AsyncMachine() {
        _super.apply(this, arguments);

    }
    return AsyncMachine;
})(asyncmachine.AsyncMachine);
exports.AsyncMachine = AsyncMachine;
//export class Task extends asyncmachine.Task {}
//@ sourceMappingURL=asyncmachine.js.map
