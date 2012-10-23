export interface IState {
    active?: bool;
    depends?: string[];
    implies?: string[];
    requires?: string[];
    blocks?: string[];
    drops?: string[];
}
interface IConfig {
}
export class MultiStateMachine {
    public config: IConfig;
    public disabled: bool;
    private states: string[];
    private trasitions: string[];
    constructor (state: string, config?: IConfig);
    constructor (state: string[], config?: IConfig);
    public prepareStates(): void;
    public state(name: string): bool;
    public state(): string[];
    private getState(name);
    public setState(states: string[]);
    public setState(states: string);
    public transition_(from: string[], to: string[]): void;
    public transitionEnter_(from: string[], to: string): void;
    public transitionExit_(from: string, to: string[]): void;
    public transitionExec_(method: string): void;
}
