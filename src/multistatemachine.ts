///<reference path="../headers/node.d.ts" />
///<reference path="../headers/lucidjs.d.ts" />
///<reference path="../headers/rsvp.d.ts" />
///<reference path="../headers/es5-shim.d.ts" />

import rsvp = module('rsvp')
var Promise = rsvp.Promise
import LucidJS = module('lucidjs')

require('es5-shim')

export interface IState {
  // will change the order of transitions placing dependant states in the front
  depends?: string[];
  // will set these states along with this one
  implies?: string[];
  // will prevent setting these state
  blocks?: string[];
  // wont be set if dependant states aren't set (or going to be)
  requires?: string[];
}

interface IConfig {
  debug: bool;
  //autostart: bool;
}

//export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
export class MultiStateMachine {
    private debug_: Function;
    disabled: bool = false;
    private states: string[];
    private states_active: string[];
    last_promise: rsvp.Promise;

    ////////////////////////////

    // API
    
    ////////////////////////////

    constructor (state: string, config?: IConfig);
    constructor (state: string[], config?: IConfig);
    constructor (state: any, public config?: IConfig) {
      LucidJS.emitter(this)
      if ( config && config.debug ) {
        this.debug()
      }
      state = Array.isArray(state) ? state : [ state ]
      this.prepareStates()
      this.setState( state )
    }

    debug( prefix?: string ) {
      if ( this.debug_ ) {
          // OFF
        this.trigger = this.debug_
        delete this.debug_
      } else {
        // ON
        this.debug_ = this.trigger
        this.trigger = function(event, ...args) {
          prefix = prefix || ''
          console.log(prefix + event )
          this.debug_.apply( this, [].concat( [event], args ) )
        }
      }
    }

    // Tells if a state is active now.
    state(name: string): bool;
    // Returns all active states.
    state(): string[];
    state(name?: any): any {
      if (name)
        return ~this.states.indexOf(name)
      return this.states_active
    }

    // Activate certain states and deactivate the current ones.
    setState(states: string[], ...args: any[]);
    setState(states: string, ...args: any[]);
    setState(states: any, ...args: any[]) {
      var states = Array.isArray( states ) ? states : [ states ]
      if ( this.selfTransitionExec_( states, args ) === false )
        return false
      states = this.setupTargetStates_( states )
      var ret = this.transition_( states, args )
      return ret === false ? false : this.allStatesSet( states )
    }
  
    // Curried version of setState.
    setStateLater(states: string[], ...rest: any[]);
    setStateLater(states: string, ...rest: any[]);
    setStateLater(states: any, ...rest: any[]) {
      var promise = new Promise
      promise.then( () => {
        this.setState.apply( this, [].concat( states, rest ) )
      } )
      return this.last_promise = promise
    }

    // Deactivate certain states.
    dropState(states: string[], ...args: any[]);
    dropState(states: string, ...args: any[]);
    dropState(states: any, ...args: any[]) {
      var states_to_drop = Array.isArray( states ) ? states : [ states ]
      // Remove duplicate states.
      states = this.states_active.filter( (state: string) => {
        return !~states_to_drop.indexOf( state )
      })
      states = this.setupTargetStates_( states )
      this.transition_( states, args )
      return this.allStatesNotSet( states )
    }

    // Deactivate certain states.
    dropStateLater(states: string[], ...rest: any[]);
    dropStateLater(states: string, ...rest: any[]);
    dropStateLater(states: any, ...rest: any[]) {
      var promise = new Promise
      promise.then( () => {
        this.dropState.apply( this, [].concat( states, rest ) )
      } )
      return this.last_promise = promise
    }

    // Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    pushState(states: string[], ...args: any[]);
    pushState(states: string, ...args: any[]);
    pushState(states: any, ...args: any[]) {
      var states = Array.isArray( states ) ? states : [ states ]
      if ( this.selfTransitionExec_( states, args ) === false )
        return false
      states = this.setupTargetStates_( this.states_active.concat( states ) )
      var ret = this.transition_( states, args )
      return ret === false ? false : this.allStatesSet( states )
    }
  
