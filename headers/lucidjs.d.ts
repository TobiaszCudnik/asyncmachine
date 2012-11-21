module 'lucidjs' {
	function VarArgsBoolFn(...args: any[]): bool;

	export function emitter(obj?: Object): EventEmitter;

	export interface EventEmitter {
		on(event: string, VarArgsBoolFn): void;
		once(event: string, VarArgsBoolFn): void;
		trigger(event: string, ...args: any[]): bool;
		set(event: string, ...args: any[]): bool;
	}
}

module 'multistatemachine' {
	interface MultiStateMachine extends EventEmitter {}
}