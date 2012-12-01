///<reference path="headers/node.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />

import LucidJS = module('lucidjs'); //; required!
import rsvp = module('rsvp')
var Promise = rsvp.Promise

export module asyncmachine {

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

	export interface IConfig {
		debug: bool;
		//autostart: bool;
	}

	//export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
	export class AsyncMachine {
		private debug_states_: bool = false;
		private log_handler_: Function;
		disabled: bool = false;
		private states: string[];
		private states_active: string[];
		last_promise: rsvp.Promise;

		////////////////////////////

		// API

		////////////////////////////

		constructor (state?: string, config?: IConfig);
		constructor (state?: string[], config?: IConfig);
		constructor (state?: any, public config?: IConfig) {
			LucidJS.emitter(this)
			if ( config && config.debug ) {
				this.debugStates()
			}
			if ( state ) {
				state = Array.isArray(state) ? state : [ state ]
				this.initStates( state )
			}
		}

		// Prepare class'es states. Required to be called manually for inheriting classes.
		initStates( state: string );
		initStates( state: string[] );
		initStates( state: any ) {
			var states = []
			for (var name in this ) {
				var match = name.match(/^state_(.+)/)
				if ( match )
					states.push( match[1] )
			}
			this.states = states
			this.states_active = []
			this.setState( state )
		}

		// Tells if a state is active now.
		state(name: string): bool;
		// Returns all active states.
		state(): string[];
		state(name?: any): any {
			if (name)
				return !!~this.states_active.indexOf(name)
			return this.states_active
		}

		// Activate certain states and deactivate the current ones.
		setState(states: string[], ...args: any[]);
		setState(states: string, ...args: any[]);
		setState(states: any, ...args: any[]) {
			var states_to_set = Array.isArray( states ) ? states : [ states ]
			if ( this.selfTransitionExec_( states_to_set, args ) === false )
				return false
			states = this.setupTargetStates_( states_to_set )
			var ret = this.transition_( states, states_to_set, args )
			return ret === false
					? false : this.allStatesSet( states_to_set )
		}

		// Curried version of setState.
		setStateLater(states: string[], ...rest: any[]);
		setStateLater(states: string, ...rest: any[]);
		setStateLater(states: any, ...rest: any[]) {
			var states = Array.isArray( states ) ? states : [ states ]
			var promise = new Promise
			promise.then( () => {
				debugger
				this.setState.apply( this, [].concat( [ states ], rest ) )
			} )
			this.last_promise = promise
			return promise.resolve.bind( promise )
		}

		// Deactivate certain states.
		dropState(states: string[], ...args: any[]);
		dropState(states: string, ...args: any[]);
		dropState(states: any, ...args: any[]) {
			var states_to_drop = Array.isArray( states ) ? states : [ states ]
			// Invert states to target ones.
			states = this.states_active.filter( (state: string) => {
				return !~states_to_drop.indexOf( state )
			})
			states = this.setupTargetStates_( states )
			this.transition_( states, args )
			return this.allStatesNotSet( states_to_drop )
		}

		// Deactivate certain states.
		dropStateLater(states: string[], ...rest: any[]);
		dropStateLater(states: string, ...rest: any[]);
		dropStateLater(states: any, ...rest: any[]) {
			var states = Array.isArray( states ) ? states : [ states ]
			var promise = new Promise
			promise.then( () => {
				this.dropState.apply( this, [].concat( [ states ], rest ) )
			} )
			this.last_promise = promise
			return promise.resolve.bind( promise )
		}

		// Activate certain states and keep the current ones.
		// TODO Maybe avoid double concat of states_active
		addState(states: string[], ...args: any[]);
		addState(states: string, ...args: any[]);
		addState(states: any, ...args: any[]) {
			var states_to_add = Array.isArray( states ) ? states : [ states ]
			if ( this.selfTransitionExec_( states_to_add, args ) === false )
				return false
			states = states_to_add.concat( this.states_active )
			states = this.setupTargetStates_( states )
			var ret = this.transition_( states, states_to_add, args )
			return ret === false
					? false : this.allStatesSet( states_to_add )
		}

		// Curried version of addState

