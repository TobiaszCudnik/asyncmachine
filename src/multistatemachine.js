var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var MultiStateMachine = (function () {
    function MultiStateMachine(state, config) {
        this.config = config;
        this.disabled = false;
        state = Array.isArray(state) ? state : [
            state
        ];
        this.prepareStates();
        this.setState(state);
    }
    MultiStateMachine.prototype.prepareStates = function () {
        var states = [];
        Object.keys(this).forEach(function (key) {
            var match;
            if(match = key.match(/^state_/)) {
                states.push(match[1]);
            }
        });
        this.states = states;
    };
    MultiStateMachine.prototype.state = function (name) {
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states.map(function (state) {
            return state.active;
        });
    };
    MultiStateMachine.prototype.setState = function (states) {
        var states = Array.isArray(states) ? states : [
            states
        ];
        var current_states = this.state();
        states = states.map(function (state) {
            return ~current_states.indexOf(state);
        });
        this.transition_(current_states, states);
    };
    MultiStateMachine.prototype.transition_ = function (from, to) {
        var _this = this;
        from.forEach(function (state) {
            _this.transitionExit_(state, to);
        });
        to.forEach(function (state) {
            _this.transitionEnter_(from, state);
        });
    };
    MultiStateMachine.prototype.transitionEnter_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        from.forEach(function (state) {
            _this.transitionExec_(state + '_' + to);
        });
        this.transitionExec_('any_' + to);
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
        this.transitionExec_(from + '_any');
    };
    MultiStateMachine.prototype.transitionExec_ = function (method) {
        if(typeof (this[method]) === 'Function') {
            this[method]();
        }
    };
    return MultiStateMachine;
})();
exports.MultiStateMachine = MultiStateMachine;
var Foo = (function (_super) {
    __extends(Foo, _super);
    function Foo() {
        _super.apply(this, arguments);

        this.state_A = {
            depends: [],
            implies: [
                'B'
            ]
        };
    }
    Foo.prototype.B_enter = function () {
    };
    Foo.prototype.A_exit = function () {
    };
    Foo.prototype.A_B = function () {
    };
    Foo.prototype.Any_B = function () {
    };
    Foo.prototype.B_Any = function () {
    };
    return Foo;
})(MultiStateMachine);

