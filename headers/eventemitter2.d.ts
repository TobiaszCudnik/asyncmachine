///<reference path="./node.d.ts" />

declare module "eventemitter2" {
  // import events = module("events")
  export class EventEmitter2 {
     addListener(event: string, listener: Function);
     on(event: string, listener: Function): any;
     once(event: string, listener: Function): void;
     removeListener(event: string, listener: Function): void;
     removeAllListener(event: string): void;
     setMaxListeners(n: number): void;
     listeners(event: string): { Function; }[];
     emit(event: string, arg1?: any, arg2?: any): void;
  }
}
