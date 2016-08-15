import AsyncMachine from './asyncmachine'


// TODO enum
export var STATE_CHANGE = {
    DROP: 0,
    ADD: 1,
    SET: 2
};

export enum STATE_CHANGE_LABELS {
    Drop,
    Add,
    Set
};

/**
 * Queue enum defining param positions in queue's entries.
 * TODO enum
 */
export var QUEUE = {
    STATE_CHANGE: 0,
    STATES: 1,
    PARAMS: 2,
    AUTO: 3,
    TARGET: 4
};

export interface IQueueRow {
    0: number;
    1: string[];
    2: any[];
    3?: boolean;
    4?: AsyncMachine;
}

export class Deferred {
    promise: Promise<any>;

    resolve: (...params: any[]) => void;

    reject: (err?) => void;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

export interface IState {
    // TODO change to 'after'
	depends?: string[];
    // TODO change to 'add'
	implies?: string[];
    // TODO change to 'drop'
	blocks?: string[];
    // TODO change to 'require'
	requires?: string[];
	auto?: boolean;
	multi?: boolean;
}

// export interface ITransitionHandler {
// 	(states: string[], ...params: any[]): boolean;
// }

export interface IPreparedTransitions {
    states: string[];
    before: string[];
    self: any[];
    enters: any[];
    exits: any[];
    accepted: boolean;
    auto: boolean;
}

// TODO merge with the enum
export type TStateAction = 'add' | 'drop' | 'set'
export type TStateMethod = 'enter' | 'exit' | 'state' | 'end'

export interface IPipeNegotiationBindings {
    enter: TStateAction,
    exit: TStateAction
}

export interface IPipeStateBindings {
    state: TStateAction,
    end: TStateAction
}

export type TPipeBindings = IPipeStateBindings | IPipeNegotiationBindings

export interface IPipeStateTarget {
    state: string,
    machine: AsyncMachine,
    event_type: TStateMethod,
    listener: Function
}

/**
 * By default piped are "_state" and "_end" methods, not the negotiation ones.
 * Use the PipeFlags.NEGOTIATION flag to pipe "_enter" and "_exit" methods, and
 * thus, to participate in the state negotiation. This mode DOES NOT guarantee, that
 * the state was successfuly negotiated in the source machine.
 * 
 * To invert the state, use the PipeFlags.INVERT flag.
 * 
 * To append the transition to the local queue (instead of the target machine's one),
 * use the PipeFlags.LOCAL_QUEUE. This will alter the transition order.
 */
export enum PipeFlags {
    NEGOTIATION = 0,
    INVERT = 1 << 0,
    LOCAL_QUEUE = 1 << 1
}

export class TransitionException extends Error {
    constructor(
            public err: Error,
            public transition: string) {
        super()
    }
}
