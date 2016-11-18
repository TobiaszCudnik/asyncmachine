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


export {
    SubClassRegisterAll,
    FooMachine,
    EventMachine,
    Sub,
    SubCrossBlockedByImplied,
    CrossBlocked
}
