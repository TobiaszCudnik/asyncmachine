declare function describe(name: string, block: Function);
declare function it(name: string, block?: (next?: Function) => void);
declare function beforeEach(block: (next?: Function) => void);
declare function afterEach(block: (next?: Function) => void);
declare function before(block: (next?: Function) => void);
declare function after(block: (next?: Function) => void);