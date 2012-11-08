///<reference path="../headers/node.d.ts" />
///<reference path="../headers/eventemitter2.d.ts" />

//import EventEmitter2 = module('eventemitter2')

/*
EXAMPLE
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

Order of transition:
- exit
  - STATE_exit
  - STATE_STATE
  - STATE_any
- enter
  - any_STATE
  - STATE_enter

IDEAS:
- customizable naming convention (STATE_STATE to StateState or state_)
- event emitter api
- mixin api
- async support
  - promise exports
  - async event emitter
*/

// TODO FIXNE
//declare function require(name:string);
//require('./es5')

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
    setState(states: string[]);
    setState(states: string);
    setState(states: any) {
      var states = Array.isArray( states ) ? states : [ states ]
      states = this.setupTargetStates_( states )
      this.transition_( states )
    }

    // Deactivate certain states.
    // TODO
    dropState(states: string[]);
    dropState(states: string);
    dropState(states: any) {
      var states_to_drop = Array.isArray( states ) ? states : [ states ]
      // Remove duplicate states.
      states = this.states_active.filter( (state: string) => {
        return !~states_to_drop.indexOf( state )
      })
      states = this.setupTargetStates_( states )
      this.transition_( states )
    }

    // Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    addState(states: string[]);
    addState(states: string);
    addState(states: any) {
      var states = Array.isArray( states ) ? states : [ states ]
      // Filter non existing states.
      states = this.setupTargetStates_( this.states_active.concat( states ) )
      this.transition_( states )
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

    private transition_(to: string[]) {
      if ( ! to.length )
        return
      // Collect states to drop, based on the target states.
      var from = this.states_active.filter( (state: string) => {
        return !~to.indexOf( state )
      })
      this.orderStates_( to )
      this.orderStates_( from )
      // var wait = <Function[]>[]
      from.forEach( (state: string) => {
        this.transitionExit_( state, to )
      })
      to.forEach( (state: string) => {
        // Skip transition if state is already active.  
        if ( ~this.states_active.indexOf(state) )
          return
        this.transitionEnter_( state )
      })
      this.states_active = to
    }

    // Exit transition handles state-to-state methods.
    private transitionExit_(from: string, to: string[]) {
      var method, callbacks = []
      this.transitionExec_( from + '_exit' )
      to.forEach( (state: string) => {
        this.transitionExec_( from + '_' + state )
      })
      // TODO trigger the exit transitions (all of them) after all other middle
      // transitions (_any etc)
      this.transitionExec_( from + '_any' )
    }

    private transitionEnter_(to: string) {
      var method, callbacks = []
//      from.forEach( (state: string) => {
//        this.transitionExec_( state + '_' + to )
//      })
      this.transitionExec_( 'any_' + to )
      // TODO trigger the enter transitions (all of them) after all other middle
      // transitions (any_ etc)
      this.transitionExec_( to + '_enter' )
    }

    private transitionExec_(method: string) {
      // TODO refactor to event, return async callback
      if ( this[ method ] instanceof Function )
        this[ method ]();
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
