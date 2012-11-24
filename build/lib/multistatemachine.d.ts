/// <reference path="headers/node.d.ts" />
/// <reference path="headers/lucidjs.d.ts" />
/// <reference path="headers/rsvp.d.ts" />
/// <reference path="headers/es5-shim.d.ts" />
export module multistatemachine {
    interface IState {
        depends?: string[];
        implies?: string[];
        blocks?: string[];
        requires?: string[];
    }
    interface IConfig {
        debug: bool;
    }
    class MultiStateMachine {
        public config: IConfig;
        private debug_states_;
        public disabled: bool;
        private states;
        private states_active;
        public last_promise: rsvp.Promise;
        constructor (state: string, config?: IConfig);
        constructor (state: string[], config?: IConfig);
        public initStates(state: string);
        public initStates(state: string[]);
        public state(name: string): bool;
        public state(): string[];
        public setState(states: string[], ...args: any[]);
        public setState(states: string, ...args: any[]);
        public setStateLater(states: string[], ...rest: any[]);
        public setStateLater(states: string, ...rest: any[]);
        public dropState(states: string[], ...args: any[]);
        public dropState(states: string, ...args: any[]);
        public dropStateLater(states: string[], ...rest: any[]);
        public dropStateLater(states: string, ...rest: any[]);
        public addState(states: string[], ...args: any[]);
        public addState(states: string, ...args: any[]);
        public addStateLater(states: string[], ...rest: any[]);
        public addStateLater(states: string, ...rest: any[]);
        public pipeForward(state: MultiStateMachine, machine?: string);
        public pipeForward(state: string, machine?: MultiStateMachine, target_state?: string);
        public pipeInvert(state: string, machine: MultiStateMachine, target_state: string): void;
        public pipeOff(): void;
        public namespaceStateName(state: string): string;
        public defineState(name: string, config: IState): void;
        public debugStates(prefix?: string): void;
        public initMSM(state: string, config?: IConfig): void;
        static mixin(prototype: Object): void;
        private allStatesSet(states);
        private allStatesNotSet(states);
        private namespaceTransition_(transition);
        private getState_(name);
        private selfTransitionExec_(states, args);
        private setupTargetStates_(states, exclude?);
        private parseImplies_(states);
        private parseRequires_(states);
        private removeDuplicateStates_(states);
        private isStateBlocked_(states, name);
        private transition_(to, args);
        private transitionExit_(from, to);
        private transitionEnter_(to, target_states);
        private transitionExec_(method, target_states, args?);
        private orderStates_(states);
        public on(event: string, VarArgsBoolFn): void;
        public once(event: string, VarArgsBoolFn): void;
        public trigger(event: string, ...args: any[]): bool;
        public set(event: string, ...args: any[]): bool;
    }
}
export class MultiStateMachine extends multistatemachine.MultiStateMachine {
}
