//export import asyncmachine = module('asyncmachine')

declare export function Block(...params: any[]): void;

export module asyncmachine {
	/**
	 * Promise-like setTimeout wrapper imitating a task.
	 */
	export class Task extends AsyncMachine {
	
		schedule_timer: number = null;
		async_timers: number[];
		queue: Function[] = [];
	
		constructor(public dispatcher: Scheduler) {
			super()
			this.initStates('Idle')
		}
	
		// Doing nothing right now (but may be waiting).
		state_Idle = IState;
	
		// Waiting for a scheduled run.
		// Sets timeout on this.schedule_timer.
		state_Waiting = IState;
	
		// Executing async actions
		state_Running: IState;
	
		// Cancelling a scheduled execution
		state_Cancelling = IState;
	
		// Stopping the execution of async actions
		state_Stopping = IState;
	
		Cancelling_enter() {
			this.addState('Idle')
			this.dropState('Cancelling')
		}
	
		Stopping_enter() {
			this.addState('Idle')
			this.dropState('Stopping')
		}
	
		Running_exit() {
			this.cancelAsyncTimers_()
			this.addState('Idle')
		}
	
		// Used to execute a vector of synchronous (!) functions "concurrently"
		// with others. Useful when you need to preserve responsivenes on UI or
		// some other interface.
		async(context: Object, ...blocks: Function[] ) {
			this.cancelAsyncTimers_()
			this.addState('Running')
			setTimeout( block.bind(context), 0 )
			blocks.forEach( (block) => {
				this.async_timers.push(
					setTimeout( block.bind(context), 1 )
				)
			})
			this.async_timers.push(
				setTimeout( this.dropStateLater('Running'), 1 )
			)
		}
	
		// Schedule an execution of a function in the worker.
		// TODO overload with an alternative params order
		schedule(delay: number, block: Function, context?: Object,
				...params: any[] ) {
			if ( this.state('Waiting') )
				this.addState('Cancelling')
			var exec_binding = this.once( 'Running.enter',
				block.apply( context, params )
			)
			var cancel_binding = this.once( 'Cancelling.enter',
				exec_binding.clear.bind( exec_binding )
			)
			this.schedule_timer = setTimeout( () => {
					cancel_binding.clear()
					this.setState('Running')
				}, delay
			)
			this.addState('Waiting')
		}
	
		// Schedule an async work
		scheduleAsync(delay: number, context: Object, ...blocks: Function[] ) {
			this.schedule( delay, () => {
				this.async.apply( this, [ context ].concat( blocks ) )
			})
		}
	
		// Cancel a scheduled execution
		cancel() { this.addState('Cancelling') }
	
		// Stop an async execution.
		stop() { this.addState('Stopping') }
	
		private cancelAsyncTimers_() {
			var timer
			while ( timer = this.async_timers.pop() )
				clearTimeout( timer )
		}
		
		newTask() {
			// TODO
		}
	}
	
	var p = Task.prototype
	p.state_Idle = {
			blocks: [ 'Running' ]
	}
	p.state_Waiting = {
			blocks: [ 'Running' ]
	}
	p.state_Running = {
			blocks: [ 'Idle', 'Waiting', 'Scheduled' ]
	}
	p.state_Cancelling = {
			blocks: [ 'Waiting' ]
	}
	p.state_Stopping = {
			blocks: [ 'Running' ]
	}
	
	export class Scheduler extends AsyncMachine {
		tasks: Task[] = [];
		
		constructor() {
			super()
		}
		
		newThread() {
			// TODO
		}
		
		dispatch( block: Function, task: Task, context?: Task ) {
			// run task
			(global || window).Task = task || context
		}
	}
}