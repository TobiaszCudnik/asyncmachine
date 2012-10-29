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
    MultiStateMachine.prototype.prepareStates = function () {
        var states = [];
        for(var name in this) {
            var match = name.match(/^state_(.+)/);
            if(match) {
                states.push(match[1]);
            }
        }
        this.states = states;
    }// Tells if a state is active now.
    ;
    MultiStateMachine.prototype.state = function (name) {
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states_active;
    };
    MultiStateMachine.prototype.getState = function (name) {
        return this['state_' + name];
    };
    MultiStateMachine.prototype.setState = function (states) {
        var _this = this;
        var states = Array.isArray(states) ? states : [
            states
        ];
        var current_states = this.state();
        // Remove duplicate states.
        states = states.filter(function (state) {
            return !~current_states.indexOf(state);
        });
        // TODO honor dependant states
        // TODO honor implied states
        this.transition_(current_states, states);
        // Mark new states as active
        states.forEach(function (name) {
            _this.states_active.push(name);
        });
    };
    MultiStateMachine.prototype.transition_ = function (from, to) {
        var _this = this;
        // var wait = <Function[]>[]
        from.forEach(function (state) {
            _this.transitionExit_(state, to);
        });
        to.forEach(function (state) {
            _this.transitionEnter_(from, state);
        });
        // set new states as active ones
        this.states_active = to;
    };
    MultiStateMachine.prototype.transitionEnter_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        from.forEach(function (state) {
            _this.transitionExec_(state + '_' + to);
        });
        this.transitionExec_('any_' + to);
        // TODO trigger the enter transitions (all of them) after all other middle
        // transitions (any_ etc)
        this.transitionExec_(to + 'enter');
    };
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
    MultiStateMachine.prototype.transitionExec_ = function (method) {
        // TODO refactor to event, return async callback
        if(typeof (this[method]) === 'Function') {
            this[method]();
        }
    };
    return MultiStateMachine;
})();
exports.MultiStateMachine = MultiStateMachine;
/*
class Foo extends MultiStateMachine {
state_A = {
depends: [],
implies: ['B']
};
state_B: { };
B_enter() { };
A_exit() { };
A_B() { };
Any_B() { };
B_Any() { };
}
*/

//@ sourceMappingURL=multistatemachine.js.map
