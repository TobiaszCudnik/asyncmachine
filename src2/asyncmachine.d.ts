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
    private states_all: Array<String>;
    private states_active: Array<String>;
    public last_promise: rsvp.Promise;
		private log_handler_: Function;
    private queue: Array<Object>;
    private $: Object;
    private lock: boolean;
    public config: IConfig;
    constructor (state?: string, config?: IConfig);
    constructor (state?: string[], config?: IConfig);
    public init(state: string);
    public init(state: string[]);
    public init(state: any);
    public getState(name): IState;
    public get(name): IState;
    public state(name: string): boolean;
    public state(name: string[]): boolean;
    public state(): string[];
    public state(name: any): any;
    public is(name: string): boolean;
    public is(name: string[]): boolean;
    public is(): string[];
    public setState(states: string[], ...params: any[]): boolean;
    public setState(states: string, ...params: any[]): boolean;
    public setStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public setStateLater(states: string, ...params: any[]): (...params: any[]) => void;
    public setLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public setLater(states: string, ...params: any[]): (...params: any[]) => void;
    public addState(states: string[], ...params: any[]): boolean;
    public addState(states: string, ...params: any[]): boolean;
    public add(states: string[], ...params: any[]): boolean;
    public add(states: string, ...params: any[]): boolean;
    public addStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public addStateLater(states: string, ...params: any[]): (...params: any[]) => void;
    public addLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public addLater(states: string, ...params: any[]): (...params: any[]) => void;
    public dropState(states: string[], ...params: any[]): boolean;
    public dropState(states: string, ...params: any[]): boolean;
    public drop(states: string[], ...params: any[]): boolean;
    public drop(states: string, ...params: any[]): boolean;
    public dropStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public dropStateLater(states: string, ...params: any[]): (...params: any[]) => void;
    public dropLater(states: string[], ...params: any[]): (...params: any[]) => void;
    public dropLater(states: string, ...params: any[]): (...params: any[]) => void;
    public pipeForward(state: AsyncMachine, machine?: string);
    public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
    public pipeInvert(state: string, machine: AsyncMachine, target_state: string): void;
    public pipeOff(): void;
    public namespaceName(state: string): string;
    public debug(prefix?: string, log_handler?: (...msgs: string[]) => void): void;
    public amLog(...msgs: any[]): void;
    static merge(name: string): void;
    private processAutoStates(excluded?);
    private setState_(states, exec_params, callback_params?);
    private addState_(states, exec_params, callback_params?);
    private dropState_(states, exec_params, callback_params?);
    private processQueue_(previous_ret);
    private allStatesSet(states);
    private allStatesNotSet(states);
    private namespaceTransition_(transition);
    private selfTransitionExec_(states, exec_params?, callback_params?);
    private setupTargetStates_(states, exclude?);
    private parseImplies_(states);
    private parseRequires_(states);
    private removeDuplicateStates_(states);
    private isStateBlocked_(states, name);
    private transition_(to, explicit_states, exec_params?, callback_params?);
    private setActiveStates_(target);
    private transitionExit_(from, to, explicit_states, params);
    private transitionEnter_(to, target_states, params);
    private transitionExec_(method, target_states, params?);
    private orderStates_(states);
}