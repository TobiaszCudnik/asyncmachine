eventemitter = require "eventemitter3-abortable"
promise = require 'es6-promise'
Promise = promise.Promise

STATE_CHANGE =
	DROP: 0
	ADD: 1
	SET: 2


STATE_CHANGE_LABELS =
	0: 'Drop'
	1: 'Add'
	2: 'Set'


QUEUE =
	STATE_CHANGE: 0
	STATES: 1
	PARAMS: 2
	TARGET: 3


class Deferred
	promise: null
	resolve: null
	reject: null
	constructor: -> @promise = new Promise (@resolve, @reject) =>


class AsyncMachine extends eventemitter.EventEmitter

	states_all: null
	states_active: null
	queue: null
	lock: no
	last_promise: null
	log_handler_: null
	# TODO change to log_prefix and log_level
	debug_prefix: ''
	debug_level: 1
	clock_: {}
	internal_fields: []
	target: null
	transition_events: []

	debug_: no

	Exception: {}


	constructor: (target) ->
		super()
		@queue = []
		@states_all = []
		@states_active = []
		@clock_ = {}

		@setTarget target or this
		@register 'Exception'
		# TODO this is lame, where are the prototypes?
		@internal_fields = ['_events', 'states_all'
			'states_active', 'queue', 'lock', 'last_promise', 'log_handler_'
			'debug_prefix', 'debug_level', 'clock_', 'debug_'
			'target', 'internal_fields']


	Exception_state: (states, err, exception_states) ->
		if exception_states.length?
			@log "Exception when tried to set following states: " +
				exception_states.join ', '
		# Promises eat exceptions, so we need to jump-out-of the stacktrace
		@setImmediate -> throw err


	setTarget: (target) ->
		@target = target


	registerAll: ->
		name = ''
		value = null

		# test the instance vars
		for name, value of @
			if (@hasOwnProperty name) and name not in @internal_fields
				@register name
		# test the prototype chain
		constructor = @constructor.prototype
		while yes
			for name, value of constructor
				if (constructor.hasOwnProperty name) and name not in @internal_fields
					@register name
			constructor = Object.getPrototypeOf constructor
			break if constructor is AsyncMachine.prototype


	# Returns active states or if passed a state, returns if its set.
	# Additionally can assert on a certain tick of a given state.
	is: (state, tick) ->
		# TODO clone the array
		return @states_active if not state
		active = !!~@states_active.indexOf state
		return no if not active
		if tick is undefined then yes else (@clock state) is tick


	# Tells if any of the parameters is set, where if param is an array, checks if
	#   all states in array are set.
	any: (names...) ->
		names.some (name) =>
			if Array.isArray name
				@every name
			else
				@is name


	every: (names...) ->
		names.every (name) =>
			!!~@states_active.indexOf name


	futureQueue: -> @queue


	# Prepare class'es states. Required to be called manually for inheriting classes.
	register: (states...) ->
		# TODO assert that the state exists
		for state in states
			@states_all.push state
			@clock_[state] = 0


	get: (state) -> @[state]


	# Activate certain states and deactivate the current ones.
	# TODO target param
	set: (target, states, params...) ->
		if target instanceof AsyncMachine
			if @duringTransition()
				@log "Queued SET state(s) #{states} for an external machine", 2
				@queue.push [STATE_CHANGE.SET, states, params, target]
				return yes
			else
				target.add states, params

		params = [states].concat params
		states = target

		@processStateChange_ STATE_CHANGE.SET, states, params


	# Deferred version of #set, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	setByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@set.bind this), target, states, params


	setByListener: (target, states, params...) ->
		@createListener @createDeferred (@set.bind this), target, states, params


	setNext: (target, states, params...) ->
		fn = @set.bind this
		@setImmediate fn, target, states, params


	# Activate certain states and keep the current ones.
	add: (target, states, params...) ->
		if target instanceof AsyncMachine
			if @duringTransition()
				@log "Queued ADD state(s) #{states} for an external machine", 2
				@queue.push [STATE_CHANGE.ADD, states, params, target]
				return yes
			else
				target.add states, params

		params = [states].concat params
		states = target
		@processStateChange_ STATE_CHANGE.ADD, states, params


	# Deferred version of #add, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	addByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@add.bind this), target, states, params


	addByListener: (target, states, params...) ->
		@createListener @createDeferred (@add.bind this), target, states, params


	addNext: (target, states, params...) ->
		fn = @add.bind this
		@setImmediate fn, target, states, params


	# Deactivate certain states.
	drop: (target, states, params...) ->
		if target instanceof AsyncMachine
			return if @duringTransition()
				@log "Queued DROP state(s) #{states} for an external machine", 2
				@queue.push [STATE_CHANGE.DROP, states, params, target]
				yes
			else
				target.drop states, params

		params = [states].concat params
		states = target

		@processStateChange_ STATE_CHANGE.DROP, states, params


	# Deferred version of #drop, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	dropByCallback: (target, states, params...) ->
		@createCallback @createDeferred (@drop.bind this), target, states, params


	dropByListener: (target, states, params...) ->
		@createListener @createDeferred (@drop.bind this), target, states, params


	dropNext: (target, states, params...) ->
		fn = @drop.bind this
		@setImmediate fn, target, states, params


	pipeForward: (state, machine, target_state) ->
		# switch params order
		if state instanceof AsyncMachine
			return @pipeForward @states_all, state, machine

		@log "Piping state #{state}", 3

		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state

			@on "#{state}_state", =>
				@add machine, new_state

			@on "#{state}_end", =>
				@drop machine, new_state


	pipeInvert: (state, machine, target_state) ->
		# switch params order
		if state instanceof AsyncMachine
			return @pipeInvert @states_all, state, machine

		@log "Piping inverted state #{state}", 3

		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state

			@on "#{state}_state", =>
				@drop machine, new_state

			@on "#{state}_end", =>
				@add machine, new_state


	pipeOff: -> throw new Error "not implemented yet"


	# Gets the current tick of a state.
	# Ticks are incemented by #set, for non-set states.
	clock: (state) ->
		# TODO assert an existing state
		@clock_[state]


	# Creates a prototype child with dedicated acrive states and the clock.
	createChild: ->
		child = Object.create @
		child_states_active = []
		child.clock = {}
		child.clock[state] = 0 for state in @states_all
		child


	duringTransition: -> @lock


	# TODO support multiple states
	getAbort: (state, abort) ->
		tick = @clock state
		=>
			should_abort = yes if abort and not abort?()
			should_abort ?= not @is state, tick
			if should_abort
				@log "Aborted #{state} listener, while in states (#{@is().join ', '})", 1

			should_abort


	# TODO support multiple states
	getAbortEnter: (state, abort) ->
		tick = @clock state
		=>
			should_abort = yes if abort and not abort?()
			should_abort ?= not @is state, tick + 1
			if should_abort
				@log "Aborted #{state}_enter listener, while in states " +
					"(#{@is().join ', '})", 1

			should_abort


	# Resolves the returned promise when all passed states are set (in the same time).
	# TODO support push cancellation
	when: (states, abort) ->
		states = [].concat states
		new Promise (resolve, reject) =>
			@bindToStates states, resolve, abort


	# Resolves the returned promise when all passed states are set (in the same time).
	# Triggers only once.
	# TODO support push cancellation
	whenOnce: (states, abort) ->
		states = [].concat states
		new Promise (resolve, reject) =>
			@bindToStates states, resolve, abort, yes


	debug: (prefix = '', level = 1) ->
		@debug_ = not @debug_
		@debug_prefix = prefix
		@debug_level = level
		null


	log: (msg, level) ->
		level ?= 1
		return unless @debug_
		return if level > @debug_level
		console.log @debug_prefix + msg


	on: (event, listener, context) ->
		# is event is a NAME_state event, fire at once if the state is set
		# TODO last state params
		if event[-6..-1] is '_state' and @is event[0...-6]
			listener.call context

		super(event, listener, context)


	once: (event, listener, context) ->
		# is event is a NAME_state event, fire at once if the state is set
		# and dont register the listener
		# TODO last state params
		if event[-6..-1] is '_state' and @is event[0...-6]
			listener.call context
		else
			super(event, listener, context)


	#//////////////////////////
	# PRIVATES
	#//////////////////////////


	# TODO make it cancellable
	setImmediate: (fn, params...) ->
		if setImmediate
			setImmediate.apply null, [fn].concat params
		else
			setTimeout (fn.apply null, params), 0


	# TODO log it better
	processAutoStates: (excluded) ->
		excluded ?= []
		add = []
		@states_all.forEach (state) =>
			is_excluded = => ~excluded.indexOf state
			is_current = => @is state
			is_blocked = => @is().some (item) =>
				return no if not (@get item).blocks
				Boolean ~(@get item).blocks.indexOf state
			if this[state].auto and not is_excluded() and not is_current() \
					and not is_blocked()
				add.push state

		@processStateChange_ STATE_CHANGE.ADD, add, [], yes


	hasStateChanged: (states_before) ->
		length_equals = @is().length is states_before.length
		# if not autostate and not ((@any states_before) and length_equals)

		not length_equals or @diffStates(states_before, @is()).length


	# TODO this is quite too long
	processStateChange_: (type, states, params, autostate, skip_queue) ->
		states = [].concat states
		# TODO merge with setupTargetStates
		states = states.filter (state) =>
			if typeof state isnt 'string'
				@log state + " isnt a string (state name)"
				return no
			if not @get state
				@log "State #{state} doesnt exist"
				return no

			yes

		return unless states.length
		try
			type_label = STATE_CHANGE_LABELS[type].toLowerCase()
			if @lock
				@log "Queued #{type_label} state(s) #{states.join ', '}", 2
				# TODO encapsulate
				@queue.push [type, states, params]
				return
			@lock = yes
			queue = @queue
			@queue = []
			states_before = @is()
			if autostate
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
				if type isnt STATE_CHANGE.DROP and not autostate
					states_accepted = states.every (state) ->
						~states_to_set.indexOf state
					unless states_accepted
						@log "Cancelled the transition, as target states weren't accepted", 3
						ret = no

			if ret isnt no
				# Execute the transition
				ret = @transition_ states_to_set, states, params
			# if canceled then drop the queue created during the transition
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			# drop the queue created during the transition
			@queue = queue
			@lock = no
			@add 'Exception', err, states
			return

		# TODO only for local target???
		if ret isnt no and @hasStateChanged states_before
			@processAutoStates states_before

		if not skip_queue
			@processQueue_()

		return if type is STATE_CHANGE.DROP
			@allStatesNotSet states
		else
			@allStatesSet states


	# Goes through the whole queue collecting returns. emits processing of
	# auto states on each tick.
	processQueue_: ->
		ret = []
		row = undefined
		while row = @queue.shift()
			target = row[QUEUE.TARGET] or this
			params = [
				row[QUEUE.STATE_CHANGE], row[QUEUE.STATES], row[QUEUE.PARAMS], no,
				target is this or target.duringTransition()
			]
			# emit the transition on the target machine
			ret.push target.processStateChange_.apply target, params

		not ~ret.indexOf no


	allStatesSet: (states) ->
		states.every (state) => @is state


	allStatesNotSet: (states) ->
		states.every (state) => not @is state


	createDeferred: (fn, target, states, params...) ->
		deferred = new Deferred
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			fn.apply null, [target, states].concat params
		@last_promise = deferred.promise

		deferred


	# TODO push states to the exception
	createCallback: (deferred) ->
		(err = null, params...) =>
			if err
				@add 'Exception', err
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
				transition_params = [states].concat params
				context = @getMethodContext name
				if context
					@log "[transition] #{name}", 2
					ret = context[name].apply context, transition_params
				else
					@log "[transition] #{name}", 3

				if ret is no
					@log "Self transition for #{state} cancelled", 2
					return yes

				ret = @emit.apply this, [name].concat params
				if ret isnt no
					# TODO this is hacky
					@transition_events.push [name, transition_params]

				ret is no

		not ret


	setupTargetStates_: (states, exclude) ->
		exclude ?= []

		# Remove non existing states
		states = states.filter (name) =>
			ret = ~@states_all.indexOf name
			if not ret
				@log "State #{name} doesn't exist", 2

			Boolean ret

		states = @parseImplies_ states
		states = @removeDuplicateStates_ states

		# Check if state is blocked or excluded
		already_blocked = []

		# parsing required states allows to avoid cross-dropping of states
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

		# parsing required states allows to avoid cross-dropping of states
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
				ret = not state.requires?.some (req) =>
					found = ~states.indexOf req
					if not found
						not_found.push req
					not found

				if not_found.length
					not_found_by_states[name] = not_found
				ret

		if Object.keys(not_found_by_states).length
			state = ''
			not_found = []
			names = for state, not_found of not_found_by_states
				"#{state}(-#{not_found.join '-'})"
			@log "Can't set following states #{names.join ', '} ", 2

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
			# Skip transition if state is already active.
			return no if ~@states_active.indexOf state
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


	# TODO this is hacky, should be integrated into the transition somehow
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
				@log "[transition] #{state}_end", 2
				context[method]?.apply context, params
			else
				@log "[transition] #{state}_end", 3

			@emit.apply this, [method].concat params

		@transition_events = []


	getMethodContext: (name) ->
		if @target[name]
			@target
		else if @[name]
			this


	# Returns states from states1 not present in states2
	diffStates: (states1, states2) ->
		name for name in states1 when name not in states2

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
		transition_params = [target_states].concat params
		ret = undefined

		context = @getMethodContext method
		if context
			@log "[transition] #{method}", 2
			ret = context[method]?.apply? context, transition_params
		else
			@log "[transition] #{method}", 3

		if ret isnt no
			is_exit = method[-5..-1] is '_exit'
			is_enter = not is_exit and method[-6..-1] is '_enter'
			if is_exit or is_enter
				# TODO this is hacky
				@transition_events.push [method, transition_params]
			ret = @emit method, transition_params
			if ret is no
				@log "Cancelled transition to #{target_states.join ', '} by " +
					"the event #{method}", 2
				# TODO broadcast the event
		else if ret is no
			@log "Cancelled transition to #{target_states.join ', '} by " +
				"the method #{method}", 2
			# TODO broadcast the event

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

module.exports.AsyncMachine = AsyncMachine
