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

describe('State binding', function () {

    it('should work for single states', function (done) {
        let states = factory(['A', 'B']);
        states.when('A').then(function (value) {
            expect(value).to.eql(undefined);
            done();
        });
        states.set('A', 1, 2, 3);
        states.set([]);
        // assert the double execution
        states.set(['A'], 1, 2, 3)
    })

    it('should work for multiple states', function (done) {
        let states = factory(['A', 'B'])
        states.when(['A', 'B']).then(function (value) {
            expect(value).to.eql(undefined);
            done();
        });
        states.set('A');
        states.set('B', 1, 2, 3);
        states.set([]);
        // assert the double execution
        states.set(['A', 'B'], 1, 2, 3)
    })

    describe('disposal', function () {
        it('should work with the abort function');
        it('should take place after execution')
    })
})