    // Curried version of pushState
  
    pushStateLater(states: string[], ...rest: any[]);
    pushStateLater(states: string, ...rest: any[]);
    pushStateLater(states: any, ...rest: any[]) {
      var promise = new Promise
      promise.then( () => {
        this.pushState.apply( this, [].concat( states, rest ) )
      } )
      return this.last_promise = promise
//    private trasitions: string[];
    }

    pipeForward(state: MultiStateMachine, machine?: string );
    pipeForward(state: string, machine?: MultiStateMachine, target_state?: string );
    pipeForward(state: any, machine?: any, target_state?: any ) {
      if ( state instanceof MultiStateMachine ) {
        target_state = machine
        machine = state
        state = this.states
      }
      [].concat(state).forEach( (state) => {
        var new_state = target_state || state
        state = this.namespaceStateName( state )
        this.on( state + '.enter', () => {
          return machine.pushState( new_state )
        })
        this.on( state + '.exit', () => {
          return machine.dropState( new_state )
        })
      })
    }

    pipeInvert(state: string, machine: MultiStateMachine, target_state: string ) {
      state = this.namespaceStateName( state )
      this.on( state + '.enter', () => {
        machine.dropState( target_state )
      })
      this.on( state + '.exit', () => {
        machine.pushState( target_state )
      })
    }

    pipeOff() {

    }

    // TODO use a regexp lib for IE8's 'g' flag compat?
    namespaceStateName( state: string ): string {
      // CamelCase to Camel.Case
      return state.replace( /([a-zA-Z])([A-Z])/g, '$1.$2' )
    }

    /*
    // Events as states feature
    on(event_name: string, listener: Function) {

    }

    many(event_name: string, times_to_listen: number, listener: Function) {
      
    }

    onAny(listener: Function) {
      
    }
    */

    ////////////////////////////

    // PRIVATES

    ////////////////////////////

    private allStatesSet( states ) {
      return ! states.reduce( (ret, state) => {
        return ret || ! this.state( state )
      }, false)
    }

    private allStatesNotSet( states ) {
      return ! states.reduce( (ret, state) => {
        return ret || this.state( state )
      }, false)
    }

    private namespaceTransition_( transition: string ) {
      // CamelCase to Camel.Case
      return this.namespaceStateName( transition )
        // A_exit -> A.exit
        .replace( /_([a-z]+)$/, '.$1' )
        // A_B -> A._.B
        .replace( '_', '._.' )
    }

    private prepareStates() {
      var states = []
      for (var name in this ) {
        var match = name.match(/^state_(.+)/)
        if ( match )
          states.push( match[1] )
      }
      this.states = states
      this.states_active = []
    }

    private getState_(name) {
      return this[ 'state_' + name ]
    }

    // Executes self transitions (eg ::A_A) based on active states.
    private selfTransitionExec_(states: string[], args: any[]) {
      var ret = states.some( (state) => {
        var ret, name = state + '_' + state
        var method: Function = this[ name ]
        if ( method && ~this.states_active.indexOf( state ) ) {
          ret = method()
          if ( ret === false )
            return true
          var event = this.namespaceTransition_( name )
          return this.trigger( event, args ) === false
        }
      })
      return ret === true ? false : true
    }

    private setupTargetStates_(states: string[], exclude: string[] = []) {
      // Remove non existing states
      states = states.filter( (name: string) => {
        return ~this.states.indexOf( name ) 
      })
      states = this.parseImplies_(states)
      states = this.removeDuplicateStates_( states )
      // Check if state is blocked or excluded
      states = states.filter( (name: string) => {
        var blocked = this.isStateBlocked_( states, name )
        return !blocked && !~exclude.indexOf( name )
      })
      return this.parseRequires_(states)
    }

