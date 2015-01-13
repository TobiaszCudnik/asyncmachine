/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/eventemitter3-abortable/eventemitter3-abortable.d.ts" />
/// <reference path="../typings/settimeout.d.ts" />
/// <reference path="../typings/commonjs.d.ts" />
import eventemitter = require("eventemitter3-abortable");
export declare var STATE_CHANGE: {
    DROP: number;
    ADD: number;
    SET: number;
};
export declare var STATE_CHANGE_LABELS: {
    0: string;
    1: string;
    2: string;
};
export declare var QUEUE: {
    STATE_CHANGE: number;
    STATES: number;
    PARAMS: number;
    TARGET: number;
};
export declare class Deferred {
    promise: Promise<any>;
    resolve: Function;
    reject: Function;
    constructor();
}
export declare class AsyncMachine extends eventemitter.EventEmitter {
    private states_all;
    private states_active;
    private queue;
    private lock;
    last_promise: Promise<any>;
    log_handler_: any;
    debug_prefix: string;
    debug_level: number;
    private clock_;
    internal_fields: any[];
    target: any;
    transition_events: any[];
    private debug_;
    Exception: {};
    constructor(target?: AsyncMachine);
    Exception_state(states: string[], err: Error, exception_states?: string[]): boolean;
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
    set(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    set(target: AsyncMachine, states: string, ...params: any[]): boolean;
    set(target: string[], states?: any, ...params: any[]): boolean;
    set(target: string, states?: any, ...params: any[]): boolean;
    setByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    setByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    setByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    setByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    setByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    setByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    setByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    setByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    setNext(target: AsyncMachine, states: string, ...params: any[]): (...params: any[]) => void;
    setNext(target: AsyncMachine, states: string[], ...params: any[]): (...params: any[]) => void;
    setNext(target: string, states: any, ...params: any[]): (...params: any[]) => void;
    setNext(target: string[], states: any, ...params: any[]): (...params: any[]) => void;
    add(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    add(target: AsyncMachine, states: string, ...params: any[]): boolean;
    add(target: string[], states?: any, ...params: any[]): boolean;
    add(target: string, states?: any, ...params: any[]): boolean;
    addByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    addByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    addByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    addByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    addByListener(target: AsyncMachine, states: string[], ...params: any[]): (...params: any[]) => void;
    addByListener(target: AsyncMachine, states: string, ...params: any[]): (...params: any[]) => void;
    addByListener(target: string[], states?: any, ...params: any[]): (...params: any[]) => void;
    addByListener(target: string, states?: any, ...params: any[]): (...params: any[]) => void;
    addNext(target: AsyncMachine, states: string, ...params: any[]): (...params: any[]) => void;
    addNext(target: AsyncMachine, states: string[], ...params: any[]): (...params: any[]) => void;
    addNext(target: string, states: any, ...params: any[]): (...params: any[]) => void;
    addNext(target: string[], states: any, ...params: any[]): (...params: any[]) => void;
    drop(target: AsyncMachine, states: string[], ...params: any[]): boolean;
    drop(target: AsyncMachine, states: string, ...params: any[]): boolean;
    drop(target: string[], states?: any, ...params: any[]): boolean;
    drop(target: string, states?: any, ...params: any[]): boolean;
    dropByCallback(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByCallback(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByCallback(target: string[], states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByCallback(target: string, states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByListener(target: AsyncMachine, states: string[], ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByListener(target: AsyncMachine, states: string, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByListener(target: string[], states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropByListener(target: string, states?: any, ...params: any[]): (err?: any, ...params: any[]) => void;
    dropNext(target: AsyncMachine, states: string, ...params: any[]): (...params: any[]) => void;
    dropNext(target: AsyncMachine, states: string[], ...params: any[]): (...params: any[]) => void;
    dropNext(target: string, states: any, ...params: any[]): (...params: any[]) => void;
    dropNext(target: string[], states: any, ...params: any[]): (...params: any[]) => void;
    pipeForward(state: string, machine?: AsyncMachine, target_state?: string): any;
    pipeForward(state: string[], machine?: AsyncMachine, target_state?: string): any;
    pipeForward(state: AsyncMachine, machine?: string): any;
    pipeInvert(state: string, machine?: AsyncMachine, target_state?: string): any;
    pipeInvert(state: string[], machine?: AsyncMachine, target_state?: string): any;
    pipeInvert(state: AsyncMachine, machine?: string): any;
    pipeOff(): void;
    clock(state: any): number;
    createChild(): any;
    duringTransition(): boolean;
    getAbort(state: string, abort?: () => boolean): () => boolean;
    getAbortEnter(state: string, abort?: () => boolean): () => boolean;
    when(states: string, abort?: Function): Promise<any>;
    when(states: string[], abort?: Function): Promise<any>;
    whenOnce(states: string, abort?: Function): Promise<any>;
    whenOnce(states: string[], abort?: Function): Promise<any>;
    debug(prefix?: any, level?: any): any;
    debugOff(): void;
    log(msg: string, level?: number): void;
    on(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter;
    once(event: string, listener: Function, context?: Object): EventEmitter3Abortable.EventEmitter;
    private getInstance();
    setImmediate(fn: any, ...params: any[]): any;
    private processAutoStates(excluded?);
    hasStateChanged(states_before: any): any;
    private processStateChange_(type, states, params, autostate?, skip_queue?);
    private processStateChange_(type, states, params, autostate?, skip_queue?);
    private processQueue_();
    private allStatesSet(states);
    private allStatesNotSet(states);
    private createDeferred(fn, target, states, state_params);
    private createCallback(deferred);
    private createListener(deferred);
    private selfTransitionExec_(states, params?);
    private setupTargetStates_(states, exclude?);
    private parseImplies_(states);
    private parseRequires_(states);
    private removeDuplicateStates_(states);
    private isStateBlocked_(states, name);
    private transition_(to, explicit_states, params?);
    private setActiveStates_(target);
    processPostTransition(): any[];
    getMethodContext(name: any): any;
    diffStates(states1: any, states2: any): any;
    private transitionExit_(from, to, explicit_states, params);
    private transitionEnter_(to, target_states, params);
    private transitionExec_(method, target_states, params?);
    private orderStates_(states);
    private bindToStates(states, listener, abort?, once?);
}
export interface IState {
    depends?: string[];
    implies?: string[];
    blocks?: string[];
    requires?: string[];
    auto?: boolean;
}
export interface ITransition {
    call(states?: string[], state_params?: any[], callback_params?: any[]): boolean;
    apply(context: any, args: any): any;
}
