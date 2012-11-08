multistatemachine = require('multistatemachine')
expect = require('chai').expect
sinon = require('sinon')

describe "multistatemachine", ->
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
    @machine.addState "B"
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

    it 'shouldn\'t remain in the requested state', ->
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

    it 'should handle dependand states first when entering', ->
      order = [
        @machine.A_D
        @machine.A_C
        @machine.any_D
        @machine.D_enter
        @machine.any_C
        @machine.C_enter
      ]
      assert_order order

    it 'should handle dependand states last when exiting', ->
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

  describe 'when state is blocked', ->
    beforeEach ->
      @machine = new FooMachine [ 'A', 'B' ]
      # mock
      mock_states @machine, [ 'A', 'B', 'C', 'D' ]
      @machine.state_C = blocks: [ 'D' ]
      # exec
      @machine.setState [ 'C', 'D' ]

    it 'should be skipped', ->
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
      # exec

    it 'should be set when required state is active', ->
      @machine.setState [ 'C', 'D' ]
      expect( @machine.state() ).to.eql [ 'C', 'D' ]

    it 'should\'t be set when required state isn\'t active', ->
      @machine.setState [ 'C', 'A' ]
      expect( @machine.state() ).to.eql [ 'A' ]