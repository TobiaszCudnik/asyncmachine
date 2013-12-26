#/<reference path="headers/commonjs.d.ts" />
#/<reference path="headers/lucidjs.d.ts" />
#/<reference path="headers/rsvp.d.ts" />
#/<reference path="headers/es5-shim.d.ts" />

lucidjs = require("lucidjs")
rsvp = require("rsvp")
Promise = rsvp.Promise
require "es5-shim"
	  
class AsyncMachine extends lucidjs.EventEmitter
						
	$: null
	states: null
	states_active: null
	lock: no
	
	debug_states_: no
		
	constructor: (parent, @config) ->
		super
		@$ = parent
		@debug_states_ = no
		@queue = []
		@states_all = []
		@states_active = []
		@debugStates() if config?.debug
		if state
			state = if (Array.isArray state) then state else [state]
			@init state
	  
	# Prepare class'es states. Required to be called manually for inheriting classes.
	initScan_: (obj) ->
		for name in obj
			continue if name instanceof Function
			continue if not @hasOwnProperty name
			@states_all.push name
		parent = obj.constructor.prototype.constructor
		return if parent is AsyncMachine
		@initScan_ parent
		
	init: (state) ->
		@states_all = []
		@initScan_ @
		@setState state if state

	getState: (state) ->
		console.log '#getState is deprecated, use #get'
		@get state

	get: (state) -> @[state]
		
	state: (state) ->
		console.log '#state is deprecated, use #is'
		@any state
		
	# Returns active states or if passed a state, returns if its set. 
	is: (state) ->
		return @states_active if not state
		!!~@states_active.indexOf state

	# Tells if any of the parameters is set, where if param is an array, checks if
	#   all states in array are set.
	any: (names...) ->
		if names.length
			return @states_active
		names.some (name) =>
			if Array.isArray name
				@every name
			else
				@is name
		
	every: (names...) ->
		names.every (name) =>
			~@states_active.indexOf name

	# Activate certain states and deactivate the current ones.
	setState: (states, params...) ->
		@setState_ states, params

	# Curried version of setState.
	setLater: (states, params...) ->
		promise = new Promise()
		promise.then (callback_params...) =>
			@setState_ states, params, callback_params

		@last_promise = promise
		(params...) -> promise.resolve params

	# Activate certain states and keep the current ones.
	add: (states, params...) ->
		@addState_ states, params

	# Curried version of addState
	addLater: (states, params...) ->
		promise = new Promise()
		promise.then (callback_params...) =>
			@addState_ states, params, callback_params

		@last_promise = promise
		(params...) -> promise.resolve params

	# Deactivate certain states.
	drop: (states, params...) ->
		@dropState_ states, params

	# Deactivate certain states.
	dropLater: (states, params...) ->
		promise = new Promise()
		promise.then (callback_params...) =>
			@dropState_ states, params, callback_params

		@last_promise = promise
		(params...) -> promise.resolve params

	pipeForward: (state, machine, target_state) ->
		# switch params order
		if state instanceof AsyncMachine
			target_state = machine
			machine = state
			state = @states_all
		
		# cast to an array
		[].concat(state).forEach (state) =>
			new_state = target_state or state
			state = @namespaceName state
			
			@on state + ".enter", ->
				machine.addState new_state

			@on state + ".exit", ->
				machine.dropState new_state


	pipeInvert: (state, machine, target_state) ->
		state = @namespaceName state
		@on state + ".enter", ->
			machine.dropState target_state

		@on state + ".exit", ->
			machine.addState target_state


	pipeOff: -> throw new Error("not implemented yet")

	# TODO use a regexp lib for IE8's 'g' flag compat?
	# CamelCase to Camel.Case
	namespaceName: (state) ->
		state.replace /([a-zA-Z])([A-Z])/g, "$1.$2"

	debug: (prefix, log_handler) ->
		@debug_states_ = not @debug_states_
		if @debug_states_
			@log_handler_ = (msgs...) ->
				args = if prefix then [prefix].concat(msgs) else msgs
				log_handler.apply null, args

	log: (msgs...) ->
		return unless @debug_states_

		console.log.apply? console, msgs
	  
	# TODO merge a state with the given name with the super
	# class' state
	# TODO2 merge by a definition
	  
	#//////////////////////////
	# PRIVATES
	#//////////////////////////
	processAuto: (excluded) ->
		excluded ?= []
		add = []
		@states_all.forEach (state) =>
			is_excluded = ~excluded.indexOf state
			is_current = @is state
			if @[state].auto and not is_excluded and not is_current
				add.push state

		@add add

	setState_: (states, exec_params, callback_params) ->
		callback_params ?= []
		states_to_set = [].concat states
		return unless states_to_set.length
		if @lock
			@queue.push [2, states_to_set, exec_params, callback_params]
			return
		@lock = yes
		@log_handler_ "[*] Set state " + states_to_set.join(", ")
		states_before = @is()
		ret = @selfTransitionExec_ states_to_set, exec_params, callback_params
		return no if ret is no
		states = @setupTargetStates_ states_to_set
		states_to_set_valid = states_to_set.some (state) ->
			~states.indexOf state
			
		unless states_to_set_valid
			@log_handler_ "[i] Transition cancelled, as target states wasn't accepted"  if @log_handler_
			return @lock = no
		queue = @queue
		@queue = []
		ret = @transition_ states, states_to_set, exec_params, callback_params
		@queue = if ret is no then queue else queue.concat @queue
		@lock = no
		ret = @processQueue_ ret
		    
		# If length equals and all previous states are set, we assume there
		# wasnt any change
		length_equals = @is().length is states_before.length
		if not (@any states_before) or not length_equals
			@processAutoStates()
		if ret is no 
			no
		else
			@allStatesSet states_to_set

	# TODO Maybe avoid double concat of states_active
	addState_: (states, exec_params, callback_params) ->
		callback_params = []  if typeof callback_params is "undefined"
		states_to_add = [].concat states
		return unless states_to_add.length
		if @lock
			@queue.push [1, states_to_add, exec_params, callback_params]
			return
		@lock = yes
		@log_handler_ "[*] Add state " + states_to_add.join ", "
		states_before = @is()
		ret = @selfTransitionExec_ states_to_add, exec_params, callback_params
		return no if ret is no
		states = states_to_add.concat(@states_active)
		states = @setupTargetStates_(states)
		states_to_add_valid = states_to_add.some (state) ->
			~states.indexOf(state)
			
		unless states_to_add_valid
			@log_handler_ "[i] Transition cancelled, as target states wasn't accepted"  if @log_handler_
			return @lock = no
			
		queue = @queue
		@queue = []
		ret = @transition_ states, states_to_add, exec_params, callback_params
		@queue = if ret is no then queue else queue.concat @queue
		@lock = no
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

	dropState_: (states, exec_params, callback_params) ->
		callback_params = []  if typeof callback_params is "undefined"
		states_to_drop = [].concat states
		return unless states_to_drop.length
		if @lock
			@queue.push [0, states_to_drop, exec_params, callback_params]
			return
		@lock = yes
		@log_handler_ "[*] Drop state " + states_to_drop.join ", "
		states_before = @is()
		    
		# Invert states to target ones.
		states = @states_active.filter((state) ->
			not ~states_to_drop.indexOf(state)
		)
		states = @setupTargetStates_(states)
		    
		# TODO validate if transition still makes sense? like in set/add
		queue = @queue
		@queue = []
		ret = @transition_ states, states_to_drop, exec_params, callback_params
		@queue = if ret is no then queue else queue.concat @queue
		@lock = no
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
					ret.push @dropState row[1], row[2], row[3]
					break
				when 1
					ret.push @addState row[1], row[2], row[3]
					break
				when 2
					ret.push @setState row[1], row[2], row[3]
					break
		not ~ret.indexOf no

	allStatesSet: (states) ->
		not states.reduce ((ret, state) =>
				ret or not @state(state)
			), no

	allStatesNotSet: (states) ->
		not states.reduce ((ret, state) =>
				ret or @state(state)
			), no

	namespaceTransition_: (transition) ->
		# CamelCase to Camel.Case
		# A_exit -> A.exit
		# A_B -> A._.B
		@namespaceName(transition)
			.replace(/_([a-z]+)$/, ".$1").replace "_", "._."

	# Executes self transitions (eg ::A_A) based on active states.
	selfTransitionExec_: (states, exec_params, callback_params) ->
		exec_params ?= []
		callback_params ?= []
		ret = states.some (state) =>
			ret = undefined
			name = state + "_" + state
			method = @[name]
			if method and ~@states_active.indexOf state
				transition_params = [states].concat [exec_params], callback_params
				ret = method.apply @, transition_params
				return yes if ret is no
				event = @namespaceTransition_ name
				transition_params = [event, states].concat [exec_params], 
					callback_params
				(@trigger.apply @, transition_params) is no
		not ret

	setupTargetStates_: (states, exclude) ->
		exclude ?= []
		    
		# Remove non existing states
		states = states.filter (name) =>
			ret = ~@states.indexOf name
			if not ret
				@log_handler_ "[i] State #{name} doesn't exist" 
			ret
			
		states = @parseImplies_ states
		states = @removeDuplicateStates_ states
		    
		# Check if state is blocked or excluded
		already_blocked = []
		    
		# Remove states already blocked.
		states = states.reverse().filter ((name) =>
				blocked_by = @isStateBlocked_ states, name
				blocked_by = blocked_by.filter (blocker_name) ->
					not ~already_blocked.indexOf blocker_name
					
				if blocked_by.length
					already_blocked.push name
					@log_handler_ "[i] State #{name} blocked by #{blocked_by.join(", ")}"
				not blocked_by.length and not ~exclude.indexOf name
			).reverse()
		@parseRequires_ states

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
				state = @get(name)
				not state.requires?.reduce ((memo, req) ->
						found = ~states.indexOf(req)
						if not found
							@log_handler_ "[i] State #{name} dropped as required state #{req} 
								is missing"
						memo or not found
					), no
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

	transition_: (to, explicit_states, exec_params, callback_params) ->
		exec_params ?= []
		callback_params ?= []
		    
		# TODO handle args
		return yes unless to.length
		    
		# Remove active states.
		from = @states_active.filter (state) ->
			not ~to.indexOf(state)
			
		@orderStates_ to
		@orderStates_ from
		params = [exec_params].concat(callback_params)
		    
		# var wait = <Function[]>[]
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
		# Set states in LucidJS emitter
		# TODO optimise these loops
		all.forEach (state) =>
			if ~target.indexOf state
				# if ( ! ~previous.indexOf( state ) )
				# this.set( state + '.enter' );
				(@set).clear state + ".exit"
			else
				# if ( ~previous.indexOf( state ) )
				(@set).clear state + ".enter"
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
		ret = to.some (state) ->
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
		ret = @transitionExec_ "any_" + to, target_states, params
		return no if ret is no
		ret = @transitionExec_ to + "_enter", target_states, params
		return no if ret is no
		    
		# Duplicate event for namespacing.
		event_args = ["enter.#{@namespaceName to}", target_states]
		ret = @trigger.apply @, event_args.concat params
		ret

	transitionExec_: (method, target_states, params) ->
		params ?= []
		params = [].concat [target_states], params
		ret = undefined
		event = @namespaceTransition_ method
		@log_handler_ event  if @log_handler_
		if @[method] instanceof Function
			ret = @[method].apply @, params  
		    
		# TODO reduce this 2 log msgs to 1
		if ret isnt no
			if ~event.indexOf "_"
				fn = "trigger"
			fn ?= "set"
			ret = @[fn] event, params
			if ret is no
				@log_handler_ "[i] Transition event #{event} cancelled" 
		if ret is no
			@log_handler_ "[i] Transition method #{method} cancelled"
		ret

	# is_exit tells that the order is exit transitions
	orderStates_: (states) ->
		states.sort (e1, e2) ->
			state1 = @get e1
			state2 = @get e2
			ret = 0
			if state1.depends and ~state1.depends.indexOf e2
				ret = 1
			else
				ret = -1  if state2.depends and ~state2.depends.indexOf e1
			ret
