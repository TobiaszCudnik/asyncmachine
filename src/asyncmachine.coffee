lucidjs = require "lucidjs"
rsvp = require "rsvp"
Promise = rsvp.Promise
require "es5-shim"


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



class AsyncMachine extends lucidjs.EventEmitter

	states_all: null
	states_active: null
	# TODO use an enum to type entry type
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


	constructor: (@config = {}) ->
		super()
		# TODO support debug prefix in settings
		@debug_ = !!config.debug
		@queue = []
		@states_all = []
		@states_active = []
		@clock_ = {}

		@setTarget @
		@register 'Exception'
		# This is lame, where are the prototypes?
		@internal_fields = ['_listeners', '_eventEmitters', '_flags'
			'source', 'event', 'cancelBubble', 'config', 'states_all'
			'states_active', 'queue', 'lock', 'last_promise', 'log_handler_'
			'debug_prefix', 'debug_level', 'clock_', 'debug_'
			'target', 'internal_fields']


	Exception_enter: (states, err, exception_states) ->
		if exception_states?.length
			@log "Exception when tried to set the following states: " +
				exception_states.join ', '
		# Promises eat exceptions, so we need to jump-out-of the stacktrace
		@setImmediate -> throw err

		yes


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
	set: (states, params...) ->
		@processStateChange_ STATE_CHANGE.SET, states, params


	# Deferred version of #set, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #setByCallback(err, data) and #setByListener(...params)
	setLater: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @processStateChange_ STATE_CHANGE.SET, states, params
			catch err
				@set 'Exception', err, states

		@last_promise = deferred.promise
		@createCallback deferred


	# Activate certain states and keep the current ones.
	add: (target, states, params...) ->
		if target instanceof AsyncMachine
			return if @duringTransition()
				@queue.push [STATE_CHANGE.ADD, states, params, target]
				yes
			else
				target.add states, params

		states = target
		params = [states].concat params
		@processStateChange_ STATE_CHANGE.ADD, states, params


	# Deferred version of #add, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #addByCallback(err, data) and #addByListener(...params)
	addByCallback: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @processStateChange_ STATE_CHANGE.ADD, states, params
			catch err
				@add 'Exception', err, states

		@last_promise = deferred.promise
		@createCallback deferred


	# TODO optimize with addByCallback
	addByListener: (target, states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (listener_params) =>
			params.push.apply params, listener_params
			try @processStateChange_ STATE_CHANGE.ADD, states, params
			catch err
				@add 'Exception', err, states

		@last_promise = deferred.promise
		@createListener deferred


	addNext: (states, params...) ->
		fn = @processStateChange_.bind this, STATE_CHANGE.ADD
		@setImmediate fn, states, params


	# TODO Deprecated, align tests and propagate to other state-manipulation methods
	addLater: (params...) -> @addByCallback.apply this, params


	# Deactivate certain states.
	drop: (states, params...) ->
		@processStateChange_ STATE_CHANGE.DROP, states, params


	# Deferred version of #drop, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #dropByCallback(err, data) and #dropByListener(...params)
	dropLater: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @processStateChange_ STATE_CHANGE.DROP, states, params
			catch err
				@drop 'Exception', err, states

		@last_promise = deferred.promise
		@createCallback deferred


	pipeForward: (state, machine, target_state) ->
		# switch params order
		if state instanceof AsyncMachine
			return @pipeForward @states_all, state, machine

		@log "Piping state #{state}", 3

		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state
			namespace = @namespaceName state

			@on namespace, =>
				@add machine, new_state

			@on namespace + ".end", ->
				@drop machine, new_state


	pipeInvert: (state, machine, target_state) ->
		throw new Error "not implemented yet"
		[].concat(state).forEach (state) =>
			state = @namespaceName state
			@on state + ".enter", ->
				machine.drop target_state

			@on state + ".exit", ->
				machine.add target_state


	pipeOff: -> throw new Error "not implemented yet"


	# Gets the current tick of a state.
	# Ticks are incemented by #set, for non-set states.
	clock: (state) ->
		# TODO assert an existing state
		@clock_[state]


	# Creates a prototype child with dedicated acrive states and the clock.
	createChild: ->
		child = Object.create @
		child.states_active = []
		child.clock = {}
		child.clock[state] = 0 for state in @states_all
		child


	duringTransition: -> @lock


	# TODO deprecated
	continueEnter: (state, func) ->
		tick = @clock state
		=>
			return if not @is state, tick + 1
			do func


	# TODO deprecated
	continueState: (state, func) ->
		tick = @clock state
		=>
			return if not @is state, tick
			do func


	# TODO support multiple states
	getAbort: (state, abort) ->
		tick = @clock state
		=>
			should_abort = yes if abort and not abort?()
			should_abort ?= not @is state, tick
			if should_abort
				@log "Aborted #{state} listener, while in states (#{@is().join ', '})", 1


	# TODO support multiple states
	getAbortEnter: (state, abort) ->
		tick = @clock state
		=>
			should_abort = yes if abort and not abort?()
			should_abort ?= not @is state, tick + 1
			if should_abort
				@log "Aborted #{state}.enter listener, while in states " +
					"(#{@is().join ', '})", 1


	# Accepts state event names (namespaced) and triggers the listener or
	# resolves a returned # promise if no listener passed.
	when: (states, abort) ->
		states = [].concat states
		new rsvp.Promise (resolve, reject) =>
			@bindToStates states, resolve, abort


	# Accepts state event names (namespaced) and triggers the listener or
	# resolves a returned # promise if no listener passed.
	# Disposes internal listeners once triggered.
	whenOnce: (states, abort) ->
		states = [].concat states
		new rsvp.Promise (resolve, reject) =>
			@bindToStates states, resolve, abort, yes


	debug: (prefix = '', level = 1, handler = null) ->
		@debug_ = not @debug_
		@debug_prefix = prefix
		@debug_level = level
		null


	log: (msg, level) ->
		level ?= 1
		return unless @debug_
		return if level > @debug_level
		console.log @debug_prefix + msg


	#//////////////////////////
	# PRIVATES
	#//////////////////////////


	# TODO use a regexp lib for IE8's 'g' flag compat?
	# CamelCase to Camel.Case
	namespaceName: (state) ->
		state.replace /([a-zA-Z])([A-Z])/g, "$1.$2"


	# TODO make it cancellable
	setImmediate: (fn, params...) ->
		if setImmediate
			setImmediate fn.apply null, params
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


	statesChanged: (states_before) ->
		length_equals = @is().length is states_before.length
		# if not autostate and not ((@any states_before) and length_equals)

		not length_equals or @diffStates(states_before, @is()).length


	# TODO Maybe avoid double concat of states_active
	# type: 0: drop, 1: add, 2: set # TODO enum this
	processStateChange_: (type, states, params, autostate, skip_queue) ->
		states = [].concat states
		# TODO handle non existing states
		return unless states.length
		try
			if @lock
				# TODO encapsulate
				@queue.push [type, states, params]
				return
			@lock = yes
			states_before = @is()
			type_label = STATE_CHANGE_LABELS[type]
			if autostate
				@log "[#{type_label}] AUTO state #{states.join ", "}", 3
			else
				@log "[#{type_label}] state #{states.join ", "}", 2
			ret = @selfTransitionExec_ states, params
			return no if ret is no
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
			if type isnt STATE_CHANGE.DROP
				states_accepted = states_to_set.some (state) ->
					~states.indexOf state
				unless states_accepted
					@log "Transition cancelled, as target states weren't accepted", 3
					return @lock = no

			queue = @queue
			@queue = []
			# Execute the transition
			ret = @transition_ states_to_set, states, params
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			@lock = no
			@add 'Exception', err, states
			throw err

		# TODO only for local target???
		if @statesChanged states_before
			@processAutoStates states_before

#		@setImmediate @processQueue_.bind this
		if not skip_queue
			@processQueue_()

		return if type is STATE_CHANGE.DROP
			@allStatesNotSet states
		else
			@allStatesSet states


	# Goes through the whole queue collecting returns. Triggers processing of
	# auto states on each tick.
	processQueue_: ->
		ret = []
		row = undefined
		while row = @queue.shift()
			target = row[QUEUE.TARGET] or this
			params = [
				row[QUEUE.STATE_CHANGE], row[QUEUE.STATES], row[QUEUE.PARAMS], no, yes
			]
			# Trigger the transition on the target without processing the queue
			ret.push target.processStateChange_.apply target, params

		not ~ret.indexOf no


	allStatesSet: (states) ->
		states.every (state) => @is state


	allStatesNotSet: (states) ->
		states.every (state) => not @is state


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


	namespaceTransition_: (transition) ->
		# CamelCase to Camel.Case
		# A_exit -> A.exit
		# A_B -> A._.B
		@namespaceName(transition)
			.replace(/_(exit|enter)$/, ".$1").replace "_", "._."


	# Executes self transitions (eg ::A_A) based on active states.
	selfTransitionExec_: (states, params) ->
		params ?= []
		ret = states.some (state) =>
			ret = undefined
			name = state + "_" + state
			method = @target[name]
			context = @target
			if not method and @[name]
				context = @
			if method and ~@states_active.indexOf state
				transition_params = [states].concat params
				ret = method.apply context, transition_params
				return yes if ret is no
				event = @namespaceTransition_ name
				transition_params2 = [event, states].concat params
				# TODO this is hacky
				@transition_events.push [event, params]
				(@trigger.apply @, transition_params2) is no

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
		# Remove duplicates.
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

		# TODO handle args
		return yes unless to.length

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
		all = @states_all
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
		if nochange_states.length and @config.debug > 1
			if new_states.length or removed_states.length
				log_msg.push "\n    "
			log_msg.push nochange_states.join ', '
		@log "[states] #{log_msg.join ' '}", 1 if log_msg.length

		# TODO this is hacky, should be integrated into the transition somehow
		for transition in @transition_events
			transition = transition[0]
			params = [previous].concat transition[1]
			if transition[-5..-1] is '.exit'
				event = transition[0...-5]
				state = event.replace /\./g, ''
				@unflag event
				@flag "#{event}.end"
				@trigger "#{event}.end", params
				@log "[flag] #{event}.end", 2
				# TODO params!
				@target[state + '_end']? previous, params
			else if transition[-6..-1] is '.enter'
				event = transition[0...-6]
				state = event.replace /\./g, ''
				@unflag "#{event}.end"
				@flag event
				@trigger event, params
				@log "[flag] #{event}", 2
				# TODO params!
				@target[state + '_state']? previous, params

		@transition_events = []


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

		# Duplicate event for namespacing.
		transition = "exit." + @namespaceName from
		ret = @transitionExec_ transition, to, transition_params
		return no if ret is no
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
		ret = @transitionExec_ "#{to}_enter", target_states, params
		return no if ret is no

		# Duplicate event for namespacing.
		event_args = ["enter.#{@namespaceName to}", target_states]
		ret = @trigger.apply @, event_args.concat params
		ret

	transitionExec_: (method, target_states, params) ->
		params ?= []
		transition_params = [target_states].concat params
		ret = undefined
		event = @namespaceTransition_ method
		@log "[event] #{event}", 3
		if @target[method] instanceof Function
			ret = @target[method]?.apply? @target, transition_params
		else if @[method] instanceof Function
			ret = @[method]?.apply? @, transition_params

		if ret isnt no
			if not ~event.indexOf "_"
				# TODO this is hacky
				@transition_events.push [event, params]
				# Unflag constraint states
				if event[-5..-1] is '.exit'
#					@log "[unflag] #{event[0...-5]}.enter", 3
					@unflag "#{event[0...-5]}.enter"
				else if event[-6..-1] is '.enter'
#					@log "[unflag] #{event[0...-5]}.exit", 3
					@unflag "#{event[0...-6]}.exit"
				@log "[flag] #{event}", 3
				@flag event
			# TODO this currently doesnt work like this in the newest lucidjs emitter
			ret = @trigger event, transition_params
			if ret is no
				@log "Transition event #{event} cancelled", 2
				# TODO broadcast the event, add a test
		if ret is no
			@log "Transition method #{method} cancelled", 2
			# TODO broadcast the event, add a test
		ret

	# is_exit tells that the order is exit transitions
	orderStates_: (states) ->
		# TODO curry?
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


	# TODO bind to .enter and .exit as well to support the negatiation phase in
	# piped events. Requires an emitter with return values!
	bindToStates: (states, listener, abort, once) ->
		fired = 0
		enter = =>
#			@log "enter #{fired} + 1", 1
			fired += 1
			if not abort?()
				do listener if fired is states.length
			if once or abort?()
				for state in states
					@removeListener "#{state}", enter
					@removeListener "#{state}.end", exit
		exit = -> fired -= 1
		# TODO this should be bound to states, not negotiation listeners
		for state in states
			event = @namespaceName state
			@log "Binding to event #{event}", 3
#			console.log "state #{state}"
			@on event, enter
			@on "#{event}.end", exit

module.exports.AsyncMachine = AsyncMachine
