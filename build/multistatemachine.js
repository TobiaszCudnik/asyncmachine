var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
//autostart: bool;
//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
var MultiStateMachine = (function () {
    function MultiStateMachine(state, config) {
        this.config = config;
        this.disabled = false;
        // super()
        debugger;

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
    // Returns all active states.
    ;
    MultiStateMachine.prototype.state = function (name) {
        var _this = this;
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states.filter(function (state) {
            return _this['state_' + state].active;
        });
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
            _this.getState(name).active = true;
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
/**
EventEmitter2 = require('eventemitter2').EventEmitter2

class NodeState
constructor: (@config = {}) ->
@_notifier = new EventEmitter2(wildcard: true)
@disabled = false

@current_state_name =
@config.initial_state ?
(state_name for state_name of @states)[0]
@current_state = @states[@current_state_name]
@current_data = @config.initial_data
@_current_timeout = null

@config.autostart ?= false
@config.sync_goto ?= false

# setup default events
for state_name, events of @states
@states[state_name]['Enter'] ?= (data) ->
@current_data = data
if @config.autostart
@goto @current_state_name

goto: (state_name, data) ->
return if @disabled

@current_data = data ? @current_data
previous_state_name = @current_state_name

clearTimeout @_current_timeout if @_current_timeout
for event_name, callback of @current_state
@_notifier.removeListener event_name, callback

# enter the new state
@current_state_name = state_name
@current_state = @states[@current_state_name]

# register events for active state
for event_name, callback of @current_state
@_notifier.on event_name, callback

callback = (data) =>
@current_data = data
@_notifier.emit 'Enter', @current_data

transition = (data, cb) =>
cb data

transition =
@transitions[previous_state_name]?[state_name] ?
@transitions['*']?[state_name] ?
@transitions[previous_state_name]?['*'] ?
@transitions['*']?['*'] ?
(data, cb) => cb data

if @config.sync_goto
transition @current_data, callback
else
process.nextTick =>
transition @current_data, callback

raise: (event_name, data) ->
@_notifier.emit event_name, data

wait: (milliseconds) ->
@_current_timeout = setTimeout(
=> @_notifier.emit 'WaitTimeout', milliseconds, @current_data
milliseconds
)

unwait: ->
clearTimeout @_current_timeout if @_current_timeout

start: (data) ->
@current_data = data if data?
@goto @current_state_name

stop: ->
@_notifier.removeAllListeners()
@unwait

disable: ->
return if @disabled
@stop()
@disabled = true

enable: (state, data) ->
return unless @disabled
@disabled = false
@goto state, data if state?

wrapCb: (fn) ->
(args...) =>
return if @disabled
fn args...

states: {}
transitions: {}

module.exports = NodeState
*/

