///<reference path="headers/commonjs.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />

export module asyncmachine {
	
	export import LucidJS = module('lucidjs'); //; required!
	export import rsvp = module('rsvp')
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
		// will be set automatically if all requirements are met
		auto?: bool;
	}

	export interface IConfig {
		debug: bool;
		//autostart: bool;
	}

	export interface ITransition  {
		call(states?: string[], state_params?: any[], callback_params?: any[]): bool;
		call(states?: string[], state_params?: any[], callback_params?: any[]): any;
		apply( context, args ): any;
	}

	//export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
	export class AsyncMachine {

		// rewrite without default types
		private debug_states_: bool;
		private log_handler_: Function;
		private states: string[];
		private states_active: string[];
		last_promise: rsvp.Promise;
		private queue: any[];
		private lock: bool;
		config: IConfig;

		////////////////////////////

		// API

		////////////////////////////

		constructor (state?: string, config?: IConfig);
		constructor (state?: string[], config?: IConfig);
		constructor (state?: any, config?: IConfig) {
			this.config = config
			this.debug_states_ = false
			this.queue = []
			this.lock = false
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

		getState(name): IState {
			return this[ 'state_' + name ] || (<any>this).constructor[ 'state_' + name ]
		}

		// Tells if a state is active now.
		state(name: string): bool;
		state(name: string[]): bool;
		// Returns all active states.
		state(): string[];
		state(name?: any): any {
			if ( name ) {
				if ( Array.isArray( name ) ) {
					return name.every( (name) => {
						return ~this.states_active.indexOf(name)
					})
				} else
					return !!~this.states_active.indexOf(name)
			}
			return this.states_active
		}

		// Activate certain states and deactivate the current ones.
		setState(states: string[], ...params: any[]): bool;
		setState(states: string, ...params: any[]): bool;
		setState(states: any, ...params: any[]): bool {
			return this.setState_( states, params )
		}

		// Curried version of setState.
		setStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
		setStateLater(states: string, ...params: any[]): (...params: any[]) => void;
		setStateLater(states: any, ...params: any[]): (...params: any[]) => void {
			var promise = new Promise
			promise.then( (...callback_params: any[] ) => {
				this.setState_( states, params, callback_params )
			} )
			this.last_promise = promise
			return function (...params: any[]) {
				promise.resolve(params)
			}
		}

		// Activate certain states and keep the current ones.
		addState(states: string[], ...params: any[]): bool;
		addState(states: string, ...params: any[]): bool;
		addState(states: any, ...params: any[]): bool {
			return this.addState_( states, params )
		}

		// Curried version of addState
		addStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
		addStateLater(states: string, ...params: any[]): (...params: any[]) => void;
		addStateLater(states: any, ...params: any[]): (...params: any[]) => void {
			var promise = new Promise
			promise.then( (...callback_params: any[] ) => {
				this.addState_( states, params, callback_params )
			} )
			this.last_promise = promise
			return function (...params: any[]) {
				promise.resolve(params)
			}
		}

		// Deactivate certain states.
		dropState(states: string[], ...params: any[]): bool;
		dropState(states: string, ...params: any[]): bool;
		dropState(states: any, ...params: any[]): bool {
			return this.dropState_( states, params )
		}

		// Deactivate certain states.
		dropStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
		dropStateLater(states: string, ...params: any[]): (...params: any[]) => void;
		dropStateLater(states: any, ...params: any[]): (...params: any[]) => void {
			var promise = new Promise
			promise.then( (...callback_params: any[] ) => {
				this.dropState_( states, params, callback_params )
			} )
			this.last_promise = promise
			return function (...params: any[]) {
				promise.resolve(params)
			}
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
                if (! log_handler && console && console.log ) {
                    log_handler = function() {
                        var a = arguments
                        if ( console.log.apply )
                            console.log.apply( console, arguments )
                        else
                            console.log( a[0], a[1] )
                    }
                }
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

		static mergeState(name: string) {
			// TODO merge a state with the given name with the super
			// class' state
			// TODO2 merge by a definition
		}

		////////////////////////////

		// PRIVATES

		////////////////////////////

		private processAutoStates( excluded: string[] = [] ) {
			var add = []
			this.states.forEach( (state: string) {
				var is_excluded = ~excluded.indexOf( state )
				var is_current = this.state(state)
				if ( this.getState(state).auto && ! is_excluded && ! is_current ) {
					add.push( state )
				}
			})
			return this.addState( add )
		}

		private setState_(states: string, exec_params: any[], callback_params?: any[]);
		private setState_(states: string[], exec_params: any[], callback_params?: any[]);
		private setState_(states: any, exec_params: any[],
				callback_params?: any[] = []): bool {
			var states_to_set = Array.isArray( states ) ? states : [ states ]
			if ( ! states_to_set.length )
				return
			if ( this.lock ) {
				this.queue.push( [ 2, states_to_set, exec_params, callback_params ] )
				return
			}
			this.lock = true
			if ( this.log_handler_ )
				this.log_handler_( '[*] Set state ' + states_to_set.join(', ') )
			var states_before = this.state()
			var ret = this.selfTransitionExec_(
				states_to_set, exec_params, callback_params
			)
			if ( ret === false )
				return false
			states = this.setupTargetStates_( states_to_set )
			var states_to_set_valid = states_to_set.some( (state) => {
				return ~states.indexOf( state )
			})
			if ( ! states_to_set_valid ) {
				if ( this.log_handler_ ) {
					this.log_handler_('[i] Transition cancelled, as target ' +
						'states wasn\'t accepted'
					)
				}
				return this.lock = false
			}
			var queue = this.queue
			this.queue = []
			ret = this.transition_(
				states, states_to_set, exec_params, callback_params
			)
			this.queue = ret === false ? queue : queue.concat( this.queue )
			this.lock = false
			ret = this.processQueue_(ret)
			// If length equals and all previous states are set, we assume there
			// wasnt any change
			var length_equals = this.state().length === states_before.length
			if ( ! this.state( states_before ) || ! length_equals )
				this.processAutoStates()
			return ret === false ? false : this.allStatesSet( states_to_set )
		}

		// TODO Maybe avoid double concat of states_active
		private addState_(states: string, exec_params: any[], callback_params?: any[]);
		private addState_(states: string[], exec_params: any[], callback_params?: any[]);
		private addState_(states: any, exec_params: any[],
				callback_params?: any[] = [] ): bool {
			var states_to_add = Array.isArray( states ) ? states : [ states ]
			if ( ! states_to_add.length )
				return
			if ( this.lock ) {
				this.queue.push( [ 1, states_to_add, exec_params, callback_params ] )
				return
			}
			this.lock = true
			if ( this.log_handler_ )
				this.log_handler_( '[*] Add state ' + states_to_add.join(', ') )
			var states_before = this.state()
			var ret = this.selfTransitionExec_(
				states_to_add, exec_params, callback_params
			)
			if ( ret === false )
				return false
			states = states_to_add.concat( this.states_active )
			states = this.setupTargetStates_( states )
			var states_to_add_valid = states_to_add.some( (state) => {
				return ~states.indexOf( state )
			})
			if ( ! states_to_add_valid ) {
				if ( this.log_handler_ ) {
					this.log_handler_('[i] Transition cancelled, as target ' +
						'states wasn\'t accepted'
					)
				}
				return this.lock = false
			}
			var queue = this.queue
			this.queue = []
			ret = this.transition_(
				states, states_to_add, exec_params, callback_params
			)
			this.queue = ret === false ? queue : queue.concat( this.queue )
			this.lock = false
			ret = this.processQueue_(ret)
			// If length equals and all previous states are set, we assume there
			// wasnt any change
			var length_equals = this.state().length === states_before.length
			if ( ! this.state( states_before ) || ! length_equals )
				this.processAutoStates()
			return ret === false ? false : this.allStatesSet( states_to_add )
		}

		private dropState_(states: string, exec_params: any[], callback_params?: any[]);
		private dropState_(states: string[], exec_params: any[], callback_params?: any[]);
		private dropState_(states: any, exec_params: any[],
				callback_params?: any[] = [] ): bool {
			var states_to_drop = Array.isArray( states ) ? states : [ states ]
			if ( ! states_to_drop.length )
				return
			if ( this.lock ) {
				this.queue.push( [ 0, states_to_drop, exec_params, callback_params ] )
				return
			}
			this.lock = true
			if ( this.log_handler_ )
				this.log_handler_( '[*] Drop state ' + states_to_drop.join(', ') )
			var states_before = this.state()
			// Invert states to target ones.
			states = this.states_active.filter( (state: string) => {
				return !~states_to_drop.indexOf( state )
			})
			states = this.setupTargetStates_( states )
			// TODO validate if transition still makes sense? like in set/add
			var queue = this.queue
			this.queue = []
			var ret = this.transition_( states, states_to_drop, exec_params, callback_params )
			this.queue = ret === false ? queue : queue.concat( this.queue )
			this.lock = false
			ret = this.processQueue_(ret)
			// If length equals and all previous states are set, we assume there
			// wasnt any change
			var length_equals = this.state().length === states_before.length
			if ( ! this.state( states_before ) || ! length_equals )
				this.processAutoStates()
			return ret === false || this.allStatesNotSet( states_to_drop )
		}

		private processQueue_(previous_ret) {
			if ( previous_ret === false ) {
				// Cancel the current queue.
				this.queue = []
				return false
			}

			var ret = [], row;

			while ( row = this.queue.shift() ) {
				switch ( row[0] ) {
					case 0:
						ret.push( this.dropState( row[1], row[2], row[3]) )
						break;
					case 1:
						ret.push( this.addState( row[1], row[2], row[3]) )
						break;
					case 2:
						ret.push( this.setState( row[1], row[2], row[3]) )
						break;
				}
			}
			return !~ret.indexOf( false )
		}

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

		// Executes self transitions (eg ::A_A) based on active states.
		private selfTransitionExec_(states: string[], exec_params?: any[] = [],
				callback_params?: any[] = [] ) {
			var ret = states.some( (state) => {
				var ret, name = state + '_' + state
				var method: ITransition = this[ name ]
				if ( method && ~this.states_active.indexOf( state ) ) {
					var transition_params = [ states ].concat(
						[ exec_params ], callback_params
					)
					ret = method.apply( this, transition_params )
					if ( ret === false )
						return true
					var event = this.namespaceTransition_( name )
					transition_params = <any[]>[ event, states ].concat(
						[ exec_params ], callback_params
					)
					return this.trigger.apply( this, transition_params ) === false
				}
			})
			return ret === true ? false : true
		}

		private setupTargetStates_(states: string[], exclude: string[] = []) {
			// Remove non existing states
			states = states.filter( (name: string) => {
				var ret = ~this.states.indexOf( name )
				if (! ret && this.log_handler_ ) {
					this.log_handler_('[i] State ' + name + ' doesn\'t exist')
				}
				return ret
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
							'[i] State ' + name + ' blocked by ' + blocked_by.join(', ')
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
				var state = this.getState( name )
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
					var state = this.getState( name )
					return ! ( state.requires || [] ).reduce( (memo, req) => {
						var found = ~states.indexOf(req)
						if ( ! found && this.log_handler_ ) {
							this.log_handler_( '[i] State ' + name +
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
				var state = this.getState( name2 )
				if ( state.blocks && ~state.blocks.indexOf(name) )
					blocked_by.push( name2 )
			})
			return blocked_by
		}

		private transition_(to: string[], explicit_states: string[],
				exec_params?: any[] = [], callback_params?: any[] = [] ) {
			// TODO handle args
			if ( ! to.length )
				return true
			// Remove active states.
			var from = this.states_active.filter( (state: string) => {
				return !~to.indexOf( state )
			})
			this.orderStates_( to )
			this.orderStates_( from )
			var params = [ exec_params ].concat( callback_params )
			// var wait = <Function[]>[]
			var ret = from.some( (state: string) => {
				var ret = this.transitionExit_(state, to, explicit_states, params)
				return ret === false
			})
			if ( ret === true )
				return false
			ret = to.some( (state: string) => {
				// Skip transition if state is already active.
				if ( ~this.states_active.indexOf( state ) )
					return false
				var transition_params = ~explicit_states.indexOf( state ) ? params : []
				var ret = this.transitionEnter_( state, to, transition_params )
				return ret === false
			})
			if ( ret === true )
				return false
			this.setActiveStates_(to)
			return true
		}
		
		private setActiveStates_( target: string[] ) {
			var previous = this.states_active
			var all = this.states
			this.states_active = target
			// Set states in LucidJS emitter
			// TODO optimise these loops
			all.forEach( (state) => {
				if ( ~target.indexOf( state ) ) {
//					if ( ! ~previous.indexOf( state ) )
//						this.set( state + '.enter' );
					(<LucidJS.ISet>this.set).clear( state + '.exit' )
				} else {
//					if ( ~previous.indexOf( state ) )
					(<LucidJS.ISet>this.set).clear( state + '.enter' )
//					this.set( state + '.exit' )
				}
			})
		}


		// Exit transition handles state-to-state methods.
		private transitionExit_( from: string, to: string[],
				explicit_states: string[], params: any[] ) {
			var method, callbacks = []
			var transition_params = ~explicit_states.indexOf( from ) ? params : []
			var ret = this.transitionExec_( from + '_exit', to, transition_params )
			if ( ret === false )
				return false
			// Duplicate event for namespacing.
			var transition = 'exit.' + this.namespaceStateName( from )
			ret = this.transitionExec_( transition, to, transition_params )
			if ( ret === false )
				return false
			ret = to.some( (state: string) => {
				var transition = from + '_' + state
				var transition_params = ~explicit_states.indexOf( state ) ? params : []
				var ret = this.transitionExec_( transition, to, transition_params )
				return ret === false
			})
			if ( ret === true )
				return false
			// TODO pass args to explicitly dropped states
			ret = this.transitionExec_( from + '_any', to ) === false
			return ret === true ? false : true
		}

		private transitionEnter_( to: string, target_states: string[],
				params: any[] ) {
			var method, callbacks = []
			var ret = this.transitionExec_( 'any_' + to, target_states, params )
			if ( ret === false )
				return false
			ret = this.transitionExec_( to + '_enter', target_states, params )
			if ( ret === false )
				return false
			// Duplicate event for namespacing.
			var event_args = <any[]>[
				'enter.' + this.namespaceStateName(to),
				target_states
			]
			ret = this.trigger.apply( this, event_args.concat( params ) )
			return ret === false ? false : true
		}

		private transitionExec_( method: string, target_states: string[],
				params?: any[] = []): bool {
			params = [].concat( [ target_states ], params )
			var ret, event = this.namespaceTransition_( method )
			if ( this.log_handler_ )
				this.log_handler_( event )
			if ( this[ method ] instanceof Function )
				ret = this[ method ].apply( this, params )
			// TODO reduce this 2 log msgs to 1
			if ( ret !== false ) {
				var fn = ~event.indexOf('_') ? 'trigger' : 'set' 
				ret = this[ fn ]( event, params )
				if ( ret === false && this.log_handler_ ) {
					this.log_handler_( '[i] Transition event ' + event + ' cancelled' )
				}
			}
			if ( ret === false && this.log_handler_ )
				this.log_handler_( '[i] Transition method ' + method + ' cancelled' )
			return ret
		}

		// is_exit tells that the order is exit transitions
		private orderStates_( states: string[] ): void {
			states.sort( (e1, e2) => {
				var state1 = this.getState( e1 )
				var state2 = this.getState( e2 )
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

		on(event: string, VarArgsBoolFn): LucidJS.IBinding {
			return <LucidJS.IBinding>{}
		}
		once(event: string, VarArgsBoolFn): LucidJS.IBinding {
			return <LucidJS.IBinding>{}
		}
		trigger(event: string, ...args: any[]): bool {
			return true
		}
		set(event: string, ...args: any[]): LucidJS.IBinding {
			return <LucidJS.IBinding>{}
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
//export class Task extends asyncmachine.Task {}