    // Collect implied states
    private parseImplies_(states: string[]): string[] {
      states.forEach( (name: string) => {
        var state = this.getState_( name )
        if (! state.implies)
          return
        states = states.concat( state.implies )
      })
      return states
    }

    // Check required states (until no change happens)
    private parseRequires_(states: string[]): string[] {
      var missing = true
      while (missing) {
        missing = false
        states = states.filter( (name: string) => {
          var state = this.getState_( name )
          missing = ( state.requires || [] ).reduce( (memo, req) => {
            return memo || !~states.indexOf(req)
          }, false)
          return !missing
        })
      }
      return states
    }

    private removeDuplicateStates_(states: string[]): string[] {
      // Remove duplicates.
      var states2 = []
      states.forEach( (name) => {
        if ( ! ~states2.indexOf(name) )
          states2.push( name )
      })
      return states2
    }

    private isStateBlocked_( states, name ) {
      var blocked = false
      states.forEach( (name2) => {
        var state = this.getState_( name2 )
        if ( state.blocks && ~state.blocks.indexOf(name) )
          blocked = true
      })
      return blocked
    }

    private transition_(to: string[], args: any[]) {
      // TODO handle args
      if ( ! to.length )
        return true
      // Collect states to drop, based on the target states.
      var from = this.states_active.filter( (state: string) => {
        return !~to.indexOf( state )
      })
      this.orderStates_( to )
      this.orderStates_( from )
      // var wait = <Function[]>[]
      var ret = from.some( (state: string) => {
        return this.transitionExit_( state, to ) === false
      })
      if ( ret === true )
        return false
      ret = to.some( (state: string) => {
        // Skip transition if state is already active.  
        if ( ~this.states_active.indexOf(state) )
          return false
        return this.transitionEnter_( state, to ) === false
      })
      if ( ret === true )
        return false
      this.states_active = to
      return true
    }

    // Exit transition handles state-to-state methods.
    private transitionExit_(from: string, to: string[]) {
      var method, callbacks = []
      if ( this.transitionExec_( from + '_exit', to ) === false )
        return false
      // Duplicate event for namespacing.
      var ret = this.transitionExec_( 'exit.' + this.namespaceStateName( from ), to )
      if ( ret === false )
        return false
      ret = to.some( (state: string) => {
        return this.transitionExec_( from + '_' + state, to ) === false
      })
      if ( ret === true )
        return false
      // TODO trigger the exit transitions (all of them) after all other middle
      // transitions (_any etc)
      ret = this.transitionExec_( from + '_any', to ) === false
      return ret === true ? false : true
    }

    private transitionEnter_(to: string, target_states: string[]) {
      var method, callbacks = []
//      from.forEach( (state: string) => {
//        this.transitionExec_( state + '_' + to )
//      })
      if ( this.transitionExec_( 'any_' + to, target_states ) === false )
        return false
      // TODO trigger the enter transitions (all of them) after all other middle
      // transitions (any_ etc)
      if ( ret = this.transitionExec_( to + '_enter', target_states ) === false )
        return false
      // Duplicate event for namespacing.
      var ret = this.trigger(
        'enter.' + this.namespaceStateName(to), target_states
      )
      return ret === false ? false : true
    }

    private transitionExec_(method: string, target_states: string[],
        args: any[] = []): bool {
      args = [].concat( [ target_states ], args )
      var ret
      if ( this[ method ] instanceof Function ) {
        ret = this[ method ].apply( this, args )
        if ( ret === false )
          return false
      }
      return this.trigger( this.namespaceTransition_( method ), args )
    }

    // is_exit tells that the order is exit transitions
    private orderStates_( states: string[] ): void {
      states.sort( (e1, e2) => {
        var state1 = this.getState_( e1 )
        var state2 = this.getState_( e2 )
        var ret = 0
        if ( state1.depends && ~state1.depends.indexOf(e2) )
          ret = 1
        else if ( state2.depends && ~state2.depends.indexOf(e1) )
          ret = -1
        return ret
      })
    }
}
