// TimeAddress
///<reference path="../headers/node.d.ts" />
///<reference path="../headers/eventemitter2.d.ts" />
///<reference path="../headers/rsvp.d.ts" />
///<reference path="../headers/es5-shim.d.ts" />
var rsvp = require('rsvp')
var Promise = rsvp.Promise;
require('es5-shim');
//autostart: bool;
//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
var MultiStateMachine = (function () {
    function MultiStateMachine(state, config) {
        this.config = config;
        this.disabled = false;
        // super()
        state = Array.isArray(state) ? state : [
            state
        ];
        this.prepareStates();
        this.setState(state);
    }
    // Tells if a state is active now.
        MultiStateMachine.prototype.state = function (name) {
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states_active;
    }// Activate certain states and deactivate the current ones.
    ;
    MultiStateMachine.prototype.setState = function (states) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var states = Array.isArray(states) ? states : [
            states
        ];
        states = this.setupTargetStates_(states);
        var ret = this.transition_(states, args);
        return ret === false ? false : this.allStatesSet(states);
    };
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
            _this.setState.apply(_this, rest);
        });
        return promise;
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
        // Remove duplicate states.
        states = this.states_active.filter(function (state) {
            return !~states_to_drop.indexOf(state);
        });
        states = this.setupTargetStates_(states);
        this.transition_(states, args);
        return this.allStatesNotSet(states);
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
            _this.dropState.apply(_this, rest);
        });
        return promise;
    }// Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    ;
    MultiStateMachine.prototype.pushState = function (states) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var states = Array.isArray(states) ? states : [
            states
        ];
        // Filter non existing states.
        states = this.setupTargetStates_(this.states_active.concat(states));
        var ret = this.transition_(states, args);
        return ret === false ? false : this.allStatesSet(states);
    }// Curried version of pushState
    ;
    MultiStateMachine.prototype.pushStateLater = function (states) {
        var _this = this;
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            rest[_i] = arguments[_i + 1];
        }
        var args = arguments;
        var promise = new Promise();
        promise.then(function () {
            _this.pushState.apply(_this, args);
        });
        return promise;
    };
    MultiStateMachine.prototype.prepareStates = function () {
        var states = [];
        for(var name in this) {
            var match = name.match(/^state_(.+)/);
            if(match) {
                states.push(match[1]);
            }
        }
        this.states = states;
        this.states_active = [];
    };
    MultiStateMachine.prototype.getState_ = function (name) {
        return this['state_' + name];
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
        states = states.filter(function (name) {
            var blocked = _this.isStateBlocked_(states, name);
            return !blocked && !~exclude.indexOf(name);
        });
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
        var blocked = false;
        states.forEach(function (name2) {
            var state = _this.getState_(name2);
            if(state.blocks && ~state.blocks.indexOf(name)) {
                blocked = true;
            }
        });
        return blocked;
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
        var method;
        var callbacks = [];

        if(this.transitionExec_(from + '_exit', to) === false) {
            return false;
        }
        var ret = to.some(function (state) {
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
        var method;
        var callbacks = [];

        //      from.forEach( (state: string) => {
        //        this.transitionExec_( state + '_' + to )
        //      })
        if(this.transitionExec_('any_' + to, target_states) === false) {
            return false;
        }
        // TODO trigger the enter transitions (all of them) after all other middle
        // transitions (any_ etc)
        var ret = this.transitionExec_(to + '_enter', target_states) === false;
        return ret === true ? false : true;
    };
    MultiStateMachine.prototype.transitionExec_ = function (method, target_states) {
        // TODO refactor to event, return async callback
        if(this[method] instanceof Function) {
            return this[method].call(this, target_states);
        }
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
    };
    return MultiStateMachine;
})();
exports.MultiStateMachine = MultiStateMachine;

//@ sourceMappingURL=multistatemachine.js.map
