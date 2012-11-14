///<reference path="../headers/node.d.ts" />
///<reference path="../headers/eventemitter2.d.ts" />
///<reference path="../headers/rsvp.d.ts" />
///<reference path="../headers/es5-shim.d.ts" />

import rsvp = module('rsvp')
var Promise = rsvp.Promise

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
  //autostart: bool;
}

//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
export class MultiStateMachine {
    disabled: bool = false;
    private states: string[];
    private states_active: string[];
		last_promise: rsvp.Promise;
//    private trasitions: string[];

    constructor (state: string, config?: IConfig);
    constructor (state: string[], config?: IConfig);
    constructor (state: any, public config?: IConfig) {
      // super()
      state = Array.isArray(state) ? state : [ state ]
      this.prepareStates()
      this.setState( state )
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
      states = this.setupTargetStates_( states )
      var ret = this.transition_( states, args )
      return ret === false ? false : this.allStatesSet( states )
    }

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
  
    // Curried version of setState.
    setStateLater(states: string[], ...rest: any[]);
    setStateLater(states: string, ...rest: any[]);
    setStateLater(states: any, ...rest: any[]) {
      var promise = new Promise
      promise.then( () => {
        this.setState.apply( this, rest )
      } )
      return promise
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
        this.dropState.apply( this, rest )
      } )
      return promise
    }

    // Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    pushState(states: string[], ...args: any[]);
    pushState(states: string, ...args: any[]);
    pushState(states: any, ...args: any[]) {
      var states = Array.isArray( states ) ? states : [ states ]
      // Filter non existing states.
      states = this.setupTargetStates_( this.states_active.concat( states ) )
      var ret = this.transition_( states, args )
      return ret === false ? false : this.allStatesSet( states )
    }
  
    // Curried version of pushState
  
    pushStateLater(states: string[], ...rest: any[]);
    pushStateLater(states: string, ...rest: any[]);
    pushStateLater(states: any, ...rest: any[]) {
      var args = arguments
      var promise = new Promise
      promise.then( () => {
        this.pushState.apply( this, args )
      } )
      return promise
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
      var ret = to.some( (state: string) => {
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
      var ret = this.transitionExec_( to + '_enter', target_states ) === false
      return ret === true ? false : true
    }

    private transitionExec_(method: string, target_states: string[]): any {
      // TODO refactor to event, return async callback
      if ( this[ method ] instanceof Function )
        return this[ method ].call( this, target_states )
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
