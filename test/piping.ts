import AsyncMachine, {
    factory,
    PipeFlags
} from '../src/asyncmachine';
import {
    BaseStates,
    IEmit,
    IBind
} from '../src/types'
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';


let { expect } = chai;
chai.use(sinonChai);

type ABCD = 'A' | 'B' | 'C' | 'D'
type XYZ = 'X' | 'Y' | 'Z'

describe('piping', function () {

    it('should forward a specific state', function () {
        let source = factory<ABCD>(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory<ABCD>(['A', 'B', 'C', 'D']);

        source.pipe('A', target);
        source.pipe('B', target);

        expect(source.piped['A']).to.have.length(2);
        expect(source.piped['B']).to.have.length(2);
        expect(target.is()).to.be.eql(['A']);
        source.set('B');
        expect(target.is()).to.eql(['B']);
    })

    it('should forward a specific state as a different one', function () {
        let source = factory<ABCD>(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory<XYZ>(['X', 'Y', 'Z']);

        source.pipe('B', target, 'X');
        source.set('B');

        expect(target.is()).to.eql(['X']);
    })

    it('should invert a specific state as a different one', function () {
        let source = factory<ABCD>(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory<XYZ>(['X', 'Y', 'Z']);

        source.pipe('A', target, 'X', PipeFlags.INVERT);
        source.drop('A');

        expect(target.is()).to.eql(['X']);
    })

    it('should forward a whole machine', function () {
        let source = factory<ABCD>(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory<ABCD>(['A', 'B', 'C', 'D']);
        target.set(['A', 'D']);

        expect(target.is()).to.eql(['A', 'D']);
        source.pipeAll(target);
        // TODO assert the number of pipes
        source.set(['B', 'C']);

        expect(target.is()).to.eql(['C', 'B']);
    })

    it('support the local queue'); // TODO

    describe('can be removed', function () {
        let source: AsyncMachine<ABCD | BaseStates, IBind, IEmit>
        let target: AsyncMachine<ABCD | BaseStates, IBind, IEmit>

        beforeEach(function () {
            source = factory(['A', 'B', 'C', 'D']);
            target = factory(['A', 'B', 'C', 'D']);
        });

        it('for single state', function () {

            source.pipe('A', target);
            source.pipeRemove('A');
            expect(source.piped.A).to.eql(undefined);
        })

        it('for a whole target machine', function () {

            source.pipeAll(target);
            source.pipeRemove(null, target);
            expect(Object.keys(source.piped)).to.eql([]);
        })

        it('for flags', function () {

            source.pipe('A', target, null, PipeFlags.INVERT);
            source.pipeRemove('A', null, PipeFlags.INVERT);
            expect(source.piped.A).to.eql(undefined);
        })

        it('for all the states', function () {

            source.pipeAll(target);
            source.pipeRemove();
            expect(Object.keys(source.piped)).to.eql([]);
        })
    })
})
