declare module 'eventemitter3-abortable' {
    export class EventEmitter extends EventEmitter3Abortable.EventEmitter {}
}

declare module EventEmitter3Abortable {
    export class EventEmitter {
        addListener(event: string, listener: Function): EventEmitter;
        on(event: string, listener: Function, context?: Object): EventEmitter;
        once(event: string, listener: Function, context?: Object): EventEmitter;
        removeListener(event: string, listener: Function): EventEmitter;
        removeAllListeners(event?: string): EventEmitter;
        setMaxListeners(n: number): void;
        listeners(event: string): Function[];
        emit(event: string, ...args: any[]): boolean;
    }
}