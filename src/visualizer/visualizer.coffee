am = require '../asyncmachine'
graphlib = require 'graphlib'
uuid = require 'node-uuid'

Graph = graphlib.Graph


class Node
  machine: null
  name: null
  id: null

  constructor: (name, machine) ->
    @id = uuid.v4()
    @machine = machine
    @name = name

  get: ->
    @machine.get @name


class VisualizerStates extends am.AsyncMachine


class Visualizer

  states: null
  graph: null
  nodes: null
  events: null

  constructor: ->
    @graph = new Graph
    @states = new VisualizerStates
    @nodes = {}


  addMachine: (machine) ->
    @getNodesFromMachine machine
    @bindToMachine machine
    @scanReferences()


  bindToMachine: (machine) ->
    # TODO override event triggers to apply them on the UI immediate


  getNodesFromMachine: (machine) ->
    # scan states
    new_nodes = []
    name = ''
    for name in machine.states_all
      node = new Node name, machine
      @nodes[node.id] = node
      @graph.setNode node.id, node
      new_nodes.push node

    # get edges from relations
    for node in new_nodes
      @getRelationsFromNode node, machine


  getRelationsFromNode: (node, machine) ->
    # TODO limit to 'requires' and 'drops' ?
    relation = ''
    targets = []
    for relation, targets of node.get()
      return if relation is 'auto'

      target_name = ''
      for target_name in targets
        target = @getNodeByName target_name, machine
        @graph.setEdge node.id, target.id, relation


  getNodeByName: (name, machine) ->
    node = null
    for id, node of @nodes
      if node.name is name and
          node.machine is machine
        return node


  scanReferences: ->
    # scan listeners, get edges from listener refs


class VisualizerUi



module.exports = {
  Node
  Visualizer
  VisualizerUi
}
