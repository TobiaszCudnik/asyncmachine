declare module 'lucidjs' {
	
	export interface ISet {
		(event: string, ...args: any[]): IBinding;
		clear(state?: string);
	}
	
	export class EventEmitter {
		on(event: string, VarArgsbooleanFn): IBinding;
		once(event: string, VarArgsbooleanFn): IBinding;
		trigger(event: string, ...args: any[]): boolean;
		set: ISet;
	}
	
	export interface IBinding {
		clear();
	}
}
