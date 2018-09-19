import AsyncMachine from './asyncmachine'
import Transition from './transition'

export type BaseStates = 'Exception'

export type TAsyncMachine = AsyncMachine<any, IBind, IEmit>

export interface IBind {
  (
    event: 'tick',
    listener: (before: string[]) => boolean | void,
    context?: Object
  ): this
  (
    event: 'id-changed',
    listener: (new_id: string, old_id: string) => boolean | void,
    context?: Object
  ): this
  (
    event: 'transition-init',
    listener: (transition: Transition) => boolean | void,
    context?: Object
  ): this
  (
    event: 'transition-start',
    listener: (transition: Transition) => boolean | void,
    context?: Object
  ): this
  (
    event: 'transition-end',
    listener: (transition: Transition) => boolean | void,
    context?: Object
  ): this
  (
    event: 'transition-step',
    listener: (...steps: ITransitionStep[]) => boolean | void,
    context?: Object
  ): this
  (
    event: 'pipe',
    listener: (pipe: TPipeBindings) => boolean | void,
    context?: Object
  ): this
  // TODO
  // (event: 'pipe-in', listener:
  // 	(pipe: TPipeBindings) => boolean | void, context?: Object): this;
  // (event: 'pipe-out', listener:
  // 	(pipe: TPipeBindings) => boolean | void, context?: Object): this;
  // (event: 'pipe-in-removed', listener:
  // 	(pipe: TPipeBindings) => boolean | void, context?: Object): this;
  // (event: 'pipe-out-removed', listener:
  // 	(pipe: TPipeBindings) => boolean | void, context?: Object): this;
  (
    event: 'state-registered',
    listener: (state: string) => boolean | void,
    context?: Object
  ): this
  (
    event: 'state-deregistered',
    listener: (state: string) => boolean | void,
    context?: Object
  ): this
  (
    event: 'transition-cancelled',
    listener: (transition: Transition) => boolean | void,
    context?: Object
  ): this
  (
    event: 'queue-changed',
    listener: () => boolean | void,
    context?: Object
  ): this
  (event: 'queue-end', listener: () => boolean | void, context?: Object): this
  // State events
  // TODO optional params
  (
    event: 'Exception_enter',
    listener: (
      err: Error,
      target_states: string[],
      base_states: string[],
      exception_transition: string,
      async_target_states?: string[]
    ) => boolean | void,
    context?: Object
  ): this
  (
    event: 'Exception_state',
    listener: (
      err: Error,
      target_states: string[],
      base_states: string[],
      exception_transition: string,
      async_target_states?: string[]
    ) => any,
    context?: Object
  ): this
  (
    event: 'Exception_exit',
    listener: () => boolean | void,
    context?: Object
  ): this
  (event: 'Exception_end', listener: () => any, context?: Object): this
  (
    event: 'Exception_Any',
    listener: () => boolean | void,
    context?: Object
  ): this
  (
    event: 'Any_Exception',
    listener: () => boolean | void,
    context?: Object
  ): this
  // TODO better compiler errors for incorrect calls
  (event: 'ts-dynamic', listener: Function): this
}

export interface IEmit {
  (event: 'tick', before: string[]): boolean
  (event: 'id-changed', new_id: string, old_id: string): boolean
  (event: 'transition-init', transition: Transition): boolean
  (event: 'transition-start', transition: Transition): boolean
  (event: 'transition-end', transition: Transition): boolean
  (event: 'transition-step', ...steps: ITransitionStep[]): boolean
  // (event: 'pipe', pipe: TPipeBindings): boolean;
  (event: 'pipe'): boolean
  // TODO
  // (event: 'pipe-in', pipe: TPipeBindings): boolean;
  // (event: 'pipe-out', pipe: TPipeBindings): boolean;
  // (event: 'pipe-in-removed', pipe: TPipeBindings): boolean;
  // (event: 'pipe-out-removed', pipe: TPipeBindings): boolean;
  (event: 'state-registered', state: string): boolean
  (event: 'state-deregistered', state: string): boolean
  (event: 'transition-cancelled', transition: Transition): boolean
  (event: 'queue-changed'): boolean
  // State events
  // TODO optional params
  (
    event: 'Exception_enter',
    err: Error,
    target_states: string[],
    base_states: string[],
    exception_transition: string,
    async_target_states?: string[]
  ): boolean
  (
    event: 'Exception_state',
    err: Error,
    target_states: string[],
    base_states: string[],
    exception_transition: string,
    async_target_states?: string[]
  ): any
  (event: 'Exception_exit'): boolean
  (event: 'Exception_end'): boolean
  (event: 'Exception_Any'): boolean
  (event: 'Any_Exception'): boolean
  (event: 'queue-end'): boolean
  // skip compiler errors for dynamic calls
  (event: 'ts-dynamic', ...params: any[]): boolean
}

