/// <reference path="../d.ts/settimeout.d.ts" />
/// <reference path="../d.ts/es5-shim.d.ts" />
/// <reference path="../d.ts/rsvp.d.ts" />
/// <reference path="../d.ts/lucidjs.d.ts" />
/// <reference path="../d.ts/commonjs.d.ts" />
import lucidjs = require("lucidjs");
import rsvp = require("rsvp");
export declare var Promise: typeof rsvp.Promise;
export declare class AsyncMachine extends lucidjs.EventEmitter {
    config: any;
    private states_all;
    private states_active;
    private queue;
    private lock;
    last_promise: rsvp.Promise;
    log_handler_: any;
    debug_prefix: string;
    debug_level: number;
    private clock_;
    internal_fields: any[];
    target: any;
    private debug_;
    Exception: {};
    constructor(config?: any);
    Exception_enter(states: string[], err: Error): boolean;
    setTarget(target: any): any;
    registerAll(): any;
    is(state: string): boolean;
    is(state: string[]): boolean;
    is(state: string, tick?: number): boolean;
    is(state: string[], tick?: number): boolean;
    is(): string[];
    any(...names: string[]): boolean;
    any(...names: string[][]): boolean;
    every(...names: string[]): boolean;
    futureQueue(): any[][];
    register(...states: string[]): number[];
    get(state: string): IState;
    set(states: string[], ...params: any[]): boolean;
    set(states: string, ...params: any[]): boolean;
    setLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    setLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    add(states: string[], ...params: any[]): boolean;
    add(states: string, ...params: any[]): boolean;
    addLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    addLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    drop(states: string[], ...params: any[]): boolean;
    drop(states: string, ...params: any[]): boolean;
    dropLater(states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    dropLater(states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    pipeForward(state: string, machine?: AsyncMachine, target_state?: string): any;
    pipeForward(state: string[], machine?: AsyncMachine, target_state?: string): any;
    pipeForward(state: AsyncMachine, machine?: string): any;
    createChild(): any;
    clock(state: any): number;
    pipeInvert(state: string, machine: AsyncMachine, target_state: string): lucidjs.IBinding;
    pipeOff(): void;
    duringTransition(): boolean;
    namespaceName(state: string): string;
    debug(prefix?: any, level?: any, handler?: any): any;
    log(msg: string, level?: number): void;
    private processAutoStates(excluded?);
    private setState_(states, params);
    private setState_(states, params);
    private addState_(states, params);
    private addState_(states, params);
    private dropState_(states, params);
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
    continueEnter(state: any, func: any): () => any;
    continueState(state: any, func: any): () => any;
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
