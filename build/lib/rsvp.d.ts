declare module "rsvp" {
	export class Promise {
		isResolved: bool;
		resolve();
		reject();
		then(success: Function, failure?: Function): Promise;
		fulfill();
	};
}