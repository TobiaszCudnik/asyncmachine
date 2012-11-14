module "multistatemachine" {
	
	import rsvp = module ('rsvp');
	var Promise: new() => rsvp.Promise;
	export interface IState {
	    depends?: string[];
	    implies?: string[];
	    blocks?: string[];
	    requires?: string[];
	}
	interface IConfig {
	}
	export class MultiStateMachine {
	    public config: IConfig;
	    public disabled: bool;
	    private states: string[];
	    private states_active: string[];
	    public last_promise: rsvp.Promise;
	    constructor (state: string, config?: IConfig);
	    constructor (state: string[], config?: IConfig);
	    public state(name: string): bool;
	    public state(): string[];
	    public setState(states: string[], ...args: any[]);
	    public setState(states: string, ...args: any[]);
	    private allStatesSet(states): bool;
	    private allStatesNotSet(states): bool;
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
	    private prepareStates(): void;
	    private getState_(name);
	    private setupTargetStates_(states: string[], exclude?: string[]): string[];
	    private parseImplies_(states: string[]): string[];
	    private parseRequires_(states: string[]): string[];
	    private removeDuplicateStates_(states: string[]): string[];
	    private isStateBlocked_(states, name): bool;
	    private transition_(to: string[], args: any[]): bool;
	    private transitionExit_(from: string, to: string[]): bool;
	    private transitionEnter_(to: string, target_states: string[]): bool;
	    private transitionExec_(method: string, target_states: string[]): any;
	    private orderStates_(states: string[]): void;
	}
}