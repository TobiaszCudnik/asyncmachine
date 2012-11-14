declare module "rsvp" {
	export class Promise {
		is_resolved: bool;
		resolve();
		reject();
		then(success: Function, failure?: Function): Promise;
		fulfill();
	};
}