export interface IState<T extends string> {
  /** Decides about the order of activations (transitions) */
  after?: (T | BaseStates)[]
  /** When set, sets also the following states */
  add?: (T | BaseStates)[]
  /** When set, blocks activation (or deactivates) given states */
  drop?: (T | BaseStates)[]
  /** State will be rejected if any of those aren't set */
  require?: (T | BaseStates)[]
  /** When true, the state will be set automatically, if it's not blocked */
  auto?: boolean
  /**
   * Multi states always triggers the enter and state transitions, plus
   * the clock is always incremented
   */
  multi?: boolean
}

export enum MutationTypes {
  DROP,
  ADD,
  SET
}

/**
 * Queue enum defining param positions in queue's entries.
 */
export enum QueueRowFields {
  STATE_CHANGE_TYPE,
  STATES,
  PARAMS,
  AUTO,
  TARGET
}

export interface IQueueRow {
  0: MutationTypes
  1: string[]
  2: any[]
  3: boolean
  4: TAsyncMachine
}

export class Deferred {
  promise: Promise<any>

  // @ts-ignore
  resolve: (...params: any[]) => void

  // @ts-ignore
  reject: (err?: any) => void

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export enum StateRelations {
  AFTER = 'after',
  ADD = 'add',
  REQUIRE = 'require',
  DROP = 'drop'
}

export enum TransitionStepTypes {
  RELATION = 1,
  TRANSITION = 1 << 2,
  SET = 1 << 3,
  DROP = 1 << 4,
  NO_SET = 1 << 5,
  REQUESTED = 1 << 6,
  CANCEL = 1 << 7,
  PIPE = 1 << 8
}

export enum StateStructFields {
  MACHINE_ID,
  STATE_NAME
}

export interface IStateStruct {
  /* StateStructFields.MACHINE_ID */
  0: string
  /* StateStructFields.STATE_NAME */
  1: string
}

export enum TransitionStepFields {
  STATE,
  SOURCE_STATE,
  TYPE,
  DATA
}

export interface ITransitionStep {
  /* TransitionStepFields.STATE */
  0: IStateStruct
  /* TransitionStepFields.SOURCE_STATE */
  1?: IStateStruct
  /* TransitionStepFields.TYPE */
  2?: TransitionStepTypes
  /* TransitionStepFields.DATA (eg a transition method name, relation type) */
  3?: any
}

export type TAbortFunction = () => boolean

// TODO merge with the enum
export type TStateAction = 'add' | 'drop' | 'set'
export type TStateMethod = 'enter' | 'exit' | 'state' | 'end'

export interface IPipeNegotiationBindings {
  enter: TStateAction
  exit: TStateAction
}

export interface IPipeStateBindings {
  state: TStateAction
  end: TStateAction
}

export type TPipeBindings = IPipeStateBindings | IPipeNegotiationBindings

export interface IPipedStateTarget {
  state: string
  machine: TAsyncMachine
  event_type: TStateMethod
  listener: Function
  flags?: PipeFlags
}

/**
 * By default piped are "_state" and "_end" methods, not the negotiation ones.
 * Use the PipeFlags.NEGOTIATION flag to pipe "_enter" and "_exit" methods, and
 * thus, to participate in the state negotiation. This mode DOES NOT guarantee,
 * that the state was successfully negotiated in the source machine.
 *
 * To invert the state, use the PipeFlags.INVERT flag.
 *
 * To append the transition to the local queue (instead of the target
 * machine's one), use the PipeFlags.LOCAL_QUEUE. This will alter the
 * transition order.
 */
export enum PipeFlags {
  NEGOTIATION = 1,
  INVERT = 1 << 2,
  LOCAL_QUEUE = 1 << 3,
  // TODO write tests for those
  FINAL = 1 << 4,
  NEGOTIATION_ENTER = 1 << 5,
  NEGOTIATION_EXIT = 1 << 6,
  FINAL_ENTER = 1 << 7,
  FINAL_EXIT = 1 << 8
}

export const PipeFlagsLabels = {
  NEGOTIATION: 'neg',
  INVERT: 'inv',
  LOCAL_QUEUE: 'loc',
  FINAL: 'fin',
  NEGOTIATION_ENTER: 'neg_enter',
  NEGOTIATION_EXIT: 'neg_exit',
  FINAL_ENTER: 'fin_enter',
  FINAL_EXIT: 'fin_exit'
}

export class TransitionException extends Error {
  constructor(public err: Error, public transition: string) {
    super()
  }
}

export class NonExistingStateError extends Error {
  constructor(name: string) {
    super('NonExistingStateError: ' + name)
  }
}

export type TLogHandler = (msg: string, level?: number) => any
