import multistatemachine = module ('../src/multistatemachine');
import chai = module ('chai');
var expect;
class FooMachine extends "multistatemachine".MultiStateMachine {
    public state_A: {};
    public state_B: {};
    public B_enter(): void;
    public A_exit(): void;
    public A_B(): void;
    public Any_B(): void;
    public B_Any(): void;
}
