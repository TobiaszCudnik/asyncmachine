declare module "rsvp" {
	
	// Promise doesnt have static mixin!
	export class EventTarget {
		on(event_name: string, listener: (event_data: any) => boolean) : void;
	 	trigger(event_name: string, event_data: any): boolean;
		static mixin(target_object: Object): void;
	}
	
	export class Promise extends EventTarget {
		isResolved: boolean;
		resolve(value?: any);
		reject(err?: any);
		then(success: Function, failure?: Function): Promise;
	}
}