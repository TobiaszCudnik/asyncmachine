multistatemachine = require('multistatemachine')
expect = require('chai').expect
sinon = require 'sinon'
Promise = require('rsvp').Promise

describe "MultiStateMachine", ->
	class FooMachine extends multistatemachine.MultiStateMachine

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

	it "should allow for a delayed start"
	it "should accept the starting state", ->
		expect( @machine.state() ).to.eql [ "A" ]

	it "should allow to set the state", ->
		@machine.setState "B"
		expect( @machine.state() ).to.eql [ "B" ]

	it "should allow to add a state", ->
		@machine.pushState "B"
		expect( @machine.state() ).to.eql [ "A", "B" ]

	it "should allow to drop a state", ->
		@machine.setState [ "B", "C" ]
		@machine.dropState 'C'
		expect( @machine.state() ).to.eql [ "B" ]


	# it "should throw when setting unknown state", ->
	#   func = ->
	#     @machine.setState "unknown"
	#   expect( func ).to.throw()

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
			@machine = new FooMachine [ 'A', 'B' ]
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
				expect( @machine.state() ).to.eql [ 'C' ]
								                
			afterEach ->
				delete @ret
								                
		describe 'and blocking one is added', ->

			it 'should unset the blocked one', ->
				@machine.pushState [ 'C' ]
				expect( @machine.state() ).to.eql [ 'C' ]
				        
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

		it 'should\'t be set when required state isn\'t active', ->
			@machine.setState [ 'C', 'A' ]
			expect( @machine.state() ).to.eql [ 'A' ]
												                        
	describe 'when state is changed', ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
		describe 'and transition is canceled', ->
			beforeEach ->
				@machine.D_enter = -> no
			describe 'when setting a new state', ->
				beforeEach -> @ret = @machine.setState 'D'

				it 'should return false', ->
					expect( @machine.setState 'D' ).not.to.be.ok
				it 'should not change the previous state', ->
					expect( @machine.state() ).to.eql [ 'A' ]

			# TODO make this and the previous a main contexts
			describe 'when pushing an additional state', ->
				beforeEach -> @ret = @machine.pushState 'D'

				it 'should return false', ->
					expect( @ret ).not.to.be.ok
				it 'should not change the previous state', ->
					expect( @machine.state() ).to.eql [ 'A' ]

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
					@machine.setState 'A', 'C'
					@machine.setState 'D', 'foo', 2
					@machine.dropState 'C', 'foo', 2

				describe 'and is explicit', ->
					          
					it 'should forward arguments to exit states', ->
						expect( @machine.C_exit.calledWith 'foo', 2 ).to.be.ok

					it 'should forward arguments to enter states', ->
						expect( @machine.D_enter.calledWith 'foo', 2 ).to.be.ok

				describe 'and is non-explicit', ->
					          
					it 'should not forward arguments to exit states', ->
						expect( @machine.A_exit.calledWith 'foo', 2 ).not.to.be.ok

					it 'should not forward arguments to enter states', ->
						expect( @machine.B_enter.calledWith 'foo', 2 ).not.to.be.ok

			describe 'and delayed', ->
				beforeEach (done) ->
					setTimeout(
						=>
							@machine.setStateLater 'A', 'C'
							@machine.setStateLater 'D', 'foo', 2
							@machine.dropStateLater 'C', 'foo', 2
							do done
						0
					)

				describe 'and is explicit', ->
					          
					it 'should forward arguments to exit states', ->
						expect( @machine.C_exit.calledWith 'foo', 2 ).to.be.ok

					it 'should forward arguments to enter states', ->
						expect( @machine.D_enter.calledWith 'foo', 2 ).to.be.ok

				describe 'and is non-explicit', ->
					          
					it 'should not forward arguments to exit states', ->
						expect( @machine.A_exit.calledWith 'foo', 2 ).not.to.be.ok

					it 'should not forward arguments to enter states', ->
						expect( @machine.B_enter.calledWith 'foo', 2 ).not.to.be.ok

		describe 'and delayed', ->
			beforeEach ->
				@ret = @machine.setStateLater 'D'

			it 'should return a promise', ->
				expect( @ret instanceof Promise ).to.be.ok
			it 'should execute the change', (done) ->
				@ret.resolve()
				@ret.then =>
					expect( @machine.any_D.calledOnce ).to.be.ok
					expect( @machine.D_enter.calledOnce ).to.be.ok
					do done
			it 'should expose a ref to the last promise', ->
				expect( @machine.last_promise ).to.equal @ret

			describe 'and then canceled', ->
				beforeEach ->
					@ret.reject()
				it 'should not execute the change', ->
					expect( @machine.any_D.called ).not.to.be.ok
					expect( @machine.D_enter.called ).not.to.be.ok

		describe 'and active state is also the target one', ->
			it 'should trigger self transition at the very beggining', ->
				@machine.setState( [ 'A', 'B' ] )
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

		describe 'should trigger events', ->
			beforeEach ->
				@machine.setState [ 'A', 'C' ]
				@machine.on 'A_A', @A_A = sinon.spy()
				@machine.on 'B_enter', @B_enter = sinon.spy()
				@machine.on 'C_exit', @C_exit = sinon.spy()
				@machine.on 'setState', @setState = sinon.spy()
				@machine.on 'cancelTransition', @cancelTransition = sinon.spy()
				@machine.on 'pushState', @pushState = sinon.spy()
				@machine.setState [ 'A', 'B' ]
			afterEach ->
				delete @C_exit
				delete @A_A
				delete @B_enter
				delete @pushState
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
			it 'for pushing a new state', ->
				expect( @pushState.called ).to.be.ok
			it 'for cancelling the transition', ->
				expect( @cancelTransition.called ).to.be.ok
	  
	describe 'Events', ->
		describe 'should pipe', ->
			it 'transition events'
			it 'machine events'


		# it 'should allow to push another state during transition'
				        
	# describe 'when any transition is async', ->
	#   it 'should accept optional continuation callback in any transition'

	#   it 'should temporarily remain in the mixed source-target state', (done) ->
	#     @machine = new FooMachine 'A'
	#     @machine.B_enter = (next) -> 
	#       finish = -> do next; do done
	#       setTimeout finish, 0
	#     @machine.setState 'B'
	#     state = @machine.state()
	#     expect( state ).to.be 'AB'

		# it 'should trigger mixed source-target states\' methods', (done) ->
		#   @machine = new FooMachine 'A'
		#   @machine.B_enter = (next) -> 
		#     finish = ->
		#       assert_order order
		#       do next
		#       do done
		#     setTimeout next, 0
		#   mock_states @machine, [ 'A', 'B', 'AB' ]
		#   order = [
		#     @machine.A_exit
		#     @machine.A_AB
		#     @machine.A_any
		#     @machine.any_AB
		#     @machine.AB_enter
		#     @machine.any_B
		#     # B_enter is async
		#     @machine.B_enter
		#   ]
		#   @machine.setState 'B'

			# describe 'when changing from many to many states', ->
			#   it 'should ....', ->
			#     @machine = new FooMachine [ 'A', 'B' ]
			#     mock_states @machine, [
			#       'A', 'B', 'C', 'D'
			#       'AC', 'AD', 'BC', 'BD'
			#     ]
			#     order = [
			#       @machine.A_exit
			#       @machine.A_AB
			#       @machine.A_AD
			#       @machine.A_any
			#       @machine.B_exit
			#       @machine.B_AB
			#       @machine.B_AD
			#       @machine.B_any
			#       @machine.any_AB
			#       @machine.A_B_enter
			#       @machine.any_AD
			#       @machine.A_D_enter
			#       @machine.any_B
			#       # B_enter is async
			#       @machine.B_enter
			#     ]
			#     @machine.setState [ 'B', 'C' ]


	# describe 'when a mixed source-target state is async', ->
	#   it 'should mix the mixed state', ->
	#     mock_states @machine, [ 'A', 'B', 'C', 'D', 'AB' ]
	#     @machine.A_exit (next) ->
	#       setTimeout next, 0
	#     @machine.AB_exit (next) ->
	#       setTimeout next, 0
	#     @machine.C_enter (next) ->
	#       setTimeout next, 0
	#     @machine.D_enter (next) ->
	#       setTimeout next, 0
	#     # state is A
	#     @machine.setState 'B'
	#     # state is A_B
	#     @machine.setState 'C'
	#     # state is A_B_C
	#     @machine.setState 'D'
	#     # state is A_B_C_D