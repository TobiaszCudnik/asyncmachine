asyncmachine = require '../build/asyncmachine'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
bluebird = require 'bluebird'

# turn off "possibly unhandled error", which is buggy
# https://github.com/petkaantonov/bluebird/issues/352
bluebird.onPossiblyUnhandledRejection ->

AM = asyncmachine.AsyncMachine

describe "Exceptions", ->

  beforeEach ->
    class Foo extends AM
      A: {}

    @foo = new Foo
    @foo.registerAll()

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

    it 'from transitions returning promises', (done) ->
      @foo.debug '', 2
      @foo.Exception_state = (states, exception, target_states) ->
        console.log 'Exception_state', states, exception, target_states
        expect(target_states).to.eql ['A']
        expect(exception).to.be.instanceOf Error
        done()
      @foo.A_enter = bluebird.coroutine ->
        yield bluebird.delay 0
        throw new Error
      @foo.add 'A'

    it 'from event listeners returning promises', (done) ->
      @foo.Exception_state = (states, exception, target_states) ->
        console.log 'Exception_state', states, exception, target_states
        expect(target_states).to.eql ['A']
        expect(exception).to.be.instanceOf Error
        done()
      @foo.on 'A_enter', bluebird.coroutine ->
        yield bluebird.delay 0
        throw new Error
      @foo.add 'A'