import 'source-map-support/register';
import AsyncMachine, {
    factory,
    PipeFlags
} from '../src/asyncmachine';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';


let { expect } = chai;
chai.use(sinonChai);

describe('piping', function () {

    it('should forward a specific state', function () {
        let source = factory(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory(['A', 'B', 'C', 'D']);

        source.pipe('A', target);
        source.pipe('B', target);

        expect(source.piped['A']).to.have.length(2);
        expect(source.piped['B']).to.have.length(2);
        expect(target.is()).to.be.eql(['A']);
        source.set('B');
        expect(target.is()).to.eql(['B']);
    })

    it('should forward a specific state as a different one', function () {
        let source = factory(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory(['X', 'Y', 'Z']);

        source.pipe('B', target, 'X');
        source.set('B');

        expect(target.is()).to.eql(['X']);
    })

    it('should invert a specific state as a different one', function () {
        let source = factory(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory(['X', 'Y', 'Z']);

        source.pipe('A', target, 'X', PipeFlags.INVERT);
        source.drop('A');

        expect(target.is()).to.eql(['X']);
    })

    it('should forward a whole machine', function () {
        let source = factory(['A', 'B', 'C', 'D']);
        source.set('A');
        let target = factory(['A', 'B', 'C', 'D']);
        target.set(['A', 'D']);

        expect(target.is()).to.eql(['A', 'D']);
        source.pipeAll(target);
        // TODO assert the number of pipes
        source.set(['B', 'C']);

        expect(target.is()).to.eql(['C', 'B', 'D']);
    })

    it('support the local queue');

    describe('can be removed', function () {
        beforeEach(function () {
            this.source = factory(['A', 'B', 'C', 'D']);
            this.target = factory(['A', 'B', 'C', 'D']);
        });

        it('for single state', function () {

            this.source.pipe('A', this.target);
            this.source.pipeRemove('A');
            expect(this.source.piped.A).to.eql(undefined);
        })

        it('for a whole target machine', function () {

            this.source.pipeAll(this.target);
            this.source.pipeRemove(null, this.target);
            expect(Object.keys(this.source.piped)).to.eql([]);
        })

        it('for flags', function () {

            this.source.pipe('A', this.target, null, PipeFlags.INVERT);
            this.source.pipeRemove('A', null, PipeFlags.INVERT);
            expect(this.source.piped.A).to.eql(undefined);
        })

        it('for all the states', function () {

            this.source.pipeAll(this.target);
            this.source.pipeRemove();
            expect(Object.keys(this.source.piped)).to.eql([]);
        })
    })
})