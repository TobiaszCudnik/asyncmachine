/// <reference path="../d.ts/commonjs.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/settimeout.d.ts" />

import lucidjs = module ('lucidjs');
import rsvp = module ('rsvp');

export interface IState {
	depends?: string[];
	implies?: string[];
	blocks?: string[];
	requires?: string[];
	auto?: boolean;
}

export interface IConfig {
	debug: boolean;
}

export interface ITransition {
	call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
	apply(context, args): any;
}

class AsyncMachine {
	private debug_: boolean;
	private states_all: string[];
	private states_active: string[];
	public last_promise: rsvp.Promise;
	// TODO typeme
	private queue: Array<Array<any>>;
	private lock: boolean;
	public config: IConfig;
	private clock_: { [state: string]: number };
	// TODO merge with the TS source
	constructor(config?: IConfig);
	public Exception_enter(states: string[], err: Error, exception_states?: string[]): boolean;
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
		
	public set(states: string[], ...params: any[]): boolean;
	public set(states: string, ...params: any[]): boolean;
	public set(states: any, ...params: any[]): boolean;
	public setLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
	public setLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
	public setLater(states: any, ...params: any[]): (err?: any, ...params: any[]) => void;
		
	public add(target: AsyncMachine, states?: string[], ...params: any[]): boolean;
	public add(target: AsyncMachine, states?: string, ...params: any[]): boolean;
	public add(target: string[], states?: any, ...params: any[]): boolean;
	public add(target: string, states?: any, ...params: any[]): boolean;
	public add(target: any, states?: any, ...params: any[]): boolean;
	public addByCallback(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
	public addByCallback(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
	public addByCallback(states: any, ...params: any[]): (err?: any, ...params: any[]) => void;
	public addByListener(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
	public addByListener(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
	public addByListener(states: any, ...params: any[]): (err?: any, ...params: any[]) => void;
		
	public drop(states: string[], ...params: any[]): boolean;
	public drop(states: string, ...params: any[]): boolean;
	public drop(states: any, ...params: any[]): boolean;
	public dropLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
	public dropLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
	public dropLater(states: any, ...params: any[]): (err?: any, ...params: any[]) => void;
		
	public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
	public pipeForward(state: AsyncMachine, machine?: string);
	public pipeForward(state: any, machine?: any, target_state?: any);
	public pipeInvert(state: string, machine: AsyncMachine, target_state: string);
	public pipeOff(): void;
	public duringTransition(): boolean;
	public namespaceName(state: string): string;
	public debug(prefix?: string, log_handler?: (...msgs: string[]) => void): void;
	public log(msg: string, level?: number): void;

	public when(states: string, abort?: Function): rsvp.Promise;
	public when(states: string[], abort?: Function): rsvp.Promise;
	public when(states: any, abort?: Function): rsvp.Promise;
	public whenOnce(states: string, abort?: Function): rsvp.Promise;
	public whenOnce(states: string[], abort?: Function): rsvp.Promise;
	public whenOnce(states: any, abort?: Function): rsvp.Promise;

	private createCallback(deferred: rsvp.Defered): (err?, ...params) => void;
	private createListener(deferred: rsvp.Defered): (...params) => void;

	private processAutoStates(excluded?: string[]);
		
	private processStateChange_(type: number, states: string, params: any[], autostate?: boolean, skip_queue?: boolean);
	private processStateChange_(type: number, states: string[], params: any[], autostate?: boolean, skip_queue?: boolean);
	private processStateChange_(type: number, states: any, params: any[], autostate?: boolean, skip_queue?: boolean): boolean;
		
	private processQueue_();
	private statesChanged(states_before: string[]): boolean;
	private allStatesSet(states): boolean;
	private allStatesNotSet(states): boolean;
	private namespaceTransition_(transition: string): string;
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