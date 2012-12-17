declare module 'lucidjs' {
	
	export interface ISet {
		(event: string, ...args: any[]): IBinding;
		clear(state?: string);
	}
	
	export interface IEventEmitter {
		on(event: string, VarArgsBoolFn): IBinding;
		once(event: string, VarArgsBoolFn): IBinding;
		trigger(event: string, ...args: any[]): bool;
		set: ISet;
	}
	
	export function emitter(obj?: Object): IEventEmitter;
	
	export interface IBinding {
		clear();
	}
}
