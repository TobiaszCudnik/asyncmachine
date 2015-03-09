asyncmachine = require '../build/asyncmachine'
AM = asyncmachine.AsyncMachine
chai = require 'chai'
expect = chai.expect
{ Visualizer } = require '../build/visualizer/visualizer'


describe "Single machine graph", ->

  beforeEach ->
    @machine = new AM.factory ['A', 'B', 'C', 'D']
    @machine.A = requires: ['B']
    @machine.C = drops: ['B']
    @machine.D = requires: ['C']

    @vis = new Visualizer
    @vis.addMachine @machine

  it 'should get all states as nodes', ->
    console.dir @vis.graph.edges()

  it 'should get all relations as edges'