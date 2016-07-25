am = require '../build/asyncmachine'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
bluebird = require 'bluebird'

# turn off "possibly unhandled error", which is buggy
# https://github.com/petkaantonov/bluebird/issues/352
#bluebird.onPossiblyUnhandledRejection ->

factory = am.factory

describe "Exceptions", ->

  beforeEach ->
    @foo = factory ['A']

  it 'should be thrown on the next tick', ->
    setImmediate = sinon.stub @foo, 'setImmediate'
    @foo.A_enter = -> throw new Error
    log = sinon.stub console, 'log'
    dir = sinon.stub console, 'dir'
    @foo.add 'A'
    log.restore()
    dir.restore()
    expect(setImmediate.calledOnce).to.be.ok
    expect(setImmediate.firstCall.args[0]).to.throw Error

  it 'should set the Exception state', ->
    @foo.A_enter = -> throw new Error
    @foo.Exception_state = ->
    @foo.add 'A'
    expect(@foo.is()).to.eql ['Exception']

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
        @foo.Exception_state = (states, exception, target_states) ->
          expect(target_states).to.eql ['A']
          expect(exception).to.be.instanceOf Error
          done()
        @foo.A_enter = bluebird.coroutine ->
          yield bluebird.delay 0
          throw new Error
        @foo.add 'A'

      it 'returned by listeners', (done) ->
        @foo.Exception_state = (states, exception, target_states) ->
          expect(target_states).to.eql ['A']
          expect(exception).to.be.instanceOf Error
          done()
        @foo.on 'A_enter', bluebird.coroutine ->
          yield bluebird.delay 0
          throw new Error
        @foo.add 'A'


  describe 'complex scenario', ->

    before ->
      asyncMock = (cb) ->
        setTimeout (cb.bind null), 0

      @foo = factory ['A', 'B', 'C']
      @bar = factory ['D']
      @bar.pipe 'D', @foo, 'A'
      @foo.A_enter = -> @add 'B'
      @foo.B_state = bluebird.coroutine ->
        yield bluebird.delay 0
        method = bluebird.promisify asyncMock
        yield method()
        @add 'C'
      @foo.C_enter = ->
        throw fake: yes

    it 'should be caught', (done) ->
      do @bar.addByListener 'D'
      @foo.Exception_state = ->
        done()

