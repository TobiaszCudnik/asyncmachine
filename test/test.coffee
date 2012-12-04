asyncmachine = require('asyncmachine')
expect = require('chai').expect
sinon = require 'sinon'
Promise = require('rsvp').Promise

describe "asyncmachine", ->
    class FooMachine extends asyncmachine.AsyncMachine
		state_A: {}
		state_B: {}
		state_C: {}
		state_D: {}

		constructor: (state, config) ->
			super state, config

	mock_states = (instance, states) ->
		for state in states
			# deeply clone all the state's attrs
			# proto = instance[ "state_#{state}" ]
			# instance[ "state_#{state}" ] = {}
			instance[ "#{state}_#{state}" ] = do sinon.spy
			instance[ "#{state}_enter" ] = do sinon.spy
			instance[ "#{state}_exit" ] = do sinon.spy
			instance[ "#{state}_any" ] = do sinon.spy
			instance[ "any_#{state}" ] = do sinon.spy
			for inner in states
				continue if inner is state
				instance[ "#{inner}_#{state}" ] = do sinon.spy

	assert_order = (order) ->
		for m, k in order[ 0...-1 ]
			order[k] = m.calledBefore order[ k+1 ]
		expect( check ).to.be.ok for check in order[ 0...-1 ]

	beforeEach ->
		@machine = new FooMachine 'A'

	it 'should allow to check if single state is active'
	it "should allow for a delayed start"
	it "should accept the starting state", ->
		expect( @machine.state() ).to.eql [ "A" ]

	it "should allow to set the state", ->
		@machine.setState "B"
		expect( @machine.state() ).to.eql [ "B" ]

	it "should allow to add a new state", ->
		@machine.addState "B"
		expect( @machine.state() ).to.eql [ "B", "A" ]

	it "should allow to drop a state", ->
		@machine.setState [ "B", "C" ]
		@machine.dropState 'C'
		expect( @machine.state() ).to.eql [ "B" ]


	it "should throw when setting unknown state", ->
		func = =>
			@machine.setState "unknown"
		expect( func ).to.throw()

	it 'should allow to define a new state'

	it "should skip non existing states", ->
		@machine.A_exit = sinon.spy()
		@machine.setState "unknown"
		expect( @machine.A_exit.calledOnce ).not.to.be.ok

	describe "when single to single state transition", ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B' ]
			# exec
			@machine.setState 'B'

		it "should trigger the state to state transition", ->
			expect( @machine.A_B.calledOnce ).to.be.ok
		it "should trigger the state exit transition", ->
			expect( @machine.A_exit.calledOnce ).to.be.ok
		it "should trigger the transition to the new state", ->
			expect( @machine.B_enter.calledOnce ).to.be.ok
		it "should trigger the transition to \"Any\" state", ->
			expect( @machine.A_any.calledOnce ).to.be.ok
		it "should trigger the transition from \"Any\" state", ->
			expect( @machine.any_B.calledOnce ).to.be.ok
		it 'should set the correct state', ->
			expect( @machine.state() ).to.eql ['B']
		it "should remain the correct order", ->
			order = [
				@machine.A_exit
				@machine.A_B
				@machine.A_any
				@machine.any_B
				@machine.B_enter
			]
			assert_order order

	describe "when single to multi state transition", ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B', 'C' ]
			# exec
			@machine.setState [ 'B', 'C' ]

		it "should trigger the state to state transitions", ->
			expect( @machine.A_B.calledOnce ).to.be.ok
			expect( @machine.A_C.calledOnce ).to.be.ok
		it "should trigger the state exit transition", ->
			expect( @machine.A_exit.calledOnce ).to.be.ok
		it "should trigger the transition to new states", ->
			expect( @machine.B_enter.calledOnce ).to.be.ok
			expect( @machine.C_enter.calledOnce ).to.be.ok
		it "should trigger the transition to \"Any\" state", ->
			expect( @machine.A_any.calledOnce ).to.be.ok
		it "should trigger the transition from \"Any\" state", ->
			expect( @machine.any_B.calledOnce ).to.be.ok
			expect( @machine.any_C.calledOnce ).to.be.ok
		it 'should set the correct state', ->
			expect( @machine.state() ).to.eql ['B', 'C']
		it "should remain the correct order", ->
			order = [
				@machine.A_exit
				@machine.A_B
				@machine.A_C
				@machine.A_any
				@machine.any_B
				@machine.B_enter
				@machine.any_C
				@machine.C_enter
			]
			assert_order order

	describe "when multi to single state transition", ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C' ]
			# exec
			@machine.setState [ 'C' ]

		it "should trigger the state to state transitions", ->
			expect( @machine.B_C.calledOnce ).to.be.ok
			expect( @machine.A_C.calledOnce ).to.be.ok
		it "should trigger the state exit transition", ->
			expect( @machine.A_exit.calledOnce ).to.be.ok
			expect( @machine.B_exit.calledOnce ).to.be.ok
		it "should trigger the transition to the new state", ->
			expect( @machine.C_enter.calledOnce ).to.be.ok
		it "should trigger the transition to \"Any\" state", ->
			expect( @machine.A_any.calledOnce ).to.be.ok
			expect( @machine.B_any.calledOnce ).to.be.ok
		it "should trigger the transition from \"Any\" state", ->
			expect( @machine.any_C.calledOnce ).to.be.ok
		it 'should set the correct state', ->
			expect( @machine.state() ).to.eql ['C']
		it "should remain the correct order", ->
			order = [
				@machine.A_exit
				@machine.A_C
				@machine.A_any
				@machine.B_exit
				@machine.B_C
				@machine.B_any
				@machine.any_C
				@machine.C_enter
			]
			assert_order order

	describe "when multi to multi state transition", ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			# exec
			@machine.setState [ 'D', 'C' ]

		it "should trigger the state to state transitions", ->
			expect( @machine.A_C.calledOnce ).to.be.ok
			expect( @machine.A_D.calledOnce ).to.be.ok
			expect( @machine.B_C.calledOnce ).to.be.ok
			expect( @machine.B_D.calledOnce ).to.be.ok
		it "should trigger the state exit transition", ->
			expect( @machine.A_exit.calledOnce ).to.be.ok
			expect( @machine.B_exit.calledOnce ).to.be.ok
		it "should trigger the transition to the new state", ->
			expect( @machine.C_enter.calledOnce ).to.be.ok
			expect( @machine.D_enter.calledOnce ).to.be.ok
		it "should trigger the transition to \"Any\" state", ->
			expect( @machine.A_any.calledOnce ).to.be.ok
			expect( @machine.B_any.calledOnce ).to.be.ok
		it "should trigger the transition from \"Any\" state", ->
			expect( @machine.any_C.calledOnce ).to.be.ok
			expect( @machine.any_D.calledOnce ).to.be.ok
		it 'should set the correct state', ->
			expect( @machine.state() ).to.eql ['D', 'C']
		it "should remain the correct order", ->
			order = [
				@machine.A_exit
				@machine.A_D
				@machine.A_C
				@machine.A_any
				@machine.B_exit
				@machine.B_D
				@machine.B_C
				@machine.B_any
				@machine.any_D
				@machine.D_enter
				@machine.any_C
				@machine.C_enter
			]
			assert_order order

	describe "when transitioning to an active state", ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			# exec
			@machine.setState [ 'A' ]

		it 'shouldn\'t trigger transition methods', ->
			expect( @machine.A_exit.called ).not.to.be.ok
			expect( @machine.A_any.called ).not.to.be.ok
			expect( @machine.any_A.called ).not.to.be.ok

		it 'should remain in the requested state', ->
			expect( @machine.state() ).to.eql [ 'A' ]

	describe 'when order is defined by the depends attr', ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.state_C.depends = [ 'D' ]
			@machine.state_A.depends = [ 'B' ]
			# exec
			@machine.setState [ 'C', 'D' ]

		describe 'when entering', ->

			it 'should handle dependand states first', ->
				order = [
					@machine.A_D
					@machine.A_C
					@machine.any_D
					@machine.D_enter
					@machine.any_C
					@machine.C_enter
				]
				assert_order order

		describe 'when exiting', ->

			it 'should handle dependand states last', ->
				order = [
					@machine.B_exit
					@machine.B_D
					@machine.B_C
					@machine.B_any
					@machine.A_exit
					@machine.A_D
					@machine.A_C
					@machine.A_any
				]
				assert_order order

	describe 'when one state blocks another', ->
		beforeEach ->
			@log = []
			@machine = new FooMachine [ 'A', 'B' ]
			@machine.debugStates '', (msg) =>
				@log.push msg
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.state_C = blocks: [ 'D' ]
			@machine.setState 'D'

		describe 'and they are set simultaneously', ->
			beforeEach ->
				@ret = @machine.setState [ 'C', 'D' ]

			it 'should skip the second state', ->
				expect( @machine.state() ).to.eql [ 'C' ]

			it 'should return false', ->
				expect( @ret ).to.eql no

			it 'should explain the reson in the log', ->
				expect( ~@log.indexOf '[i] State D blocked by C').to.be.ok

			afterEach ->
				delete @ret

		describe 'and blocking one is added', ->

			it 'should unset the blocked one', ->
				@machine.addState [ 'C' ]
				expect( @machine.state() ).to.eql [ 'C' ]

		describe 'and cross blocking one is added', ->
			beforeEach ->
				@machine.state_D = blocks: [ 'C' ]

			describe 'using setState', ->

				it 'should unset the old one', ->
					@machine.setState 'C'
					expect( @machine.state() ).to.eql [ 'C' ]

				it 'should work in both ways', ->
					@machine.setState 'C'
					expect( @machine.state() ).to.eql [ 'C' ]
					@machine.setState 'D'
					expect( @machine.state() ).to.eql [ 'D' ]

			describe 'using addState', ->

				it 'should unset the old one', ->
					@machine.addState 'C'
					expect( @machine.state() ).to.eql [ 'C' ]

				it 'should work in both ways', ->
					@machine.addState 'C'
					expect( @machine.state() ).to.eql [ 'C' ]
					@machine.addState 'D'
					expect( @machine.state() ).to.eql [ 'D' ]

	describe 'when state is implied', ->
		beforeEach ->
			@machine = new FooMachine [ 'A' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.state_C = implies: [ 'D' ]
			@machine.state_A = blocks: [ 'D' ]
			# exec
			@machine.setState [ 'C' ]

		it 'should be activated', ->
			expect( @machine.state() ).to.eql [ 'C', 'D' ]

		it 'should be skipped if blocked at the same time', ->
			@machine.setState [ 'A', 'D' ]
			expect( @machine.state() ).to.eql [ 'A' ]
	#expect( fn ).to.throw

	describe 'when state requires another one', ->
		beforeEach ->
			@machine = new FooMachine [ 'A' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.state_C = requires: [ 'D' ]

		it 'should be set when required state is active', ->
			@machine.setState [ 'C', 'D' ]
			expect( @machine.state() ).to.eql [ 'C', 'D' ]

		describe 'when required state isn\'t active', ->
			beforeEach ->
				@log = []
				@logger = (msg) =>
					@log.push msg
				@machine.debugStates '', @logger
				@machine.setState [ 'C', 'A' ]
			afterEach ->
				delete @log

			it 'should\'t be set', ->
				expect( @machine.state() ).to.eql [ 'A' ]

			it 'should explain the reason in the log', ->
				msg = '[i] State C dropped as required state D is missing'
				expect( @log ).to.contain msg

	describe 'when state is changed', ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]

		describe 'during another state change', ->

			it 'can\'t be set synchronously', ->
				@machine.B_enter = (states) ->
					@setState [ 'C' ]
				func = ->
					@machine.setState 'B'
				expect( func ).to.throw()

			# TODO
			it 'can be added synchronously', ->
				@machine.B_enter = (states) ->
					@addState 'C'
				@machine.C_enter = sinon.spy()
				@machine.A_exit = sinon.spy()
				@machine.setState 'B'
				expect( @machine.B_enter.calledOnce ).to.be.ok
				expect( @machine.C_enter.calledOnce ).to.be.ok
				expect( @machine.A_exit.calledOnce ).to.be.ok
				expect( @machine.state() ).to.eql [ 'B', 'C' ]

			it 'can be set asynchronously', ->
				@machine.B_enter = (states) ->
					@on 'state.set', @setStateLater 'B', 'C'
				@machine.setState 'B'
				expect( @machine.state() ).to.eql [ 'B', 'C' ]

		describe 'and transition is canceled', ->
			beforeEach ->
				@machine.D_enter = -> no
			describe 'when setting a new state', ->
				beforeEach ->
					@log = []
					@logger = (msg) =>
						@log.push msg
					@machine.debugStates '', @logger
					@ret = @machine.setState 'D'

				it 'should return false', ->
					expect( @machine.setState 'D' ).not.to.be.ok

				it 'should not change the previous state', ->
					expect( @machine.state() ).to.eql [ 'A' ]

				it 'should explain the reason in the log', ->
					expect( ~@log.indexOf '[i] Transition method D_enter cancelled').to.be.ok

			# TODO make this and the previous a main contexts
			describe 'when adding an additional state', ->
				beforeEach -> @ret = @machine.addState 'D'

				it 'should return false', ->
					expect( @ret ).not.to.be.ok

				it 'should not change the previous state', ->
					expect( @machine.state() ).to.eql [ 'A' ]

				it 'should explain the reason in the log', ->
					expect( ~@log.indexOf 'Transition method D_enter cancelled').to.be.ok

		describe 'and transition is successful', ->

			it 'should return true', ->
				expect( @machine.setState 'D' ).to.be.ok

		it 'should provide previous state information', (done) ->
			@machine.D_enter = ->
				expect( @state() ).to.eql [ 'A' ]
				do done
			@machine.setState 'D'

		it 'should provide target state information', (done) ->
			@machine.D_enter = (target) ->
				expect( target ).to.eql [ 'D' ]
				do done
			@machine.setState 'D'

		describe 'with arguments', ->
			beforeEach ->
				@machine.state_D =
					implies: [ 'B' ]
					blocks: [ 'A' ]

			describe 'and synchronous', ->
				beforeEach ->
					@machine.setState [ 'A', 'C' ]
					@machine.setState 'D', 'foo', 2
					@machine.setState 'D', 'foo', 2
					@machine.dropState 'D', 'foo', 2

				describe 'and is explicit', ->

					it 'should forward arguments to exit methods', ->
						expect( @machine.D_exit.calledWith ['B'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to enter methods', ->
						expect( @machine.D_enter.calledWith ['D', 'B'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to self transition methods', ->
						# TODO this passes only explicite states array, not all target states
						expect( @machine.D_D.calledWith ['D'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to transition methods', ->
						expect( @machine.C_D.calledWith ['D', 'B'], [ 'foo', 2 ] ).to.be.ok

				describe 'and is non-explicit', ->

					it 'should not forward arguments to exit methods', ->
						expect( @machine.A_exit.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to enter methods', ->
						expect( @machine.B_enter.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to transition methods', ->
						expect( @machine.A_B.calledWith ['D', 'B'] ).to.be.ok

			describe 'and delayed', ->
				beforeEach (done) ->
					resolve = @machine.setStateLater [ 'A', 'C' ]
					do resolve
					@machine.last_promise
						.then( =>
							resolve = @machine.setStateLater 'D', 'foo', 2
							do resolve
							@machine.last_promise
						).then( =>
						resolve = @machine.setStateLater 'D', 'foo', 2
						do resolve
						@machine.last_promise
					).then( =>
						resolve = @machine.dropStateLater 'D', 'foo', 2
						do resolve
						@machine.last_promise
					).then done

				describe 'and is explicit', ->

					it 'should forward arguments to exit methods', ->
						expect( @machine.D_exit.calledWith ['B'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to enter methods', ->
						expect( @machine.D_enter.calledWith ['D', 'B'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to self transition methods', ->
						# TODO this passes only explicite states array, not all target states
						expect( @machine.D_D.calledWith ['D'], [ 'foo', 2 ] ).to.be.ok

					it 'should forward arguments to transition methods', ->
						expect( @machine.C_D.calledWith ['D', 'B'], [ 'foo', 2 ] ).to.be.ok

				describe 'and is non-explicit', ->

					it 'should not forward arguments to exit methods', ->
						expect( @machine.A_exit.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to enter methods', ->
						expect( @machine.B_enter.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to transition methods', ->
						expect( @machine.A_B.calledWith ['D', 'B'] ).to.be.ok

		describe 'and delayed', ->
			beforeEach ->
				@machine.setStateLater 'D'
				@promise = @machine.last_promise
			afterEach ->
				delete @promise

			it 'should return a promise', ->
				expect( @promise instanceof Promise ).to.be.ok

			it 'should execute the change', (done) ->
				@promise.resolve()
				@promise.then =>
					expect( @machine.any_D.calledOnce ).to.be.ok
					expect( @machine.D_enter.calledOnce ).to.be.ok
					do done

			it 'should expose a ref to the last promise', ->
				expect( @machine.last_promise ).to.equal @promise

			it 'should be called with params passed to the delayed function', ->
				@promise.resolve 'foo', 2
				expect( @machine.D_enter.calledWith [ 'D' ], [], 'foo', 2).to.be.ok

			describe 'and then canceled', ->
				beforeEach ->
					@promise.reject()
				it 'should not execute the change', ->
					expect( @machine.any_D.called ).not.to.be.ok
					expect( @machine.D_enter.called ).not.to.be.ok

		describe 'and active state is also the target one', ->
			it 'should trigger self transition at the very beggining', ->
				@machine.setState [ 'A', 'B' ]
				order = [
					@machine.A_A
					@machine.any_B
					@machine.B_enter
				]
				assert_order order
			it 'should be executed only for explicitly called states'
			it 'should be cancellable', ->
				@machine.A_A = sinon.stub().returns no
				@machine.setState( [ 'A', 'B' ] )
				expect( @machine.A_A.calledOnce ).to.be.ok
				expect( @machine.any_B.called ).not.to.be.ok

			after ->
				delete @machine.A_A

		describe 'should trigger events', ->
			beforeEach ->
				@machine = new FooMachine 'A'
				# mock
				mock_states @machine, [ 'A', 'B', 'C', 'D' ]
				@machine.setState [ 'A', 'C' ]
				@machine.on 'A._.A', @A_A = sinon.spy()
				@machine.on 'B.enter', @B_enter = sinon.spy()
				@machine.on 'C.exit', @C_exit = sinon.spy()
				@machine.on 'D.exit', -> no
				@machine.on 'state.set', @setState = sinon.spy()
				@machine.on 'state.cancel', @cancelTransition = sinon.spy()
				@machine.on 'state.add', @addState = sinon.spy()
				@machine.setState [ 'A', 'B' ]
				@machine.addState [ 'C' ]
				@machine.addState [ 'D' ]
			afterEach ->
				delete @C_exit
				delete @A_A
				delete @B_enter
				delete @addState
				delete @setState
				delete @cancelTransition

			it 'for self transitions', ->
				expect( @A_A.called ).to.be.ok
			it 'for enter transitions', ->
				expect( @B_enter.called ).to.be.ok
			it 'for exit transtions', ->
				expect( @C_exit.called ).to.be.ok
			it 'which can cancel the transition', ->
				@machine.on 'D_enter', sinon.stub().returns no
				@machine.setState 'D'
				expect( @machine.D_any.called ).not.to.be.ok
			it 'for setting a new state', ->
				expect( @setState.called ).to.be.ok
			it 'for adding a new state', ->
				expect( @addState.called ).to.be.ok
			it 'for cancelling the transition', ->
				expect( @cancelTransition.called ).to.be.ok

	describe 'Events', ->
		class EventMachine extends FooMachine
			state_TestNamespace: {}

		beforeEach ->
			@machine = new EventMachine 'A'
		describe 'should support states', ->

			it 'by triggering the listener at once for active states', ->
				l1 = sinon.stub()
				@machine.on 'A', l1
				expect( l1.calledOnce ).to.be.ok

		describe 'should support namespaces', ->
			describe 'with wildcards', ->
				beforeEach ->
					@listeners = []
					@listeners.push( sinon.stub() )
					@listeners.push( sinon.stub() )
					@listeners.push( sinon.stub() )
					@machine.on('enter.Test', @listeners[0])
					# TODO FIXME * fails to conver 2 namespaces
					@machine.on('enter', @listeners[1])
					@machine.on('A', @listeners[2])
					@machine.setState( [ 'TestNamespace', 'B' ] )

				it 'should handle "enter.Test" sub event', ->
					expect( @listeners[0].callCount ).to.eql 1
				it 'should handle "enter.*" sub event', ->
					expect( @listeners[1].calledTwice ).to.be.ok
				it 'should handle "A" sub events', ->
					expect( @listeners[2].callCount ).to.eql 4

			it 'for all transitions', ->
				l1 = sinon.stub()
				l2 = sinon.stub()

				@machine.on('Test.Namespace.enter', l1)
				@machine.on('A._.Test.Namespace', l2)
				@machine.setState('TestNamespace')

				expect( l1.calledOnce ).to.be.ok
				expect( l2.calledOnce ).to.be.ok

		describe 'piping', ->

			it 'should forward a specific state', ->
				emitter = new EventMachine 'A'
				@machine.pipeForward 'B', emitter
				@machine.setState 'B'
				# TODO order inverted?
				expect( emitter.state() ).to.eql [ 'B', 'A' ]

			it 'should forward a specific state as a different one', ->
				emitter = new EventMachine 'A'
				@machine.pipeForward 'B', emitter, 'C'
				@machine.setState 'B'
				expect( emitter.state() ).to.eql [ 'C', 'A' ]

			it 'should invert a specific state as a different one', ->
				emitter = new EventMachine 'A'
				@machine.pipeInvert 'A', emitter, 'C'
				@machine.setState 'B'
				expect( emitter.state() ).to.eql [ 'C', 'A' ]

			it 'should forward a whole machine', ->
				#@machine.debug()
				machine2 = new EventMachine [ 'A', 'D' ]
				#machine2.debug()
				expect( machine2.state() ).to.eql [ 'A', 'D' ]
				@machine.pipeForward machine2
				@machine.setState [ 'B', 'C' ]
				expect( machine2.state() ).to.eql [ 'C', 'B', 'D' ]

			it 'can be turned off'
	# machine2 = new EventMachine [ 'A', 'D' ]
	# @machine.pipeOff 'B', emitter #, 'BB'
	# @machine.pipeForward machine2
	# @machine.setState [ 'B', 'C' ]
	# expect( machine2.state() ).to.eql [ 'D', 'B', 'C' ]

	describe 'bugs', ->
		# TODO use a constructor in Sub
		it 'should trigger the enter state of a subclass', ->
			a_enter_spy = sinon.spy()
			b_enter_spy = sinon.spy()
			class Sub extends asyncmachine.AsyncMachine
				state_A: {}
				state_B: {}
				A_enter: a_enter_spy
				B_enter: b_enter_spy
			sub = new Sub 'A'
			sub.setState 'B'
			expect( a_enter_spy.called ).to.be.ok
			expect( b_enter_spy.called ).to.be.ok

		it 'should drop states cross-blocked by implied states', ->
			# parse implied states before current ones
			# hint: in blocked by
			class Sub extends asyncmachine.AsyncMachine
				state_A: {
				blocks: [ 'B' ]
				}
				state_B: {
				blocks: [ 'A' ]
				}
				state_C: {
				implies: [ 'B' ]
				}
				constructor: ->
					super()
					@initStates 'A'
					@setState 'C'

			sub = new Sub
			expect( sub.state()).to.eql [ 'C', 'B' ]

		it 'should pass args to transition methods'

	describe 'Promises', ->
		it 'can be resolved'
		it 'can be rejected'
		it 'can be chainged'
		describe 'delayed methods', ->
			it 'should return correctly bound resolve method'

