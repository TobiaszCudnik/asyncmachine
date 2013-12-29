/// <reference path="headers/commonjs.d.ts" />
/// <reference path="headers/lucidjs.d.ts" />
/// <reference path="headers/rsvp.d.ts" />
/// <reference path="headers/es5-shim.d.ts" />

import lucidjs = module ('lucidjs');
import rsvp = module ('rsvp');
interface IState {
    depends?: string[];
    implies?: string[];
    blocks?: string[];
    requires?: string[];
    auto?: boolean;
}

interface IConfig {
    debug: boolean;
}

interface ITransition {
    call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
    call(states?: string[], state_params?: any[], callback_params?: any[]): any;
    apply(context, args): any;
}

class AsyncMachine extends lucidjs.EventEmitter {
    private debug_: boolean;
    private log_handler_: Function;
    private states_all: string[];
    private states_active: string[];
    public last_promise: rsvp.Promise;
		private log_handler_: Function;
    private queue: Object[];
    private lock: boolean;
    public config: IConfig;
    constructor(config?: IConfig);
    constructor(config?: IConfig);
    public register(...states: string[]);
    public get(state: string): IState;
    public state(name: string): boolean;
    public state(name: string[]): boolean;
    public state(): string[];
    public state(name?: any): any;
    public is(state: string): boolean;
    public is(state: string[]): boolean;
    public is(): string[];
    public is(state?: any): any;
    public any(...names: string[]): boolean;
    public every(...names: string[]): boolean;
	
    public set(states: string[], ...params: any[]): boolean;
    public set(states: string, ...params: any[]): boolean;
    public set(states: any, ...params: any[]): boolean;
	
    public setLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public setLater(states: string, ...params: any[]): (...params: any[]) => void;
    public setLater(states: any, ...params: any[]): (...params: any[]) => void;
	
    public addState(states: string[], ...params: any[]): boolean;
    public add(states: string[], ...params: any[]): boolean;
    public add(states: string, ...params: any[]): boolean;
    public add(states: any, ...params: any[]): boolean;
    public addLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public addLater(states: string, ...params: any[]): (...params: any[]) => void;
    public addLater(states: any, ...params: any[]): (...params: any[]) => void;
    public drop(states: string[], ...params: any[]): boolean;
    public drop(states: string, ...params: any[]): boolean;
    public drop(states: any, ...params: any[]): boolean;
    public dropLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public dropLater(states: string, ...params: any[]): (...params: any[]) => void;
    public dropLater(states: any, ...params: any[]): (...params: any[]) => void;
    public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: string[], machine?: AsyncMachine, target_state?: string);
    public pipeForward(state: AsyncMachine, machine?: string);
    public pipeForward(state: any, machine?: any, target_state?: any);
    public pipeInvert(state: string, machine: AsyncMachine, target_state: string);
    public pipeOff(): void;
    public namespaceName(state: string): string;
    public debug(prefix?: string, log_handler?: (...msgs: string[]) => void): void;
    public amLog(...msgs: any[]): void;
    static merge(name: string): void;
    private processAutoStates(excluded?: string[]);
	
		private setState_(states: string, exec_params: any[], 
			callback_params?: any[]);
		private setState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
		private setState_(states: any, exec_params: any[],
			callback_params?: any[]): boolean;
	
		private addState_(states: string, exec_params: any[], 
			callback_params?: any[]);
		private addState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
		private addState_(states: any, exec_params: any[],
			callback_params?: any[]): boolean;
	
		private dropState_(states: string, exec_params: any[], 
			callback_params?: any[]);
		private dropState_(states: string[], exec_params: any[], 
			callback_params?: any[]);
		private dropState_(states: any, exec_params: any[],
			callback_params?: any[] ): boolean;
	
    private processQueue_(previous_ret);
    private allStatesSet(states): boolean;
    private allStatesNotSet(states): boolean;
    private namespaceTransition_(transition: string);
    private selfTransitionExec_(states: string[], exec_params?: any[],
				callback_params?: any[] );
    private setupTargetStates_(states: string[], exclude?: string[]);
    private parseImplies_(states: string[]): string[];
    private parseRequires_(states: string[]): string[];
    private removeDuplicateStates_(states: string[]): string[];
    private isStateBlocked_(states: string[], name: string): string[];
    private transition_(to: string[], explicit_states: string[], 
			exec_params?: any[], callback_params?: any[]);
    private setActiveStates_(target: string[]);
    private transitionExit_(from: string, to: string[], 
			explicit_states: string[], params: any[]);
    private transitionEnter_(to: string, target_states: string[], 
			params: any[]);
    private transitionExec_(method: string, target_states: string[], 
			params?: string[]);
    private orderStates_(states: string[]): void;
}