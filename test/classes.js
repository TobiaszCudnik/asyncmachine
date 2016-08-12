/**
 * Classes have been extracted as CoffeeScript cant extend ES6 classes.
 * TODO move all of these to factory calls.
 */

var asyncmachine = require('../build/asyncmachine.js')

class FooMachine extends asyncmachine.AsyncMachine {

    constructor(initialState, config) {
        super();
        
        this.A = {};
        this.B = {};
        this.C = {};
        this.D = {};
        
        this.register("A", "B", "C", "D");
        if (initialState) {
            this.set(initialState);
        }
    }
}

class EventMachine extends FooMachine {

    constructor(initial, config) {
        super();
        this.TestNamespace = {};
        this.register("TestNamespace");
        if (initial) {
            this.set(initial);
        }
    }
}

class Sub extends asyncmachine.AsyncMachine {

    constructor(initial, a_spy, b_spy) {
        super();
        
        this.A = {};
        this.B = {};

        this.register("A", "B");
        this.A_enter = a_spy;
        this.B_enter = b_spy;
        if (initial) {
            this.set(initial);
        }
    }
}

class SubCrossBlockedByImplied extends asyncmachine.AsyncMachine {

    constructor(config) {
        super();
        
        this.A = {
            blocks: ["B"]
        };

        this.B = {
            blocks: ["A"]
        };

        this.C = {
            implies: ["B"]
        };
        
        this.register("A", "B", "C");
        this.set("C");
    }
}

class CrossBlocked extends asyncmachine.AsyncMachine {

    constructor(config) {
        super();
        
        this.A = {
            blocks: ["B"]
        };

        this.B = {
            blocks: ["A"]
        };
        
        this.register("A", "B");
        this.set("A");
        this.set("B");
    }
}

module.exports = {
    FooMachine,
    EventMachine,
    Sub,
    SubCrossBlockedByImplied,
    CrossBlocked
}