import AsyncMachine, {
  machine,
  PipeFlags,
  Transition
} from '../src/asyncmachine'
import { TransitionStepTypes, TransitionStepFields } from '../src/types'
import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'

let { expect } = chai
chai.use(sinonChai)

describe('Transition steps', function() {
  it('for relations', function() {
    let states = machine({
      A: { require: ['B'] },
      B: { require: ['C'] },
      C: { after: ['A'] },
      D: {
        add: ['B', 'C'],
        drop: ['E']
      },
      E: {}
    })
    states.id('')
    states.set('E')
    let transition: Transition
    states.on('transition-end', (t: Transition) => {
      transition = t
    })
    states.add(['A', 'D'])
    expect(states.is()).to.eql(['A', 'D', 'B', 'C'])
    expect(transition.steps.length).to.be.gt(0)
    let types = TransitionStepTypes
    let steps = [
      [['', 'A'], undefined, types.REQUESTED, undefined],
      [['', 'D'], undefined, types.REQUESTED, undefined],
      [['', 'A'], undefined, types.SET, undefined],
      [['', 'D'], undefined, types.SET, undefined],
      [['', 'B'], ['', 'D'], types.RELATION, 'add'],
      [['', 'C'], ['', 'D'], types.RELATION, 'add'],
      [['', 'B'], undefined, types.SET, undefined],
      [['', 'C'], undefined, types.SET, undefined],
      [['', 'E'], ['', 'D'], types.RELATION, 'drop'],
      [['', 'E'], undefined, types.DROP, undefined]
    ]
    expect(transition.steps).to.eql(steps)
  })

  it('for transitions', function() {
    let states = machine<'A' | 'B' | 'C' | 'D'>(['A', 'B', 'C', 'D'])
    let f = function() {}
    let target = {
      Any_C: f,
      B_C: f,
      B_exit: f,
      C_enter: f,
      A_A: f
    }
    states.id('').setTarget(target)
    states.set(['A', 'B'])
    let transition: Transition
    states.on('transition-end', (t: Transition) => {
      transition = t
    })
    states.set(['A', 'C'])
    expect(states.is()).to.eql(['A', 'C'])
    expect(transition.steps.length).to.be.gt(0)
    let types = TransitionStepTypes
    let steps = [
      [['', 'A'], undefined, types.REQUESTED, undefined],
      [['', 'C'], undefined, types.REQUESTED, undefined],
      [['', 'C'], undefined, types.SET, undefined],
      [['', 'B'], undefined, types.DROP, undefined],
      [['', 'A'], ['', 'A'], types.TRANSITION, 'A_A'],
      [['', 'B'], undefined, types.TRANSITION, 'B_exit'],
      [['', 'B'], ['', 'C'], types.TRANSITION, 'B_C'],
      [['', 'C'], undefined, types.TRANSITION, 'C_enter']
    ]
    expect(transition.steps).to.eql(steps)
  })

  // describe('events')
})
