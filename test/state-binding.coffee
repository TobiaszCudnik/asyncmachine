asyncmachine = require '../build/asyncmachine.js'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
sinonChai = require "sinon-chai"

factory = asyncmachine.factory
chai.use sinonChai

describe 'State binding', ->

    it 'should work for single states', (done) ->
        states = asyncmachine.factory ['A', 'B']
        states.when('A').then (value) ->
            expect(value).to.eql undefined
            done()
        states.set 'A', 1, 2, 3
        states.set []
        # assert the double execution
        states.set ['A'], 1, 2, 3

    it 'should work for multiple states', ->
        states = asyncmachine.factory ['A', 'B']
        states.when(['A', 'B']).then (value) ->
            expect(value).to.eql undefined
            done()
        states.set 'A'
        states.set 'B', 1, 2, 3
        states.set []
        # assert the double execution
        states.set ['A', 'B'], 1, 2, 3

    describe 'disposal', ->
    	it 'should work with the abort function'
    	it 'should take place after execution'