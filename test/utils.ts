/**
 * TODO move all of these to factory calls.
 */
import AsyncMachine, {
    factory
} from '../src/asyncmachine';
import {
    IBind,
    IEmit
} from '../src/types';
import { IState } from '../src/types'
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as sinonChai from "sinon-chai";


let { expect } = chai;
chai.use(sinonChai);

type AB = 'A' | 'B'
type ABC = 'A' | 'B' | 'C'
type ABCD = 'A' | 'B' | 'C' | 'D'

type FooMachineState = IState<ABCD>
interface IFooMachineState<T extends string> extends IState<T | ABCD> {}

class FooMachineExt<States extends string>
        extends AsyncMachine<States | ABCD, IBind, IEmit> {
    A: FooMachineState = {};
    B: FooMachineState = {};
    C: FooMachineState = {};
    D: FooMachineState = {};

    constructor(initialState?) {
        super();

        this.register("A", "B", "C", "D");
        if (initialState) {
            this.set(initialState);
        }

        this.add('A')
    }
}

class FooMachine extends FooMachineExt<null> {}

class SubClassRegisterAll extends AsyncMachine<'A', IBind, IEmit> {
    A: IState<'A'> = {}

    constructor() {
        super()
        this.registerAll()
    }
}

class EventMachine extends FooMachineExt<'TestNamespace'> {

    TestNamespace: IFooMachineState<'TestNamespace'> = {}

    constructor(initial?, config?) {
        super();
        this.register("TestNamespace");
        if (initial) {
            this.set(initial);
        }
    }
}

class Sub extends AsyncMachine<AB, IBind, IEmit> {

    A: IState<AB> = {}
    B: IState<AB> = {}

    constructor(initial?, a_spy?, b_spy?) {
        super();

        this.register("A", "B");
        this.A_enter = a_spy;
        this.B_enter = b_spy;
        if (initial) {
            this.set(initial);
        }
    }

    A_enter() {

    }

    B_enter() {

    }
}

class SubCrossBlockedByImplied extends AsyncMachine<ABC, IBind, IEmit> {
    A: IState<ABC> = {
        drop: ["B"]
    };
    B: IState<ABC> = {
        drop: ["A"]
    };
    C: IState<ABC> = {
        add: ["B"]
    };
    constructor() {
        super();

        this.register("A", "B", "C");
        this.set("C");
    }
}

class CrossBlocked extends AsyncMachine<AB, IBind, IEmit> {

    A: IState<AB> = {
        drop: ["B"]
    }
    B: IState<AB> = {
        drop: ["A"]
    }

    constructor() {
        super();

        this.register("A", "B");
        this.set("A");
        this.set("B");
    }
}

function mock_states(instance, states) {
    for (let state of states) {
        // deeply clone all the state's attrs
        // proto = instance["#{state}"]
        // instance["#{state}"] = {}
        instance[`${state}_${state}`] = sinon.spy(instance[`${state}_${state}`])
        instance[`${state}_enter`] = sinon.spy(instance[`${state}_enter`])
        instance[`${state}_exit`] = sinon.spy(instance[`${state}_exit`])
        instance[`${state}_state`] = sinon.spy(instance[`${state}_state`])
        instance[`${state}_any`] = sinon.spy(instance[`${state}_any`])
        // TODO any -> Any
        instance[`any_${state}`] = sinon.spy(instance[`any_${state}`])
        for (let inner of states)
            instance[`${inner}_${state}`] = sinon.spy(instance[`${inner}_${state}`])
    }
}

function assert_order(order) {
    let m = null;
    let k = null;
    let iterable = order.slice(0, -1);
    for (k = 0; k < iterable.length; k++) {
        m = iterable[k];
        order[k] = m.calledBefore(order[k + 1]);
    }
    for (let check of order.slice(0, -1)) {
        expect(check).to.be.ok
    }
}


export {
    SubClassRegisterAll,
    FooMachine,
    EventMachine,
    Sub,
    SubCrossBlockedByImplied,
    CrossBlocked,
    mock_states,
    assert_order
}
