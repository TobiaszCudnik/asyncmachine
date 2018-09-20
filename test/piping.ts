import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import AsyncMachine, { machine, PipeFlags } from '../src/asyncmachine'
import { IBind, IEmit } from '../src/types'
import { assert_order, mock_states } from './utils'

let { expect } = chai
chai.use(sinonChai)

type ABCD = 'A' | 'B' | 'C' | 'D'
type XYZ = 'X' | 'Y' | 'Z'

describe('piping', function() {
  it('should forward a specific state', function() {
    let source = machine<ABCD>(['A', 'B', 'C', 'D'])
    source.set('A')
    let target = machine<ABCD>(['A', 'B', 'C', 'D'])

    source.pipe('A', target)
    source.pipe('B', target)

    expect(source.piped['A']).to.have.length(2)
    expect(source.piped['B']).to.have.length(2)
    expect(target.is()).to.be.eql(['A'])
    source.set('B')
    expect(target.is()).to.eql(['B'])
  })

  it('should forward a specific state as a different one', function() {
    let source = machine<ABCD>(['A', 'B', 'C', 'D'])
    source.set('A')
    let target = machine<XYZ>(['X', 'Y', 'Z'])

    source.pipe('B', target, 'X')
    source.set('B')

    expect(target.is()).to.eql(['X'])
  })

  it('should invert a specific state as a different one', function() {
    let source = machine<ABCD>(['A', 'B', 'C', 'D']).id('source')
    source.set('A')
    let target = machine<XYZ>(['X', 'Y', 'Z']).id('target')

    source.pipe('A', target, 'X', PipeFlags.INVERT)
    source.drop('A')

    expect(target.is()).to.eql(['X'])
  })

  it('should work for negotiation', function() {
    let source = machine<ABCD>(['A', 'B', 'C', 'D'])
    let target = machine<ABCD>(['A', 'B', 'C', 'D'])
    source.pipe('A', target, null, PipeFlags.NEGOTIATION)
    target['A_enter'] = () => false
    source.add('A')

    expect(source.is()).to.eql([])
    expect(target.is()).to.eql([])
  })

  it('should work for both negotiation and final', function() {
    // piping negotiation-only phrase does not give you certainty,
    // that the state was actually set for the machine A
    // in that case, fow now, assert the success via the self-transition
    const source = machine<ABCD>(['A', 'B', 'C', 'D']).id('source')
    const target_1 = machine<ABCD>(['A', 'B', 'C', 'D']).id('target-1')
    const target_2 = machine<ABCD>(['A', 'B', 'C', 'D']).id('target-2')

    source.pipe(
      ['A', 'B'],
      target_1,
      null,
      PipeFlags.NEGOTIATION | PipeFlags.FINAL
    )
    source.pipe(
      ['A', 'B'],
      target_2,
      null,
      PipeFlags.NEGOTIATION | PipeFlags.FINAL
    )

    target_1['A_enter'] = sinon.spy()
    // reject the transition after it's done with target_1
    target_2['A_enter'] = sinon.stub().returns(false)
    target_1['A_A'] = sinon.spy()
    target_2['B_enter'] = sinon.spy()
    target_2['B_B'] = sinon.spy()

    source.add('A')
    source.add('B')

    assert_order([
      target_1['A_enter'],
      target_2['A_enter'],
      target_2['B_enter'],
      target_2['B_B']
    ])

    expect(target_1['A_A']).not.called

    expect(source.is()).to.eql(['B'])
    expect(target_1.is()).to.eql(['B', 'A'])
    expect(target_2.is()).to.eql(['B'])
  })

  it('should forward a whole machine', function() {
    let source = machine<ABCD>(['A', 'B', 'C', 'D'])
    source.set('A')
    let target = machine<ABCD>(['A', 'B', 'C', 'D'])
    target.set(['A', 'D'])

    expect(target.is()).to.eql(['A', 'D'])
    source.pipeAll(target)
    // TODO assert the number of pipes
    source.set(['B', 'C'])

    expect(target.is()).to.eql(['C', 'B'])
  })

  describe('queue handling', function() {
    it("target machine's queue", function() {
      let source = machine<ABCD>(['A', 'B', 'C', 'D'])
      let target = machine<ABCD>(['A', 'B', 'C', 'D'])

      source.pipe('B', target, null)
      source['A_enter'] = function() {
        source.add('B')
        source.add('C')
      }
      mock_states(source, ['A', 'B', 'C', 'D'])
      mock_states(target, ['A', 'B', 'C', 'D'])
      source.add('A')

      assert_order([
        source['A_enter'],
        source['B_enter'],
        target['B_enter'],
        source['C_enter']
      ])
    })

    it('local queue', function() {
      let source = machine<ABCD>(['A', 'B', 'C', 'D'])
      let target = machine<ABCD>(['A', 'B', 'C', 'D'])

      source.pipe('B', target, null, PipeFlags.LOCAL_QUEUE)
      source['A_enter'] = function() {
        source.add('B')
        source.add('C')
      }
      mock_states(source, ['A', 'B', 'C', 'D'])
      mock_states(target, ['A', 'B', 'C', 'D'])
      source.add('A')

      assert_order([
        source['A_enter'],
        source['B_enter'],
        source['C_enter'],
        target['B_enter']
      ])
    })
  })

  describe('can be removed', function() {
    let source: AsyncMachine<ABCD, IBind, IEmit>
    let target: AsyncMachine<ABCD, IBind, IEmit>

    beforeEach(function() {
      source = machine(['A', 'B', 'C', 'D'])
      target = machine(['A', 'B', 'C', 'D'])
    })

    it('for single state', function() {
      source.pipe('A', target)
      source.pipeRemove('A')
      expect(source.piped.A).to.eql(undefined)
    })

    it('for a whole target machine', function() {
      source.pipeAll(target)
      source.pipeRemove(null, target)
      expect(Object.keys(source.piped)).to.eql([])
    })

    it('for flags', function() {
      source.pipe('A', target, null, PipeFlags.INVERT)
      source.pipeRemove('A', null, PipeFlags.INVERT)
      expect(source.piped.A).to.eql(undefined)
    })

    it('for all the states', function() {
      source.pipeAll(target)
      source.pipeRemove()
      expect(Object.keys(source.piped)).to.eql([])
    })
  })
})
