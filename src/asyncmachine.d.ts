/// <reference path="../typings/commonjs.d.ts" />
/// <reference path="../typings/settimeout.d.ts" />
/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

// import promise = module ('es6-promise');
// import eventemitter = module ('eventemitter3-abortable');

export interface IState {
	depends?: string[];
	implies?: string[];
	blocks?: string[];
	requires?: string[];
	auto?: boolean;
}

export interface ITransitionHandler {
	(states: string[], ...params: any[]): boolean;
}

class Deferred {
	promise: Promise<any>;
	resolve: Function;
	reject: Function;
}

class AsyncMachine extends EventEmitter {
	public last_promise: Promise<any>;
	// TODO public type export
    public piped: {state: string, machine: AsyncMachine}[];
	private debug_: boolean;
	private states_all: string[];
	private states_active: string[];
	private debug_prefix: string;
	private debug_level: number;
	private internal_fields: string[];
	private target: AsyncMachine;
	private transition_events: any[];
	// TODO typeme
	private queue: Array<Array<any>>;
	private lock: boolean;
	private clock_: { [state: string]: number };
	// TODO merge with the TS source
	constructor(target?: Object, register_all?: boolean);
	public Exception_state(states: string[], err: Error, exception_states: string[], async_target_states?: string[]): void;
	public register(...states: string[]);
	public registerAll();
	public getRelations(from_state: string, to_state: string): string[];
	public get(state: string): IState;
	public state(name: string): boolean;
	public state(name: string[]): boolean;
	public state(): string[];
	public state(name?: any): any;
	public is(state: string): boolean;
	public is(state: string[]): boolean;
	public is(state: string, tick?: number): boolean;
	public is(): string[];
	public is(state?: any, tick?: any): any;
	public any(...states: string[]): boolean;
	public any(...states: string[][]): boolean;
	public any(...states: any[]): boolean;
	public every(...states: string[]): boolean;
	public hasStateChanged(states_before: string[]): boolean;
		
	public add(target: AsyncMachine, states: string[], ...params: any[]): boolean;
	public add(target: AsyncMachine, states: string, ...params: any[]): boolean;
	public add(target: string[], states?: any, ...params: any[]): boolean;
	public add(target: string, states?: any, ...params: any[]): boolean;
	public add(target: any, states?: any, ...params: any[]): boolean;
	public addByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
	public addByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
	public addByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
	public addByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public addByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public addByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
	public addByListener(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
	public addByListener(target: string[], states?: any, ...params: any[]): (...params) => void;
	public addByListener(target: string, states?: any, ...params: any[]): (...params) => void;
	public addByListener(target: any, states?: any, ...params: any[]): (...params) => void;
	public addNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
	public addNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
	public addNext(target: string, states: any, ...params: any[]): (...params) => void;
	public addNext(target: string[], states: any, ...params: any[]): (...params) => void;
	public addNext(target: any, states: any, ...params: any[]): (...params) => void;

	public drop(target: AsyncMachine, states: string[], ...params: any[]): boolean;
	public drop(target: AsyncMachine, states: string, ...params: any[]): boolean;
	public drop(target: string[], states?: any, ...params: any[]): boolean;
	public drop(target: string, states?: any, ...params: any[]): boolean;
	public drop(target: any, states?: any, ...params: any[]): boolean;
	public dropByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
	public dropByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
	public dropByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
	public dropByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
	public dropByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public dropNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
	public dropNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
	public dropNext(target: string, states: any, ...params: any[]): (...params) => void;
	public dropNext(target: string[], states: any, ...params: any[]): (...params) => void;
	public dropNext(target: any, states: any, ...params: any[]): (...params) => void;

	public set(target: AsyncMachine, states: string[], ...params: any[]): boolean;
	public set(target: AsyncMachine, states: string, ...params: any[]): boolean;
	public set(target: string[], states?: any, ...params: any[]): boolean;
	public set(target: string, states?: any, ...params: any[]): boolean;
	public set(target: any, states?: any, ...params: any[]): boolean;
	public setByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
	public setByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
	public setByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setByCallback(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params) => void;
	public setByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params) => void;
	public setByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setByListener(target: any, states?: any, ...params: any[]): (err?: any, ...params) => void;
	public setNext(target: AsyncMachine, states: string, ...params: any[]): (...params) => void;
	public setNext(target: AsyncMachine, states: string[], ...params: any[]): (...params) => void;
	public setNext(target: string, states: any, ...params: any[]): (...params) => void;
	public setNext(target: string[], states: any, ...params: any[]): (...params) => void;
	public setNext(target: any, states: any, ...params: any[]): (...params) => void;
		
