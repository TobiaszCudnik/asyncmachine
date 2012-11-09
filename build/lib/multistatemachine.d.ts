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
    constructor (state: string, config?: IConfig);
    constructor (state: string[], config?: IConfig);
    public state(name: string): bool;
    public state(): string[];
    public setState(states: string[]);
    public setState(states: string);
    public dropState(states: string[]);
    public dropState(states: string);
    public addState(states: string[]);
    public addState(states: string);
    private prepareStates(): void;
    private getState_(name);
    private setupTargetStates_(states: string[], exclude?: string[]): string[];
    private parseImplies_(states: string[]): string[];
    private parseRequires_(states: string[]): string[];
    private removeDuplicateStates_(states: string[]): string[];
    private isStateBlocked_(states, name): bool;
    private transition_(to: string[]): void;
    private transitionExit_(from: string, to: string[]): void;
    private transitionEnter_(to: string): void;
    private transitionExec_(method: string): void;
    private orderStates_(states: string[]): void;
}
