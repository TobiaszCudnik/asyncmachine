declare module 'lucidjs' {
	
	export interface EventEmitter {
		on(event: string, VarArgsBoolFn): IBinding;
		once(event: string, VarArgsBoolFn): IBinding;
		trigger(event: string, ...args: any[]): bool;
		set(event: string, ...args: any[]): bool;
	}
	
	export function emitter(obj?: Object): EventEmitter;
	
	export interface IBinding {
		clear();
	}
}
