var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var multistatemachine = require('../src/multistatemachine')
var chai = require('chai')
var expect = chai.expect;
var FooMachine = (function (_super) {
    __extends(FooMachine, _super);
    function FooMachine() {
        _super.apply(this, arguments);

        this.state_A = {
        };
        this.state_B = {
        };
    }
    FooMachine.prototype.B_enter = function () {
    };
    FooMachine.prototype.A_exit = function () {
    };
    FooMachine.prototype.A_B = function () {
    };
    FooMachine.prototype.Any_B = function () {
    };
    FooMachine.prototype.B_Any = function () {
    };
    return FooMachine;
})(multistatemachine.MultiStateMachine);
describe('MutliStateMachine', function () {
    describe("basics", function () {
        var machine;
        beforeEach(function () {
            machine = new FooMachine('A');
        });
        it('should accept the starting state option', function () {
            expect(machine.state()).to.equal([
                'A'
            ]);
        });
        it('should accept the autostart option');
        it('should return the current state');
        it('should return a new state after a change');
    });
    describe("transitions", function () {
        it('should not trigger the non existing transitions');
        describe('single to single state transition', function () {
            it('should trigger the state exit transition');
            it('should trigger the transition to the new state');
            it('should trigger the transition to "any" state');
            it('should trigger the enter transition');
        });
        describe('single to multi state transition', function () {
            it('should trigger the state exit transition');
            it('should trigger the transition to the new state');
            it('should trigger the transition to "any" state');
            it('should trigger the enter transition');
        });
        describe('multi to single state transition', function () {
            it('should trigger the state exit transition');
            it('should trigger the transition to the new state');
            it('should trigger the transition to "any" state');
            it('should trigger the enter transition');
        });
        describe('multi to multi state transition', function () {
            it('should trigger the state exit transition');
            it('should trigger the transition to the new state');
            it('should trigger the transition to "any" state');
            it('should trigger the enter transition');
        });
    });
});

