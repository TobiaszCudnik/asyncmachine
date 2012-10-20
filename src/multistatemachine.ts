///<reference path="../headers/node.d.ts" />
///<reference path="../headers/eventemitter2.d.ts" />

//import EventEmitter2 = module('eventemitter2')

export interface IState {
  // v1
  active?: bool;
  // will change the order of transitions placing dependant states in the front
  depends?: string[];
  // will set these states along with this one
  implies?: string[];
  // TODO v2
  // wont be set if dependant states aren't set (or going to be)
  requires?: string[];
  // will prevent setting these state
  blocks?: string[];
  // will drop these states?
  drops?: string[];
}

interface IConfig {
  //autostart: bool;
}

//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
export class MultiStateMachine {
    disabled: bool = false;
    private states: string[];
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
      for (var name in this ) {
        var match = name.match(/^state_(.+)/)
        if ( match )
          states.push( match[1] )
      }
      this.states = states
    }
    // Tells if a state is active now.
    // Returns all active states.
    state(name: string): bool;
    state(): string[];
    state(name?: any): any {
      if (name)
        return ~this.states.indexOf(name)
      return this.states.filter( (state) => {
        return this[ 'state_' + state ].active
      })
    }
    private getState(name) {
      return this[ 'state_' + name ]
    }
    setState(states: string[]);
    setState(states: string);
    setState(states: any) {
      var states = Array.isArray( states ) ? states : [ states ]
      var current_states = this.state()
      // Remove duplicate states.
      states = states.filter( (state: string) => {
        return !~current_states.indexOf( state )
      })
      // TODO honor dependant states
      // TODO honor implied states
      this.transition_( current_states, states )
      // Mark new states as active
      states.forEach( (name: string) => {
        this.getState( name ).active = true
      })
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
