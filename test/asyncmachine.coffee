asyncmachine = require '../build/asyncmachine.js'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
sinonChai = require "sinon-chai"

# TODO
# - no self transition for non accepted states

factory = asyncmachine.factory

chai.use sinonChai

{
    FooMachine,
    EventMachine,
    Sub,
    SubCrossBlockedByImplied,
    CrossBlocked
} = require './classes'

describe "asyncmachine", ->

	mock_states = (instance, states) ->
		for state in states
			# deeply clone all the state's attrs
			# proto = instance["#{state}"]
			# instance["#{state}"] = {}
			instance.constructor["#{state}_#{state}"] = do sinon.spy
			instance["#{state}_enter"] = do sinon.spy
			instance["#{state}_exit"] = do sinon.spy
			instance["#{state}_state"] = do sinon.spy
			instance["#{state}_any"] = do sinon.spy
			instance["any_#{state}"] = do sinon.spy
			for inner in states
				instance["#{inner}_#{state}"] = do sinon.spy

	assert_order = (order) ->
		m = null
		k = null
		for m, k in order[ 0...-1 ]
			order[k] = m.calledBefore order[ k+1 ]
		expect( check ).to.be.ok for check in order[ 0...-1 ]

	beforeEach ->
		@machine = new FooMachine
		@machine.set 'A'

	it 'should allow to check if single state is active', ->
		expect(@machine.is('A')).to.be.ok
		expect(@machine.is(['A'])).to.be.ok
		
	it 'should allow to check if multiple states are active', ->
		@machine.add 'B'
		expect(@machine.is(['A', 'B'])).to.be.ok
		expect(@machine.every 'A', 'B').to.be.ok
		
	it "should expose all available states", ->
		expect( @machine.states_all ).to.eql [ 'Exception', 'A', 'B', 'C', 'D' ]

	it "should allow to set the state", ->
		expect( @machine.set "B" ).to.eql true
		expect( @machine.is() ).to.eql ["B"]

	it "should allow to add a new state", ->
		expect( @machine.add "B" ).to.eql true
		expect( @machine.is() ).to.eql ["B", "A"]

	it "should allow to drop a state", ->
		@machine.set ["B", "C"]
		expect( @machine.drop 'C' ).to.eql true
		expect( @machine.is() ).to.eql ["B"]


	it "should throw when setting an unknown state", ->
		machine = @machine
		func = =>
			machine.set "unknown"
		expect( func ).to.throw()

	it 'should allow to define a new state', ->
		machine = new asyncmachine.AsyncMachine
		machine.A = {}
		machine.register 'A'
		machine.add 'A'
		expect(machine.is()).eql ['A']

	describe "when single to single state transition", ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B' ]
			# exec
			@machine.set 'B'

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
			expect( @machine.is() ).to.eql ['B']
		it "should remain the correct transition order", ->
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
			@machine.set [ 'B', 'C' ]

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
		it "should trigger the states' handlers", ->
			expect( @machine.B_state.calledOnce ).to.be.ok
			expect( @machine.C_state.calledOnce ).to.be.ok
		it 'should set the correct state', ->
			expect( @machine.is() ).to.eql ['B', 'C']
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
				@machine.B_state
				@machine.C_state
			]
			assert_order order

	describe "when multi to single state transition", ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C' ]
			# exec
			@machine.set [ 'C' ]

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
			expect( @machine.is() ).to.eql ['C']
		it "should remain the correct transition order", ->
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
			@machine.set [ 'D', 'C' ]

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
			expect( @machine.is() ).to.eql ['D', 'C']
		it "should remain the correct transition order", ->
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
			@machine.set [ 'A' ]

		it 'shouldn\'t trigger transition methods', ->
			expect( @machine.A_exit.called ).not.to.be.ok
			expect( @machine.A_any.called ).not.to.be.ok
			expect( @machine.any_A.called ).not.to.be.ok

		it 'should remain in the requested state', ->
			expect( @machine.is() ).to.eql [ 'A' ]

	describe 'when order is defined by the depends attr', ->
		beforeEach ->
			@machine = new FooMachine [ 'A', 'B' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.C.depends = [ 'D' ]
			@machine.A.depends = [ 'B' ]
			# exec
			@machine.set [ 'C', 'D' ]
		after ->
			delete @machine.C.depends
			delete @machine.A.depends

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
			@machine
				.id('')
				.logLevel(3)
				.logHandler @log.push.bind @log
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.C = blocks: [ 'D' ]
			@machine.set 'D'

		describe 'and they are set simultaneously', ->
			beforeEach ->
				@ret = @machine.set [ 'C', 'D' ]

			it 'should cancel the transition', ->
				expect( @machine.is() ).to.eql [ 'D' ]

			it 'should return false', ->
				expect( @ret ).to.eql no

			it 'should explain the reason in the log', ->
				expect(@log).to.contain '[drop] D by C'

			afterEach ->
				delete @ret

		describe 'and blocking one is added', ->

			it 'should unset the blocked one', ->
				@machine.add [ 'C' ]
				expect( @machine.is() ).to.eql [ 'C' ]

		describe 'and cross blocking one is added', ->
			beforeEach ->
				@machine.D = blocks: [ 'C' ]
			after ->
				@machine.D = {}

			describe 'using set', ->

				it 'should unset the old one', ->
					@machine.set 'C'
					expect( @machine.is() ).to.eql [ 'C' ]

				it 'should work in both ways', ->
					@machine.set 'C'
					expect( @machine.is() ).to.eql [ 'C' ]
					@machine.set 'D'
					expect( @machine.is() ).to.eql [ 'D' ]

			describe 'using add', ->

				it 'should unset the old one', ->
					@machine.add 'C'
					expect( @machine.is() ).to.eql [ 'C' ]

				it 'should work in both ways', ->
					@machine.add 'C'
					expect( @machine.is() ).to.eql [ 'C' ]
					@machine.add 'D'
					expect( @machine.is() ).to.eql [ 'D' ]

	describe 'when state is implied', ->
		beforeEach ->
			@machine = new FooMachine [ 'A' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.C = implies: [ 'D' ]
			@machine.A = blocks: [ 'D' ]
			# exec
			@machine.set [ 'C' ]

		it 'should be activated', ->
			expect( @machine.is() ).to.eql [ 'C', 'D' ]

		it 'should be skipped if blocked at the same time', ->
			@machine.set [ 'A', 'C' ]
			expect( @machine.is() ).to.eql [ 'A', 'C' ]
	#expect( fn ).to.throw

	describe 'when state requires another one', ->
		beforeEach ->
			@machine = new FooMachine [ 'A' ]
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]
			@machine.C = requires: [ 'D' ]
		after ->
			@machine.C = {}

		it 'should be set when required state is active', ->
			@machine.set [ 'C', 'D' ]
			expect( @machine.is() ).to.eql [ 'C', 'D' ]

		describe 'when required state isn\'t active', ->
			
			beforeEach ->
				@log = []
				@machine
					.id('')
					.logLevel(3)
					.logHandler @log.push.bind @log
				@machine.set [ 'C', 'A' ]
				
			afterEach ->
				delete @log

			it 'should\'t be set', ->
				expect( @machine.is() ).to.eql [ 'A' ]

			it 'should explain the reason in the log', ->
				msg = "[rejected] C(-D)"
				expect( @log ).to.contain msg

	describe 'when state is changed', ->
		beforeEach ->
			@machine = new FooMachine 'A'
			# mock
			mock_states @machine, [ 'A', 'B', 'C', 'D' ]

		describe 'during another state change', ->

			it 'should be scheduled synchronously', ->
				@machine.B_enter = (states) ->
					@add 'C'
				@machine.C_enter = sinon.spy()
				@machine.A_exit = sinon.spy()
				@machine.set 'B'
				expect( @machine.C_enter.calledOnce ).to.be.ok
				expect( @machine.A_exit.calledOnce ).to.be.ok
				expect( @machine.is() ).to.eql [ 'C', 'B' ]

			it 'should be checkable'
				# TODO use #duringTransition

		describe 'and transition is canceled', ->
			beforeEach ->
				@machine.D_enter = -> no
				@log = []
				@machine
					.id('')
					.logLevel(3)
					.logHandler @log.push.bind @log

			describe 'when setting a new state', ->
				beforeEach ->
					@ret = @machine.set 'D'

				it 'should return false', ->
					expect( @machine.set 'D' ).not.to.be.ok

				it 'should not change the previous state', ->
					expect( @machine.is() ).to.eql [ 'A' ]

				it 'should explain the reason in the log', ->
					expect(@log).to.contain '[cancelled] D by the method D_enter'

				it 'should not change the auto states'

			# TODO make this and the previous a main contexts
			describe 'when adding an additional state', ->
				beforeEach -> @ret = @machine.add 'D'

				it 'should return false', ->
					expect( @ret ).not.to.be.ok

				it 'should not change the previous state', ->
					expect( @machine.is() ).to.eql [ 'A' ]

				it 'should not change the auto states'

			describe 'when droping a current state', ->
				it 'should return false'

				it 'should not change the previous state'

				it 'should explain the reason in the log'

				it 'should not change the auto states'

		describe 'and transition is successful', ->

			it 'should return true', ->
				expect( @machine.set 'D' ).to.be.ok

			it 'should set the auto states'

		it 'should provide previous state information', (done) ->
			@machine.D_enter = ->
				expect( @is() ).to.eql [ 'A' ]
				do done
			@machine.set 'D'

		it 'should provide target state information', (done) ->
			@machine.D_enter = (target) ->
				expect( target ).to.eql [ 'D' ]
				do done
			@machine.set 'D'

		describe 'with arguments', ->
			beforeEach ->
				@machine.D =
					implies: [ 'B' ]
					blocks: [ 'A' ]
			after ->
				@machine.D = {}

			describe 'and synchronous', ->
				beforeEach ->
					@machine.set [ 'A', 'C' ]
					@machine.set 'D', 'foo', 2
					@machine.set 'D', 'foo', 2
					@machine.drop 'D', 'foo', 2

				describe 'and is explicit', ->

					it 'should forward arguments to exit methods', ->
						expect( @machine.D_exit.calledWith ['B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to enter methods', ->
						expect( @machine.D_enter.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to self transition methods', ->
						expect( @machine.D_D.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to transition methods', ->
						expect( @machine.C_D.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

				describe 'and is non-explicit', ->

					it 'should not forward arguments to exit methods', ->
						expect( @machine.A_exit.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to enter methods', ->
						expect( @machine.B_enter.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to transition methods', ->
						expect( @machine.A_B.calledWith ['D', 'B'] ).to.be.ok

			describe 'and delayed', ->
				beforeEach ->
					do @machine.setByListener [ 'A', 'C' ], 'foo'
					do @machine.setByListener 'D', 'foo', 2
					do @machine.setByListener 'D', 'foo', 2
					do @machine.dropByListener 'D', 'foo', 2

				describe 'and is explicit', ->

					it 'should forward arguments to exit methods', ->
						expect( @machine.D_exit.calledWith ['B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to enter methods', ->
						expect( @machine.D_enter.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to self transition methods', ->
						expect( @machine.D_D.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

					it 'should forward arguments to transition methods', ->
						expect( @machine.C_D.calledWith ['D', 'B'], 'foo', 2 ).to.be.ok

				describe 'and is non-explicit', ->

					it 'should not forward arguments to exit methods', ->
						expect( @machine.A_exit.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to enter methods', ->
						expect( @machine.B_enter.calledWith ['D', 'B'] ).to.be.ok

					it 'should not forward arguments to transition methods', ->
						expect( @machine.A_B.calledWith ['D', 'B'] ).to.be.ok

		describe 'and delayed', ->
			beforeEach (done) ->
				@callback = @machine.setByCallback 'D'
				@promise = @machine.last_promise
				# TODO without some action after beforeEach, we'd hit a timeout
				done()

			afterEach ->
				delete @promise

			it 'should return a promise', ->
				expect( @promise instanceof Promise ).to.be.ok

			it 'should execute the change', (done) ->
				# call without an error
				@callback null
				@promise.then =>
					expect( @machine.any_D.calledOnce ).to.be.ok
					expect( @machine.D_enter.calledOnce ).to.be.ok
					do done

			it 'should expose a ref to the last promise', ->
				expect( @machine.last_promise ).to.equal @promise

			it 'should be called with params passed to the delayed function', (done) ->
				@machine.D_enter = (params...) ->
					expect( params ).to.be.eql [ [ 'D' ], 'foo', 2 ]
					do done
				@callback null, 'foo', 2

			describe 'and then cancelled', ->

				it 'should not execute the change', (done) ->
					@machine.Exception_state = ->
					@promise.catch =>
						expect(@machine.any_D).not.have.been.called
						expect(@machine.D_enter).not.have.been.called
						done()
					@callback new Error

		describe 'and active state is also the target one', ->
			it 'should trigger self transition at the very beginning', ->
				@machine.set [ 'A', 'B' ]
				order = [
					@machine.A_A
					@machine.any_B
					@machine.B_enter
				]
				assert_order order

			it 'should be executed only for explicitly called states', ->
				@machine.add 'B'
				@machine.add 'A'
				expect( @machine.A_A.calledOnce ).to.be.ok
				expect( @machine.B_B.callCount ).to.eql 0

			it 'should be cancellable', ->
				@machine.A_A = sinon.stub().returns no
				@machine.set( [ 'A', 'B' ] )
				expect( @machine.A_A.calledOnce ).to.be.ok
				expect( @machine.any_B.called ).not.to.be.ok

			after ->
				delete @machine.A_A

		# TODO move to events
		describe 'should trigger events', ->
			
			beforeEach ->

				@A_A = sinon.spy()
				@B_enter = sinon.spy()
				@C_exit = sinon.spy()
				@change = sinon.spy()
				@cancelTransition = sinon.spy()
				
				@machine = new FooMachine 'A'
				# mock
				mock_states @machine, [ 'A', 'B', 'C', 'D' ]
				@machine.set [ 'A', 'C' ]
				@machine.on 'A_A', @A_A
				@machine.on 'B_enter', @B_enter
				@machine.on 'C_exit', @C_exit
				@machine.on 'D_exit', ->
					no
				# emitter event
				@machine.on 'change', @change
				@machine.on 'cancelled', @cancelTransition
				@machine.set [ 'A', 'B' ]
				@machine.add [ 'C' ]
				@machine.add [ 'D' ]
				
			afterEach ->
				delete @C_exit
				delete @A_A
				delete @B_enter
				delete @add
				delete @set
				delete @cancelTransition

			it 'for self transitions', ->
				expect( @A_A.called ).to.be.ok
			it 'for enter transitions', ->
				expect( @B_enter.called ).to.be.ok
			it 'for exit transitions', ->
				expect( @C_exit.called ).to.be.ok
			it 'which can cancel the transition', ->
				expect( @machine.D_any.called ).not.to.be.ok
			it 'for changing states', ->
				expect( @change.called ).to.be.ok
			it 'for cancelling the transition', ->
				@machine.drop 'D'
				expect( @cancelTransition.called ).to.be.ok

	describe 'Events', ->

		beforeEach ->
			@machine = new EventMachine 'A'
			
		describe 'should support states', ->

			it 'by triggering the *_state bindings immediately', ->
				l = []
				# init spies
				l[ i ] = sinon.stub() for i in [ 0..2 ]
				i = 0
				@machine.set 'B'
				@machine.on 'A_state', l[ i++ ]
				@machine.on 'B_state', l[ i++ ]
				i = 0
				expect( l[ i++ ].called ).not.to.be.ok
				expect( l[ i++ ].calledOnce ).to.be.ok
								
			it 'shouldn\'t duplicate events'
				
		describe 'clock', ->
			beforeEach ->
				@machine = new FooMachine
				
			it 'should tick when setting a new state', ->
				@machine.set 'A'
				(expect @machine.clock 'A').to.be.eql 1

			it 'should tick when setting many new states', ->
				@machine.set ['A', 'B']
				(expect @machine.clock 'A').to.be.eql 1
				(expect @machine.clock 'B').to.be.eql 1
			
			it 'shouldn\'t tick when setting an already set state', ->
				@machine.set 'A'
				@machine.set 'A'
				(expect @machine.clock 'A').to.be.eql 1
			
			it 'should tick for Multi states when setting an already set state', ->
				@machine.A.multi = yes
				@machine.set 'A'
				@machine.set 'A'
				(expect @machine.clock 'A').to.be.eql 2
			
		describe 'proto child', ->
			beforeEach ->
				@machine = new FooMachine
				@child = @machine.createChild()
				
			after: -> delete @child
				
			it 'should inherit all the instance properties', ->
				(expect @machine.A).to.equal @child.A
				
			it 'should have own active states and the clock', ->
				@child.add 'B'
				(expect @machine.is()).to.not.eql @child.is()


	describe 'queue', ->
	describe 'nested queue', ->

	describe 'bugs', ->
		# TODO use a constructor in Sub
		it 'should trigger the enter state of a subclass', ->
			a_enter_spy = sinon.spy()
			b_enter_spy = sinon.spy()
			sub = new Sub 'A', a_enter_spy, b_enter_spy
			sub.set 'B'
			expect( a_enter_spy.called ).to.be.ok
			expect( b_enter_spy.called ).to.be.ok

		it 'should drop states cross-blocked by implied states', ->
			# parse implied states before current ones
			# hint: in blocked by
			sub = new SubCrossBlockedByImplied
			expect( sub.is() ).to.eql [ 'C', 'B' ]

		it 'should pass args to transition methods'

		it 'should drop states blocked by a new one if the one blocks it', ->
			sub = new CrossBlocked
			expect( sub.is() ).to.eql [ 'B' ]
			
	describe 'Promises', ->
		it 'can be resolved'
		it 'can be rejected'
		it 'can be chainable'
		describe 'delayed methods', ->
			it 'should return correctly bound resolve method'