		addStateLater(states: string[], ...rest: any[]);
		addStateLater(states: string, ...rest: any[]);
		addStateLater(states: any, ...rest: any[]) {
			var states = Array.isArray( states ) ? states : [ states ]
			var promise = new Promise
			promise.then( () => {
				this.addState.apply( this, [].concat( [ states ], rest ) )
			} )
			this.last_promise = promise
			return promise.resolve.bind( promise )
		}

		pipeForward(state: AsyncMachine, machine?: string );
		pipeForward(state: string, machine?: AsyncMachine, target_state?: string );
		pipeForward(state: any, machine?: any, target_state?: any ) {
			if ( state instanceof AsyncMachine ) {
				target_state = machine
				machine = state
				state = this.states
			}
			[].concat(state).forEach( (state) => {
				var new_state = target_state || state
				state = this.namespaceStateName( state )
				this.on( state + '.enter', () => {
					return machine.addState( new_state )
				})
				this.on( state + '.exit', () => {
					return machine.dropState( new_state )
				})
			})
		}

		pipeInvert(state: string, machine: AsyncMachine, target_state: string ) {
			state = this.namespaceStateName( state )
			this.on( state + '.enter', () => {
				machine.dropState( target_state )
			})
			this.on( state + '.exit', () => {
				machine.addState( target_state )
			})
		}

		pipeOff() {
			throw new Error('not implemented yet')
		}

		// TODO use a regexp lib for IE8's 'g' flag compat?
		namespaceStateName( state: string ): string {
			// CamelCase to Camel.Case
			return state.replace( /([a-zA-Z])([A-Z])/g, '$1.$2' )
		}

		defineState(name: string, config: IState) {
			throw new Error('not implemented yet')
		}

		debugStates( prefix?: string, log_handler?: (...msgs: string[] ) => void ) {
			if ( this.debug_states_ ) {
				// OFF
				this.debug_states_ = false
				delete this.log_handler_
			} else {
				// ON
				this.debug_states_ = true
				log_handler = log_handler || console.log.bind( console )
				this.log_handler_ = ( ...msgs: string[] ) => {
					var args = prefix ? [ prefix ].concat( msgs ) : msgs
					log_handler.apply( null, args )
				}
			}
		}

		// Initializes the mixin.
		initAsyncMachine(state: string, config?: IConfig) {
			AsyncMachine.apply( this, arguments )
		}

		// Mixin asyncmachine into a prototype of another constructor.
		static mixin(prototype: Object) {
			Object.keys( this.prototype ).forEach( (key: string) => {
				prototype[ key ] = this.prototype[ key ]
			})
		}

		////////////////////////////

		// PRIVATES

		////////////////////////////

		private allStatesSet( states ): bool {
			return ! states.reduce( (ret, state) => {
				return ret || ! this.state( state )
			}, false)
		}

