/// <reference path="../typings/commonjs.d.ts" />
/// <reference path="../typings/settimeout.d.ts" />
/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

import promise = module ('es6-promise');
import eventemitter = module ('eventemitter3-abortable');

export interface IState {
	depends?: string[];
	implies?: string[];
	blocks?: string[];
	requires?: string[];
	auto?: boolean;
}

export interface ITransition {
	call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
	apply(context, args): any;
}

class Deferred {
	promise: Promise<any>;
	resolve: Function;
	reject: Function;
}

class AsyncMachine extends EventEmitter {
	private debug_: boolean;
	private states_all: string[];
	private states_active: string[];
	public last_promise: Promise<any>;
	// TODO typeme
	private queue: Array<Array<any>>;
	private lock: boolean;
	private clock_: { [state: string]: number };
	// TODO merge with the TS source
	constructor(target?: AsyncMachine);
	public Exception_state(states: string[], err: Error, exception_states?: string[]): boolean;
	public register(...states: string[]);
	public get(state: string): IState;
	public state(name: string): boolean;
	public state(name: string[]): boolean;
	public state(): string[];
	public state(name?: any): any;
	public is(state: string): boolean;
	public is(state: string[]): boolean;
	public is(state: string, tick?: number): boolean;
	public is(state: string[], tick?: number): boolean;
	public is(): string[];
	public is(state?: any, tick?: number): any;
	public any(...names: string[]): boolean;
	public any(...names: string[][]): boolean;
	public any(...names: any[]): boolean;
	public every(...names: string[]): boolean;
		
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
		
	public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: AsyncMachine, machine?: string);
	public pipeForward(state: any, machine?: any, target_state?: any);
	public pipeInvert(state: string, machine?: AsyncMachine, target_state?: string);
	public pipeInvert(state: string[], machine?: AsyncMachine, target_state?: string);
	public pipeInvert(state: AsyncMachine, machine?: string);
	public pipeInvert(state: any, machine?: any, target_state?: any);
	public pipeOff(): void;
	public duringTransition(): boolean;
	public debug(prefix?: string, level?: number): void;
	public debugOff(): void;
	public log(msg: string, level?: number): void;

	on(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter;
	once(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter;

	public when(states: string, abort?: Function): Promise<any>;
	public when(states: string[], abort?: Function): Promise<any>;
	public when(states: any, abort?: Function): Promise<any>;
	public whenOnce(states: string, abort?: Function): Promise<any>;
	public whenOnce(states: string[], abort?: Function): Promise<any>;
	public whenOnce(states: any, abort?: Function): Promise<any>;

	public getAbort(state: string, abort?: () => boolean): () => boolean;
	public getAbortEnter(state: string, abort?: () => boolean): () => boolean;

	// ----- PRIVATES -----

	private getInstance(): any;

	private createDeferred(fn: Function, target, states, state_params: any[]): Deferred;
	private createCallback(deferred: Deferred): (err?, ...params) => void;
	private createListener(deferred: Deferred): (...params) => void;

	private processAutoStates(excluded?: string[]);
		
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
}