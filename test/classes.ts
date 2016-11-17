/**
 * TODO move all of these to factory calls.
 */
import AsyncMachine, {
    factory
} from '../src/asyncmachine';
import {
    BaseStates,
    IBind,
    IEmit
} from '../src/types-states';
import { IState } from '../src/types'


class FooMachineExt<States extends string>
        extends AsyncMachine<States | 'A' | 'B' | 'C' | 'D' | BaseStates, IBind, IEmit> {
    A: IState = {};
    B: IState = {};
    C: IState = {};
    D: IState = {};

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

class SubClassRegisterAll extends AsyncMachine<'A' | BaseStates, IBind, IEmit> {
    A = {}

    constructor() {
        super()
        this.registerAll()
    }
}

class EventMachine extends FooMachineExt<'TestNamespace'> {

    TestNamespace: IState = {}

    constructor(initial?, config?) {
        super();
        this.register("TestNamespace");
        if (initial) {
            this.set(initial);
        }
    }
}

class Sub extends AsyncMachine<'A' | 'B' | BaseStates, IBind, IEmit> {

    A: IState = {}
    B: IState = {}

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

class SubCrossBlockedByImplied extends AsyncMachine<'A' | 'B' | 'C' | BaseStates, IBind, IEmit> {
    A: IState = {
        drop: ["B"]
    };
    B: IState = {
        drop: ["A"]
    };
    C: IState = {
        add: ["B"]
    };
    constructor() {
        super();

        this.register("A", "B", "C");
        this.set("C");
    }
}

class CrossBlocked extends AsyncMachine<'A' | 'B' | BaseStates, IBind, IEmit> {

    A: IState = {
        drop: ["B"]
    }
    B: IState = {
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
