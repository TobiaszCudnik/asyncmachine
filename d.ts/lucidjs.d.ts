declare module "lucidjs" {
	
	export interface ISet {
		(event: string, ...args: any[]): IBinding;
		clear(state?: string);
	}
	
	export class EventEmitter {
		on(event: string, VarArgsbooleanFn): IBinding;
		once(event: string, VarArgsbooleanFn): IBinding;
		trigger(event: string, ...args: any[]): boolean;
		flag(event: string, ...args: any[]): IBinding;
		unflag(event: string, ...args: any[]);
		removeListener(event: string, listener: Function);
	}
	
	export interface IBinding {
		clear();
	}
}
