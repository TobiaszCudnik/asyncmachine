declare var require: {
    (id: string): any;
    resolve(): string;
    cache: any;
    extensions: any;
}

declare var module: {
    exports: any;
    require(id: string): any;
    id: string;
    filename: string;
    loaded: boolean;
    parent: any;
    children: any[];
}

// Same as module.exports
declare var exports: any;
declare var console: any;