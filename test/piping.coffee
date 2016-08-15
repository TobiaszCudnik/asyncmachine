require 'source-map-support/register'
asyncmachine = require '../build/asyncmachine.js'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
sinonChai = require "sinon-chai"

factory = asyncmachine.factory
chai.use sinonChai

describe 'piping', ->

    it 'should forward a specific state', ->
        source = factory ['A', 'B', 'C', 'D']
        source.set 'A'
        target = factory ['A', 'B', 'C', 'D']

        source.pipe 'A', target
        source.pipe 'B', target

        expect(source.piped.A).to.have.length 2
        expect(source.piped.B).to.have.length 2
        expect(target.is()).to.be.eql ['A']
        source.set 'B'
        expect( target.is() ).to.eql ['B']

    it 'should forward a specific state as a different one', ->
        source = factory ['A', 'B', 'C', 'D']
        source.set 'A'
        target = factory ['X', 'Y', 'Z']

        source.pipe 'B', target, 'X'
        source.set 'B'

        expect( target.is() ).to.eql [ 'X' ]

    it 'should invert a specific state as a different one', ->
        source = factory ['A', 'B', 'C', 'D']
        source.set 'A'
        target = factory ['X', 'Y', 'Z']

        source.pipe 'A', target, 'X', asyncmachine.PipeFlags.INVERT
        source.drop 'A'

        expect( target.is() ).to.eql [ 'X' ]

    it 'should forward a whole machine', ->
        source = factory ['A', 'B', 'C', 'D']
        source.set 'A'
        target = factory ['A', 'B', 'C', 'D']
        target.set ['A', 'D']

        expect( target.is() ).to.eql [ 'A', 'D' ]
        source.pipeAll target
        # TODO assert the number of pipes
        source.set [ 'B', 'C' ]

        expect( target.is() ).to.eql [ 'C', 'B', 'D' ]

    it 'support the local queue'

    describe 'can be removed', ->
        beforeEach ->
            @source = factory ['A', 'B', 'C', 'D']
            @target = factory ['A', 'B', 'C', 'D']

        it 'for single state', ->

            @source.pipe 'A', @target
            @source.pipeRemove 'A'
            expect( @source.piped.A ).to.eql undefined

        it 'for a whole target machine', ->

            @source.pipeAll @target
            @source.pipeRemove null, @target
            expect( Object.keys @source.piped ).to.eql []

        it 'for flags', ->

            @source.pipe 'A', @target, null, asyncmachine.PipeFlags.INVERT
            @source.pipeRemove 'A', null, asyncmachine.PipeFlags.INVERT
            expect( @source.piped.A ).to.eql undefined

        it 'for all the states', ->

            @source.pipeAll @target
            @source.pipeRemove()
            expect( Object.keys @source.piped ).to.eql []