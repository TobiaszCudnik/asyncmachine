lucidjs = require "lucidjs"
rsvp = require "rsvp"
Promise = rsvp.Promise
require "es5-shim"
		
class AsyncMachine extends lucidjs.EventEmitter
						
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
	
	Exception_enter: (states, err) ->
		# Promises eat exceptions, so we need to jump-out-of the stacktrace
		setTimeout (-> throw err), 0
	yes

	setTarget: (target) ->
		@target = target
		
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
		@setState_ states, params

	# Deferred version of #set, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #setByCallback(err, data) and #setByListener(...params)
	setLater: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @setState_ states, params
			catch err
				@add 'Exception', err

		@last_promise = deferred.promise
		@createCallback deferred
		
	# Sets a state and fires a callback once it's fulfilled
	# TODO types, tests
#	onceSet: (state, listener) ->
#		@set state
#		@once state, listener

	# Activate certain states and keep the current ones.
	add: (states, params...) ->
		@addState_ states, params

	# Deferred version of #add, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #addByCallback(err, data) and #addByListener(...params)
	addLater: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @addState_ states, params
			catch err
				@add 'Exception', err

		@last_promise = deferred.promise
		@createCallback deferred

	# Deactivate certain states.
	drop: (states, params...) ->
		@dropState_ states, params

	# Deferred version of #drop, returning a callback to add the state.
	# After the call, the responsible promise object is available as
	# #last_promise
	# TODO refactor to #dropByCallback(err, data) and #dropByListener(...params)
	dropLater: (states, params...) ->
		deferred = rsvp.defer()
		deferred.promise.then (callback_params) =>
			params.push.apply params, callback_params
			try @dropState_ states, params
			catch err
				@add 'Exception', err

		@last_promise = deferred.promise
		@createCallback deferred

	pipeForward: (state, machine, target_state) ->
		# switch params order
		if state instanceof AsyncMachine
			return @pipeForward @states_all, state, machine
		
		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state
			namespace = @namespaceName state
			
			@on namespace + ".enter", ->
				machine.add new_state

			@on namespace + ".exit", ->
				machine.drop new_state

	# Creates a prototype child with dedicated acrive states and the clock.
	createChild: ->
		child = Object.create @
		child.states_active = []
		child.clock = {}
		child.clock[state] = 0 for state in @states_all
		child
		
	# Gets the current tick of a state.
	# Ticks are incemented by #set, for non-set states.
	clock: (state) ->
		# TODO assert an existing state
		@clock_[state]

	pipeInvert: (state, machine, target_state) ->
		state = @namespaceName state
		@on state + ".enter", ->
			machine.drop target_state

		@on state + ".exit", ->
			machine.add target_state

	pipeOff: -> throw new Error "not implemented yet"
		
	duringTransition: -> @lock

	# TODO use a regexp lib for IE8's 'g' flag compat?
	# CamelCase to Camel.Case
	namespaceName: (state) ->
		state.replace /([a-zA-Z])([A-Z])/g, "$1.$2"

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
			if @[state].auto and not is_excluded() and not is_current() \
					and not is_blocked()
				add.push state

		@add add

	setState_: (states, params) ->
		states_to_set = [].concat states
		for state in states_to_set
			if not ~@states_all.indexOf state
				throw new Error "Can't set a non-existing state #{state}"
		return unless states_to_set.length
		if @lock
			@queue.push [2, states_to_set, params]
			return
		try
			@lock = yes
			@log "[=] Set state #{states_to_set.join ', '}", 1
			states_before = @is()
			ret = @selfTransitionExec_ states_to_set, params
			return no if ret is no
			states = @setupTargetStates_ states_to_set
			states_to_set_valid = states_to_set.some (state) ->
				!!~states.indexOf state
				
			unless states_to_set_valid
				@log "Transition cancelled, as target states weren't accepted", 2
				return @lock = no
				
			# Queue
			queue = @queue
			@queue = []
			ret = @transition_ states, states_to_set, params
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			@lock = no
			throw err
		ret = @processQueue_ ret
				
		# If length equals and all previous states are set, we assume there
		# wasnt any change
		length_equals = @is().length is states_before.length
		if not (@any states_before) or not length_equals
			@processAutoStates()
		return no if not ret
		@allStatesSet states_to_set

	# TODO Maybe avoid double concat of states_active
	addState_: (states, params) ->
		states_to_add = [].concat states
		return unless states_to_add.length
		try
			if @lock
				@queue.push [1, states_to_add, params]
				return
			@lock = yes
			@log "[+] Add state #{states_to_add.join ", "}", 1
			states_before = @is()
			ret = @selfTransitionExec_ states_to_add, params
			return no if ret is no
			states = states_to_add.concat @states_active
			states = @setupTargetStates_ states
			states_to_add_valid = states_to_add.some (state) ->
				!!~states.indexOf(state)
				
			unless states_to_add_valid
				@log "Transition cancelled, as target states weren't accepted", 2
				return @lock = no
				
			queue = @queue
			@queue = []
			ret = @transition_ states, states_to_add, params
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			@lock = no
			throw err
		ret = @processQueue_ ret
				
		# If length equals and all previous states are set, we assume there
		# wasnt any change
		length_equals = @is().length is states_before.length
		if not (@any states_before) or not length_equals
			@processAutoStates() 
		if ret is no 
			no
		else
			@allStatesSet states_to_add

	dropState_: (states, params) ->
		states_to_drop = [].concat states
		return unless states_to_drop.length
		if @lock
			@queue.push [0, states_to_drop, params]
			return
		try
			@lock = yes
			@log "[-] Drop state #{states_to_drop.join ", "}", 1
			states_before = @is()
					
			# Invert states to target ones.
			states = @states_active.filter (state) ->
				not ~states_to_drop.indexOf(state)
			states = @setupTargetStates_ states
					
			# TODO validate if transition still makes sense? like in set/add
			queue = @queue
			@queue = []
			ret = @transition_ states, states_to_drop, params
			@queue = if ret is no then queue else queue.concat @queue
			@lock = no
		catch err
			@lock = no
			throw err
		ret = @processQueue_(ret)
				
		# If length equals and all previous states are set, we assume there
		# wasnt any change
		length_equals = @is().length is states_before.length
		if not (@any states_before) or not length_equals
			@processAutoStates()
		ret is no or @allStatesNotSet states_to_drop

	processQueue_: (previous_ret) ->
		if previous_ret is no
			# Cancel the current queue.
			@queue = []
			return no
		ret = []
		row = undefined
		while row = @queue.shift()
			switch row[0]
				when 0
					ret.push @drop row[1], row[2], row[3]
					break
				when 1
					ret.push @add row[1], row[2], row[3]
					break
				when 2
					ret.push @set row[1], row[2], row[3]
					break
		not ~ret.indexOf no

	allStatesSet: (states) ->
		states.every @is.bind @

	allStatesNotSet: (states) ->
		states.every (state) => not @is state
		
	createCallback: (deferred) ->
		cb = (e) -> console.log 'e2', e
		deferred.promise.catch cb
		(err = null, params...) ->
			if err
				deferred.reject err
			else
				deferred.resolve params

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
			method = @[name]
			if method and ~@states_active.indexOf state
				transition_params = [states].concat params
				ret = method.apply @, transition_params
				return yes if ret is no
				event = @namespaceTransition_ name
				transition_params2 = [event, states].concat params
				(@trigger.apply @, transition_params2) is no
		not ret

	setupTargetStates_: (states, exclude) ->
		exclude ?= []
				
		# Remove non existing states
		states = states.filter (name) =>
			ret = ~@states_all.indexOf name
			if not ret
				@log "State #{name} doesn't exist", 2
			!!ret

		states = @parseImplies_ states
		states = @removeDuplicateStates_ states
		
		# Check if state is blocked or excluded
		already_blocked = []

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

		@parseRequires_ states.reverse()

	# Collect implied states
	parseImplies_: (states) ->
		states.forEach (name) =>
			state = @get(name)
			return unless state.implies
			states = states.concat(state.implies)

		states

	# Check required states
	# Loop until no change happens, as state can requires themselves in a vector.
	parseRequires_: (states) ->
		length_before = 0
		until length_before is states.length
			length_before = states.length
			states = states.filter (name) =>
				state = @get name
				not state.requires?.some (req) =>
					found = ~states.indexOf req
					if not found
						@log "State #{name} dropped as required state #{req} " +
							"is missing", 2
					not found
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
		@states_active = target
		# Tick all the new states.
		for state in target
			@clock_[state]++ if not ~previous.indexOf state
		@log "[states] #{@states_active.join ', '}", 2
		# Set states in LucidJS emitter
		# TODO optimise these loops
		all.forEach (state) =>
			if ~target.indexOf state
				# if ( ! ~previous.indexOf( state ) )
				# this.set( state + '.enter' );
#				@log "[unflag] #{state}.exit", 3
				@unflag "#{state}.exit"
			else
				# if ( ~previous.indexOf( state ) )
#				@log "[unflag] #{state}.enter", 3
				@unflag "#{state}.enter"
				# this.set( state + '.exit'

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
			ret = @@target[method]?.apply? @, transition_params
				
		if ret isnt no
			if not ~event.indexOf "_"
				# Unflag constraint states
				if event[-5..-1] is '.exit'
#					@log "[unflag] #{event[0...-5]}.enter", 3
					@unflag "#{event[0...-5]}.enter"
				else if event[-5...-1] is '.enter'
#					@log "[unflag] #{event[0...-5]}.exit", 3
					@unflag "#{event[0...-5]}.exit"
				@log "[flag] #{event}", 3
				@flag event
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

	# TODO support multiple states
	# TODO automate & merge
	continueEnter: (state, func) ->
		tick = @clock state
		=>
			return if not @is state, tick + 1
			do func

	# TODO support multiple states
	# TODO automate & merge
	continueState: (state, func) ->
		tick = @clock state
		=>
			return if not @is state, tick
			do func

module.exports.AsyncMachine = AsyncMachine
