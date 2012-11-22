module multistatemachine {
    export interface IState {
        depends?: string[];
        implies?: string[];
        blocks?: string[];
        requires?: string[];
    }
    export class MultiStateMachine {
        public config: IConfig;
        private debug_: Function;
        public disabled: bool;
        private states: string[];
        private states_active: string[];
        public last_promise: rsvp.Promise;
        constructor (state: string, config?);
        constructor (state: string[], config?);
        public debug(prefix?: string): void;
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
        public pushState(states: string[], ...args: any[]);
        public pushState(states: string, ...args: any[]);
        public pushStateLater(states: string[], ...rest: any[]);
        public pushStateLater(states: string, ...rest: any[]);
        public pipeForward(state: MultiStateMachine, machine?: string);
        public pipeForward(state: string, machine?: MultiStateMachine, target_state?: string);
        public pipeInvert(state: string, machine: MultiStateMachine, target_state: string): void;
        public pipeOff(): void;
        public namespaceStateName(state: string): string;
        private allStatesSet(states): bool;
        private allStatesNotSet(states): bool;
        private namespaceTransition_(transition: string): string;
        public prepareStates(): void;
        private getState_(name);
        private selfTransitionExec_(states: string[], args: any[]): bool;
        private setupTargetStates_(states: string[], exclude?: string[]): string[];
        private parseImplies_(states: string[]): string[];
        private parseRequires_(states: string[]): string[];
        private removeDuplicateStates_(states: string[]): string[];
        private isStateBlocked_(states, name): bool;
        private transition_(to: string[], args: any[]): bool;
        private transitionExit_(from: string, to: string[]): bool;
        private transitionEnter_(to: string, target_states: string[]): bool;
        private transitionExec_(method: string, target_states: string[], args?: any[]): bool;
        private orderStates_(states: string[]): void;
        public on(event: string, VarArgsBoolFn): void;
        public once(event: string, VarArgsBoolFn): void;
        public trigger(event: string, ...args: any[]): bool;
        public set(event: string, ...args: any[]): bool;
    }
}
export var MultiStateMachine: { new(state: string,config?: multistatemachine.IConfig): multistatemachine.MultiStateMachine; new(state: string[],config?: multistatemachine.IConfig): multistatemachine.MultiStateMachine; };
