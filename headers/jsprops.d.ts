
module "jsprops" {
    interface PropertyData {
		get?(): any;
		set?(): any;
		init?(): any;
	}
	export function property(name: string, data?: PropertyData, def?: any): (...args: any[]) => any;
};