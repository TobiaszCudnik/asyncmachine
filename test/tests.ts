/// <reference path="../typings/index.d.ts" />

import AsyncMachine, {
	machine,
	StateRelations
} from '../src/asyncmachine';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from "sinon-chai";

import {
	FooMachine, 
	EventMachine, 
	Sub, 
	SubCrossBlockedByImplied,
	CrossBlocked,
	SubClassRegisterAll,
	mock_states,
	assert_order
} from './utils';


let { expect } = chai;
chai.use(sinonChai);

describe("asyncmachine", function () {

	beforeEach(function () {
		this.machine = new FooMachine();
		this.machine.set('A');
	});

	it('should allow to check if single state is active', function () {
		expect(this.machine.is('A')).to.be.ok;
		expect(this.machine.is(['A'])).to.be.ok;
	});

	it('should allow to check if multiple states are active', function () {
		this.machine.add('B');
		expect(this.machine.is(['A', 'B'])).to.be.ok;
		expect(this.machine.every('A', 'B')).to.be.ok;
	});


	it("should expose all available states", function () {
		expect(this.machine.states_all).to.eql(['Exception', 'A', 'B', 'C', 'D']);
	});


	it("should allow to set the state", function () {
		expect(this.machine.set("B")).to.eql(true);
		expect(this.machine.is()).to.eql(["B"]);
	});


	it("should allow to add a new state", function () {
		expect(this.machine.add("B")).to.eql(true);
		expect(this.machine.is()).to.eql(["B", "A"]);
	});


	it("should allow to drop a state", function () {
		this.machine.set(["B", "C"]);
		expect(this.machine.drop('C')).to.eql(true);
		expect(this.machine.is()).to.eql(["B"]);
	});

	it("should properly register all the states", function() {
		let machine = new AsyncMachine(null, false)
		machine['A'] = {}
		machine['B'] = {}

		machine.registerAll()

		expect(machine.states_all).to.eql(['Exception', 'A', 'B'])
	})

	it("should properly register all the states from a sub class", function() {
		let machine = new SubClassRegisterAll()
		expect(machine.states_all).to.eql(['Exception', 'A'])
	})


	it("should throw when setting an unknown state", function () {
		let { machine } = this;
		let func = () => {
			return machine.set("unknown");
		};
		expect(func).to.throw();
	});


	it('should allow to define a new state', function () {
		let machine = <any>machine(['A'])
		machine.A = {};
		machine.register('A');
		machine.add('A');
		expect(machine.is()).eql(['A']);
	});


	it('should allow to get relations of a state', function () {
		let machine = machine<'A'|'B'>({
			A: {
				add: ['B'],
				auto: true
			},
			B: {}
		})
		expect(machine.getRelationsOf('A')).eql([StateRelations.ADD]);
	});


	it('should allow to get relations between 2 states', function () {
		let machine = <any>machine({
			A: {
				add: ['B'],
				require: ['C'],
				auto: true
			},
			B: {},
			C: {}
		})
		expect(machine.getRelationsOf('A', 'B')).eql([StateRelations.ADD]);
	});

	describe("when single to single state transition", function () {
		beforeEach(function () {
			this.machine = new FooMachine('A');
			// mock
			mock_states(this.machine, ['A', 'B']);
			// exec
			this.machine.set('B');
		});

		it("should trigger the state to state transition", function () {
			expect(this.machine.A_B.calledOnce).to.be.ok;
		});

		it("should trigger the state exit transition", function () {
			expect(this.machine.A_exit.calledOnce).to.be.ok;
		});

		it("should trigger the transition to the new state", function () {
			expect(this.machine.B_enter.calledOnce).to.be.ok;
		});

		it("should trigger the transition to \"Any\" state", function () {
			expect(this.machine.A_any.calledOnce).to.be.ok;
		});

		it("should trigger the transition from \"Any\" state", function () {
			expect(this.machine.any_B.calledOnce).to.be.ok;
		});

		it('should set the correct state', function () {
			expect(this.machine.is()).to.eql(['B']);
		});

		it("should remain the correct transition order", function () {
			let order = [
				this.machine.A_exit,
				this.machine.A_B,
				this.machine.A_any,
				this.machine.any_B,
				this.machine.B_enter
			];
			assert_order(order);
		});
	});

	describe("when single to multi state transition", function () {
		beforeEach(function () {
			this.machine = new FooMachine('A');
			// mock
			mock_states(this.machine, ['A', 'B', 'C']);
			// exec
			this.machine.set(['B', 'C']);
		});

		it("should trigger the state to state transitions", function () {
			expect(this.machine.A_B.calledOnce).to.be.ok;
			expect(this.machine.A_C.calledOnce).to.be.ok;
		});

		it("should trigger the state exit transition", function () {
			expect(this.machine.A_exit.calledOnce).to.be.ok;
		});

		it("should trigger the transition to new states", function () {
			expect(this.machine.B_enter.calledOnce).to.be.ok;
			expect(this.machine.C_enter.calledOnce).to.be.ok;
		});

		it("should trigger the transition to \"Any\" state", function () {
			expect(this.machine.A_any.calledOnce).to.be.ok;
		});

		it("should trigger the transition from \"Any\" state", function () {
			expect(this.machine.any_B.calledOnce).to.be.ok;
			expect(this.machine.any_C.calledOnce).to.be.ok;
		});

		it("should trigger the states' handlers", function () {
			expect(this.machine.B_state.calledOnce).to.be.ok;
			expect(this.machine.C_state.calledOnce).to.be.ok;
		});

		it('should set the correct state', function () {
			expect(this.machine.is()).to.eql(['B', 'C']);
		});

		it("should remain the correct order", function () {
			let order = [
				this.machine.A_exit,
				this.machine.A_B,
				this.machine.A_C,
				this.machine.A_any,
				this.machine.any_B,
				this.machine.B_enter,
				this.machine.any_C,
				this.machine.C_enter,
				this.machine.B_state,
				this.machine.C_state
			];
			assert_order(order);
		});
	});

	describe("when multi to single state transition", function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A', 'B']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C']);
			// exec
			this.machine.set(['C']);
		});

		it("should trigger the state to state transitions", function () {
			expect(this.machine.B_C.calledOnce).to.be.ok;
			expect(this.machine.A_C.calledOnce).to.be.ok;
		});

		it("should trigger the state exit transition", function () {
			expect(this.machine.A_exit.calledOnce).to.be.ok;
			expect(this.machine.B_exit.calledOnce).to.be.ok;
		});

		it("should trigger the transition to the new state", function () {
			expect(this.machine.C_enter.calledOnce).to.be.ok;
		});

		it("should trigger the transition to \"Any\" state", function () {
			expect(this.machine.A_any.calledOnce).to.be.ok;
			expect(this.machine.B_any.calledOnce).to.be.ok;
		});

		it("should trigger the transition from \"Any\" state", function () {
			expect(this.machine.any_C.calledOnce).to.be.ok;
		});

		it('should set the correct state', function () {
			expect(this.machine.is()).to.eql(['C']);
		});

		it("should remain the correct transition order", function () {
			let order = [
				this.machine.A_exit,
				this.machine.A_C,
				this.machine.A_any,
				this.machine.B_exit,
				this.machine.B_C,
				this.machine.B_any,
				this.machine.any_C,
				this.machine.C_enter
			];
			assert_order(order);
		});
	});

	describe("when multi to multi state transition", function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A', 'B']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			// exec
			this.machine.set(['D', 'C']);
		});

		it("should trigger the state to state transitions", function () {
			expect(this.machine.A_C.calledOnce).to.be.ok;
			expect(this.machine.A_D.calledOnce).to.be.ok;
			expect(this.machine.B_C.calledOnce).to.be.ok;
			expect(this.machine.B_D.calledOnce).to.be.ok;
		});

		it("should trigger the state exit transition", function () {
			expect(this.machine.A_exit.calledOnce).to.be.ok;
			expect(this.machine.B_exit.calledOnce).to.be.ok;
		});

		it("should trigger the transition to the new state", function () {
			expect(this.machine.C_enter.calledOnce).to.be.ok;
			expect(this.machine.D_enter.calledOnce).to.be.ok;
		});

		it("should trigger the transition to \"Any\" state", function () {
			expect(this.machine.A_any.calledOnce).to.be.ok;
			expect(this.machine.B_any.calledOnce).to.be.ok;
		});

		it("should trigger the transition from \"Any\" state", function () {
			expect(this.machine.any_C.calledOnce).to.be.ok;
			expect(this.machine.any_D.calledOnce).to.be.ok;
		});

		it('should set the correct state', function () {
			expect(this.machine.is()).to.eql(['D', 'C']);
		});

		it("should remain the correct transition order", function () {
			let order = [
				this.machine.A_exit,
				this.machine.A_D,
				this.machine.A_C,
				this.machine.A_any,
				this.machine.B_exit,
				this.machine.B_D,
				this.machine.B_C,
				this.machine.B_any,
				this.machine.any_D,
				this.machine.D_enter,
				this.machine.any_C,
				this.machine.C_enter
			];
			assert_order(order);
		});
	});

	describe("when transitioning to an active state", function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A', 'B']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			// exec
			this.machine.set(['A']);
		});

		it('shouldn\'t trigger transition methods', function () {
			expect(this.machine.A_exit.called).not.to.be.ok;
			expect(this.machine.A_any.called).not.to.be.ok;
			expect(this.machine.any_A.called).not.to.be.ok;
		});


		it('should remain in the requested state', function () {
			expect(this.machine.is()).to.eql(['A']);
		});
	});

	describe('when order is defined by the depends attr', function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A', 'B']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			this.machine.C.after = ['D'];
			this.machine.A.after = ['B'];
			// exec
			this.machine.set(['C', 'D']);
		});
		after(function () {
			delete this.machine.C.depends;
			delete this.machine.A.depends;
		});

		describe('when entering', function() {

			it('should handle dependand states first', function () {
				let order = [
					this.machine.A_D,
					this.machine.A_C,
					this.machine.any_D,
					this.machine.D_enter,
					this.machine.any_C,
					this.machine.C_enter
				];
				assert_order(order);
			})
		})

		describe('when exiting', function() {

			it('should handle dependand states last', function () {
				let order = [
					this.machine.B_exit,
					this.machine.B_D,
					this.machine.B_C,
					this.machine.B_any,
					this.machine.A_exit,
					this.machine.A_D,
					this.machine.A_C,
					this.machine.A_any
				];
				assert_order(order);
			})
		})
	});

	describe('when one state blocks another', function () {
		beforeEach(function () {
			this.log = [];
			this.machine = new FooMachine(['A', 'B']);
			this.machine
				.id('')
				.logLevel(3)
				.logHandler(this.log.push.bind(this.log));
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			this.machine.C = { drop: ['D'] };
			this.machine.set('D');
		});

		describe('and they are set simultaneously', function () {
			beforeEach(function () {
				this.ret = this.machine.set(['C', 'D']);
			});

			it('should cancel the transition', function () {
				expect(this.machine.is()).to.eql(['D']);
			});


			it('should return false', function () {
				expect(this.ret).to.eql(false);
			});


			it('should explain the reason in the log', function () {
				expect(this.log).to.contain('[drop] D by C');
			});

			afterEach(function () {
				delete this.ret;
			});
		});

		describe('and blocking one is added', function() {

			it('should unset the blocked one', function () {
				this.machine.add(['C']);
				expect(this.machine.is()).to.eql(['C']);
			})
		})

		describe('and cross blocking one is added', function () {
			beforeEach(function () {
				this.machine.D = { drop: ['C'] };
			});
			after(function () {
				this.machine.D = {};
			});

			describe('using set', function () {

				it('should unset the old one', function () {
					this.machine.set('C');
					expect(this.machine.is()).to.eql(['C']);
				});


				it('should work in both ways', function () {
					this.machine.set('C');
					expect(this.machine.is()).to.eql(['C']);
					this.machine.set('D');
					expect(this.machine.is()).to.eql(['D']);
				});
			});

			describe('using add', function () {

				it('should unset the old one', function () {
					this.machine.add('C');
					expect(this.machine.is()).to.eql(['C']);
				});


				it('should work in both ways', function () {
					this.machine.add('C');
					expect(this.machine.is()).to.eql(['C']);
					this.machine.add('D');
					expect(this.machine.is()).to.eql(['D']);
				});
			});
		});
	});

	describe('when state is implied', function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			this.machine.C = { add: ['D'] };
			this.machine.A = { drop: ['D'] };
			// exec
			this.machine.set(['C']);
		});

		it('should be activated', function () {
			expect(this.machine.is()).to.eql(['C', 'D']);
		});


		it('should be skipped if blocked at the same time', function () {
			this.machine.set(['A', 'C']);
			expect(this.machine.is()).to.eql(['A', 'C']);
		});
	});
	//expect( fn ).to.throw

	describe('when state requires another one', function () {
		beforeEach(function () {
			this.machine = new FooMachine(['A']);
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
			this.machine.C = { require: ['D'] };
		});
		after(function () {
			this.machine.C = {};
		});

		it('should be set when required state is active', function () {
			this.machine.set(['C', 'D']);
			expect(this.machine.is()).to.eql(['C', 'D']);
		});

		describe('when required state isn\'t active', function () {

			beforeEach(function () {
				this.log = [];
				this.machine
					.id('')
					.logLevel(3)
					.logHandler(this.log.push.bind(this.log));
				this.machine.set(['C', 'A']);
			});

			afterEach(function () {
				delete this.log;
			});

			it('should\'t be set', function () {
				expect(this.machine.is()).to.eql(['A']);
			});


			it('should explain the reason in the log', function () {
				let msg = "[rejected] C(-D)";
				expect(this.log).to.contain(msg);
			});
		});
	});

	describe('when state is changed', function () {
		beforeEach(function () {
			this.machine = new FooMachine('A');
			// mock
			mock_states(this.machine, ['A', 'B', 'C', 'D']);
		});

		describe('during another state change', function () {

			it('should be scheduled synchronously', function () {
				this.machine.B_enter = function (states) {
					this.add('C');
				};
				this.machine.C_enter = sinon.spy();
				this.machine.A_exit = sinon.spy();
				this.machine.set('B');
				expect(this.machine.C_enter.calledOnce).to.be.ok;
				expect(this.machine.A_exit.calledOnce).to.be.ok;
				expect(this.machine.is()).to.eql(['C', 'B']);
			});


			it('should be checkable');
		});
		// TODO use #duringTransition

		describe('and transition is canceled', function () {
			beforeEach(function () {
				this.machine.D_enter = () => false;
				this.log = [];
				this.machine
					.id('')
					.logLevel(3)
					.logHandler(this.log.push.bind(this.log));
			});

			describe('when setting a new state', function () {
				beforeEach(function () {
					this.ret = this.machine.set('D');
				});

				it('should return false', function () {
					expect(this.machine.set('D')).not.to.be.ok;
				});


				it('should not change the previous state', function () {
					expect(this.machine.is()).to.eql(['A']);
				});


				it('should explain the reason in the log', function () {
					expect(this.log).to.contain('[cancelled] D by the method D_enter');
				});


				it('should not change the auto states');
			});

			// TODO make this and the previous a main contexts
			describe('when adding an additional state', function () {
				beforeEach(function () { this.ret = this.machine.add('D'); });

				it('should return false', function () {
					expect(this.ret).not.to.be.ok;
				});


				it('should not change the previous state', function () {
					expect(this.machine.is()).to.eql(['A']);
				});


				it('should not change the auto states');
			});

			describe('when droping a current state', function () {
				it('should return false');

				it('should not change the previous state');

				it('should explain the reason in the log');

				it('should not change the auto states');
			});
		});

		describe('and transition is successful', function () {

			it('should return true', function () {
				expect(this.machine.set('D')).to.be.ok;
			});


			it('should set the auto states');
		});

		it('should provide previous state information', function (done) {
			this.machine.D_enter = function () {
				expect(this.is()).to.eql(['A']);
				done();
			};
			this.machine.set('D');
		});

		it('should provide target state information', function (done) {
			this.machine.D_enter = function () {
				expect(this.to()).to.eql(['D']);
				done();
			};
			this.machine.set('D');
		});

		describe('with arguments', function () {
			beforeEach(function () {
				this.machine.D = {
					add: ['B'],
					drop: ['A']
				};
			});
			after(function () {
				this.machine.D = {};
			});

			describe('and synchronous', function () {
				beforeEach(function () {
					this.machine.set(['A', 'C']);
					this.machine.set('D', 'foo', 2);
					this.machine.set('D', 'foo', 2);
					this.machine.drop('D', 'foo', 2);
				});

				describe('and is explicit', function () {

					it('should forward arguments to exit methods', function () {
						expect(this.machine.D_exit.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to enter methods', function () {
						expect(this.machine.D_enter.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to self transition methods', function () {
						expect(this.machine.D_D.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to transition methods', function () {
						expect(this.machine.C_D.calledWith('foo', 2)).to.be.ok;
					});
				});

				describe('and is non-explicit', function () {

					it('should not forward arguments to exit methods', function () {
						expect(this.machine.A_exit.calledWith()).to.be.ok;
					});


					it('should not forward arguments to enter methods', function () {
						expect(this.machine.B_enter.calledWith()).to.be.ok;
					});


					it('should not forward arguments to transition methods', function () {
						expect(this.machine.A_B.calledWith()).to.be.ok;
					});
				});
			});

			describe('and delayed', function () {
				beforeEach(function () {
					this.machine.setByListener(['A', 'C'], 'foo')();
					this.machine.setByListener('D', 'foo', 2)();
					this.machine.setByListener('D', 'foo', 2)();
					this.machine.dropByListener('D', 'foo', 2)();
				});

				describe('and is explicit', function () {

					it('should forward arguments to exit methods', function () {
						expect(this.machine.D_exit.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to enter methods', function () {
						expect(this.machine.D_enter.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to self transition methods', function () {
						expect(this.machine.D_D.calledWith('foo', 2)).to.be.ok;
					});


					it('should forward arguments to transition methods', function () {
						expect(this.machine.C_D.calledWith('foo', 2)).to.be.ok;
					});
				});

				describe('and is non-explicit', function () {

					it('should not forward arguments to exit methods', function () {
						expect(this.machine.A_exit.calledWith()).to.be.ok;
					});


					it('should not forward arguments to enter methods', function () {
						expect(this.machine.B_enter.calledWith()).to.be.ok;
					});


					it('should not forward arguments to transition methods', function () {
						expect(this.machine.A_B.calledWith()).to.be.ok;
					});
				});
			});
		});

		describe('and delayed', function () {
			beforeEach(function (done) {
				this.callback = this.machine.setByCallback('D');
				this.promise = this.machine.last_promise;
				// TODO without some action after beforeEach, we'd hit a timeout
				done();
			});

			afterEach(function () {
				delete this.promise;
			});

			it('should return a promise', function () {
				expect(this.promise instanceof Promise).to.be.ok;
			});


			it('should execute the change', function (done) {
				// call without an error
				this.callback(null);
				this.promise.then(() => {
					expect(this.machine.any_D.calledOnce).to.be.ok;
					expect(this.machine.D_enter.calledOnce).to.be.ok;
					done();
				});
			});

			it('should expose a ref to the last promise', function () {
				expect(this.machine.last_promise).to.equal(this.promise);
			});


			it('should be called with params passed to the delayed function', function (done) {
				this.machine.D_enter = function (...params) {
					expect(this.to()).to.eql(['D'])
					expect(params).to.be.eql(['foo', 2]);
					done();
				};
				this.callback(null, 'foo', 2);
			});

			describe('and then cancelled', function() {

				it('should not execute the change', function (done) {
					this.machine.Exception_state = function () { };
					this.promise.catch(() => {
						expect(this.machine.any_D).not.have.been.called;
						expect(this.machine.D_enter).not.have.been.called;
						done();
					});
					this.callback(new Error());
				})
			});
		});

		describe('and active state is also the target one', function () {
			it('should trigger self transition at the very beginning', function () {
				this.machine.set(['A', 'B']);
				let order = [
					this.machine.A_A,
					this.machine.any_B,
					this.machine.B_enter
				];
				assert_order(order);
			});

			it('should be executed only for explicitly called states', function () {
				this.machine.add('B');
				this.machine.add('A');
				expect(this.machine.A_A.calledOnce).to.be.ok;
				expect(this.machine.B_B.callCount).to.eql(0);
			});


			it('should be cancellable', function () {
				this.machine.A_A = sinon.stub().returns(false);
				this.machine.set(['A', 'B']);
				expect(this.machine.A_A.calledOnce).to.be.ok;
				expect(this.machine.any_B.called).not.to.be.ok;
			});

			after(function () {
				delete this.machine.A_A;
			});
		});

		// TODO move to events
		describe('should trigger events', function () {

			beforeEach(function () {

				this.A_A = sinon.spy();
				this.B_enter = sinon.spy();
				this.C_exit = sinon.spy();
				this.change = sinon.spy();
				this.cancelTransition = sinon.spy();

				this.machine = new FooMachine('A');
				// mock
				mock_states(this.machine, ['A', 'B', 'C', 'D']);
				this.machine.set(['A', 'C']);
				this.machine.on('A_A', this.A_A);
				this.machine.on('B_enter', this.B_enter);
				this.machine.on('C_exit', this.C_exit);
				this.machine.on('D_exit', () => false
				);
				// emitter event
				this.machine.on('change', this.change);
				this.machine.on('cancelled', this.cancelTransition);
				this.machine.set(['A', 'B']);
				this.machine.add(['C']);
				this.machine.add(['D']);
			});

			afterEach(function () {
				delete this.C_exit;
				delete this.A_A;
				delete this.B_enter;
				delete this.add;
				delete this.set;
				delete this.cancelTransition;
			});

			it('for self transitions', function () {
				expect(this.A_A.called).to.be.ok;
			});

			it('for enter transitions', function () {
				expect(this.B_enter.called).to.be.ok;
			});

			it('for exit transitions', function () {
				expect(this.C_exit.called).to.be.ok;
			});

			it('which can cancel the transition', function () {
				expect(this.machine.D_any.called).not.to.be.ok;
			});

			it('for changing states', function () {
				expect(this.change.called).to.be.ok;
			});

			it('for cancelling the transition', function () {
				this.machine.drop('D');
				expect(this.cancelTransition.called).to.be.ok;
			});
		});
	});

	describe('Events', function () {

		beforeEach(function () {
			this.machine = new EventMachine('A');
		});

		describe('should support states', function () {

			it('by triggering the *_state bindings immediately', function () {
				let l = [];
				// init spies
				let iterable = [0, 1, 2];
				for (let j = 0; j < iterable.length; j++) { var i = iterable[j]; l[i] = sinon.stub(); }
				var i = 0;
				this.machine.set('B');
				this.machine.on('A_state', l[i++]);
				this.machine.on('B_state', l[i++]);
				i = 0;
				expect(l[i++].called).not.to.be.ok;
				expect(l[i++].calledOnce).to.be.ok;
			});


			it('shouldn\'t duplicate events');
		});

		describe('clock', function () {
			beforeEach(function () {
				this.machine = new FooMachine();
			});

			it('should tick when setting a new state', function () {
				this.machine.set('A');
				(expect(this.machine.clock('A'))).to.be.eql(1);
			});

			it('should tick when setting many new states', function () {
				this.machine.set(['A', 'B']);
				(expect(this.machine.clock('A'))).to.be.eql(1);
				(expect(this.machine.clock('B'))).to.be.eql(1);
			});

			it('shouldn\'t tick when setting an already set state', function () {
				this.machine.set('A');
				this.machine.set('A');
				(expect(this.machine.clock('A'))).to.be.eql(1);
			});

			it('should tick for Multi states when setting an already set state', function () {
				this.machine.A.multi = true;
				this.machine.set('A');
				this.machine.set('A');
				(expect(this.machine.clock('A'))).to.be.eql(2);
			});
		});

		describe('proto child', function () {
			beforeEach(function () {
				this.machine = new FooMachine();
				this.child = this.machine.createChild();
			});

			after(function() {
				delete this.child
			})

			it('should inherit all the instance properties', function () {
				(expect(this.machine.A)).to.equal(this.child.A);
			});

			it('should have own active states and the clock', function () {
				this.child.add('B');
				(expect(this.machine.is())).to.not.eql(this.child.is());
			});
		});
	});


	describe('queue', function () { });
	describe('nested queue', function () { });

	describe('bugs', function () {
		// TODO use a constructor in Sub
		it('should trigger the enter state of a subclass', function () {
			let a_enter_spy = sinon.spy();
			let b_enter_spy = sinon.spy();
			let sub = new Sub('A', a_enter_spy, b_enter_spy);
			sub.set('B');
			expect(a_enter_spy.called).to.be.ok;
			expect(b_enter_spy.called).to.be.ok;
		});


		it('should drop states cross-blocked by implied states', function () {
      const state = {
        A: { drop: ['B'] },
        B: { drop: ['A'] },
        Z: { add: ['B'] } }
      const example = machine(state)
      example.add('Z')
			expect(example.is()).to.eql(['Z', 'B'])
		});


		it('implied block by one about to be dropped should be set', function () {
			const state = {
				Wet: { require: ['Water'] },
				Dry: { drop: ['Wet'] },
				Water: { add: ['Wet'], drop: ['Dry'] }
			}
			const example = machine(state)
			example.add('Dry')
			example.add('Water')
			expect(example.is()).to.eql(['Wet', 'Water'])
		});


		it('should pass args to transition methods');

		it('should drop states blocked by a new one if the one blocks it', function () {
			let sub = new CrossBlocked();
			expect(sub.is()).to.eql(['B']);
		});
	});

	describe('Promises', function () {
		it('can be resolved');
		it('can be rejected');
		it('can be chainable');
		describe('delayed methods', function() {
			it('should return correctly bound resolve method')
		});
	});
});
