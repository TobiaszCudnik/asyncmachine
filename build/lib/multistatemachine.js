var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="headers/node.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />
var LucidJS = require('lucidjs')//; required!

var rsvp = require('rsvp')
var Promise = rsvp.Promise;
(function (multistatemachine) {
    require('es5-shim');
    //autostart: bool;
    //export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
    var MultiStateMachine = (function () {
        function MultiStateMachine(state, config) {
            this.config = config;
            this.disabled = false;
            LucidJS.emitter(this);
            if(config && config.debug) {
                this.debugStates();
            }
            state = Array.isArray(state) ? state : [
                state
            ];
            this.initStates(state);
        }
        // Prepare class'es states. Required to be called manually for inheriting classes.
                MultiStateMachine.prototype.initStates = function (state) {
            var states = [];
            for(var name in this) {
                var match = name.match(/^state_(.+)/);
                if(match) {
                    states.push(match[1]);
                }
            }
            this.states = states;
            this.states_active = [];
            this.setState(state);
        }// Tells if a state is active now.
        ;
        MultiStateMachine.prototype.state = function (name) {
            if(name) {
                return !!~this.states_active.indexOf(name);
            }
            return this.states_active;
        }// Activate certain states and deactivate the current ones.
        ;
        MultiStateMachine.prototype.setState = function (states) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            var states_to_set = Array.isArray(states) ? states : [
                states
            ];
            if(this.selfTransitionExec_(states_to_set, args) === false) {
                return false;
            }
            states = this.setupTargetStates_(states_to_set);
            //console.log('setState1', states_to_set)
            //console.log('current', this.states_active)
            //console.log('setState2', states)
            var ret = this.transition_(states, args);
            return ret === false ? false : this.allStatesSet(states_to_set);
        }// Curried version of setState.
        ;
        MultiStateMachine.prototype.setStateLater = function (states) {
            var _this = this;
            var rest = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                rest[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                _this.setState.apply(_this, [].concat(states, rest));
            });
            return this.last_promise = promise;
        }// Deactivate certain states.
        ;
        MultiStateMachine.prototype.dropState = function (states) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            var states_to_drop = Array.isArray(states) ? states : [
                states
            ];
            // Invert states to target ones.
            states = this.states_active.filter(function (state) {
                return !~states_to_drop.indexOf(state);
            });
            states = this.setupTargetStates_(states);
            this.transition_(states, args);
            return this.allStatesNotSet(states_to_drop);
        }// Deactivate certain states.
        ;
        MultiStateMachine.prototype.dropStateLater = function (states) {
            var _this = this;
            var rest = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                rest[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                _this.dropState.apply(_this, [].concat(states, rest));
            });
            return this.last_promise = promise;
        }// Activate certain states and keep the current ones.
        // TODO Maybe avoid double concat of states_active
        ;
        MultiStateMachine.prototype.addState = function (states) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            var states_to_add = Array.isArray(states) ? states : [
                states
            ];
            if(this.selfTransitionExec_(states_to_add, args) === false) {
                return false;
            }
            states = states_to_add.concat(this.states_active);
            //console.log('states1', states)
            //console.log('current', this.states_active)
            states = this.setupTargetStates_(states);
            //console.log('states2', states)
            var ret = this.transition_(states, args);
            return ret === false ? false : this.allStatesSet(states_to_add);
        }// Curried version of addState
        ;
        MultiStateMachine.prototype.addStateLater = function (states) {
            var _this = this;
            var rest = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                rest[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                _this.addState.apply(_this, [].concat(states, rest));
            });
            return this.last_promise = promise;
            //    private trasitions: string[];
                    };
        MultiStateMachine.prototype.pipeForward = function (state, machine, target_state) {
            var _this = this;
            if(state instanceof MultiStateMachine) {
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
        MultiStateMachine.prototype.pipeInvert = function (state, machine, target_state) {
            state = this.namespaceStateName(state);
            this.on(state + '.enter', function () {
                machine.dropState(target_state);
            });
            this.on(state + '.exit', function () {
                machine.addState(target_state);
            });
        };
        MultiStateMachine.prototype.pipeOff = function () {
        }// TODO use a regexp lib for IE8's 'g' flag compat?
        ;
        MultiStateMachine.prototype.namespaceStateName = function (state) {
            // CamelCase to Camel.Case
            return state.replace(/([a-zA-Z])([A-Z])/g, '$1.$2');
        };
        MultiStateMachine.prototype.defineState = function (name, config) {
            throw new Error('not implemented yet');
        };
        MultiStateMachine.prototype.debugStates = function (prefix) {
            if(this.debug_states_) {
                // OFF
                this.trigger = this.debug_states_;
                delete this.debug_states_;
            } else {
                // ON
                this.debug_states_ = this.trigger;
                this.trigger = function (event) {
                    var args = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        args[_i] = arguments[_i + 1];
                    }
                    prefix = prefix || '';
                    console.log(prefix + event);
                    return this.debug_states_.apply(this, [].concat([
                        event
                    ], args));
                };
            }
        };
        MultiStateMachine.prototype.initMSM = function (state, config) {
            MultiStateMachine.apply(this, arguments);
        }// Mixin multistatemachine into a prototype of another constructor.
        ;
        MultiStateMachine.mixin = function mixin(prototype) {
            var _this = this;
            Object.keys(this.prototype).forEach(function (key) {
                prototype[key] = _this.prototype[key];
            });
        }
        ////////////////////////////
        // PRIVATES
        ////////////////////////////
                MultiStateMachine.prototype.allStatesSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || !_this.state(state);
            }, false);
        };
        MultiStateMachine.prototype.allStatesNotSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || _this.state(state);
            }, false);
        };
        MultiStateMachine.prototype.namespaceTransition_ = function (transition) {
            // CamelCase to Camel.Case
            return this.namespaceStateName(transition).replace(// A_exit -> A.exit
            /_([a-z]+)$/, '.$1').replace(// A_B -> A._.B
            '_', '._.');
        };
        MultiStateMachine.prototype.getState_ = function (name) {
            return this['state_' + name];
        }// Executes self transitions (eg ::A_A) based on active states.
        ;
        MultiStateMachine.prototype.selfTransitionExec_ = function (states, args) {
            var _this = this;
            var ret = states.some(function (state) {
                var ret, name = state + '_' + state;
                var method = _this[name];
                if(method && ~_this.states_active.indexOf(state)) {
                    ret = method();
                    if(ret === false) {
                        return true;
                    }
                    var event = _this.namespaceTransition_(name);
                    return _this.trigger(event, args) === false;
                }
            });
            return ret === true ? false : true;
        };
        MultiStateMachine.prototype.setupTargetStates_ = function (states, exclude) {
            if (typeof exclude === "undefined") { exclude = []; }
            var _this = this;
            // Remove non existing states
            states = states.filter(function (name) {
                return ~_this.states.indexOf(name);
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
                }
                return !blocked_by.length && !~exclude.indexOf(name);
            }).reverse();
            return this.parseRequires_(states);
        }// Collect implied states
        ;
        MultiStateMachine.prototype.parseImplies_ = function (states) {
            var _this = this;
            states.forEach(function (name) {
                var state = _this.getState_(name);
                if(!state.implies) {
                    return;
                }
                states = states.concat(state.implies);
            });
            return states;
        }// Check required states (until no change happens)
        ;
        MultiStateMachine.prototype.parseRequires_ = function (states) {
            var _this = this;
            var missing = true;
            while(missing) {
                missing = false;
                states = states.filter(function (name) {
                    var state = _this.getState_(name);
                    missing = (state.requires || []).reduce(function (memo, req) {
                        return memo || !~states.indexOf(req);
                    }, false);
                    return !missing;
                });
            }
            return states;
        };
        MultiStateMachine.prototype.removeDuplicateStates_ = function (states) {
            // Remove duplicates.
            var states2 = [];
            states.forEach(function (name) {
                if(!~states2.indexOf(name)) {
                    states2.push(name);
                }
            });
            return states2;
        };
        MultiStateMachine.prototype.isStateBlocked_ = function (states, name) {
            var _this = this;
            var blocked_by = [];
            states.forEach(function (name2) {
                var state = _this.getState_(name2);
                if(state.blocks && ~state.blocks.indexOf(name)) {
                    blocked_by.push(name2);
                }
            });
            return blocked_by;
        };
        MultiStateMachine.prototype.transition_ = function (to, args) {
            var _this = this;
            // TODO handle args
            if(!to.length) {
                return true;
            }
            // Collect states to drop, based on the target states.
            var from = this.states_active.filter(function (state) {
                return !~to.indexOf(state);
            });
            this.orderStates_(to);
            this.orderStates_(from);
            // var wait = <Function[]>[]
            var ret = from.some(function (state) {
                return _this.transitionExit_(state, to) === false;
            });
            if(ret === true) {
                return false;
            }
            ret = to.some(function (state) {
                // Skip transition if state is already active.
                if(~_this.states_active.indexOf(state)) {
                    return false;
                }
                return _this.transitionEnter_(state, to) === false;
            });
            if(ret === true) {
                return false;
            }
            this.states_active = to;
            return true;
        }// Exit transition handles state-to-state methods.
        ;
        MultiStateMachine.prototype.transitionExit_ = function (from, to) {
            var _this = this;
            var method, callbacks = [];
            if(this.transitionExec_(from + '_exit', to) === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var ret = this.transitionExec_('exit.' + this.namespaceStateName(from), to);
            if(ret === false) {
                return false;
            }
            ret = to.some(function (state) {
                return _this.transitionExec_(from + '_' + state, to) === false;
            });
            if(ret === true) {
                return false;
            }
            // TODO trigger the exit transitions (all of them) after all other middle
            // transitions (_any etc)
            ret = this.transitionExec_(from + '_any', to) === false;
            return ret === true ? false : true;
        };
        MultiStateMachine.prototype.transitionEnter_ = function (to, target_states) {
            var method, callbacks = [];
            //      from.forEach( (state: string) => {
            //        this.transitionExec_( state + '_' + to )
            //      })
            if(this.transitionExec_('any_' + to, target_states) === false) {
                return false;
            }
            // TODO trigger the enter transitions (all of them) after all other middle
            // transitions (any_ etc)
            if(ret = this.transitionExec_(to + '_enter', target_states) === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var ret = this.trigger('enter.' + this.namespaceStateName(to), target_states);
            return ret === false ? false : true;
        };
        MultiStateMachine.prototype.transitionExec_ = function (method, target_states, args) {
            if (typeof args === "undefined") { args = []; }
            args = [].concat([
                target_states
            ], args);
            var ret;
            if(this[method] instanceof Function) {
                ret = this[method].apply(this, args);
                if(ret === false) {
                    return false;
                }
            }
            return this.trigger(this.namespaceTransition_(method), args);
        }// is_exit tells that the order is exit transitions
        ;
        MultiStateMachine.prototype.orderStates_ = function (states) {
            var _this = this;
            states.sort(function (e1, e2) {
                var state1 = _this.getState_(e1);
                var state2 = _this.getState_(e2);
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
        MultiStateMachine.prototype.on = function (event, VarArgsBoolFn) {
        };
        MultiStateMachine.prototype.once = function (event, VarArgsBoolFn) {
        };
        MultiStateMachine.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return true;
        };
        MultiStateMachine.prototype.set = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return true;
        };
        return MultiStateMachine;
    })();
    multistatemachine.AsyncMachine = MultiStateMachine;
    // Support LucidJS mixin
    // TODO make it sucks less
    delete MultiStateMachine.prototype.on;
    delete MultiStateMachine.prototype.once;
    delete MultiStateMachine.prototype.trigger;
    delete MultiStateMachine.prototype.set;
})(exports.multistatemachine || (exports.multistatemachine = {}));
var multistatemachine = exports.multistatemachine;
// Fake class for sane export.
var MultiStateMachine = (function (_super) {
    __extends(MultiStateMachine, _super);
    function MultiStateMachine() {
        _super.apply(this, arguments);

    }
    return MultiStateMachine;
})(multistatemachine.AsyncMachine);
exports.MultiStateMachine = MultiStateMachine;
//@ sourceMappingURL=multistatemachine.js.map