	public pipe(state: string, machine?: AsyncMachine, target_state?: string, local_queue?: boolean);
	public pipe(state: string[], machine?: AsyncMachine, target_state?: string, local_queue?: boolean);
	public pipe(state: AsyncMachine, machine?: string, target_state?: boolean);
	public pipe(state: any, machine?: any, target_state?: any, local_queue?: any);
	public pipeInvert(state: string, machine?: AsyncMachine, target_state?: string, local_queue?: boolean);
	public pipeInvert(state: string[], machine?: AsyncMachine, target_state?: string, local_queue?: boolean);
	public pipeInvert(state: AsyncMachine, machine?: string, target_state?: boolean);
	public pipeInvert(state: any, machine?: any, target_state?: any, local_queue?: any);
	public pipeOff(): void;
	public duringTransition(): boolean;
	public debug(prefix?: string, level?: number): void;
	public debugOff(): void;

	public on(event: string, listener: Function, context?: Object): AsyncMachine;
	public once(event: string, listener: Function, context?: Object): AsyncMachine;

	public when(states: string, abort?: Function): Promise<any>;
	public when(states: string[], abort?: Function): Promise<any>;
	public when(states: any, abort?: Function): Promise<any>;
	public whenOnce(states: string, abort?: Function): Promise<any>;
	public whenOnce(states: string[], abort?: Function): Promise<any>;
	public whenOnce(states: any, abort?: Function): Promise<any>;

	public getAbort(state: string, abort?: () => boolean): () => boolean;

	public futureQueue(): Array<Array<any>>;

	public catchPromise(promise: Promise<any>, target_states?: string[]): Promise<any>;
	public catchPromise(promise: any, target_states?: string[]): any;

	public diffStates(states1: string[], states2: string[]);

	// ----- PRIVATES -----

	private log(msg: string, level?: number): void;
	private callListener(listener, context, params): Promise<any>;
	private callListener(listener, context, params): any;

	private getInstance(): any;

	private createDeferred(fn: Function, target, states, state_params: any[]): Deferred;
	private createCallback(deferred: Deferred): (err?, ...params) => void;
	private createListener(deferred: Deferred): (...params) => void;

	private processAutoStates(skip_queue: boolean);
		
	private processStateChange_(type: number, states: string, params: any[], autostate?: boolean, skip_queue?: boolean);
	private processStateChange_(type: number, states: string[], params: any[], autostate?: boolean, skip_queue?: boolean);
	private processStateChange_(type: number, states: any, params: any[], autostate?: boolean, skip_queue?: boolean): boolean;
		
	private processQueue_();
	private statesChanged(states_before: string[]): boolean;
	private allStatesSet(states): boolean;
	private allStatesNotSet(states): boolean;
	private selfTransitionExec_(states: string[], params?: any[]);
	private setupTargetStates_(states: string[], exclude?: string[]);
	private parseImplies_(states: string[]): string[];
	private parseRequires_(states: string[]): string[];
	private removeDuplicateStates_(states: string[]): string[];
	private isStateBlocked_(states: string[], name: string): string[];
	private transition_(to: string[], explicit_states: string[], params?: any[]);
	private setActiveStates_(target: string[]);
	private transitionExit_(from: string, to: string[], 
		explicit_states: string[], params: any[]);
	private transitionEnter_(to: string, target_states: string[], 
		params: any[]);
	private transitionExec_(method: string, target_states: string[], 
		params?: string[]);
	private orderStates_(states: string[]): void;
	private bindToStates(states: string[], listener: Function, abort?: Function, once?: boolean);
	private getAbortFunction(state: string, tick: number, abort?: () => boolean): () => boolean;
	// TODO
	// pipeBind: (state, machine, target_state, local_queue, bindings);
}
