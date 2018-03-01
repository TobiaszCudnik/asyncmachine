import AsyncMachine, {
  machine
} from '../src/asyncmachine';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';


let { expect } = chai;
chai.use(sinonChai);

describe("Exceptions", function () {

  beforeEach(function () {
    this.foo = machine(['A']);
  })

  it('should be thrown on the next tick', function () {
    let setImmediate = sinon.stub(this.foo, 'setImmediate');
    this.foo.A_enter = function () { throw new Error(); };
    this.foo.add('A');
    expect(setImmediate.calledOnce).to.be.ok;
    expect(setImmediate.firstCall.args[0]).to.throw(Error);
  })

  it('should set the Exception state', function () {
    this.foo.A_enter = function () { throw new Error(); };
    this.foo.Exception_state = function () { };
    this.foo.add('A');
    expect(this.foo.is()).to.eql(['Exception']);
  })

  it('should pass all the params to the method', function (done) {
    let states = <any>machine(['A', 'B', 'C']);
    states.C_enter = function () { throw new Error(); };

    states.Exception_state = function (err, target_states, base_states, 
        exception_transition, async_target_states) {
      expect(target_states).to.eql(['B', 'C']);
      expect(base_states).to.eql(['A']);
      expect(exception_transition).to.eql('C_enter');
      expect(async_target_states).to.eql(undefined);
      done();
    };

    states.set(['A']);
    states.set(['B', 'C']);
  })

  it('should set accept completed transition');

  describe('should be caught', function () {

    it('from next-tick state changes', function (done) {
      this.foo.A_enter = function () { throw new Error(); };
      this.foo.Exception_state = () => done();
      this.foo.addNext('A');
    })

    it('from a callbacks error param', function (done) {
      let delayed = callback => setTimeout((callback.bind(null, new Error())), 0);
      delayed(this.foo.addByCallback('A'));
      this.foo.Exception_state = () => done();
    })

    it('from deferred changes', function (done) {
      this.foo.A_enter = function () { throw new Error(); };
      let delayed = callback => setTimeout(callback, 0);
      delayed(this.foo.addByListener('A'));
      this.foo.Exception_state = () => done();
    })

    describe('in promises', function () {

      it('returned by transitions', function (done) {
        this.foo.Exception_state = function (exception, target_states, base_states, exception_state) {
          expect(target_states).to.eql(['A']);
          expect(exception).to.be.instanceOf(Error);
          done();
        };
        this.foo.A_enter = () => new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error()))
        );
        this.foo.add('A');
      })

      it('returned by listeners', function (done) {
        this.foo.Exception_state = function (exception, target_states, base_states, exception_state) {
          expect(target_states).to.eql(['A']);
          expect(exception).to.be.instanceOf(Error);
          done();
        };
        this.foo.on('A_enter', new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error()))
        ));
        this.foo.add('A');
      })


      it('returned by the state binding "when()"');
      // TODO
    })
  })

  describe('complex scenario', function () {

    before(function () {
      let asyncMock = cb => setTimeout((cb.bind(null)), 0);

      this.foo = machine(['A', 'B', 'C']);
      this.bar = machine(['D']);
      this.bar.pipe('D', this.foo, 'A');
      this.foo.A_enter = function () { this.add('B'); };
      this.foo.B_state = function() {
        new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(this.add('C'));
          })
        })
      }
      this.foo.C_enter = function () {
        throw ({ fake: true })
      };
    })

    it('should be caught', function (done) {
      this.bar.addByListener('D')();
      this.foo.Exception_state = () => done();
    })
  })
})
