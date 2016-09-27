import AsyncMachine, {
    factory,
    PipeFlags,
    Transition
} from '../src/asyncmachine';
import {
    TransitionStepTypes,
    TransitionTouchFields
} from '../src/types'
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';


let { expect } = chai;
chai.use(sinonChai);


describe('Transition steps', function () {
    it('for relations', function() {
        let states = factory({
            A: {requires: ['B']},
            B: {requires: ['C']},
            C: {after: ['A']},
            D: {
                add: ['B', 'C'],
                drop: ['E']
            },
            E: {}
        })
        states.id('')
        states.set('E')
        let transition
        states.on('transition-end', (t: Transition) => {
            transition = t
        })
        states.add(['A', 'D'])
        expect(states.is()).to.eql(['A', 'D', 'B', 'C'])
        expect(transition.steps.length).to.be.gt(0)
        let steps = [
            [["", "A"], undefined, 5],
            [["", "D"], undefined, 5],
            [["", "A"], undefined, 2],
            [["", "D"], undefined, 2],
            [["", "B"], ["", "D"], 0, "add"],
            [["", "C"], ["", "D"], 0, "add"],
            [["", "B"], undefined, 2],
            [["", "C"], undefined, 2],
            [["", "E"], ["", "D"], 0, "drop"],
            [["", "E"], undefined, 3]
        ]
        expect(transition.steps).to.eql(steps)
    })

    it('for transitions', function() {
        let states = factory(['A', 'B', 'C', 'D'])
        let f = function(){}
        let target = {
            Any_C: f,
            B_C: f,
            B_exit: f,
            C_enter: f,
            A_A: f
        }
        states.id('').setTarget(target)
        states.set(['A', 'B'])
        let transition
        states.on('transition-end', (t: Transition) => {
            transition = t
        })
        states.set(['A', 'C'])
        expect(states.is()).to.eql(['A', 'C'])
        expect(transition.steps.length).to.be.gt(0)
        let steps = [
            [["", "A"], undefined, 5],
            [["", "C"], undefined, 5],
            [["", "C"], undefined, 2],
            [["", "B"], undefined, 3],
            [["", "A"], ["", "A"], 1, "A_A"],
            [["", "B"], undefined, 1, "B_exit"],
            [["", "B"], ["", "C"], 1, "B_C"],
            [["", "C"], undefined, 1, "C_enter"]
        ]
        expect(transition.steps).to.eql(steps)
    })

    // describe('events')
})
