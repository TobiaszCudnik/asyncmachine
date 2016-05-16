eventemitter = require "eventemitter3-abortable"
promise = require 'es6-promise'

STATE_CHANGE =
	DROP: 0
	ADD: 1
	SET: 2


STATE_CHANGE_LABELS =
	0: 'Drop'
	1: 'Add'
	2: 'Set'


###*
 * Queue enum defining param positions in queue's entries.
###
QUEUE =
	STATE_CHANGE: 0
	STATES: 1
	PARAMS: 2
	TARGET: 3


class Deferred
	promise: null
	resolve: null
	reject: null
	constructor: -> @promise = new promise.Promise (@resolve, @reject) =>


###*
 * Base class which you extend with your own one defining the states.
 * The [[Exception]] state is already provided.
 *
 * ```
 * class FooStates extends AsyncMachine
 *   Enabled: {}
 *
 *   Downloading: blocks: 'Downloaded'
 *   Downloaded: blocks: 'Downloading'
 *
 * class Foo
 *   constructor: ->
 *   	this.states = new FooStates this, yes
 *
 *   Downloading_state: (states, @url)
 *   	fetch url, this.states.addByCallack 'Downloaded'
 *
 *   Downloaded_state: (states, local_path) ->
 *   	console.log 'Downloaded #{this.url} to #{local_path}'
 *
 * ```
 * TODO
 * - exposing the current state during transition (via the #duringTransition() method)
 * - loose bind in favor of closures
###
class AsyncMachine extends eventemitter.EventEmitter

	states_all: null
	states_active: null
	queue: null
	lock: no
	last_promise: null
	# TODO change to log_prefix and log_level
	debug_prefix: ''
	debug_level: 1
	clock_: {}
	target: null
	transition_events: []
	debug_: no
	piped: null
	# TODO expose duringQueueProcessing(): Boolean
	lock_queue: no
# TODO this is lame, filter out on the prototype level. Besides the Exception state, which will make it...
# an exception... ;]
	internal_fields: ['_events', 'states_all', 'states_active', 'queue'
		'lock', 'last_promise', 'debug_prefix', 'debug_level', 'clock_', 'debug_'
		'target', 'internal_fields', 'transition_events', 'piped']

	###*
	Empty Exception state properties. See [[Exception_state]] transition handler.
	###
	Exception: {}

	###*
	 * Creates an AsyncMachine instance (not a constructor) with specified states.
	 * States properties are empty, so you'd need to set it by yourself.
	 *
	 * @param states List of state names to register on the new instance.
	 * @return
	 *
	 * ```
	 * states = AsyncMachine.factory ['A', 'B','C']
	 * states.A = implies: ['B']
	 * states.add 'A'
	 * states.is() # -> ['A', 'B']
	 * ```
	###
	@factory: (states, constructor) ->
		states ?= []
		instance = new (constructor or AsyncMachine)
		for state in states
			instance[state] = {}
			instance.register state

		instance

	###*
	 * Creates a new instance with only state one registered, which is the
	 * Exception.
	 * When extending the class, you should register your states by using either
	 * [[registerAll]] or [[register]].
	 *
	 * @param target Target object for the transitions, useful when composing the
	 * 	states instance.
	 * @param registerAll Automaticaly registers all defined states.
	 * @see [[AsyncMachine]] for the usage example.
	###
	constructor: (target = null, register_all = no) ->
		super()
		@queue = []
		@states_all = []
		@states_active = []
		@clock_ = {}
		@piped = {}

		@setTarget target or this
		if register_all
			@registerAll()
		else
			@register 'Exception'

	###*
	 * All exceptions are caught into this state, including both synchronous and
	 * asynchronous from promises and callbacks. You can overcreateride it and
	 * handle exceptions based on their type and target states of the transition
	 * during which they appeared.
	 *
	 * @param states States to which the machine is transitioning rigt now.
	 * 	This means post-exception states.
	 * @param err The exception object.
	 * @param exception_states Target states of the transition during
	 * 	which the exception was thrown.
	 * @param async_target_states Only for async transitions like
	 * [[addByCallback]], these are states which we're supposed to be set by the
	 * callback.
	 * @return
	 *
	 * Example of exception handling
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.Exception_state = (states, err, exception_states) ->
	 * 	# Re-adds state 'C' in case of an exception if A is set.
	 * 	if exception_states.some((state) -> state is 'C') and @is 'A'
	 * 		states.add 'C'
	 * ```
	 * Example of a manual exception triggering
	 * ```
	 * states.A_state = (states) ->
	 * 	foo = new SomeAsyncTask
	 * 	foo.start()
	 * 	foo.once 'error', (error) =>
	 * 		@add 'Exception', error, states
	 * ```
	###
	Exception_state: (states, err, exception_states, async_target_states) ->
		console.log 'EXCEPTION from AsyncMachine'
		if exception_states?.length?
			@log "Exception \"#{err}\" when setting the following states:\n    " +
				exception_states.join ', '
		if async_target_states?.length?
			@log "Next states were supposed to be (add/drop/set):\n    " +
				exception_states.join ', '
		console.dir err
		@setImmediate -> throw err

	###*
	 * Sets the target for the transition handlers. Useful to keep all you methods in
	 * in one class while the states class is composed as an attribute of the main
	 * object. There's also a shorthand for this method as
	 * [[AsyncMachine.constructor]]'s param.
	 *
	 * @param target Target object.
	 * @return
	 *
	 * ```
	 * class Foo
	 * 	constructor: ->
	 * 		@states = AsyncMachine.factory ['A', 'B', 'C']
	 * 		@states.setTarget this
	 * 		@states.add 'A'
	 *
	 * 	A_state: ->
	 * 		console.log 'State A set'
	 * ```
	###
	setTarget: (target) ->
		@target = target

	###*
	 * Registers all defined states. Use it only if you don't define any other
	 * attributes on the object (or it's prototype). If you do, register the states
	 * manually with the [[register]] method. There's also a shorthand for this
	 * method as [[AsyncMachine.constructor]]'s param.
	 *
	 * ```
	 * class States extends AsyncMachine
	 * 	A: {}
	 * 	B: {}
	 *
	 * class Foo
	 * 	constructor: ->
	 * 		@states = new States
	 * 		@states.registerAll()
	 * ```
	###
	registerAll: ->
		name = ''
		value = null

		# test the instance vars
		for name, value of @
			if (@hasOwnProperty name) and name not in @internal_fields and
					@[name] not instanceof Function
				@register name
		# test the prototype chain
		constructor = @getInstance().constructor.prototype
		while yes
			for name, value of constructor
				@register name if (constructor.hasOwnProperty name) and
						name not in @internal_fields and
						constructor[name] not instanceof Function

			constructor = Object.getPrototypeOf constructor
			break if constructor is AsyncMachine.prototype

	###*
	 * Returns an array of relations from one state to another.
	 * Maximum set is ['blocks', 'drops', 'implies', 'requires'].
   *
   * TODO code sample
  ###
	getRelations: (from_state, to_state) ->
		# TODO enum
		relations = ['blocks', 'drops', 'implies', 'requires']
		state = @get from_state
		# TODO assert

		relations.filter (relation) ->
			to_state in state[relation]?

	###*
	 * If no states passed, returns all the current states.
	 *
	 * If states passed, returns a boolean if all of them are set.
	 *
	 * If only one state is passed, one can assert on a certain tick of the given
	 * state (see [[clock]]).
	 *
	 * @param state One or more state names.
	 * @param tick For one state, additionally checks if state's clock is the same
	 * moment.
	 * @return
	 *
	 * ```
	 * states = AsyncMachine.factory ['A', 'B']
	 * states.add 'A'
	 * states.is 'A' # -> true
	 * states.is ['A'] # -> true
	 * states.is ['A', 'B'] # -> false
	 * tick = states.clock 'A'
	 * states.drop 'A'
	 * states.add 'A'
	 * states.is 'A', tick # -> false
	 * ```
	###
	is: (state, tick) ->
		return [].concat @states_active if not state
		active = Boolean ~@states_active.indexOf state
		return no if not active
		if tick is undefined then yes else (@clock state) is tick

	###*
	 * Checks if any of the passed states is set. State can also be an array, then
	 * all states from this param has to be set.
	 *
	 * @param states State names and/or lists of state names.
	 * @return
	 *
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add ['A', 'B']
	 *
	 * states.any 'A', 'C' # -> true
	 * states.any ['A', 'C'], 'C' # -> false
	 * ```
	###
	any: (states...) ->
		states.some (name) =>
			if Array.isArray name
				@every name
			else
				@is name

	###*
	 * Checks if all the passed states are set.
	 *
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add ['A', 'B']
	 *
	 * states.every 'A', 'B' # -> true
	 * states.every 'A', 'B', 'C' # -> false
	 * ```
	###
	every: (states...) ->
		states.every (name) =>
			Boolean ~@states_active.indexOf name

	###*
	 * Returns the current queue. For struct's meaning, see [[QUEUE]].
	###
	futureQueue: -> @queue

	###*
	 * Register the passed state names. State properties should be already defined.
	 *
	 * @param states State names.
	 * @return
	 *
	 * ```
	 * states = new AsyncMachine
	 * states.Enabled = {}
	 * states.Disposed = blocks: 'Enabled'
	 *
	 * states.register 'Enabled', 'Disposed'
	 *
	 * states.add 'Enabled'
	 * states.is() # -> 'Enabled'
	 * ```
	###
	register: (states...) ->
		# TODO assert that the state exists
		for state in states
			@states_all.push state if state not in @states_all
			@clock_[state] = 0

	###*
	 * Returns state's properties.
	 *
	 * @param state State name.
	 * @return
	 *
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.A = blocks: ['B']
	 *
	 * states.get('A') # -> { blocks: ['B'] }
	 * ```
	###
	get: (state) -> @[state]

	###*
	 * Sets specified states and deactivate all the other which are currently set.
	 *
	 * @param target OPTIONAL. Pass it if you want to execute a transition on an
	 *   external machine, but using the local queue.
	 * @param states Array of state names or a single state name.
	 * @param params Params to be passed to the transition handlers (only ones from
	 *   the specified states, not implied or auto states).
	 * @return Result of the transition. FALSE means that states weren't accepted,
	 *   or some of implied or auto states dropped some of the requested states
	 *   after the transition.
	 *
	 * Basic usage
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.set 'A'
	 * states.is() # -> ['A']
	 * states.set 'B'
	 * states.is() # -> ['B']
	 * ```
	 *
	 * State negotiation
	 * ```
	 * states = AsyncMachine.factory ['A', 'B']
	 * # Transition enter negotiation
	 * states.A_enter = -> no
	 * states.add 'A' # -> false
	 * ```
	 *
	 * Setting a state on an external machine
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B']
	 * states2 = AsyncMachine.factory ['C', 'D']
	 *
	 * states1.A_enter ->
	 * 	# this transition will be queued and executed after the current transition
	 * 	# fully finishes
	 * 	states1.add states2, 'B'
	 * ```
	###
	set: (target, states, params...) ->
		if target not instanceof AsyncMachine
			if states
				params = [states].concat params
			states = target
			target = null

		@enqueue_ STATE_CHANGE.SET, states, params, target

		@processQueue_()

	###*
	 * Deferred version of [[set]], returning a node-style callback for setting
	 * the state. Errors are handled automatically and forwarded to the Exception
	 * state.
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[set]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * setTimeout states.setByCallback 'B'
	 * ```
	 *
	###
	setByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@set.bind this), target, states, params

	###*
	 * Deferred version of [[set]], returning a listener for setting
	 * the state. Errors need to be handled manually by binding the exception
	 * state to the 'error' event (or equivalent).
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[set]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * emitter = new events.EventEmitter
	 * emitter.on 'ready', states.setByListener 'A'
	 * emitter.on 'error', states.addByListener 'Exception'
	 * ```
	###
	setByListener: (target, states, params...) ->
		@createListener @createDeferred (@set.bind this), target, states, params

	###*
	 * Deferred version of [[set]], setting the requested states on the next event
	 * loop's tick. Useful if you want to start with a fresh stack trace.
	 *
	 * See [[set]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.set 'A'
	 * states.setNext 'B'
	 * states.is() # -> ['A']
	 * ```
	###
	setNext: (target, states, params...) ->
		fn = @set.bind this
		@setImmediate fn, target, states, params

	###*
	 * Adds specified states to the currently set ones.
	 *
	 * @param target OPTIONAL. Pass it if you want to execute a transition on an
	 *   external machine, but using the local queue.
	 * @param states Array of state names or a single state name.
	 * @param params Params to be passed to the transition handlers (only ones from
	 *   the specified states, not implied or auto states).
	 * @return Result of the transition. FALSE means that states weren't accepted,
	 *   or some of implied or auto states dropped some of the requested states
	 *   after the transition.
	 *
	 * Basic usage
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add 'A'
	 * states.is() # -> ['A']
	 * states.add 'B'
	 * states.is() # -> ['B']
	 * ```
	 *
	 * State negotiation
	 * ```
	 * states = AsyncMachine.factory ['A', 'B']
	 * # Transition enter negotiation
	 * states.A_enter = -> no
	 * states.add 'A' # -> false
	 * ```
	 *
	 * Adding a state on an external machine
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B']
	 * states2 = AsyncMachine.factory ['C', 'D']
	 *
	 * states1.A_enter ->
	 * 	# this transition will be queued and executed after the current transition
	 * 	# fully finishes
	 * 	states1.add states2, 'B'
	 * ```
	###
	add: (target, states, params...) ->
		if target not instanceof AsyncMachine
			if states
				params = [states].concat params
			states = target
			target = null

		@enqueue_ STATE_CHANGE.ADD, states, params, target

		@processQueue_()

	###*
	 * Deferred version of [[add]], returning a node-style callback for adding
	 * the state. Errors are handled automatically and forwarded to the Exception
	 * state.
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[add]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * someNodeCallback 'foo.com', states.addByCallback 'B'
	 * ```
	 *
	###
	addByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@add.bind this), target, states, params

	###*
	 * Deferred version of [[add]], returning a listener for adding
	 * the state. Errors need to be handled manually by binding the exception
	 * state to the 'error' event (or equivalent).
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[add]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * emitter = new events.EventEmitter
	 * emitter.on 'ready', states.addByListener 'A'
	 * emitter.on 'error', states.addByListener 'Exception'
	 * ```
	###
	addByListener: (target, states, params...) ->
		@createListener @createDeferred (@add.bind this), target, states, params

	###*
	 * Deferred version of [[add]], adding the requested states on the next event
	 * loop's tick. Useful if you want to start with a fresh stack trace.
	 *
	 * See [[add]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add 'A'
	 * states.addNext 'B'
	 * states.is() # -> ['A', 'B']
	 * ```
	###
	addNext: (target, states, params...) ->
		fn = @add.bind this
		@setImmediate fn, target, states, params

	###*
	 * Drops specified states if they are currently set.
	 *
	 * @param target OPTIONAL. Pass it if you want to execute a transition on an
	 *   external machine, but using the local queue.
	 * @param states Array of state names or a single state name.
	 * @param params Params to be passed to the transition handlers (only ones from
	 *   the specified states, not implied or auto states).
	 * @return Result of the transition. FALSE means that dropping the states
	 *   wasn't accepted, or some of implied or auto states added some of the
	 *   requested states after the transition.
	 *
	 * Basic usage
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.drop 'A'
	 * states.is() # -> ['A']
	 * states.drop 'B'
	 * states.is() # -> ['B']
	 * ```
	 *
	 * State negotiation
	 * ```
	 * states = AsyncMachine.factory ['A', 'B']
	 * # Transition enter negotiation
	 * states.A_enter = -> no
	 * states.add 'A' # -> false
	 * ```
	 *
	 * Dropping a state on an external machine
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B']
	 * states2 = AsyncMachine.factory ['C', 'D']
	 *
	 * states1.A_enter ->
	 * 	# this transition will be queued and executed after the current transition
	 * 	# fully finishes
	 * 	states1.add states2, 'B'
	 * ```
	###
	drop: (target, states, params...) ->
		if target not instanceof AsyncMachine
			if states
				params = [states].concat params
			states = target
			target = null

		@enqueue_ STATE_CHANGE.DROP, states, params, target

		@processQueue_()

	###*
	 * Deferred version of [[drop]], returning a node-style callback for dropping
	 * the state. Errors are handled automatically and forwarded to the Exception
	 * state.
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[drop]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * someNodeCallback 'foo.com', states.dropByCallback 'B'
	 * ```
	 *
	###
	dropByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@drop.bind this), target, states, params

	###*
	 * Deferred version of [[drop]], returning a listener for dropping
	 * the state. Errors need to be handled manually by binding the exception
	 * state to the 'error' event (or equivalent).
	 *
	 * After the call, the responsible promise object is available as the
	 * [[last_promise]] attribute.
	 *
	 * See [[drop]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * emitter = new events.EventEmitter
	 * emitter.on 'ready', states.dropByListener 'A'
	 * emitter.on 'error', states.setByListener 'Exception'
	 * ```
	###
	dropByListener: (target, states, params...) ->
		@createListener @createDeferred (@drop.bind this), target, states, params

	###*
	 * Deferred version of [[drop]], dropping the requested states on the next
	 * event loop's tick. Useful if you want to start with a fresh stack trace.
	 *
	 * See [[drop]] for the params description.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add 'A'
	 * states.dropNext 'A'
	 * states.is('A') # -> true
	 * ```
	###
	dropNext: (target, states, params...) ->
		fn = @drop.bind this
		@setImmediate fn, target, states, params

	###*
	 * Pipes (forwards) the state to other instance.
	 *
	 * Piped are "_state" and "_end" methods, not the negotiation ones
	 * (see pipeNegotiation]] for these).
	 *
	 * @param state Source state's name. Optional - if none is given, all states
	 * from the source asyncmachine are piped.
	 * @param machine Target machine to which the state(s) should be forwarded.
	 * @param target_state If the target state name should be different, this is
	 * the name.
	 * @param local_queue Append the piped stated to the end of the local queue
	 *   if any exists at the moment. This will alter the order of the transition.
	 *
	 * Example
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states1.pipe 'A', states2
	 * states1.add 'A'
	 * states2.is('A') # -> true
	 * ```
	###
	pipe: (state, machine, target_state, local_queue) ->
		bindings =
			state: 'add'
			end: 'drop'

		@pipeBind state, machine, target_state, local_queue, bindings

	###*
	 * Pipes (forwards) the state to other instance in an inverted manner.
	 *
	 * Piped are "_state" and "_end" methods, not the negatiation ones
	 * (see pipeNegotiation]] for these).
	 *
	 * @param state Source state's name. Optional - if none is given, all states
	 * from the source asyncmachine are forwarded.
	 * @param machine Target machine to which the state(s) should be forwarded.
	 * @param target_state If the target state name should be different, this is
	 * the name.
	 * @param local_queue Append the piped stated to the end of the local queue
	 *   if any exists at the moment. This will alter the order of the transition.
	 *
	 * Example
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states1.pipeInverted 'A', states2
	 * states2.is('A') # -> true
	 * states1.add 'A'
	 * states2.is('A') # -> false
	 * ```
	###
	pipeInverted: (state, machine, target_state, local_queue) ->
		bindings =
			state: 'drop'
			end: 'add'

		@pipeBind state, machine, target_state, local_queue, bindings

	###*
	 * Pipes (forwards) the state to other instance.
	 *
	 * Piped are "_enter" and "_exit" methods, which returned values can manage
	 * the state negotiation, but also can be executed in random order (relatively
	 * to other states from the same transition).
	 *
	 * @param state Source state's name. Optional - if none is given, all states
	 * from the source asyncmachine are piped.
	 * @param machine Target machine to which the state(s) should be forwarded.
	 * @param target_state If the target state name should be different, this is
	 * the name.
	 * @param local_queue Append the piped stated to the end of the local queue
	 *   if any exists at the moment. This will alter the order of the transition.
	 *
	 * Piping without negotiation
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states1.pipeNegotiation 'A', states2
	 * states1.add 'A'
	 * states2.is('A') # -> true
	 * ```
	 *
	 * Piping with negotiation
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2.A_enter = -> no
	 * states1.pipeNegotiation 'A', states2
	 * states1.add 'A'
	 * states2.is('A') # -> false
	 * ```
	###
	pipeNegotiation: (state, machine, target_state, local_queue) ->
		bindings =
			enter: 'add'
			exit: 'drop'

		@pipeBind state, machine, target_state, local_queue, bindings

	###*
	 * Pipes (forwards) the state to other instance in an inverted manner.
	 *
	 * Piped are "_enter" and "_exit" methods, which returned values can manage
	 * the state negotiation, but also can be executed in random order (relatively
	 * to other states from the same transition).
	 *
	 * @param state Source state's name. Optional - if none is given, all states
	 * from the source asyncmachine are piped.
	 * @param machine Target machine to which the state(s) should be forwarded.
	 * @param target_state If the target state name should be different, this is
	 * the name.
	 * @param local_queue Append the piped stated to the end of the local queue
	 *   if any exists at the moment. This will alter the order of the transition.
	 *
	 * Inverted piping without negotiation
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states1.pipeNegotiationInverted 'A', states2
	 * states1.add 'A'
	 * states2.is('A') # -> true
	 * ```
	 *
	 * Inverted piping with negotiation
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2.A_enter = -> no
	 * states1.pipeNegotiationInverted 'A', states2
	 * states1.add 'A'
	 * states2.is('A') # -> false
	 * ```
	###
	pipeNegotiationInverted: (state, machine, target_state, local_queue) ->
		bindings =
			enter: 'drop'
			exit: 'add'

		@pipeBind state, machine, target_state, local_queue, bindings


	pipeOff: -> throw new Error "not implemented yet"


	###*
	 * Returns the current tick of the passed state.
	 *
	 * State's clock starts with 0 and on each (successful) set it's incremented
	 * by 1. Ticks lets you keep control flow's integrity across async listeners,
	 * by aborting it once the state had changed. Easiest way to get the tick
	 * abort function is to use [[getAbort]].
	 *
	 * @param state Name of the state
	 * @return Current tick of the passed state
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.add 'A'
	 * states.add 'A'
	 * states.clock('A') # -> 1
	 * states.drop 'A'
	 * states.add 'A'
	 * states.clock('A') # -> 2
	 * ````
	###
	clock: (state) ->
		# TODO assert an existing state
		@clock_[state]


	###*
	 * Creates a prototype child with dedicated active states, a clock and
	 * a queue.
	 *
	 * Useful for creating new instances of dynamic classes (or factory created
	 * instances).
	 *
	 * @param state Name of the state
	 * @return Current tick of the passed state
	 *
	 * Example
	 * ```
	 * states1 = AsyncMachine.factory ['A', 'B', 'C']
	 * states2 = states1.createChild()
	 *
	 * states2.add 'A'
	 * states2.is() # -> ['A']
	 * states1.is() # -> []
	 * ````
	###
	createChild: ->
		child = Object.create @
		child_states_active = []
		child.clock = {}
		child.queue = []
		child.clock[state] = 0 for state in @states_all
		child


	###*
	 * Indicates if this instance is currently during a state transition.
	 *
	 * When a machine is during a transition, all state changes will be queued
	 * and executed as a queue. See [[queue]].
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 *
	 * states.A_enter = ->
	 *   @duringTransition() # -> true
	 *
	 * states.A_state = ->
	 *   @duringTransition() # -> true
	 *
	 * states.add 'A'
	 * ````
	###
	duringTransition: -> @lock


	###*
	 * Returns the abort function, based on the current [[clock]] tick of the
	 * passed state. Optionally allows to compose an existing abort function.
	 *
	 * The abort function is a boolean function returning TRUE once the flow
	 * for the specific state should be aborted, because:
	 * -the state has been unset (at least once)
	 * -the composed abort function returns TRUE
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 *
	 * states.A_state = ->
	 *   abort = @getAbort 'A'
	 *   setTimeout (->
	 *       return if abort()
	 *       console.log 'never reached'
	 *     ), 0
	 *
	 * states.add 'A'
	 * states.drop 'A'
	 * ````
	 *
	 * TODO support multiple states
	 * TODO support default values for state names
	 *
	 * @param state Name of the state
	 * @param abort Existing abort function (optional)
	 * @return A new abort function
	###
	getAbort: (state, abort) ->
		tick = @clock state

		@getAbortFunction state, tick, abort


	###*
	 * Resolves the returned promise when all passed states are set (at the same
	 * time). Accepts an optional abort function.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.when(['A', 'B']).then ->
	 *   console.log 'A, B'
	 *
	 * states.add 'A'
	 * states.add('B') # -> prints 'A, B'
	 * ````
	 *
	 * # TODO support push cancellation
	 *
	 * @param state List of state names
	 * @param abort Existing abort function (optional)
	 * @return Promise resolved once all states are set concurrently.
	###
	when: (states, abort) ->
		states = [].concat states
		new promise.Promise (resolve, reject) =>
			@bindToStates states, resolve, abort


	###*
	 * Resolves the returned promise when all passed states are set (at the same
	 * time), but triggers the listeners only once. Accepts an optional abort
	 * function.
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.whenOnce(['A', 'B']).then ->
	 *   console.log 'A, B'
	 *
	 * states.add 'A'
	 * states.add('B') # -> prints 'A, B'
	 * states.drop 'B'
	 * states.add 'B' # listener is already disposed
	 * ````
	 *
	 * # TODO support push cancellation
	 *
	 * @param state List of state names
	 * @param abort Existing abort function (optional)
	 * @return Promise resolved once all states are set concurrently.
	###
	whenOnce: (states, abort) ->
		states = [].concat states
		new promise.Promise (resolve, reject) =>
			@bindToStates states, resolve, abort, yes


	###*
	 * Enabled debug messages sent to the console. There're 3 log levels:
	 *
	 * - 1 - displays only the state changes in a diff format
	 * - 2 - displays all operations which happened along with refused state
	 *   changes
	 * - 3 - displays pretty much everything, including all possible operations
	 *
	 * Example
	 * ```
	 * states = AsyncMachine.factory ['A', 'B', 'C']
	 * states.debug 'FOO ', 1
	 * states.add 'A'
	 * # -> FOO [add] state Enabled
	 * # -> FOO [states] +Enabled
	 * ````
	 *
	 * @param prefix Prefix before all console messages.
	 * @param level Error level (1-3).
	###
	debug: (prefix = '', level = 1) ->
		@debug_ = yes
		@debug_prefix = prefix
		@debug_level = level

		null


	debugOff: ->
		@debug_ = no

		null


	on: (event, listener, context) ->
		# is event is a NAME_state event, fire at once if the state is set
		# TODO last state params
		if event[-6..-1] is '_state' and @is event[0...-6]
			@catchPromise listener.call context

		super event, listener, context
		this


	once: (event, listener, context) ->
		# is event is a NAME_state event, fire at once if the state is set
		# and dont register the listener
		# TODO last state params
		if event[-6..-1] is '_state' and @is event[0...-6]
			@catchPromise listener.call context
		else
			super event, listener, context

		this


	###*
	 * Bind the Exception state to the promise error handler. Handy when working
	 * with promises.
	 *
	 * See [[Exception_state]].
	 *
	 * @param promise The promise to handle
	 * @param target_states States for which the promise was created (the
	 *   one that failed).
	 * @return The source promise, for piping.
	###
	catchPromise: (promise, target_states) ->
		if promise?.then and promise?.catch
			promise.catch (error) =>
				@add 'Exception', error, target_states

		promise


	###*
	 * Diffs two state sets and returns the ones present in the 1st only.
	 *
	 * @param states1 Source states list.
	 * @param states2 Set to diff against (picking up the non existing ones).
	 * @return List of states in states1 but not in states2.
	###
	diffStates: (states1, states2) ->
		name for name in states1 when name not in states2


	##/#/#/#/#/#/#/#///
	# PRIVATES
	##/#/#/#/#/#/#/#///


	log: (msg, level) ->
		level ?= 1
		return unless @debug_
		return if level > @debug_level
		console.log @debug_prefix + msg


	pipeBind: (state, machine, target_state, local_queue, bindings) ->
		# switch params order
		if state instanceof AsyncMachine
			target_state ?= yes
			return @pipeBind @states_all, state, machine, target_state, bindings

		local_queue ?= yes

		@log "Piping state #{state}", 3

		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state

			Object.keys(bindings).forEach (event_type) =>
				method_name = bindings[event_type]
				# TODO support self transitions?
				@piped[state] =
					state: new_state
					machine: machine
				@on "#{state}_#{event_type}", =>
					if local_queue
						this[method_name] machine, new_state
					else
						machine[method_name] new_state


	###*
	 * Override for EventEmitter method calling a specific listener. Binds to
	 * a promis if returned by the listener.
	###
	callListener: (listener, context, params) ->
		ret = listener.apply context, params

		# assume params[0] are the target states of the transition
		@catchPromise ret, params[0]


	# used only for casting in static typing
	getInstance: -> @


	# TODO make it cancellable
	setImmediate: (fn, params...) ->
		if setImmediate
			setImmediate.apply null, [fn].concat params
		else
			setTimeout (fn.apply null, params), 0


	# TODO log it better
	# Returns a queue entry with
	prepareAutoStates: ->
		add = []
		@states_all.forEach (state) =>
			is_current = => @is state
			is_blocked = => @is().some (item) =>
				return no if not (@get item).blocks
				Boolean ~(@get item).blocks.indexOf state

			if this[state].auto and not is_current() and not is_blocked()
				add.push state

		if add.length
			[STATE_CHANGE.ADD, add, [], yes]


	hasStateChanged: (states_before) ->
		length_equals = @is().length is states_before.length
		# if not autostate and not ((@any states_before) and length_equals)

		not length_equals or Boolean @diffStates(states_before, @is()).length


	parseStates: (states) ->
		states = [].concat states

		states = states.filter (state) =>
			if typeof state isnt 'string' or not @get state
				# TODO trow a specific class once TS will stop complaining
				throw new Error "Non existing state: #{state}"

			yes

	# This is the main transition logic, called exclusively by the queue iterator
	processStateChange_: (type, states, params, is_autostate) ->
		return unless states.length

		try
			@lock = yes
			queue = @queue
			@queue = []
			states_before = @is()
			type_label = STATE_CHANGE_LABELS[type].toLowerCase()
			if is_autostate
				@log "[#{type_label}] AUTO state #{states.join ", "}", 3
			else
				@log "[#{type_label}] state #{states.join ", "}", 2
			# TODO shouldn't this be after setting up the target states?
			ret = @selfTransitionExec_ states, params

			if ret isnt no
				states_to_set = switch type
					when STATE_CHANGE.DROP
						@states_active.filter (state) ->
							not ~states.indexOf state
					when STATE_CHANGE.ADD
						states.concat @states_active
					when STATE_CHANGE.SET
						states
				states_to_set = @setupTargetStates_ states_to_set

				# Dropping states doesnt require an acceptance
				# Autostates can be set partially (TODO check if any is a target?)
				if type isnt STATE_CHANGE.DROP and not is_autostate
					states_accepted = states.every (state) ->
						~states_to_set.indexOf state
					unless states_accepted
						@log "Cancelled the transition, as not all target states were accepted", 3
						ret = no

			if ret isnt no
				# Execute the transition
				# TODO produce a list of method calls and return them
				ret = @transition_ states_to_set, states, params
			# if canceled then drop the queue created during the transition
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			# drop the queue created during the transition
			@queue = [
				STATE_CHANGE.ADD, ['Exception'], [err, states]
			].concat queue
			console.log @queue
			@lock = no
			return

		# TODO move to processQueue
		if ret is no
			@emit 'cancelled'
		# TODO autostate cant trigger an auto state?
		else if (@hasStateChanged states_before) and not is_autostate
			# prepend auto states to the beginning of the queue
			auto_states = @prepareAutoStates()
			if auto_states
				@queue.unshift auto_states

		return if type is STATE_CHANGE.DROP
			@allStatesNotSet states
		else
			@allStatesSet states


	###
  	Puts a transition in the queue, handles a log msg and unifies the states
  	array.
	###
	enqueue_: (type, states, params, target) ->
		type_label = STATE_CHANGE_LABELS[type].toLowerCase()
		states = @parseStates states
			
		if @duringTransition()
			if target
				# TODO add machine ID
				@log "Queued #{type_label} state(s) #{states.join ', '} for an external machine", 2
			else
				@log "Queued #{type_label} state(s) #{states.join ', '}", 2

		@queue.push [type, states, params, target]


	# Goes through the whole queue collecting return values.
	processQueue_: ->
		return if @lock_queue

		ret = []
		row = undefined
		@lock_queue = yes
		while row = @queue.shift()
			target = row[QUEUE.TARGET] or this
			params = [
				row[QUEUE.STATE_CHANGE],
				(@parseStates row[QUEUE.STATES]),
				row[QUEUE.PARAMS], no,
				target is this
			]
			# emit the transition on the target machine
			ret.push target.processStateChange_.apply target, params
		@lock_queue = no

		# TODO parse the first row for main functions
		not ~ret.indexOf no


	allStatesSet: (states) ->
		states.every (state) => @is state


	allStatesNotSet: (states) ->
		states.every (state) => not @is state


	createDeferred: (fn, target, states, state_params) ->
		# TODO use the current transition's states if available (for enter/exit
		# transitons)
		transition_states = @is()

		params = [target]
		if states
			params.push states
		if state_params.length
			params.push.apply params, state_params

		deferred = new Deferred
		deferred.promise
			.then (callback_params) =>
				fn.apply null, params.concat callback_params
			.catch (err) =>
				async_states = [].concat if params[0] instanceof AsyncMachine
					params[1]
				else
					params[0]
				@add 'Exception', err, transition_states, async_states

		@last_promise = deferred.promise

		deferred

	createCallback: (deferred) ->
		(err = null, params...) =>
			if err
				deferred.reject err
			else
				deferred.resolve params


	createListener: (deferred) ->
		(params...) -> deferred.resolve params


	# Executes self transitions (eg ::A_A) based on active states.
	selfTransitionExec_: (states, params) ->
		params ?= []
		ret = states.some (state) =>
			ret = undefined
			name = state + "_" + state
			if ~@states_active.indexOf state
				transition_params = []
				transition_params = [states].concat params
				context = @getMethodContext name
				if context
					@log "[transition] #{name}", 2
					ret = context[name].apply context, transition_params
					@catchPromise ret, states
				else
					@log "[transition] #{name}", 3

				if ret is no
					@log "Self transition for #{state} cancelled", 2
					return yes

				a = @emit.apply this, [name].concat transition_params
				if ret isnt no
					# TODO this is hacky
					@transition_events.push [name, transition_params]

				ret is no

		not ret


	setupTargetStates_: (states, exclude) ->
		states = @parseStates states

		exclude ?= []

		states = @parseImplies_ states
		states = @removeDuplicateStates_ states

		# Check if state is blocked or excluded
		already_blocked = []

		# Parsing required states allows to avoid cross-dropping of states
		states = @parseRequires_ states

		# Remove states already blocked.
		states = states.reverse().filter (name) =>
			blocked_by = @isStateBlocked_ states, name
			blocked_by = blocked_by.filter (blocker_name) ->
				not ~already_blocked.indexOf blocker_name

			if blocked_by.length
				already_blocked.push name
				# if state wasn't implied by another state (was one of the current
				# states) then make it a higher priority log msg
				if @is name
					@log "State #{name} dropped by #{blocked_by.join(", ")}", 2
				else
					@log "State #{name} ignored because of #{blocked_by.join(", ")}", 3
			not blocked_by.length and not ~exclude.indexOf name

		# Parsing required states allows to avoid cross-dropping of states
		@parseRequires_ states.reverse()


	# Collect implied states
	parseImplies_: (states) ->
		states.forEach (name) =>
			state = @get(name)
			return unless state.implies
			states = states.concat state.implies

		states


	# Check required states
	# Loop until no change happens, as states can require themselves in a vector.
	parseRequires_: (states) ->
		length_before = 0
		not_found_by_states = {}
		# TODO compare states by name
		until length_before is states.length
			length_before = states.length
			states = states.filter (name) =>
				state = @get name
				not_found = []
				not state.requires?.forEach (req) =>
					found = ~states.indexOf req
					if not found
						not_found.push req

				if not_found.length
					not_found_by_states[name] = not_found

				not not_found.length

		if Object.keys(not_found_by_states).length
			state = ''
			not_found = []
			names = for state, not_found of not_found_by_states
				"#{state}(-#{not_found.join ' -'})"
			@log "Can't set the following states #{names.join ', '}", 2

		states


	removeDuplicateStates_: (states) ->
		states2 = []
		states.forEach (name) ->
			states2.push name unless ~states2.indexOf name

		states2


	isStateBlocked_: (states, name) ->
		blocked_by = []
		states.forEach (name2) =>
			state = @get name2
			if state.blocks and ~state.blocks.indexOf name
				blocked_by.push name2

		blocked_by


	transition_: (to, explicit_states, params) ->
		params ?= []
		@transition_events = []

		# Remove active states.
		from = @states_active.filter (state) ->
			not ~to.indexOf state

		@orderStates_ to
		@orderStates_ from

		ret = from.some (state) =>
			no is @transitionExit_ state, to, explicit_states, params

		return no if ret is yes
		ret = to.some (state) =>
			# Skip transition if state is already active and its not a multi state.
			# TODO write tests for multi state
			return no if (~@states_active.indexOf state) and not (@get state).multi
			if ~explicit_states.indexOf state
				transition_params = params
			else
				transition_params = []
			ret = @transitionEnter_ state, to, transition_params

			ret is no

		return no if ret is yes
		@setActiveStates_ to

		yes


	setActiveStates_: (target) ->
		previous = @states_active
		new_states = @diffStates target, @states_active
		removed_states = @diffStates @states_active, target
		nochange_states = @diffStates target, new_states
		@states_active = target
		# Tick all the new states.
		for state in target
			@clock_[state]++ if not ~previous.indexOf state

		 # construct a logging msg
		log_msg = []
		if new_states.length
			log_msg.push "+#{new_states.join ' +'}"
		if removed_states.length
			log_msg.push "-#{removed_states.join ' -'}"
		# TODO fix
		if nochange_states.length and @debug_level > 2
			if new_states.length or removed_states.length
				log_msg.push "\n    "
			log_msg.push nochange_states.join ', '
		@log "[states] #{log_msg.join ' '}", 1 if log_msg.length

		@processPostTransition()
		@emit 'change', previous


	# TODO this is hacky, should be integrated into processTransition
	processPostTransition: ->
		for transition in @transition_events
			name = transition[0]
			params = transition[1]

			if name[-5..-1] is '_exit'
				state = name[0...-5]
				method = "#{state}_end"
			else if name[-6..-1] is '_enter'
				state = name[0...-6]
				method = "#{state}_state"

			context = @getMethodContext method
			if context
				@log "[transition] #{method}", 2
				try ret = context[method]?.apply context, params
				# Drop the states in case it created an exception
				catch err
					@drop state
					throw err
				@catchPromise ret, @is()
			else
				@log "[transition] #{method}", 3

			@emit.apply this, [method].concat params

		@transition_events = []


	getMethodContext: (name) ->
		if @target[name]
			@target
		else if @[name]
			this


	# Exit transition handles state-to-state methods.
	transitionExit_: (from, to, explicit_states, params) ->
		if ~explicit_states.indexOf from
			transition_params = params
		transition_params ?= []
		ret = @transitionExec_ from + "_exit", to, transition_params
		return no if ret is no

		# TODO executes transitions which are beeing dropped now
		ret = to.some (state) =>
			transition = from + "_" + state
			if ~explicit_states.indexOf state
				transition_params = params
			transition_params ?= []
			ret = @transitionExec_ transition, to, transition_params
			ret is no

		return no if ret is yes

		# TODO pass args to explicitly dropped states
		ret = (@transitionExec_ "#{from}_any", to) is no

		not ret


	transitionEnter_: (to, target_states, params) ->
		ret = @transitionExec_ "any_#{to}", target_states, params
		return no if ret is no

		@transitionExec_ "#{to}_enter", target_states, params


	transitionExec_: (method, target_states, params) ->
		params ?= []
		transition_params = []
		transition_params = [target_states].concat params
		ret = undefined

		context = @getMethodContext method
		if context
			@log "[transition] #{method}", 2
			ret = context[method]?.apply? context, transition_params
			@catchPromise ret, target_states
		else
			@log "[transition] #{method}", 3

		if ret isnt no
			is_exit = method[-5..-1] is '_exit'
			is_enter = not is_exit and method[-6..-1] is '_enter'
			if is_exit or is_enter
				# TODO this is hacky
				@transition_events.push [method, transition_params]
			ret = @emit.apply this, [method].concat transition_params
			if ret is no
				@log "Cancelled transition to #{target_states.join ', '} by " +
					"the event #{method}", 2
		else
			@log "Cancelled transition to #{target_states.join ', '} by " +
				"the method #{method}", 2

		ret

	# is_exit tells that the order is exit transitions
	orderStates_: (states) ->
		states.sort (e1, e2) =>
			state1 = @get e1
			state2 = @get e2
			ret = 0
			if state1.depends and ~state1.depends.indexOf e2
				ret = 1
			else
				ret = -1  if state2.depends and ~state2.depends.indexOf e1
			ret
		null


	# TODO bind to _enter and _exit as well to support the negotiation phase in
	# piped events
	bindToStates: (states, listener, abort, once) ->
		fired = 0
		enter = =>
			fired += 1
			if not abort?() and fired is states.length
				listener()
			if once or abort?()
				for state in states
					@removeListener "#{state}_state", enter
					@removeListener "#{state}_end", exit
		exit = -> fired -= 1
		for state in states
			@log "Binding to event #{state}", 3
			@on "#{state}_state", enter
			@on "#{state}_end", exit


	# TODO compose the existing abort function without recursion
	getAbortFunction: (state, tick, abort) ->
		=>
			if abort?()
				return yes
			else if not @is state
				@log "Aborted #{state} listener as the state is not set. " +
					"Current states:\n    (#{@is().join ', '})", 1
				return yes
			else if not @is state, tick
				@log "Aborted #{state} listener as the tick changed. Current states:" +
					"\n    (#{@is().join ', '})", 1
				return yes

			return no



module.exports.AsyncMachine = AsyncMachine
