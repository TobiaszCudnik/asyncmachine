/// <reference path="headers/commonjs.d.ts" />
/// <reference path="headers/lucidjs.d.ts" />
/// <reference path="headers/rsvp.d.ts" />
/// <reference path="headers/es5-shim.d.ts" />
export module asyncmachine {
    import LucidJS = module ('lucidjs');
    import rsvp = module ('rsvp');
    interface IState {
        depends?: string[];
        implies?: string[];
        blocks?: string[];
        requires?: string[];
        auto?: bool;
    }
    interface IConfig {
        debug: bool;
    }
    interface ITransition {
        call(states?: string[], state_params?: any[], callback_params?: any[]): bool;
        call(states?: string[], state_params?: any[], callback_params?: any[]): any;
        apply(context, args): any;
    }
    class AsyncMachine {
        private debug_states_;
        private log_handler_;
        private states;
        private states_active;
        public last_promise: rsvp.Promise;
        private queue;
        private lock;
        public config: IConfig;
        constructor (state?: string, config?: IConfig);
        constructor (state?: string[], config?: IConfig);
        public initStates(state: string);
        public initStates(state: string[]);
        public getState(name): IState;
        public state(name: string): bool;
        public state(name: string[]): bool;
        public state(): string[];
        public setState(states: string[], ...params: any[]): bool;
        public setState(states: string, ...params: any[]): bool;
        public setStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public setStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public addState(states: string[], ...params: any[]): bool;
        public addState(states: string, ...params: any[]): bool;
        public addStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public addStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public dropState(states: string[], ...params: any[]): bool;
        public dropState(states: string, ...params: any[]): bool;
        public dropStateLater(states: string[], ...params: any[]): (...params: any[]) => void;
        public dropStateLater(states: string, ...params: any[]): (...params: any[]) => void;
        public pipeForward(state: AsyncMachine, machine?: string);
        public pipeForward(state: string, machine?: AsyncMachine, target_state?: string);
        public pipeInvert(state: string, machine: AsyncMachine, target_state: string): void;
        public pipeOff(): void;
        public namespaceStateName(state: string): string;
        public defineState(name: string, config: IState): void;
        public debugStates(prefix?: string, log_handler?: (...msgs: string[]) => void): void;
        public initAsyncMachine(state: string, config?: IConfig): void;
        static mixin(prototype: Object): void;
        static mergeState(name: string): void;
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
        public on(event: string, VarArgsBoolFn): LucidJS.IBinding;
        public once(event: string, VarArgsBoolFn): LucidJS.IBinding;
        public trigger(event: string, ...args: any[]): bool;
        public set(event: string, ...args: any[]): LucidJS.IBinding;
    }
    class Task extends AsyncMachine {
        public schedule_timer: number;
        public async_timers: number[];
        constructor ();
        static state_Idle: {
            blocks: string[];
        };
        static state_Waiting: {
            blocks: string[];
        };
        static state_Running: {
            blocks: string[];
        };
        static state_Cancelling: {
            blocks: string[];
        };
        static state_Stopping: {
            blocks: string[];
        };
        public Cancelling_enter(): void;
        public Stopping_enter(): void;
        public Running_exit(): void;
        public async(context: Object, ...blocks: Function[]): void;
        public schedule(delay: number, block: Function, context?: Object, ...params: any[]): void;
        public scheduleAsync(delay: number, context: Object, ...blocks: Function[]): void;
        public cancel(): void;
        public stop(): void;
        private cancelAsyncTimers_();
    }
}
export class AsyncMachine extends asyncmachine.AsyncMachine {
}
export class Task extends asyncmachine.Task {
}
