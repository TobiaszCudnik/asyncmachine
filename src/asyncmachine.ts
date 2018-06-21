// @ts-ignore
import * as uuidProxy from 'simple-random-id'
import EventEmitter from './ee'
import Transition from './transition'
import {
  BaseStates,
  Deferred,
  IBind,
  IEmit,
  IPipedStateTarget,
  IQueueRow,
  IState,
  NonExistingStateError,
  PipeFlags,
  PipeFlagsLabels,
  QueueRowFields,
  MutationTypes,
  StateRelations,
  TAbortFunction,
  TAsyncMachine,
  TLogHandler,
  TPipeBindings,
  TransitionException,
  TransitionStepTypes,
  TStateMethod
} from './types'

export {
  PipeFlags,
  StateStructFields,
  TransitionStepTypes,
  TransitionStepFields,
  MutationTypes,
  StateRelations,
  // needed for factory()
  IBind,
  IEmit,
  IState,
  // useful for typing
  TAsyncMachine
} from './types'
export { default as Transition } from './transition'
export { AsyncMachine }

// TODO thank you rollup for years of linking issues
const uuid = (<any>uuidProxy).default || uuidProxy

const assert = function(cond: boolean, msg: string) {
  if (!cond) {
    throw Error(msg)
  }
}

/**
 * Factory function which creates an AsyncMachine instance with specified
 * states.
 *
 * States properties are empty, so you'd need to define the relations by
 * yourself.
 *
 * @param states List of state names to register on the new instance or a map
 *   of state names and their attributes.
 * @return The machine instance. You can inherit from it by [[createChild]] to
 *   make more copies, which are efficient.
 *
 * Using a list of names:
 * ```
 * import { machine } from 'asyncmachine'
 *
 * let states = machine(['A', 'B','C'])
 * states.A = { add: ['B'] }
 * states.add('A')
 * states.is() // -> ['A', 'B']
 * ```
 *
 * Using a map:
 * ```
 * import { machine } from 'asyncmachine'
 *
 * let states = machine({
 *   A: { add: ['B'] },
 *   B: {},
 *   C: {}
 * })
 * states.add('A')
 * states.is() // -> ['A', 'B']
 * ```
 */
export function machine<
  States extends string,
  T extends AsyncMachine<any, IBind, IEmit>
>(
  states: string[] | { [K in keyof States]?: IState<States> },
  constructor?: { new (...params: any[]): T }
): T
export function machine<States extends string>(
  states: string[]
): AsyncMachine<States, IBind, IEmit>
export function machine<States extends string>(
  states: { [K in States]?: IState<States> }
): AsyncMachine<States, IBind, IEmit>
export function machine<
  States extends string,
  T extends AsyncMachine<any, IBind, IEmit>
>(
  states: string[] | { [K in keyof States]?: IState<States> } = [],
  constructor?: any
): any {
  var instance = <T>(<any>new (constructor || AsyncMachine)())

  if (states instanceof Array) {
    for (let state of states) {
      instance[state] = {}
      instance.register(state as BaseStates)
    }
  } else {
    for (let state of Object.keys(states)) {
      instance[state] = states[state]
      instance.register(state as BaseStates)
    }
  }

  return instance
}

/**
 * Base class to extend. Define states as prototype attributes or
 * inside of the constructor. In the latter case remember to call
 * this.registerAll() afterwards (for every sub constructor).
 *
 * The [[Exception]] state is already provided.
 *
 * ```
 * class FooStates extends AsyncMachine {
 *   Enabled: {}
 *
 *   Downloading: {
 *     drop: 'Downloaded'
 *   }
 *
 *   Downloaded = {
 *     drop: 'Downloading'
 *   }
 *
 *   constructor(target) {
 *     super(target)
 *     this.registerAll()
 *   }
 * }
 *
 * class Foo {
 *   constructor() {
 *     this.states = new FooStates(this)
 *   }
 *
 *   Downloading_state(states, url) {
 *   	 fetch(url, this.states.addByCallack('Downloaded'))
 *   }
 *
 *   Downloaded_state(states, local_path) {
 *   	 console.log(`Downloaded ${this.url} to ${local_path}`)
 *   }
 * }
 * ```
 */
export default class AsyncMachine<
  TStates extends string,
  TBind extends IBind,
  TEmit extends IEmit