		private allStatesNotSet( states ): bool {
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

		private getState_(name): IState {
			return this[ 'state_' + name ]
		}

		// Executes self transitions (eg ::A_A) based on active states.
		private selfTransitionExec_(states: string[], args: any[]) {
			var ret = states.some( (state) => {
				var ret, name = state + '_' + state
				var method: Function = this[ name ]
				if ( method && ~this.states_active.indexOf( state ) ) {
					var transition_args = [ states ].concat( args )
					ret = method.apply( this, transition_args )
					if ( ret === false )
						return true
					var event = this.namespaceTransition_( name )
					transition_args = <any[]>[ event, states ].concat( args )
					return this.trigger.apply( this, transition_args ) === false
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
			var already_blocked = []
			states = states.reverse().filter( (name: string) => {
				var blocked_by = this.isStateBlocked_( states, name )
				// Remove states already blocked.
				blocked_by = blocked_by.filter( ( blocker_name ) => {
					return !~already_blocked.indexOf( blocker_name )
				})
				if ( blocked_by.length ) {
					already_blocked.push( name )
					if ( this.log_handler_ ) {
						this.log_handler_(
							'State ' + name + ' blocked by ' + blocked_by.join(', ')
						)
					}
				}
				return !blocked_by.length && !~exclude.indexOf( name )
			}).reverse()
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

		// Check required states
		// Loop until no change happens, as state can requires themselves in a vector.
		private parseRequires_(states: string[]): string[] {
			var length_before = 0,
				length_after
			while (length_before != states.length) {
				length_before = states.length
				states = states.filter( (name: string) => {
					var state = this.getState_( name )
					return ! ( state.requires || [] ).reduce( (memo, req) => {
						var found = ~states.indexOf(req)
						if ( ! found && this.log_handler_ ) {
							this.log_handler_( 'State ' + name +
								' dropped as required state ' + req + ' is missing'
							)
						}
						return memo || !found
					}, false)
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

		private isStateBlocked_( states, name ): string[] {
			var blocked_by = []
			states.forEach( (name2) => {
				var state = this.getState_( name2 )
				if ( state.blocks && ~state.blocks.indexOf(name) )
					blocked_by.push( name2 )
			})
			return blocked_by
		}

		private transition_(to: string[], explicit_states: string[],
                args?: any[] = []) {
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
				return this.transitionExit_( state, to, explicit_states, args )
					=== false
			})
			if ( ret === true )
				return false
			ret = to.some( (state: string) => {
				// Skip transition if state is already active.
				if ( ~this.states_active.indexOf(state) )
					return false
				var trans_args = ~explicit_states.indexOf(state) ? args : []
				return this.transitionEnter_( state, to, trans_args )
					=== false
			})
			if ( ret === true )
				return false
			this.states_active = to
			return true
		}

		// Exit transition handles state-to-state methods.
		private transitionExit_( from: string, to: string[],
                explicit_states: string[], args: any[] ) {
			var method, callbacks = []
			if ( this.transitionExec_( from + '_exit', to ) === false )
				return false
			// Duplicate event for namespacing.
			var transition = 'exit.' + this.namespaceStateName( from )
			var ret = this.transitionExec_( transition, to )
			if ( ret === false )
				return false
			ret = to.some( (state: string) => {
				var trans_args = ~explicit_states.indexOf( state ) ? args : []
				var transition = from + '_' + state
				var ret = this.transitionExec_( transition, to, trans_args )
				return ret === false
			})
			if ( ret === true )
				return false
			// TODO pass args to explicitly dropped states
			ret = this.transitionExec_( from + '_any', to ) === false
			return ret === true ? false : true
		}

		private transitionEnter_( to: string, target_states: string[],
				args: any[] ) {
			var method, callbacks = []
			var ret = this.transitionExec_( 'any_' + to, target_states, args )
			if ( ret === false )
				return false
			ret = this.transitionExec_( to + '_enter', target_states, args )
			if ( ret === false )
				return false
			// Duplicate event for namespacing.
			var event_args = <any[]>[
				'enter.' + this.namespaceStateName(to),
				target_states
			]
			ret = this.trigger.apply( this, event_args.concat( args ) )
			return ret === false ? false : true
		}

		private transitionExec_( method: string, target_states: string[],
                args?: any[] = []): bool {
			args = [].concat( [ target_states ], args )
			var ret,
				event = this.namespaceTransition_( method )
			if ( this.log_handler_ )
				this.log_handler_( event )
			if ( this[ method ] instanceof Function ) {
				ret = this[ method ].apply( this, args )
				if ( ret === false ) {
					if ( this.log_handler_ )
						this.log_handler_( 'Transition method ' + method + ' cancelled' )
					return false
				}
			}
			ret = this.trigger( event, args )
			if ( ret === false && this.log_handler_ ) {
				this.log_handler_( 'Transition event ' + event + ' cancelled' )
			}
			return ret
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

		// Event Emitter interface
		// TODO cover as mixin in the d.ts file

		on(event: string, VarArgsBoolFn): void {}
		once(event: string, VarArgsBoolFn): void {}
		trigger(event: string, ...args: any[]): bool {
			return true
		}
		set(event: string, ...args: any[]): bool {
			return true
		}
	}

	// Support LucidJS mixin
	// TODO make it sucks less
	delete AsyncMachine.prototype.on
	delete AsyncMachine.prototype.once
	delete AsyncMachine.prototype.trigger
	delete AsyncMachine.prototype.set
}

// Fake class for sane export.
export class AsyncMachine extends asyncmachine.AsyncMachine {}