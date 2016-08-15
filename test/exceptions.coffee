am = require '../build/asyncmachine.js'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'

factory = am.factory

describe "Exceptions", ->

  beforeEach ->
    @foo = factory ['A']

  it 'should be thrown on the next tick', ->
    setImmediate = sinon.stub @foo, 'setImmediate'
    @foo.A_enter = -> throw new Error
    @foo.add 'A'
    expect(setImmediate.calledOnce).to.be.ok
    expect(setImmediate.firstCall.args[0]).to.throw Error

  it 'should set the Exception state', ->
    @foo.A_enter = -> throw new Error
    @foo.Exception_state = ->
    @foo.add 'A'
    expect(@foo.is()).to.eql ['Exception']

    null

  it 'should pass all the params to the method', (done) ->
    states = factory ['A', 'B', 'C']
    states.C_enter = -> throw new Error

    states.Exception_state = (err, target_states, base_states, exception_transition, async_target_states) ->
      expect(target_states).to.eql ['B', 'C']
      expect(base_states).to.eql ['A']
      expect(exception_transition).to.eql 'C_enter'
      expect(async_target_states).to.eql undefined
      done()
      
    states.set ['A']
    states.set ['B', 'C']

    null

  it 'should set accept completed transition'

  describe 'should be caught', ->

    it 'from next-tick state changes', (done) ->
      @foo.A_enter = -> throw new Error
      @foo.Exception_state = -> done()
      @foo.addNext 'A'

    it 'from a callbacks error param', (done) ->
      delayed = (callback) ->
        setTimeout (callback.bind null, new Error), 0
      delayed @foo.addByCallback 'A'
      @foo.Exception_state = -> done()

    it 'from deferred changes', (done) ->
      @foo.A_enter = -> throw new Error
      delayed = (callback) ->
        setTimeout callback, 0
      delayed @foo.addByListener 'A'
      @foo.Exception_state = -> done()

    describe 'in promises', ->

      it 'returned by transitions', (done) ->
        @foo.Exception_state = (exception, target_states, base_states, exception_state) ->
          expect(target_states).to.eql ['A']
          expect(exception).to.be.instanceOf Error
          done()
        @foo.A_enter = -> new Promise (resolve, reject) ->
          setTimeout ->
            reject new Error
        @foo.add 'A'

      it 'returned by listeners', (done) ->
        @foo.Exception_state = (exception, target_states, base_states, exception_state) ->
          expect(target_states).to.eql ['A']
          expect(exception).to.be.instanceOf Error
          done()
        @foo.on 'A_enter', new Promise (resolve, reject) ->
          setTimeout ->
            reject new Error
        @foo.add 'A'


      it 'returned by the state binding "when()"'
        # TODO


  describe 'complex scenario', ->

    before ->
      asyncMock = (cb) ->
        setTimeout (cb.bind null), 0

      @foo = factory ['A', 'B', 'C']
      @bar = factory ['D']
      @bar.pipe 'D', @foo, 'A'
      @foo.A_enter = -> @add 'B'
      @foo.B_state = ->
        new Promise (resolve, reject) =>
          setTimeout =>
            resolve @add 'C'
      @foo.C_enter = ->
        throw fake: yes

    it 'should be caught', (done) ->
      do @bar.addByListener 'D'
      @foo.Exception_state = ->
        done()

