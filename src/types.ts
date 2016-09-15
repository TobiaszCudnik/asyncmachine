import AsyncMachine from './asyncmachine'


export enum StateChangeTypes {
	DROP,
	ADD,
	SET
}

/**
 * Queue enum defining param positions in queue's entries.
 */
export enum QueueRowFields {
	STATE_CHANGE_TYPE,
	STATES,
	PARAMS,
	AUTO,
	TARGET
}

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

export enum StateRelations {
	AFTER = <any>'after',
	ADD = <any>'add',
	REQUIRE = <any>'require',
	DROP = <any>'drop'
}

export enum TransitionStateRelations {
	AFTER,
	ADD,
	REQUIRE,
	DROP,
	TRANSITION
}

export interface IStateStruct {
	// machine ID
	0: string,
	// state name
	1: string
}

export interface ITransitionTouch {
	// target state
	0: IStateStruct,
	// source state
	1?: IStateStruct,
	// reason (empty means user input)
	2?: TransitionStateRelations,
	// did it cancel the transition?
	3?: boolean,
	// relations data (eg a transition method name)
	4?: any
}

export interface IState {
	// Decides about the order of activations (transitions)
	after?: string[];
	// When set, sets also the following states
	add?: string[];
	// When set, blocks activation (or deactivates) given states
	drop?: string[];
	// State will be rejected if any of those aren't set
	require?: string[];
	// When true, the state will be set automatically, if it's not blocked
	auto?: boolean;
	// Multi states always triggers the enter and state transitions, plus
	// the clock is always incremented
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

export interface IPipedStateTarget {
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

export class NonExistingStateError extends Error {}

export type TLogHandler = (msg: string, level?: number) => any
