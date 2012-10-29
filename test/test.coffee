multistatemachine = require('multistatemachine')
expect = require('chai').expect

class FooMachine extends multistatemachine.MultiStateMachine

  state_A: {}
  state_B: {}
  state_C: {}
  state_D: {}

  constructor: (state, config) ->
    super state, config

describe "MultiStateMachine", ->
  machine = undefined
  beforeEach ->
    machine = new FooMachine 'A'

  it "should allow for a delayed start"
  it "should accept the starting state", ->
    expect( machine.state() ).to.eql [ "A" ]

  it "should allow to change the state", ->
    machine.setState "B"
    
    # control flow assert
    expect(true).to.eql true

  it "should return the current state", ->
    machine.setState "B"
    expect( machine.state() ).to.eql [ "B" ]

  # it "should throw when setting unknown state", ->
  #   func = ->
  #     machine.setState "unknown"
  #   expect( func ).to.throw()

  it 'should allow to define a new state'

  describe "transitions", ->
    mock_states = (instance, states) ->
      for state in states
        instance[ "#{state}_enter" ] = do sinon.spy
        instance[ "#{state}_exit" ] = do sinon.spy
        instance[ "#{state}_Any" ] = do sinon.spy
        instance[ "Any_#{state}" ] = do sinon.spy

    it "should not trigger the non existing transitions", ->
      machine.A_exit = sinon.spy()
      machine.setState "unknown"
      expect( machine.A_exit.called ).not.to.be.ok

    describe "single to single state transition", ->
      beforeEach ->
        machine = new FooMachine 'A'
        # mock
        mock_states machine, [ 'A', 'B' ]
        # exec
        machine.state 'B'

      it "should trigger the state exit transition", ->
        expect( machine.A_exit.called ).to.be.ok
      it "should trigger the transition to the new state", ->
        expect( machine.B_enter.called ).to.be.ok
      it "should trigger the transition to \"Any\" state", ->
        expect( machine.A_Any.called ).to.be.ok
      it "should trigger the transition from \"Any\" state", ->
        expect( machine.Any_B.called ).to.be.ok

    describe "single to multi state transition", ->
      beforeEach ->
        machine = new FooMachine 'A'
        # mock
        mock_states machine, [ 'A', 'B', 'C' ]
        # exec
        machine.state [ 'B', 'C' ]

      it "should trigger the state exit transition", ->
        expect( machine.A_exit.called ).to.be.ok
      it "should trigger the transition to new states", ->
        expect( machine.B_enter.called ).to.be.ok
        expect( machine.C_enter.called ).to.be.ok
      it "should trigger the transition to \"Any\" state", ->
        expect( machine.A_Any.called ).to.be.ok
      it "should trigger the transition from \"Any\" state", ->
        expect( machine.Any_B.called ).to.be.ok
        expect( machine.Any_C.called ).to.be.ok

    describe "multi to single state transition", ->
      beforeEach ->
        machine = new FooMachine [ 'A', 'B' ]
        # mock
        mock_states machine, [ 'A', 'B', 'C' ]
        # exec
        machine.state [ 'C' ]
      it "should trigger the state exit transition", ->
        expect( machine.A_exit.called ).to.be.ok
        expect( machine.B_exit.called ).to.be.ok
      it "should trigger the transition to the new state", ->
        expect( machine.C_enter.called ).to.be.ok
      it "should trigger the transition to \"Any\" state", ->
        expect( machine.A_Any.called ).to.be.ok
        expect( machine.B_Any.called ).to.be.ok
      it "should trigger the transition from \"Any\" state", ->
        expect( machine.Any_C.called ).to.be.ok

    describe "multi to multi state transition", ->
      beforeEach ->
        machine = new FooMachine [ 'A', 'B' ]
        # mock
        mock_states machine, [ 'A', 'B', 'C', 'D' ]
        # exec
        machine.state [ 'D', 'C' ]
      it "should trigger the state exit transition", ->
        expect( machine.A_exit.called ).to.be.ok
        expect( machine.B_exit.called ).to.be.ok
      it "should trigger the transition to the new state", ->
        expect( machine.C_enter.called ).to.be.ok
        expect( machine.D_enter.called ).to.be.ok
      it "should trigger the transition to \"Any\" state", ->
        expect( machine.A_Any.called ).to.be.ok
        expect( machine.B_Any.called ).to.be.ok
      it "should trigger the transition from \"Any\" state", ->
        expect( machine.Any_C.called ).to.be.ok
        expect( machine.Any_D.called ).to.be.ok

    it 'should be ordered according to the "depends" state attribute'
    it 'should activate other states according to the the "implies" state attribute'
