///<reference path="../headers/mocha.d.ts" />
///<reference path="../headers/expect.d.ts" />
///<reference path="../headers/chai.d.ts" />
///<reference path="../src/multistatemachine.d.ts" />

import multistatemachine = module('../src/multistatemachine')
import chai = module('chai')
var expect = chai.expect

class FooMachine extends multistatemachine.MultiStateMachine {
	constructor(state, config?) {
	    this.state_A = {};
	    this.state_B = {};
		super(state, config)
	}
    state_A;
    state_B;
    B_enter() {}
    A_exit() {}
    A_B() {}
    Any_B() {}
    B_Any() {}
}

describe('MultiStateMachine', () => {
	describe("basics", () => {
		var machine
		beforeEach( () => {
			machine = new FooMachine('A')
		})
		it('should accept the starting state option', () => {
			expect( machine.state() ).to.equal(['A'])
		})
		it('should accept the autostart option')
		it('should return the current state')
		it('should return a new state after a change')	
	})
	describe("transitions", () => {
		it('should not trigger the non existing transitions')
		describe('single to single state transition', () => {
			it('should trigger the state exit transition')
			it('should trigger the transition to the new state')
			it('should trigger the transition to "any" state')
			it('should trigger the enter transition')
		})
		describe('single to multi state transition', () => {
			it('should trigger the state exit transition')
			it('should trigger the transition to the new state')
			it('should trigger the transition to "any" state')
			it('should trigger the enter transition')
		})
		describe('multi to single state transition', () => {
			it('should trigger the state exit transition')
			it('should trigger the transition to the new state')
			it('should trigger the transition to "any" state')
			it('should trigger the enter transition')
		})
		describe('multi to multi state transition', () => {
			it('should trigger the state exit transition')
			it('should trigger the transition to the new state')
			it('should trigger the transition to "any" state')
			it('should trigger the enter transition')
		})
	})
})