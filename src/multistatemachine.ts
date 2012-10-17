///<reference path="../headers/node.d.ts" />
///<reference path="../headers/eventemitter2.d.ts" />

//import EventEmitter2 = module('eventemitter2')

interface IState {
  // v1
  active: bool;
  // will change the order of transitions placing dependant states in the front
  depends: string[];
  // will set these states along with this one
  implies: string[];
  // TODO v2
  // wont be set if dependant states aren't set (or going to be)
  requires: string[];
  // will prevent setting these state
  blocks: string[];
  // will drop these states?
  drops: string[];
}

interface IConfig {
  //autostart: bool;
}

//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
export class MultiStateMachine {
    disabled: bool = false;
    private states: IState[];
    private trasitions: string[];
    constructor (state: string, config?: IConfig);
    constructor (state: string[], config?: IConfig);
    constructor (state: any, public config?: IConfig) {
      // super()
      state = Array.isArray(state) ? state : [ state ]
      this.prepareStates()
      this.setState( state )
    }
    prepareStates() {
      var states = []
      Object.keys(this).forEach( (key: string) => {
        var match
        if ( match = key.match(/^state_/) )
          states.push( match[1] )
      })
      this.states = states
    }
    // Tells if a state is active now.
    // Returns all active states.
    state(name: string): bool;
    state(): string[];
    state(name?: any): any {
      if (name)
        return ~this.states.indexOf(name)
      return this.states.map( (state) => {
        return state.active
      })
    }
    setState(states: string[]);
    setState(states: string);
    setState(states: any) {
      var states = Array.isArray( states ) ? states : [ states ]
      var current_states = this.state()
      // Remove duplicate states.
      states = states.map( (state: string) => {
        return ~current_states.indexOf( state )
      })
      // TODO honor dependant states
      // TODO honor implied states
      this.transition_( current_states, states )
    }
    transition_(from: string[], to: string[]) {
      // var wait = <Function[]>[]
      from.forEach( (state: string) => {
        this.transitionExit_( state, to )
      })
      to.forEach( (state: string) => {
        this.transitionEnter_( from, state )
      })
    }
    transitionEnter_(from: string[], to: string) {
      var method, callbacks = []
      from.forEach( (state: string) => {
        this.transitionExec_( state + '_' + to )
      })
      this.transitionExec_( 'any_' + to )
      // TODO trigger the enter transitions (all of them) after all other middle
      // transitions (any_ etc)
      this.transitionExec_( to + 'enter' )
    }
    transitionExit_(from: string, to: string[]) {
      var method, callbacks = []
      this.transitionExec_( from + '_exit' )
      to.forEach( (state: string) => {
        this.transitionExec_( from + '_' + state )
      })
      // TODO trigger the exit transitions (all of them) after all other middle
      // transitions (_any etc)
      this.transitionExec_( from + '_any' )
    }
    transitionExec_(method: string) {
      // TODO refactor to event, return async callback
      if ( typeof(this[ method ]) === 'Function' )
        this[ method ]();
    }
}

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