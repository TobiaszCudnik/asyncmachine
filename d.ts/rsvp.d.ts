declare module "rsvp" {
	
	// Promise doesnt have static mixin!
	export class EventTarget {
		on(event_name: string, listener: (event_data: any) => boolean) : void;
	 	trigger(event_name: string, event_data: any): boolean;
		static mixin(target_object: Object): void;
	}
	
	export class Promise extends EventTarget {
		isResolved: boolean;
		then(success: Function, failure?: Function): Promise;
	}
	
	export class Defered extends Promise {
		resolve(value?: any);
		reject(err?: any);
		promise: Promise;
	}
	
	export function defer(): Defered;
}