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
        var states = Array.isArray(states) ? states : [
            states
        ];
        states = this.setupTargetStates_(states);
        this.transition_(states);
    }// Deactivate certain states.
    // TODO
    ;
    MultiStateMachine.prototype.dropState = function (states) {
        var states_to_drop = Array.isArray(states) ? states : [
            states
        ];
        // Remove duplicate states.
        states = this.states_active.filter(function (state) {
            return !~states_to_drop.indexOf(state);
        });
        states = this.setupTargetStates_(states);
        this.transition_(states);
    }// Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    ;
    MultiStateMachine.prototype.addState = function (states) {
        var states = Array.isArray(states) ? states : [
            states
        ];
        // Filter non existing states.
        states = this.setupTargetStates_(this.states_active.concat(states));
        this.transition_(states);
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
    MultiStateMachine.prototype.transition_ = function (to) {
        var _this = this;
        if(!to.length) {
            return;
        }
        // Collect states to drop, based on the target states.
        var from = this.states_active.filter(function (state) {
            return !~to.indexOf(state);
        });
        this.orderStates_(to);
        this.orderStates_(from);
        // var wait = <Function[]>[]
        from.forEach(function (state) {
            _this.transitionExit_(state, to);
        });
        to.forEach(function (state) {
            // Skip transition if state is already active.
            if(~_this.states_active.indexOf(state)) {
                return;
            }
            _this.transitionEnter_(state);
        });
        this.states_active = to;
    }// Exit transition handles state-to-state methods.
    ;
    MultiStateMachine.prototype.transitionExit_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        this.transitionExec_(from + '_exit');
        to.forEach(function (state) {
            _this.transitionExec_(from + '_' + state);
        });
        // TODO trigger the exit transitions (all of them) after all other middle
        // transitions (_any etc)
        this.transitionExec_(from + '_any');
    };
    MultiStateMachine.prototype.transitionEnter_ = function (to) {
        var method;
        var callbacks = [];

        //      from.forEach( (state: string) => {
        //        this.transitionExec_( state + '_' + to )
        //      })
        this.transitionExec_('any_' + to);
        // TODO trigger the enter transitions (all of them) after all other middle
        // transitions (any_ etc)
        this.transitionExec_(to + '_enter');
    };
    MultiStateMachine.prototype.transitionExec_ = function (method) {
        // TODO refactor to event, return async callback
        if(this[method] instanceof Function) {
            this[method]();
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
