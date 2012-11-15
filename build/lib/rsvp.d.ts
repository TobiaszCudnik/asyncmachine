declare module "rsvp" {
	// Promise doesnt have static mixin!
	export class EventTarget {
		on(event_name: string, listener: (event_data: any) => bool) : void;
	 	trigger(event_name: string, event_data: any): bool;
		static mixin(target_object: Object): void;
	}
	export class Promise extends EventTarget {
		isResolved: bool;
		resolve();
		reject();
		then(success: Function, failure?: Function): Promise;
		fulfill();
	}
}