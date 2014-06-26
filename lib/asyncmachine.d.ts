/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />

declare module "asyncmachine" {
	export import lucidjs = require("lucidjs");
	export import rsvp = require("rsvp");
	export var Promise: typeof rsvp.Promise;
	export class AsyncMachine extends lucidjs.EventEmitter {
    public config: any;
    private states_all;
    private states_active;
    private queue;
    private lock;
    public last_promise: rsvp.Promise;
    public log_handler_: any;
    public debug_prefix: string;
    public debug_level: number;
    private clock_;
    private debug_;
	public Exception: IState;
    constructor(config?: any);
    public Exception_enter(states: string[], err: Error): boolean;
    public register(...states: string[]): number[];
    public get(state: string): IState;
    public is(state: string): boolean;
    public is(state: string[]): boolean;
    public is(state: string, tick?: number): boolean;
    public is(state: string[], tick?: number): boolean;
    public is(): string[];
    public any(...names: string[]): boolean;
    public any(...names: string[][]): boolean;
    public every(...names: string[]): boolean;
    public set(states: string[], ...params: any[]): boolean;
    public set(states: string, ...params: any[]): boolean;
    public setLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public setLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public add(states: string[], ...params: any[]): boolean;
    public add(states: string, ...params: any[]): boolean;
    public addLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public addLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public drop(states: string[], ...params: any[]): boolean;
    public drop(states: string, ...params: any[]): boolean;
    public dropLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    public dropLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    public pipeForward(state: string, machine?: AsyncMachine, target_state?: string): any;
    public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string): any;
    public pipeForward(state: AsyncMachine, machine?: string): any;
    public createChild(): any;
    public clock(state: any): any;
    public pipeInvert(state: string, machine: AsyncMachine, target_state: string): lucidjs.IBinding;
    public pipeOff(): void;
    public duringTransition(): boolean;
    public namespaceName(state: string): string;
    public debug(prefix?: any, level?: any, handler?: any): any;
    public log(msg: string, level?: number): void;
    private processAutoStates(excluded?);
    private setState_(states, params);
    private addState_(states, params);
    private dropState_(states, params);
    private processQueue_(previous_ret);
    private allStatesSet(states);
    private allStatesNotSet(states);
    private createCallback(deferred);
    private namespaceTransition_(transition);
    private selfTransitionExec_(states, params?);
    private setupTargetStates_(states, exclude?);
    private parseImplies_(states);
    private parseRequires_(states);
    private removeDuplicateStates_(states);
    private isStateBlocked_(states, name);
    private transition_(to, explicit_states, params?);
    private setActiveStates_(target);
    private transitionExit_(from, to, explicit_states, params);
    private transitionEnter_(to, target_states, params);
    private transitionExec_(method, target_states, params?);
    private orderStates_(states);
	}
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
	    apply(context: any, args: any): any;
	}
}