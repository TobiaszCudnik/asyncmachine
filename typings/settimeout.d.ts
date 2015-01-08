
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;
declare function clearTimeout(timeoutId: number): void;
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;
declare function clearInterval(intervalId: number): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any;
declare function clearImmediate(immediateId: any): void;