> extends EventEmitter {
  /**
   * Exception state's properties. See [[Exception_state]] final transition
   * handler.
   * @type {IState}
   */
  Exception: IState<TStates | BaseStates> = {
    multi: true
  }
  /** List of all registered state names */
  states_all: (TStates | BaseStates)[] = []
  /**
   * Promise created by one of the delayed mutation methods:
   * - `...ByCallback`
   * - `...ByListener`
   *
   * Resolved once the callback/listener gets called.
   */
  last_promise: Promise<any> | null = null
  /** Map of piped states and their targets. */
  piped: { [K in TStates | BaseStates]?: IPipedStateTarget[] } = {}
  /**
   * If true, an exception will be printed immediately after it's thrown.
   * Automatically turned on with logLevel > 0.
   */
  print_exception = false
  /** List of active states. */
  states_active: (TStates | BaseStates)[] = []
  protected queue_: IQueueRow[] = []
  /** If true, this machine is currently during a transition. */
  lock: boolean = false
  /** If true, this machine's queue is currently being executed. */
  lock_queue = false
  /** List of current ticks per state. */
  protected clock_: { [K in TStates | BaseStates]?: number } = {}
  /**
   * Target object for the transitions, useful when composing the states
   * instance.
   */
  target: {} | null = null
  protected log_level_: number = 0
  /** Currently executing transition (if any) */
  transition: Transition | null = null
  /** List of handlers receiving log messeges */
  log_handlers: TLogHandler[] = []
  /**
   * Queue execution got postponed, because this machine is currently during
   * a transition from another machine's queue.
   */
  protected postponed_queue = false
  protected internal_fields: string[] = [
    'states_all',
    'lock_queue',
    'states_active',
    'queue_',
    'lock',
    'last_promise',
    'log_level_',
    'clock_',
    'target',
    'internal_fields',
    'piped',
    'id_',
    'print_exception',
    'transition',
    'log_handlers',
    'postponed_queue',
    'def_log_handler_off'
  ]
  private id_: string = uuid()

  /**
   * Creates a new instance with only one registered state - Exception.
   *
   * When extending the class, you should register your states by using either
   * the [[registerAll]] or [[register]] methods at the end of every sub
   * constructor.
   *
   * @param target Target object for the transitions, useful when composing a
   *   machine.
   * @param register_all Automatically registers all defined states. Works
   *   only in case there no other attributes defined on the prototype.
   * @see [[AsyncMachine]] for the usage example.
   */
  constructor(target?: {}, register_all: boolean = true) {
    super()

    this.setTarget(target || this)
    if (register_all) this.registerAll()
    else this.register('Exception')
  }

  /**
   * All exceptions are caught into this state, including both synchronous and
   * asynchronous ones, coming from async methods and callbacks. You can
   * override it with your own and handle exceptions based on passed state
   * data and the actual state.
   *
   * @param err The exception object.
   * @param target_states Target states of the transition during
   * 	 which the exception was thrown.
   * @param base_states Base states in which the transition originated.
   * @param exception_src_handler The handler state which thrown the exception.
   * @param async_target_states Only for delayed mutations like
   *   [[addByCallback]], these are states which we're supposed to be activated
   *   by the callback.
   *
   * Example of a custom exception handler
   * ```
   * states = machine(['A', 'B', 'C'])
   * states.Exception_state = function(err, target_states) {
   *   // Re-adds the state 'C' in case of an exception when A is active
   *   if (exception_states.some((state) => state == 'C') && this.is('A')) {
   *     states.add 'C'
   *   }
   * }
   * ```
   *
   * Example of a manually thrown exception
   * ```
   * states.A_state = function(states) {
   *   foo = new SomeAsyncTask()
   *   foo.start()
   *   foo.once('error', (error) => {
   *     this.add('Exception', error, states)
   *   }
   * }
   * ```
   */
  Exception_state(
    err: Error | TransitionException,
    target_states: string[],
    base_states: string[],
    exception_src_handler: string,
    async_target_states?: string[]
  ): void {
    if (this.print_exception) {
      console.error('EXCEPTION from AsyncMachine')
    }
    if (target_states && target_states.length > 0) {
      this.log(
        `Exception \"${err}\" when setting states:\n` +
          `${target_states.join(', ')}`
      )
    }
    if (Array.isArray(base_states)) {
      this.log(
        `Source states of the transition were:\n` +
          `${base_states.join(', ') || '--EMPTY--'}`
      )
    }
    if (async_target_states && async_target_states.length > 0) {
      this.log(
        `Next states that were supposed to be (add|drop|set):\n` +
          `${async_target_states.join(', ')}`
      )
    }
    if (exception_src_handler) {
      console.error(
        `The call which caused the exception was ` + exception_src_handler
      )
    }
    // if the exception param was passed, print and throw (but outside of the
    // current stack trace)
    if (err) {
      if (this.print_exception) {
        console.error(err)
      }
      this.setImmediate(() => {
        throw err
      })
    }
  }

  /**
   * Sets the target for the transition handlers. Useful to keep all your
   * methods in in one class while the states class is composed as an
   * attribute of the target object. There's also a shorthand for this method
   * as a [[AsyncMachine.constructor]]'s param.
   *
   * @param target Target object.
   *
   * ```
   * class Foo {
   *   constructor() {
   *     this.states = machine(['A', 'B', 'C'])
   *     this.states.setTarget(this)
   *     this.states.add('A')
   *   }
   *
   *   A_state() {
   *     console.log('State A set')
   *   }
   * }
   * ```
   */
  setTarget(target: {}): this {
    this.target = target
    return this
  }

  /**
   * Registers all defined states. Use it only if you don't define any other
   * attributes on the object (or it's prototype). If you do, register the
   * states manually with the [[register]] method. There's also a shorthand
   * for this method as [[AsyncMachine.constructor]]'s param.
   *
   * ```
   * class States extends AsyncMachine {
   *   constructor() {
   *     this.A = {}
   *     this.B = {}
   *
   *     this.registerAll()
   *     console.log(this.states_all) // -> ['Exception', 'A', 'B']
   *   }
   * }
   * ```
   */
  registerAll() {
    // test the instance vars
    for (let name in this) {
      let value = this[name]
      if (
        this.hasOwnProperty(name) &&
        !this.internal_fields.includes(name) &&
        !(value instanceof Function)
      ) {
        this.register(name as TStates | BaseStates)
      }
    }

    // test the prototype chain
    var constructor = this.constructor.prototype
    if (constructor === AsyncMachine.prototype) return

    while (true) {
      for (let name in constructor) {
        let value = constructor[name]
        if (
          constructor.hasOwnProperty(name) &&
          !this.internal_fields.includes(name) &&
          !(value instanceof Function)
        ) {
          this.register(name as TStates | BaseStates)
        }
      }

      constructor = Object.getPrototypeOf(constructor)
      if (constructor === AsyncMachine.prototype) break
    }

    // TODO validate relations
  }

  /**
   * Returns defined relations between two registered states.
   *
   * @param from_state
   * @param to_state
   * @returns List of relations.
   */
  getRelationsOf(
    from_state: TStates | BaseStates,
    to_state?: TStates | BaseStates
  ): StateRelations[] {
    this.parseStates(from_state)
    if (to_state) this.parseStates(to_state)
    let state = this.get(from_state)
    let relations = [
      StateRelations.AFTER,
      StateRelations.ADD,
      StateRelations.DROP,
      StateRelations.REQUIRE
    ]

    return relations.filter(relation => {
      if (!state[relation]) return false
      // @ts-ignore
      if (to_state && !state[relation].includes(to_state)) {
        return false
      }
      return true
    })
  }

  /**
   * Without any params passed, returns all of the current states.
   *
   * When a list of states is provided, returns a boolean if all of them are
   * currently active.
   *
   * If only one state is passed, you can assert on a certain tick of that
   * state (see [[clock]]).
   *
   * @param states One or more state names.
   * @param tick When checking only one state, additionally asserts the clock
   *   value for that state.
   *
   * ```
   * states = machine(['A', 'B'])
   * states.add('A')
   * states.is('A') // -> true
   * states.is(['A']) // -> true
   * states.is(['A', 'B']) // -> false
   * // assert the tick
   * tick = states.clock('A')
   * states.drop('A')
   * states.add('A')
   * states.is('A', tick) // -> false
   * ```
   */
  is(
    states: (TStates | BaseStates) | (TStates | BaseStates)[],
    tick?: number
  ): boolean
  is(): (TStates | BaseStates)[]
  is(states?: any, tick?: any): any {
    if (!states) {
      return this.states_active
    }
    let states_parsed = this.parseStates(states)
    const active = states_parsed.every(state => {
      return Boolean(this.states_active.includes(state))
    })
    if (!active) {
      return false
    }
    if (states_parsed.length && tick !== undefined) {
      return this.clock(states) === tick
    }
    return true
  }

  /**
   * Returns `true` in case of all of the passed states aren't active.
   *
   * Example:
   *
   * ```
   * const example = machine(['A', 'B', 'C', 'D'])
   * example.add(['A', 'B'])
   *
   * // not(A) and not(C)
   * example.not(['A', 'C']) // -> false
   * // not(C) and not(D)
   * example.not(['C', 'D']) // -> true
   * ```
   *
   * @param states
   * @return
   */
  not(states: (TStates | BaseStates) | (TStates | BaseStates)[]): boolean {
    let states_parsed = this.parseStates(states)
    return states_parsed.every(state => {
      return Boolean(!this.states_active.includes(state))
    })
  }

  /**
   * Checks if any of the passed states is active. State can also be an array,
   * then all states from this param has to be active.
   *
   * @param states State names and/or lists of state names.
   * @return
   *
   * ```
   * states = machine(['A', 'B', 'C'])
   * states.add(['A', 'B'])
   *
   * states.any('A', 'C') // -> true
   * states.any(['A', 'C'], 'C') // -> false
   * ```
   */
  any(...states: (TStates | BaseStates)[]): boolean
  any(...states: (TStates | BaseStates)[][]): boolean
  any(...states: any[]): boolean {
    return states.some(name => {
      return this.is(name)
    })
  }

  /**
   * Returns the current queue.
   *
   * To understand the returned format, refer to [[IQueueRow]].
   */
  queue(): IQueueRow[] {
    return this.queue_
  }

  /**
   * Register passed state names. State properties should be already defined.
   *
   * @param states State names.
   * @return
   *
   * ```
   * const example = machine()
   * example.Enabled = {}
   * example.Disposed = { drop: ['Enabled'] }
   *
   * states.register('Enabled', 'Disposed')
   *
   * states.add('Enabled')
   * states.is() // -> 'Enabled'
   * ```
   */
  register(...states: (TStates | BaseStates)[]) {
    // TODO dont register during a transition
    for (let state of this.parseStates(states)) {
      // @ts-ignore Cant use this.get() here
      const exists = this[state]
      if (!exists) {
        console.error(`Missing state '${state}' in machine '${this.id()}'`)
      }
      if (!this.states_all.includes(state)) {
        this.states_all.push(state)
      }
      this.clock_[state] = 0
    }
  }

  /**
   * TODO desc
   * TODO sample
   * TODO test
   * @param name
   */
  unregister(name: string) {
    throw new Error(`Not implemented - unregister('${name}')`)
    // TODO dont unregister during a transition
  }

  /**
   * Returns state's properties and relations.
   *
   * @param state State name.
   *
   * ```
   * states = machine(['A', 'B', 'C'])
   * states.A = { drop: ['B'] }
   *
   * states.get('A') // -> { drop: ['B'] }
   * ```
   */
  get(state: TStates | BaseStates): IState<TStates> {
    if (!this.states_all.includes(state)) {
      throw new NonExistingStateError(state)
    }
    return this[state as string]
  }

  /**
   * Activates only the specified states and de-activates all the other ones
   * which are currently active.
   *
   * @param target OPTIONAL. Pass it if you want to execute a transition on an
   *   external machine, but using this machine's queue.
   * @param states Array of state names or a single state name.
   * @param params Params to be passed to the transition handlers (only the ones
   *   belonging to the explicitly requested states, not implied or auto
   *   states).
   * @return Result of the transition. `false` can mean that either the
   *   requested states weren't accepted or that the transition has been aborted
   *   by one of the negotiation handlers. `null` means that the machine is busy
   *   and the mutation has been queued.
   *
   * Basic usage
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.set('A') // -> true
   * example.is() // -> ['A']
   * example.set('B') // -> true
   * example.is() // -> ['B']
   * ```
   *
   * State negotiation
   * ```
   * const example = machine(['A', 'B'])
   * // reject the transition with a negotiation handler
   * example.A_enter = function() {
   *   return false
   * }
   * example.add('A') // -> false
   * ```
   *
   * Activating a state on an external machine
   * ```
   * const m1 = machine(['A', 'B'])
   * const m2 = machine(['C', 'D'])
   *
   * m1.A_enter = function() {
   *   // this transition will be queued and executed after the current
   *   // transition is completed
   *   m1.add(m2, 'C') // -> null
   * }
   * ```
   */
  set<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): boolean | null
  set(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): boolean | null
  set(target: any, states?: any, ...params: any[]): boolean | null {
    assert(target, 'First param required')
    if (!(target instanceof AsyncMachine)) {
      // TODO test for `states === 0`
      if (states !== undefined) {
        params = params ? [states, ...params] : [states]
      }
      states = target
      target = this
    }

    this.enqueue_(MutationTypes.SET, states, params, target)

    return this.processQueue_()
  }

  /**
   * Deferred version of [[set]], returning a node-style callback for setting
   * the state. Errors are handled automatically and forwarded to the Exception
   * state.
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[set]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * setTimeout(example.setByCallback('B'))
   * ```
   *
   */
  setByCallback<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  setByCallback(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  setByCallback(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createCallback(
      this.createDeferred(this.set.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[set]], returning a listener for setting the state.
   *
   * Errors need to be handled manually by binding the exception
   * state to the 'error' event (or equivalent).
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[set]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * emitter = new EventEmitter
   * emitter.on('ready', states.setByListener('A'))
   * emitter.on('error', states.addByListener('Exception'))
   * ```
   */
  setByListener<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (...params: any[]) => void
  setByListener(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (...params: any[]) => void
  setByListener(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createListener(
      this.createDeferred(this.set.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[set]], setting the requested states on the next
   * event loop's tick. Useful if you want to start with a fresh stack trace.
   *
   * See [[set]] for the params description.
   *
   * Example
   * ```
   * states = machine(['A', 'B', 'C'])
   * states.set('A')
   * states.setNext('B')
   * states.is() // -> ['A']
   * ```
   */
  setNext<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): number
  setNext(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): number
  setNext(target: any, states?: any, ...params: any[]): number {
    assert(target, 'First param required')
    // TODO closure
    let fn = this.set.bind(this)
    return this.setImmediate(fn, target, states, params)
  }

  /**
   * Adds specified states to the currently active ones.
   *
   * @param target OPTIONAL. Pass it if you want to execute a transition on an
   *   external machine, but using this machine's queue.
   * @param states Array of state names or a single state name.
   * @param params Params to be passed to the transition handlers (only the ones
   *   belonging to the explicitly requested states, not implied or auto
   *   states).
   * @return Result of the transition. `false` can mean that either the
   *   requested states weren't accepted or that the transition has been aborted
   *   by one of the negotiation handlers. `null` means that the machine is busy
   *   and the mutation has been queued.
   *
   * Basic usage
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.add 'A'
   * example.is() // -> ['A']
   * example.add('B')
   * example.is() // -> ['B']
   * ```
   *
   * State negotiation
   * ```
   * const example = machine(['A', 'B'])
   * // reject the transition with a negotiation handler
   * example.A_enter = function() {
   *   return false
   * }
   * example.add('A' ) // -> false
   * ```
   *
   * Adding a state on an external machine
   * ```
   * const m1 = machine(['A', 'B'])
   * const m2 = machine(['C', 'D'])
   *
   * m1.A_enter = function() {
   *   // this transition will be queued and executed after the current
   *   // transition is completed
   *   m1.add(m2, 'C') // -> null
   * }
   * ```
   */
  add<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): boolean | null
  add(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): boolean | null
  add(target: any, states?: any, ...params: any[]): boolean | null {
    assert(target, 'First param required')
    if (!(target instanceof AsyncMachine)) {
      // TODO test for `states === 0`
      if (states !== undefined) {
        params = params ? [states, ...params] : [states]
      }
      states = target
      target = this
    }

    this.enqueue_(MutationTypes.ADD, states, params, target)

    return this.processQueue_()
  }

  /**
   * Deferred version of [[add]], returning a node-style callback for adding
   * the state. Errors are handled automatically and forwarded to the Exception
   * state.
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[add]] for the params description.
   *
   * Example
   *
   * ```
   * const example = machine(['A', 'B', 'C'])
   * someNodeCallback('foo.com', example.addByCallback('B'))
   * ```
   */
  addByCallback<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  addByCallback(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  addByCallback(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createCallback(
      this.createDeferred(this.add.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[add]], returning a listener for adding the state.
   *
   * Errors need to be handled manually by binding the exception
   * state to the 'error' event (or equivalent).
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[add]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * emitter = new EventEmitter
   * emitter.on('ready', example.addByListener('A'))
   * emitter.on('error', example.addByListener('Exception'))
   * ```
   */
  addByListener<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (...params: any[]) => void
  addByListener(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (...params: any[]) => void
  addByListener(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createListener(
      this.createDeferred(this.add.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[add]], adding the requested states on the next event
   * loop's tick. Useful if you want to start with a fresh stack trace.
   *
   * See [[add]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.add('A')
   * example.addNext('B')
   * example.is() // -> ['A', 'B']
   * ```
   */
  addNext<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): number
  addNext(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): number
  addNext(target: any, states?: any, ...params: any[]): number {
    assert(target, 'First param required')
    // TODO closure
    let fn = this.add.bind(this)
    return this.setImmediate(fn, target, states, params)
  }

  /**
   * De-activates specified states if any of them is currently active.
   *
   * @param target OPTIONAL. Pass it if you want to execute a transition on an
   *   external machine, but using this machine's queue.
   * @param states Array of state names or a single state name.
   * @param params Params to be passed to the transition handlers (only the ones
   *   belonging to the explicitly requested states, not implied or auto
   *   states).
   * @return Result of the transition. `false` can mean that either the
   *   requested states weren't accepted or that the transition has been aborted
   *   by one of the negotiation handlers. `null` means that the machine is busy
   *   and the mutation has been queued.
   *
   * Basic usage
   * ```
   * const example = machine(['A', 'B', 'C'])
   * states.drop('A')
   * states.is() // -> ['A']
   * states.drop('B')
   * states.is() // -> ['B']
   * ```
   *
   * State negotiation
   * ```
   * const example = machine(['A', 'B'])
   * // reject the transition with a negotiation handler
   * states.A_enter = function() {
   *   return false
   * }
   * states.add('A') // -> false
   * ```
   *
   * Dropping a state on an external machine
   * ```
   * const m1 = machine(['A', 'B'])
   * const m2 = machine(['C', 'D'])
   *
   * m1.A_enter = function() {
   *   // this transition will be queued and executed after the current
   *   // transition is completed
   *   m1.drop(m2, 'C') // -> null
   * }
   * ```
   */
  drop<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): boolean | null
  drop(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): boolean | null
  drop(target: any, states?: any, ...params: any[]): boolean | null {
    assert(target, 'First param required')
    if (!(target instanceof AsyncMachine)) {
      if (states !== undefined) {
        params = params ? [states, ...params] : [states]
      }
      states = target
      target = this
    }

    this.enqueue_(MutationTypes.DROP, states, params, target)

    return this.processQueue_()
  }

  /**
   * Deferred version of [[drop]], returning a node-style callback for dropping
   * the state. Errors are handled automatically and forwarded to the Exception
   * state.
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[drop]] for the params description.
   *
   * Example
   *
   * ```
   * const example = machine(['A', 'B', 'C'])
   * someNodeCallback('foo.com', states.dropByCallback('B'))
   * ```
   */
  dropByCallback<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  dropByCallback(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void
  dropByCallback(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (err?: any, ...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createCallback(
      this.createDeferred(this.drop.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[drop]], returning a listener for dropping the state.
   *
   * Errors need to be handled manually by binding the exception
   * state to the 'error' event (or equivalent).
   *
   * After the call, the related promise object is available as the
   * [[last_promise]] attribute.
   *
   * See [[drop]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * emitter = new EventEmitter
   * emitter.on('ready', example.dropByListener('A'))
   * emitter.on('error', example.setByListener('Exception'))
   * ```
   */
  dropByListener<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates),
    ...params: any[]
  ): (...params: any[]) => void
  dropByListener(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): (...params: any[]) => void
  dropByListener(
    target: any,
    states?: (TStates | BaseStates)[] | (TStates | BaseStates) | any,
    ...params: any[]
  ): (...params: any[]) => void {
    assert(target, 'First param required')
    // TODO closure instead of bind
    return this.createListener(
      this.createDeferred(this.drop.bind(this), target, states, params)
    )
  }

  /**
   * Deferred version of [[drop]], dropping the requested states on the next
   * event loop's tick. Useful if you want to start with a fresh stack trace.
   *
   * See [[drop]] for the params description.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * states.add('A')
   * states.dropNext('A')
   * states.is('A') // -> true
   * ```
   */
  dropNext<S extends string>(
    target: AsyncMachine<S, IBind, IEmit>,
    states: (S | BaseStates)[] | (S | BaseStates),
    ...params: any[]
  ): number
  dropNext(
    target: (TStates | BaseStates)[] | (TStates | BaseStates),
    states?: any,
    ...params: any[]
  ): number
  dropNext(target: any, states?: any, ...params: any[]): number {
    assert(target, 'First param required')
    // TODO closure
    let fn = this.drop.bind(this)
    return this.setImmediate(fn, target, states, params)
  }

  /**
   * Pipes (forwards) a state to another machine.
   *
   * @param state Name of the state to pipe.
   * @param machine Target machine to which the state should be forwarded to.
   * @param target_state If the target state name should be different, this is
   *   that name. Applicable if only one state is being piped.
   * @param flags Different modes of piping. See [[PipeFlags]].
   *
   * Piping without negotiation
   * ```
   * const m1 = machine(['A', 'B', 'C'])
   * const m2 = machine(['A', 'B', 'C'])
   * m1.pipe('A', m2)
   * m1.add('A')
   * m2.is('A') // -> true
   * ```
   *
   * Piping with negotiation
   * ```
   * import { PipeFlags } from 'asyncmachine'
   * const m1 = machine(['A', 'B', 'C'])
   * const m2 = machine(['A', 'B', 'C'])
   * m2.A_enter = function() {
   *   return false
   * }
   * m1.pipe('A', m2, null, PipeFlags.NEGOTIATION)
   * m1.add('A')
   * m2.is('A') // -> false
   * ```
   */
  pipe<S extends string>(
    state: (TStates | BaseStates) | (TStates | BaseStates)[],
    machine: AsyncMachine<S, IBind, IEmit>,
    target_state?: S,
    flags = PipeFlags.FINAL
  ) {
    this.pipeBind(state, machine, target_state, flags)
  }

  /**
   * Pipes all the states from this machine to the `target`. Doesn't pipe the
   * `Exception` state.
   *
   * The exception state is never piped.
   *
   * @param target Target machine to which the state should be forwarded.
   */
  pipeAll(target: AsyncMachine<any, IBind, IEmit>, flags = PipeFlags.FINAL) {
    // Do not forward the Exception state
    let states_all = this.states_all.filter(state => state !== 'Exception')

    this.pipeBind(states_all, target, null, flags)
  }

  /**
   * Removes an existing pipe. All params are optional.
   *
   * @param states Source states. Empty means any state.
   * @param machine Target machine. Empty means any machine.
   * @param flags Pipe flags. Empty means any flags.
   *
   * TODO optimise, if needed
   */
  pipeRemove(
    states?: (TStates | BaseStates) | (TStates | BaseStates)[],
    machine?: AsyncMachine<any, IBind, IEmit>,
    flags = PipeFlags.FINAL
  ) {
    assert(!!flags, `Flags can't be 0`)
    // Add defaults when a sole INVERT requested
    if (flags == PipeFlags.INVERT) {
      flags = PipeFlags.INVERT | PipeFlags.FINAL
    }
    let bindings = flags ? this.getPipeBindings(flags) : null
    let event_types = flags && bindings ? Object.keys(bindings) : null
    let parsed_states = states ? this.parseStates(states) : null
    let to_emit: TAsyncMachine[] = []

    for (let [state, pipes] of Object.entries(this.piped)) {
      pipes = pipes as IPipedStateTarget[]
      // TODO remove casting once Object.entries() is typed correctly
      if (
        parsed_states &&
        !parsed_states.includes(state as TStates | BaseStates)
      )
        continue
      for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i]
        if (machine && machine !== pipe.machine) continue
        if (event_types && !event_types.includes(pipe.event_type)) continue
        this.removeListener(`${state}_${pipe.event_type}`, pipe.listener)
        pipes.splice(i, 1)
        // stay on the same index
        i--
        if (!to_emit.includes(pipe.machine)) {
          to_emit.push(pipe.machine)
        }
        if (!to_emit.includes(this as TAsyncMachine)) {
          to_emit.push(this as TAsyncMachine)
        }
      }
      if (!pipes.length) {
        delete this.piped[state]
      }
    }
    for (let machine of to_emit) {
      // TODO emit pipe-in-removed pipe-out-removed, passing the pipe binding
      machine.emit('pipe')
    }
  }

  /**
   * TODO should remove a binding returned by pipe() and pipeAll() methods
   */
  pipeRemoveBinding(/*binding*/) {
    throw new Error('TODO')
  }

  /**
   * Returns the current tick of the passed state.
   *
   * State's clock starts with 0 and on each activation gets incremented
   * by 1. Ticks lets you keep control flow's integrity across async listeners,
   * by aborting them once the state changes. Easiest way to get the tick-based
   * abort function is to use [[getAbort]].
   *
   * @param state Name of the state
   * @return Current tick of the passed state
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.add('A')
   * example.add('A')
   * example.clock('A') // -> 1
   * example.drop('A')
   * example.add('A')
   * example.clock('A') // -> 2
   * ```
   */
  clock(state: TStates | BaseStates): number {
    // @ts-ignore
    return this.clock_[state] || 0
  }

  /**
   * Creates a prototype child with it's own active states, clock, queue and
   * locks.
   *
   * Useful for creating new instances of machines created using the
   * [[machine]] factory in an efficient manner.
   *
   * Example
   * ```
   * const parent = machine(['A', 'B', 'C'])
   * const child = parent.createChild()
   *
   * child.add('A')
   * child.is() // -> ['A']
   * parent.is() // -> []
   * ```
   *
   * // TODO write a test
   */
  createChild(): this {
    // TODO check if during a transition
    const child = Object.create(this)
    child.states_active = []
    child.states_all = [...this.states_all]
    child.clock_ = {}
    child.queue_ = []
    child.lock = false
    child.lock_queue = false
    child.postponed_queue = false
    child._events = null
    child.piped = {}
    child.transition = null
    for (let state of this.states_all) {
      child.clock[state as string] = 0
    }
    return child
  }

  /**
   * Indicates if this instance is currently during a transition.
   *
   * When a machine is during a transition, all state changes will be queued
   * and executed once the transition and the previously queued state
   * changes are finished. See [[queue]].
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   *
   * example.A_enter = function() {
   *   this.duringTransition() // -> true
   * }
   *
   * example.A_state = function() {
   *   this.duringTransition() // -> true
   * }
   *
   * example.add('A')
   * ```
   */
  duringTransition(): boolean {
    return this.lock
  }

  /**
   * Returns the list of active states from which the current transition
   * started.
   *
   * Requires [[duringTranstion]] to be true or it'll throw.
   */
  from(): (TStates | BaseStates)[] {
    if (!this.transition || this.transition.machine !== this) {
      throw new Error(
        `[AsyncMachine] ${this.id()} not during an (own) transition`
      )
    }

    // TODO write a test
    return this.transition.before as (TStates | BaseStates)[]
  }

  /**
   * Returns the list of target states which are about to be active after the
   * transition finishes.
   *
   * Requires [[duringTranstion]] to be true or it'll throw.
   */
  to(): (TStates | BaseStates)[] {
    if (!this.transition || this.transition.machine !== this) {
      throw new Error(
        `[AsyncMachine] ${this.id()} not during an (own) transition`
      )
    }

    // TODO write a test
    return this.transition.states as (TStates | BaseStates)[]
  }

  /**
   * Returns an abort function, based on the current [[clock]] tick of the
   * passed state. Optionally allows to next an existing abort function.
   *
   * The abort function return a boolean `true` in case the flow for the
   * specific state should be aborted, because:
   * - the state has been de-activated (at least once)
   * - the nested abort function returns `true`
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   *
   * example.A_state = function() {
   *   const abort = this.getAbort('A')
   *   setTimeout( () => {
   *     if (abort()) return
   *     console.log('never reached')
   *   }, 0)
   * }
   *
   * example.add('A')
   * example.drop('A')
   * ```
   *
   * TODO support multiple states
   *
   * @param state Name of the state
   * @param abort Existing abort function (optional)
   * @return A new abort function
   */
  getAbort(state: TStates | BaseStates, abort?: () => boolean): () => boolean {
    var tick = this.clock(state)

    return this.getAbortFunction(state, tick, abort)
  }

  /**
   * Resolves the returned promise when all of the passed states are active
   * (at the same time). Accepts an optional abort function.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.when(['A', 'B']).then( () => {
   *   console.log('A, B')
   * }
   *
   * example.add('A')
   * example.add('B') // prints 'A, B'
   * ```
   *
   * TODO support push cancellation
   *
   * @param states List of state names
   * @param abort Existing abort function (optional)
   * @return Promise resolved once all states are set simultaneously.
   */
  when(
    states: (TStates | BaseStates) | (TStates | BaseStates)[],
    abort?: TAbortFunction
  ): Promise<null> {
    let states_parsed = this.parseStates(states)
    return new Promise<null>(resolve => {
      // early resolve if all the states are currently set
      if (this.is(states_parsed)) {
        return resolve()
      }
      this.bindToStates(states_parsed, resolve, abort)
    })
  }

  /**
   * Resolves the returned promise when all of the passed states are NOT active
   * (at the same time). Accepts an optional abort function.
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.when(['A', 'B']).then( () => {
   *   console.log('A, B')
   * }
   *
   * example.add('A')
   * example.add('B') // prints 'A, B'
   * ```
   *
   * TODO support push cancellation
   * TODO merge with `when(active, inactive)`
   *
   * @param states List of state names
   * @param abort Existing abort function (optional)
   * @return Promise resolved once all states are set simultaneously.
   */
  whenNot(
    states: (TStates | BaseStates) | (TStates | BaseStates)[],
    abort?: TAbortFunction
  ): Promise<null> {
    let states_parsed = this.parseStates(states)
    return new Promise<null>(resolve => {
      // early resolve if all the states are NOT currently set
      if (this.not(states_parsed)) {
        return resolve()
      }
      this.bindToNotStates(states_parsed, resolve, abort)
    })
  }

  /**
   * Enables debug messages sent to the console (or the custom handler).
   *
   * There's 4 log levels:
   * - 0: logging is off
   * - 1: displays only the state changes in a diff format
   * - 2: displays all operations which happened along with rejected state
   *   changes
   * - 3: displays more decision logic
   * - 4: displays everything, including all possible handlers
   *
   * Example
   * ```
   * const example = machine(['A', 'B', 'C'])
   * example.logLevel(1)
   * example.add('A')
   * // -> [add] state Enabled
   * // -> [state] +Enabled
   * ```
   *
   * @param prefix Prefix before all console messages.
   * @param level Error level (1-3).
   */
  logLevel(log_level: number | string): this
  logLevel(): number
  logLevel(log_level?: number | string): this | number {
    if (log_level !== undefined) {
      this.print_exception = Boolean(log_level)
      this.log_level_ = parseInt(log_level as string, 10)
      return this
    } else {
      return this.log_level_
    }
  }

  /**
   * Managed the ID of a machine.
   *
   * Sets or gets and also support returning a normalized version.
   *
   * Example
   * ```
   * const example = machine()
   * // set
   * example.id('a b c')
   * // get
   * example.id() // -> 'a b c'
   * // get normalized
   * example.id(true) // -> 'a-b-c'
   * ```
   */
  id(id: string): this
  id(get_normalized: true): string
  id(): string
  id(id?: any): this | string {
    if (id === true) {
      return (this.id_ || '')
        .replace(/[^\w\d]/g, '-')
        .replace(/-+/g, '-')
        .toLocaleLowerCase()
    }
    if (id !== undefined) {
      if (id != this.id_) {
        let old_id = this.id_
        this.id_ = id
        this.emit('id-changed', id, old_id)
      }
      return this
    } else return this.id_
  }

  /**
   * TODO docs
   * TODO rename TPipeBindings to TPipeBinding
   * TODO copy these to once() and emit()
   */
  // @ts-ignore
  on: TBind & IBind
  // @ts-ignore
  on(event: string, listener: Function, context?: Object): this {
    // if event is a NAME_state event, fire immediately if the state is set
    if (
      (event.slice(-6) === '_state' || event.slice(-6) === '_enter') &&
      this.is(event.slice(0, -6) as TStates | BaseStates)
    ) {
      this.catchPromise(listener.call(context))
      // if event is a NAME_end event, fire immediately if the state isnt set
    } else if (
      (event.slice(-4) === '_end' &&
        !this.is(event.slice(0, -4) as TStates | BaseStates)) ||
      (event.slice(-5) === '_exit' &&
        !this.is(event.slice(0, -5) as TStates | BaseStates))
    ) {
      this.catchPromise(listener.call(context))
    }

    super.on(event, listener, context)
    return this
  }

  /**
   * TODO docs
   * TODO extract eventToStateName(name: string): (TStates | States)
   *   and loose the type casting
   */
  // @ts-ignore
  once: TBind & IBind
  // @ts-ignore
  once(event: string, listener: Function, context?: Object): this {
    // is event is a NAME_state event, fire immediately if the state is set
    // and dont register the listener
    if (
      (event.slice(-6) === '_state' || event.slice(-6) === '_enter') &&
      this.is(event.slice(0, -6) as TStates | BaseStates)
    ) {
      this.catchPromise(listener.call(context))
      // is event is a NAME_end event, fire immediately if the state is not set
      // and dont register the listener
    } else if (
      (event.slice(-4) === '_end' &&
        !this.is(event.slice(0, -4) as TStates | BaseStates)) ||
      (event.slice(-5) === '_exit' &&
        !this.is(event.slice(0, -5) as TStates | BaseStates))
    ) {
      this.catchPromise(listener.call(context))
    } else {
      super.once(event, listener, context)
    }

    return this
  }
  // @ts-ignore
  emit: TEmit & IEmit

  /**
   * Binds the Exception state to the promise error handler. Handy when working
   * with promises.
   *
   * See [[Exception_state]].
   *
   * @param promise The promise to handle
   * @param target_states States for which the promise was created (the
   *   one that failed).
   * @return The source promise, for piping.
   */
  catchPromise<T>(promise: T, target_states?: (TStates | BaseStates)[]): T {
    if (isPromise(promise)) {
      promise.catch((error: any) => {
        this.add('Exception', error, target_states)
      })
    }
    return promise
  }

  /**
   * Diffs two state sets and returns the ones present only in the first one.
   *
   * @param states1 List of source states.
   * @param states2 List of states to diff against (picking up the non
   *   existing ones).
   * @return List of states in states1, but not in states2.
   */
  diffStates(
    states1: (TStates | BaseStates)[],
    states2: (TStates | BaseStates)[]
  ) {
    return states1.filter(name => !states2.includes(name))
  }

  /**
   * Push a new message to the log with an optional level (defaults to 1).
   *
   * @param {string} msg
   * @param {number} level
   */
  log(msg: string, level: number = 1) {
    for (const handler of this.log_handlers) {
      handler(msg, level)
    }
    if (level > this.log_level_) return

    let prefix = this.id() ? `[${this.id()}] ` : ''
    msg = prefix + msg

    console.log(msg)
  }

  /**
   * Returns a string representation of the machine using the [[statesToString]]
   * method.
   */
  toString() {
    return this.statesToString()
  }

  /**
   * Returns a string representation of the machine (name and the list of
   * states), optionally including the in-active states.
   *
   * @param include_inactive
   */
  statesToString(include_inactive = false): string {
    let ret = `${this.id()}\n`
    let footer = ''
    for (const state of this.states_all) {
      if (this.states_active.includes(state)) {
        ret += `    ${state} (${this.clock(state)})\n`
      } else if (include_inactive) {
        footer += `    -${state} (${this.clock(state)})\n`
      }
    }
    return ret + footer
  }

  // PRIVATES

  protected getPipeBindings(flags = PipeFlags.FINAL): TPipeBindings {
    const pf = PipeFlags
    flags = flags || pf.FINAL
    const bindings = {}
    if (flags & pf.INVERT) {
      if (flags & pf.FINAL) {
        bindings['state'] = 'drop'
        bindings['end'] = 'add'
      }
      if (flags & pf.NEGOTIATION || flags & pf.NEGOTIATION_ENTER) {
        bindings['enter'] = 'drop'
      }
      if (flags & pf.NEGOTIATION || flags & pf.NEGOTIATION_EXIT) {
        bindings['exit'] = 'add'
      }
    } else {
      if (flags & pf.FINAL) {
        bindings['state'] = 'add'
        bindings['end'] = 'drop'
      }
      if (flags & pf.NEGOTIATION || flags & pf.NEGOTIATION_ENTER) {
        bindings['enter'] = 'add'
      }
      if (flags & pf.NEGOTIATION || flags & pf.NEGOTIATION_EXIT) {
        bindings['exit'] = 'drop'
      }
    }
    // @ts-ignore
    return bindings
  }

  protected getPipeFlagsLabels(flags: PipeFlags) {
    const names = Object.keys(PipeFlags).filter(
      key => !isNaN(Number(PipeFlags[key]))
    )
    const ret = []
    for (const flag of names) {
      if (flags & PipeFlags[flag]) {
        ret.push(PipeFlagsLabels[flag])
      }
    }
    return ret
  }

  // TODO overload signatures for the optional requested_state
  // TODO rename machine to target and target to machine, as its confusing
  protected pipeBind<S extends string>(
    states: (TStates | BaseStates) | (TStates | BaseStates)[],
    machine: AsyncMachine<S, IBind, IEmit>,
    requested_state?: S | null,
    flags = PipeFlags.FINAL
  ) {
    const pf = PipeFlags
    assert(!!flags, `Flags can't be 0`)
    // Add defaults when a sole INVERT requested
    if (flags == pf.INVERT) {
      flags = pf.INVERT | pf.FINAL
    }
    let bindings = this.getPipeBindings(flags)
    let parsed_states = this.parseStates(states)

    if (requested_state && typeof requested_state !== 'string')
      throw new Error('target_state has to be string or null')

    const is_negotiation = bindings['enter'] || bindings['exit']

    if (is_negotiation && flags & pf.LOCAL_QUEUE) {
      throw new Error('Cant pipe with negotiation into a local queue')
    }

    let tags = this.getPipeFlagsLabels(flags).join(':')

    if (parsed_states.length == 1 && parsed_states[0] == requested_state)
      this.log(
        `[pipe:${tags}] '${
          parsed_states[0]
        }' as '${requested_state}' to '${machine.id()}'`,
        2
      )
    else
      this.log(
        `[pipe:${tags}] '${parsed_states.join(', ')}' to '${machine.id()}'`,
        2
      )

    let emit_on: AsyncMachine<any, IBind, IEmit>[] = []

    for (let state of parsed_states) {
      // accept a different name only when one state is piped
      let target_state: S =
        (parsed_states.length == 1 && requested_state) || (state as S)

      for (let [event_type, method_name] of Object.entries(bindings)) {
        // TODO extract
        let pipe_listener = () => {
          let target = flags && flags & PipeFlags.LOCAL_QUEUE ? this : machine
          if (this.transition) {
            this.transition.addStep(
              [machine.id(true), target_state as string],
              [this.id(true), state as string],
              TransitionStepTypes.PIPE
            )
          }
          const ret = target[method_name](machine, target_state)
          // return only for negotiation pipes
          if (['enter', 'exit'].includes(event_type)) {
            // TODO check both lock of both of the machines
            if (target.duringTransition()) {
              this.log(
                `[pipe] Negotiation not possible, machine ${target.id(
                  true
                )} during a transition`,
                2
              )
            }
            // TODO add a canceled step in case of negotiation and a negative
            // result
            return ret
          }
        }
        // TODO extract
        // TODO check for duplicates
        if (!this.piped[state]) {
          this.piped[state] = []
        }
        // @ts-ignore
        this.piped[state].push({
          state: target_state,
          machine: machine,
          event_type: event_type as TStateMethod,
          flags,
          listener: pipe_listener
        })
        // assert target states
        machine.parseStates(target_state)
        // setup the forwarding listener
        // TODO listener-less piping
        // read from #pipes directly, inside the transition
        this.on(`${state}_${event_type}` as 'ts-dynamic', pipe_listener)
      }

      if (!emit_on.includes(this)) {
        emit_on.push(this)
      }
      if (machine !== (this as TAsyncMachine) && !emit_on.includes(machine)) {
        emit_on.push(machine)
      }
    }

    for (let machine of emit_on) {
      // TODO emit pipe-in and pipe-out, on source and target respectively
      // passing the pipe binding
      machine.emit('pipe')
    }
  }

  /**
   * Override for EventEmitter method calling a specific listener. Binds to
   * a promise if returned by the listener.
   *
   * TODO incorporate into EE, saving one call stack frame
   */
  protected callListener(
    listener: Function,
    context: Object,
    params: any[]
  ): any {
    var ret = listener.apply(context, params)

    // assume params[0] are the target states of the transition
    return this.catchPromise(ret, params[0])
  }

  // TODO make it cancellable
  setImmediate(fn: Function, ...params: any[]) {
    if (setImmediate) {
      return setImmediate.apply(null, [fn].concat(params))
    } else {
      return setTimeout(fn.apply(null, params), 0)
    }
  }

  /**
   * Return `true` if the current state differs from the `states_before`.
   *
   * @param states_before List of previously active states.
   */
  hasStateChanged(states_before: (TStates | BaseStates)[]): boolean {
    const length_equals = this.is().length === states_before.length

    return (
      !length_equals ||
      Boolean(this.diffStates(states_before, this.is()).length)
    )
  }

  /**
   * Parse state names, check if they exist and always return an array. Throws
   * in of an error.
   *
   * @param states State names to check
   * @return An array of valid state names.
   */
  parseStates(
    states: (TStates | BaseStates) | (TStates | BaseStates)[]
  ): (TStates | BaseStates)[] {
    // TODO remove duplicates
    const states_parsed = (<(TStates | BaseStates)[]>[]).concat(states)

    return states_parsed.filter(state => {
      // @ts-ignore Cant use this.get() here
      const exists = this[state]
      if (typeof state !== 'string' || !exists) {
        let id = this.id() ? ` in the machine "${this.id()}"` : ''
        throw new NonExistingStateError(`State "${state}" doesn't exist${id}`)
      }

      return true
    })
  }

  /**
   * Returns the JSON structure of states along with their relations.
   *
   * @return JSON version of the current machine. Valid input for the
   *   [[machine]] factory.
   */
  states(): { [K in TStates | BaseStates]: IState<TStates> } {
    let ret: { [K in TStates | BaseStates]?: IState<TStates> } = {}
    for (let state of this.states_all) {
      ret[state] = this.get(state)
    }
    return ret as { [K in TStates | BaseStates]: IState<TStates> }
  }

  /*
	 * Puts a transition in the queue, handles a log msg and unifies the states
	 * array.
	 * 
	 * TODO generic for the machine param?
	 */
  private enqueue_(
    type: MutationTypes,
    states: (TStates | BaseStates)[] | (TStates | BaseStates),
    params: any[] = [],
    target: AsyncMachine<any, IBind, IEmit> = this
  ): void {
    const type_label = MutationTypes[type].toLowerCase()
    const states_parsed = target.parseStates(states)

    let queue = this.queue_
    if (this.duringTransition()) {
      if (this.transition && this.transition.source_machine !== this) {
        // TODO log msg for using the parent queue
        queue = this.transition.source_machine.queue_
      }
      if (target !== this) {
        this.log(
          `[queue:${type_label}] [${target.id()}]` +
            ` ${states_parsed.join(', ')}`,
          2
        )
      } else {
        this.log(`[queue:${type_label}] ${states_parsed.join(', ')}`, 2)
      }
    }

    queue.push([type, states_parsed, params, false, target])
  }

  // Goes through the whole queue collecting return values.
  private processQueue_(): boolean | null {
    if (!this.queue_.length) return false
    let queued = false
    if (this.lock_queue) {
      this.log(`[postpone] postponing the transition, the queue is running`, 3)
      queued = true
    } else if (this.lock) {
      // instance is during a transition from an external queue
      // wait for it to finish OR schedule this queue somehow
      // 			this.log(`[abort] Aborting queue processing, machine locked`, 3)
      this.log(
        `[postpone] postponing the transition, machine locked by another` +
          ` one`,
        3
      )
      queued = true
      if (!this.postponed_queue) {
        this.postponed_queue = true
        this.once('queue-end', () => {
          this.postponed_queue = false
          this.log('[resume] resuming an aborted queue', 3)
          this.processQueue_()
        })
      }
    }
    if (queued) {
      this.emit('queue-changed')
      // queued mutation requests return `null`
      // TODO write a test
      return null
    }
    let ret: boolean[] = []
    this.lock_queue = true
    let row: IQueueRow | undefined
    while ((row = this.queue_.shift())) {
      if (!row[QueueRowFields.TARGET]) {
        row[QueueRowFields.TARGET] = this
      }
      this.transition = new Transition(this, row)
      // TODO do the queue checks here, per each entry and postpone if busy
      // expose the current transition also on the target machine
      row[QueueRowFields.TARGET].transition = this.transition
      ret.push(this.transition.exec())
      // GC the transition
      row[QueueRowFields.TARGET].transition = null
    }
    // GC the transition
    this.transition = null
    this.lock_queue = false
    this.emit('queue-end')
    return ret[0] || false
  }

  private createDeferred(
    fn: Function,
    target:
      | AsyncMachine<any, IBind, IEmit>
      | (TStates | BaseStates)
      | (TStates | BaseStates)[],
    states: (TStates | BaseStates) | (TStates | BaseStates)[] | any,
    state_params: any[]
  ): Deferred {
    // TODO use the current transition's states if available (for enter/exit
    // transitions)
    var transition_states = this.is()

    var params: any[] = [target]
    if (states) {
      params.push(states)
    }
    if (state_params.length) {
      params.push.apply(params, state_params)
    }

    const async_states = [].concat(
      params[0] instanceof AsyncMachine ? params[1] : params[0]
    )
    const gc = function() {
      // GC
      deferred = null
      resolve = null
      reject = null
    }
    let deferred: Deferred | null = new Deferred()
    let resolve: Function | null = deferred.resolve
    let reject: Function | null = deferred.reject
    deferred.resolve = callback_params => {
      try {
        const ret = fn.apply(null, params.concat(callback_params))
        if (resolve) resolve(ret)
      } catch (err) {
        const ret = this.add('Exception', err, transition_states, async_states)
        if (reject) reject(ret)
      } finally {
        gc()
      }
    }
    deferred.reject = err => {
      const ret = this.add('Exception', err, transition_states, async_states)
      if (reject) reject(ret)
      gc()
    }

    this.last_promise = deferred.promise

    return deferred
  }

  private createCallback(
    deferred: Deferred
  ): (err?: any, ...params: any[]) => void {
    return (err: any = null, ...params: any[]) => {
      if (err) {
        return deferred.reject(err)
      } else {
        return deferred.resolve(params)
      }
    }
  }

  private createListener(deferred: Deferred): (...params: any[]) => void {
    return (...params: any[]) => deferred.resolve(params)
  }

  /**
   * Sets the new active states incrementing the counters.
   *
   * @return An array of previously active states.
   */
  setActiveStates_(
    explicite_states: (TStates | BaseStates)[],
    target: (TStates | BaseStates)[]
  ): (TStates | BaseStates)[] {
    let previous = this.states_active
    let new_states = this.diffStates(target, this.states_active)
    let removed_states = this.diffStates(this.states_active, target)
    let nochange_states = this.diffStates(target, new_states)
    this.states_active = target
    // Tick all the new states and the explicit multi states
    for (let state of target) {
      let data = this.get(state)
      if (
        !previous.includes(state) ||
        (explicite_states.includes(state) && data.multi)
      ) {
        // @ts-ignore
        this.clock_[state]++
      }
    }

    // construct a logging msg
    const log_msg: string[] = []
    if (new_states.length) {
      log_msg.push('+' + new_states.join(' +'))
    }

    if (removed_states.length) {
      log_msg.push('-' + removed_states.join(' -'))
    }
    // TODO fix
    if (nochange_states.length && this.log_level_ > 2) {
      if (new_states.length || removed_states.length) {
        log_msg.push('\n    ')
      }
      log_msg.push(nochange_states.join(', '))
    }
    if (log_msg.length) {
      this.log('[state] ' + log_msg.join(' '), 1)
    }

    return previous
  }

  /**
   * Returns an object for a given handler.
   * @param name Handler's name
   */
  getMethodContext(name: string): Object | null {
    if (
      this.target &&
      this.target[name] &&
      this.target[name] instanceof Function
    ) {
      return this.target
    } else if (this[name] && this[name] instanceof Function) {
      return this
    }
    return null
  }

  // TODO bind to _enter and _exit as well to support the negotiation phase in
  // piped events
  private bindToStates(
    states: (TStates | BaseStates)[],
    listener: Function,
    abort?: TAbortFunction
  ) {
    const enter = () => {
      let should_abort = abort && abort()
      if (!should_abort && this.is(states)) listener()

      if (this.is(states)) {
        this.log(`[bind:off] ${states.join(', ')}`, 3)
        for (let state of states) this.removeListener(`${state}_state`, enter)
      }
    }

    this.log(`[bind:on] ${states.join(', ')}`, 3)
    for (let state of states) this.on(`${state}_state` as 'ts-dynamic', enter)
  }

  // TODO bind to _enter and _exit as well to support the negotiation phase in
  // piped events
  // TODO merge with #with as `.with(['A', 'B'], ['C']) runs when `+A+B-C`
  private bindToNotStates(
    states: (TStates | BaseStates)[],
    listener: Function,
    abort?: TAbortFunction
  ) {
    const exit = () => {
      let should_abort = abort && abort()
      if (!should_abort && this.not(states)) listener()

      if (this.not(states)) {
        this.log(`[bind:off] ${states.join(', ')}`, 3)
        for (let state of states) this.removeListener(`${state}_end`, exit)
      }
    }

    this.log(`[bind:on] ${states.join(', ')}`, 3)
    for (let state of states) this.on(`${state}_end` as 'ts-dynamic', exit)
  }

  // TODO compose abort functions without recursion
  private getAbortFunction(
    state: TStates | BaseStates,
    tick: number,
    abort?: () => boolean
  ): () => boolean {
    return () => {
      let quit = false
      let msg = ''
      if (abort && abort()) {
        quit = true
        msg = 'the parent abort function has quit'
      } else if (!this.is(state)) {
        quit = true
        msg = 'the state is not set'
      } else if (!this.is(state, tick)) {
        quit = true
        msg = 'the has tick changed'
      }

      if (quit) {
        this.log(
          `[abort] ${state}; reason - ${msg}\n\t${this.is().join(', ')}`,
          1
        )
        return true
      }

      return false
    }
  }
}

function isPromise(promise: any): promise is Promise<any> {
  return promise && promise.then && promise.catch
}
