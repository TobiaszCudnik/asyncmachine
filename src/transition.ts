import AsyncMachine from './asyncmachine'
import {
  TransitionException,
  StateChangeTypes,
  IQueueRow,
  QueueRowFields,
  TransitionStepTypes,
  IStateStruct,
  ITransitionStep,
  StateRelations,
  TransitionStepFields,
  StateStructFields,
  IBind,
  IEmit
} from './types'
// @ts-ignore
import * as uuidProxy from 'simple-random-id'

const uuid = (<any>uuidProxy).default || uuidProxy

/**
 * TODO make it easier to parse
 */
interface IEvent {
  0: string
  1: any[]
}

/**
 * The Transition class is responsible for encapsulating a single mutation
 * for a single machine. In can be created by a different machine than it's
 * mutating. End users usually don't have to deal with it at all, as the most
 * important data it carries for them is exposed as `instance.to()` and
 * `instance.from()` methods and it's events are also emitted on the
 * machine itself.
 *
 * TODO freeze the attributes
 */
export default class Transition {
  id = uuid()
  // ID of the machine which initiated the transition
  source_machine: AsyncMachine<any, IBind, IEmit>
  // queue of events to fire
  private events: IEvent[] = []
  // states before the transition
  before: string[]
  // target states after parsing the relations
  states: string[] = []
  // array of enter transition to execute
  enters: string[] = []
  // array of exit transition to execute
  exits: string[] = []
  // was the transition accepted?
  accepted = true
  // source queue row
  row: IQueueRow
  // list of steps with machine IDs
  steps: ITransitionStep[] = []
  // was transition cancelled during negotiation?
  cancelled: boolean = false

  // target machine on which the transition is supposed to happen
  get machine(): AsyncMachine<any, IBind, IEmit> {
    return this.row[QueueRowFields.TARGET]
  }
  // is it an auto-state transition?
  get auto(): boolean {
    return this.row[QueueRowFields.AUTO] || false
  }
  // type of the transition
  get type(): StateChangeTypes {
    return this.row[QueueRowFields.STATE_CHANGE_TYPE]
  }
  // explicitly requested states
  get requested_states(): string[] {
    return this.row[QueueRowFields.STATES]
  }
  // params passed to the transition
  get params(): any[] {
    return this.row[QueueRowFields.PARAMS]
  }

  constructor(source_machine: AsyncMachine<any, IBind, IEmit>, row: IQueueRow) {
    this.source_machine = source_machine
    this.row = row
    this.before = this.machine.is()

    this.machine.emit('transition-init', this)

    let type = this.type
    let states = this.requested_states
    this.addStepsFor(states, null, TransitionStepTypes.REQUESTED)

    const types = StateChangeTypes
    const type_label = types[type].toLowerCase()
    if (this.auto)
      this.machine.log(`[${type_label}:auto] state ${states.join(', ')}`, 3)
    else this.machine.log(`[${type_label}] ${states.join(', ')}`, 2)

    let states_to_set: string[] = []

    switch (type) {
      case types.DROP:
        states_to_set = this.machine.states_active.filter(
          state => !states.includes(state)
        )
        this.addStepsFor(states, null, TransitionStepTypes.DROP)
        break
      case types.ADD:
        states_to_set = [...states, ...this.machine.states_active]
        this.addStepsFor(
          this.machine.diffStates(states_to_set, this.machine.states_active),
          null,
          TransitionStepTypes.SET
        )
        break
      case types.SET:
        states_to_set = states
        this.addStepsFor(
          this.machine.diffStates(states_to_set, this.machine.states_active),
          null,
          TransitionStepTypes.SET
        )
        this.addStepsFor(
          this.machine.diffStates(this.machine.states_active, states_to_set),
          null,
          TransitionStepTypes.DROP
        )
        break
    }

    this.resolveRelations(states_to_set)

    let implied_states = this.machine.diffStates(this.states, states_to_set)
    if (implied_states.length)
      this.machine.log(
        `[${type_label}:implied] ${implied_states.join(', ')}`,
        2
      )

    this.setupAccepted()

    if (this.accepted) {
      this.setupExitEnter()
    }
  }

  exec(): boolean {
    let machine = this.machine
    let aborted = !this.accepted
    let hasStateChanged = false

    machine.emit('transition-start', this)

    // check if the machine isnt already during a transition
    // TODO ideally we would postpone the transition instead of cancelling it
    // TODO move to parseQueue()
    if (machine.lock) {
      this.addStepsFor(this.requested_states, null, TransitionStepTypes.CANCEL)
      machine.emit('transition-cancelled', this)
      machine.emit('transition-end', this)
      const msg =
        `[cancelled:${this.source_machine.id(true)}] Target machine` +
        `"${machine.id()}" already during a transition, use a shared` +
        `queue. Requested states: ${this.requested_states.join(
          ', '
        )}, source states: ${this.before.join(', ')}`
      console.warn(msg)
      machine.log(msg, 1)
      return false
    }

    machine.transition = this
    this.events = []
    machine.lock = true

    try {
      // NEGOTIATION CALLS PHASE (cancellable)

      // self transitions
      if (!aborted && this.type != StateChangeTypes.DROP) {
        aborted = this.self() === false
      }

      // exit transitions
      if (!aborted) {
        for (let state of this.exits) {
          if (false === this.exit(state)) {
            aborted = true
            this.addStep(state, null, TransitionStepTypes.CANCEL)
            continue
          }
        }
      }
      // enter transitions
      if (!aborted) {
        for (let state of this.enters) {
          if (false === this.enter(state)) {
            aborted = true
            this.addStep(state, null, TransitionStepTypes.CANCEL)
            continue
          }
        }
      }

      // STATE CALLS PHASE (non cancellable)
      if (!aborted) {
        // TODO extract
        machine.setActiveStates_(this.requested_states, [...this.states])
        this.processPostTransition()
        hasStateChanged = machine.hasStateChanged(this.before)
        if (hasStateChanged) {
          machine.emit('tick', this.before)
        }
      }
    } catch (ex) {
      // TODO extract
      let err = ex as TransitionException
      aborted = true
      // Its an exception to an exception when the exception throws...
      // an exception
      if (
        err.transition &&
        (err.transition.match(/^Exception_/) ||
          err.transition.match(/_Exception$/))
      ) {
        // TODO honor this.machine.print_exception
        machine.setImmediate(() => {
          throw err.err
        })
      } else {
        let queued_exception: IQueueRow = [
          StateChangeTypes.ADD,
          ['Exception'],
          [err.err, this.states, this.before, err.transition],
          false,
          machine
        ]
        // drop the queue created during the transition
        // @ts-ignore
        this.source_machine.queue_.unshift(queued_exception)
      }
    }

    machine.transition = null
    machine.lock = false

    if (aborted) {
      machine.emit('transition-cancelled', this)
    } else if (hasStateChanged && !this.row[QueueRowFields.AUTO]) {
      var auto_states = this.prepareAutoStates()
      if (auto_states)
        // prepend auto states to the beginning of the queue
        // @ts-ignore
        this.source_machine.queue_.unshift(auto_states)
      // target.queue_.unshift(auto_states)
    }

    machine.emit('transition-end', this)
    this.events = []

    if (aborted) return false

    // If this's a DROP transition, check if all explicit states has been
    // dropped.
    if (this.row[QueueRowFields.STATE_CHANGE_TYPE] === StateChangeTypes.DROP) {
      return machine.not(this.row[QueueRowFields.STATES])
    } else {
      return machine.is(this.states)
    }
  }

  setupAccepted() {
    // Dropping states doesn't require an acceptance
    // Auto-states can be set partially
    if (this.type !== StateChangeTypes.DROP && !this.auto) {
      let not_accepted = this.machine.diffStates(
        this.requested_states,
        this.states
      )
      if (not_accepted.length) {
        this.machine.log(`[cancelled:rejected] ${not_accepted.join(', ')}`, 3)
        this.addStepsFor(not_accepted, null, TransitionStepTypes.CANCEL)
        this.accepted = false
      }
    }
  }

  resolveRelations(states: string[]): void {
    states = this.machine.parseStates(states)
    states = this.parseImplies_(states)
    states = this.removeDuplicateStates_(states)

    // Check if state is blocked or excluded
    var already_blocked: string[] = []

    // Parsing required states allows to avoid cross-dropping of states
    states = this.parseRequires_(states)

    // Remove states already blocked.
    states = states.reverse().filter(name => {
      let blocked_by = this.isStateBlocked_(states, name)
      blocked_by = blocked_by.filter(
        blocker_name => !already_blocked.includes(blocker_name)
      )

      if (blocked_by.length) {
        already_blocked.push(name)
        // if state wasn't implied by another state (was one of the current
        // states) then make it a higher priority log msg
        let level = this.machine.is(name) ? 2 : 3
        this.machine.log(`[rel:drop] ${name} by ${blocked_by.join(', ')}`, level)
        if (this.machine.is(name)) {
          this.addStep(name, null, TransitionStepTypes.DROP)
        } else {
          this.addStep(name, null, TransitionStepTypes.NO_SET)
        }
      }
      return !blocked_by.length
    })

    // states dropped by the states which about to be set
    const to_drop = states.reduce((ret: string[], name: string) => {
      const state = this.machine.get(name)
      if (state.drop) {
        ret.push(...state.drop)
      }
      return ret
    }, [])
    states = this.parseImplies_(states).filter(n => !to_drop.includes(n))
    states = this.removeDuplicateStates_(states)
    // Parsing required states allows to avoid cross-dropping of states
    this.states = this.parseRequires_(states.reverse())
    this.orderStates_(this.states)
  }

  // TODO log it better
  // Returns a queue entry with auto states
  // TODO should pass them through resolveRelations() ?
  prepareAutoStates(): IQueueRow | null {
    var add: string[] = []

    for (let state of this.machine.states_all) {
      let is_current = () => this.machine.is(state)
      let is_blocked = () =>
        this.machine.is().some(current => {
          let relations = this.machine.get(current)
          if (!relations.drop) {
            return false
          }
          return relations.drop.includes(state)
        })

      if (this.machine.get(state).auto && !is_current() && !is_blocked()) {
        add.push(state)
      }
    }

    if (add.length) {
      return [StateChangeTypes.ADD, add, [], true, this.machine]
    }

    return null
  }

  // Collect implied states
  parseImplies_(states: string[]): string[] {
    let ret = [...states]
    let changed = true
    let visited: string[] = []
    while (changed) {
      changed = false
      for (let name of ret) {
        let state = this.machine.get(name)
        if (visited.includes(name) || !state.add) continue
        this.addStepsFor(
          state.add,
          name,
          TransitionStepTypes.RELATION,
          StateRelations.ADD
        )
        this.addStepsFor(state.add, null, TransitionStepTypes.SET)
        ret.push(...state.add)
        visited.push(name)
        changed = true
      }
    }

    return ret
  }

  // Check required states
  // Loop until no change happens, as states can require themselves in a vector.
  parseRequires_(states: string[]): string[] {
    let length_before = 0
    let not_found_by_states: { [name: string]: string[] } = {}
    while (length_before !== states.length) {
      length_before = states.length
      states = states.filter(name => {
        let state = this.machine.get(name)
        let not_found: string[] = []
        for (let req of state.require || []) {
          this.addStep(
            req,
            name,
            TransitionStepTypes.RELATION,
            StateRelations.REQUIRE
          )
          // TODO if required state is auto, add it (avoid an inf loop)
          if (!states.includes(req)) {
            not_found.push(req)
            this.addStep(name, null, TransitionStepTypes.NO_SET)
            if (this.requested_states.includes(name)) {
              this.addStep(req, null, TransitionStepTypes.CANCEL)
            }
          }
        }

        if (not_found.length) {
          not_found_by_states[name] = not_found
        }

        return !not_found.length
      })
    }

    if (Object.keys(not_found_by_states).length) {
      let names: string[] = []
      for (let [state, not_found] of Object.entries(not_found_by_states))
        names.push(`${state}(-${not_found.join(' -')})`)

      if (this.auto) {
        this.machine.log(`[rejected:auto] ${names.join(' ')}`, 3)
      } else {
        this.machine.log(`[rejected] ${names.join(' ')}`, 2)
      }
    }

    return states
  }

  /**
   * Returns the subset of states which block the state name.
   */
  isStateBlocked_(states: string[], name: string): string[] {
    var blocked_by: string[] = []
    for (let name2 of states) {
      let state = this.machine.get(name2)
      if (state.drop && state.drop.includes(name)) {
        this.addStep(
          name,
          name2,
          TransitionStepTypes.RELATION,
          StateRelations.DROP
        )
        blocked_by.push(name2)
      }
    }

    return blocked_by
  }

  orderStates_(states: string[]): void {
    states.sort((name1, name2) => {
      var state1 = this.machine.get(name1)
      var state2 = this.machine.get(name2)
      var ret = 0
      if (state1.after && state1.after.includes(name2)) {
        ret = 1
        this.addStep(
          name2,
          name1,
          TransitionStepTypes.RELATION,
          StateRelations.AFTER
        )
      } else {
        if (state2.after && state2.after.includes(name1)) {
          ret = -1
          this.addStep(
            name1,
            name2,
            TransitionStepTypes.RELATION,
            StateRelations.AFTER
          )
        }
      }
      return ret
    })
  }

  // TODO use a module
  removeDuplicateStates_(states: string[]): string[] {
    let found = {}

    return states.filter(name => {
      if (found[name]) return false
      found[name] = true
      return true
    })
  }

  setupExitEnter(): void {
    let from = this.machine.states_active.filter(
      state => !this.states.includes(state)
    )

    this.orderStates_(from)

    // queue the exit transitions
    for (let state of from) this.exits.push(state)

    // queue the enter transitions
    for (let state of this.states) {
      // dont enter to already set states, except when it's a MULTI state
      // TODO write tests for multi state
      if (
        this.machine.is(state) &&
        !(
          this.machine.get(state).multi && this.requested_states.includes(state)
        )
      ) {
        continue
      }

      this.enters.push(state)
    }
  }

  // Executes self transitions (eg ::A_A) based on active states.
  self() {
    return !this.requested_states.some(state => {
      // only the active states
      if (!this.machine.is(state)) return false

      let ret = true
      let name = `${state}_${state}`
      // pass the transition params only to the explicite states
      let params = this.requested_states.includes(state) ? this.params : []
      let context = this.machine.getMethodContext(name)

      try {
        if (context) {
          this.machine.log('[transition] ' + name, 2)
          this.addStep(state, state, TransitionStepTypes.TRANSITION, name)
          ret = context[name](...params)
          this.machine.catchPromise(ret, this.states)
        } else {
          this.machine.log('[transition] ' + name, 4)
        }

        if (ret === false) {
          this.machine.log(`[cancelled:self] ${state}`, 2)
          this.addStep(state, null, TransitionStepTypes.CANCEL)
          return true
        }

        ret = this.machine.emit(name as 'ts-dynamic', ...params)
      } catch (err) {
        throw new TransitionException(err, name)
      }

      if (ret !== false) {
        this.events.push([name, params])
      }

      if (ret === false) {
        this.machine.log(`[cancelled:self] ${state}`, 2)
        this.addStep(state, null, TransitionStepTypes.CANCEL)
        return true
      }
      return false
    })
  }

  enter(to: string) {
    let params = this.requested_states.includes(to) ? this.params : []
    let ret = this.transitionExec_('Any', to, 'any_' + to, params)
    if (ret === false) return false

    return this.transitionExec_(to, null, to + '_enter', params)
  }

  // Exit transition handles state-to-state methods.
  exit(from: string) {
    let transition_params: any[] = []
    // this means a 'drop' transition
    if (this.requested_states.includes(from)) {
      transition_params = this.params
    }

    let ret = this.transitionExec_(
      from,
      null,
      from + '_exit',
      transition_params
    )
    if (ret === false) return false

    ret = this.states.some(state => {
      let transition = from + '_' + state
      transition_params = this.requested_states.includes(state)
        ? this.params
        : []
      ret = this.transitionExec_(from, state, transition, transition_params)
      return ret === false
    })

    if (ret === true) return false

    return !(this.transitionExec_(from, 'Any', from + '_any') === false)
  }

  transitionExec_(
    from: string,
    to: string | null,
    method: string,
    params: string[] = []
  ) {
    const context = this.machine.getMethodContext(method)
    let ret

    try {
      if (context) {
        this.machine.log('[transition] ' + method, 2)
        this.addStep(from, to, TransitionStepTypes.TRANSITION, method)
        ret = context[method](...params)
        this.machine.catchPromise(ret, this.states)
      } else {
        this.machine.log('[transition] ' + method, 4)
      }

      if (ret !== false) {
        let is_exit = method.slice(-5) === '_exit'
        let is_enter = !is_exit && method.slice(-6) === '_enter'
        // TODO bad bad bad
        if (is_exit || is_enter) {
          this.events.push([method, params])
        }
        ret = this.machine.emit(method as 'ts-dynamic', ...params)
        if (ret === false) {
          this.machine.log(
            `[cancelled] ${this.states.join(', ')} by the event ${method}`,
            2
          )
        }
      } else {
        this.machine.log(
          `[cancelled] ${this.states.join(', ')} by the method ${method}`,
          2
        )
      }
    } catch (err) {
      throw new TransitionException(err, method)
    }

    return ret
  }

  // TODO this is hacky, should be integrated into processTransition
  // the names arent the best way of queueing transition calls
  processPostTransition() {
    let transition: IEvent | undefined
    while ((transition = this.events.shift())) {
      let name = transition[0]
      let params = transition[1]
      let is_enter = false
      let state: string
      let method: string

      if (name.slice(-5) === '_exit') {
        state = name.slice(0, -5)
        method = state + '_end'
      } else if (name.slice(-6) === '_enter') {
        is_enter = true
        state = name.slice(0, -6)
        method = state + '_state'
      } else {
        // self transition
        continue
      }

      try {
        const context = this.machine.getMethodContext(method)
        if (context) {
          this.machine.log('[transition] ' + method, 2)
          this.addStep(state, null, TransitionStepTypes.TRANSITION, name)
          let ret = context[method](...params)
          this.machine.catchPromise(ret, this.machine.is())
        } else {
          this.machine.log('[transition] ' + method, 4)
        }

        this.machine.emit(method as 'ts-dynamic', ...params)
      } catch (err) {
        err = new TransitionException(err, method)
        // TODO addStep for TransitionStepTypes.EXCEPTION
        this.processPostTransitionException(state, is_enter)
        throw err
      }
    }
  }

  // TODO REFACTOR
  processPostTransitionException(state: string, is_enter: boolean) {
    const states_active = [...this.machine.states_active]
    let transition: IEvent | undefined
    // remove non transitioned states from the active list
    // in case there was an exception thrown while settings them
    while ((transition = this.events.shift())) {
      let name = transition[0]
      let state: string

      if (name.slice(-5) === '_exit') {
        state = name.slice(0, -5)
        states_active.push(state)
      } else if (name.slice(-6) === '_enter') {
        state = name.slice(0, -6)
        states_active.splice(states_active.indexOf(state), 1)
      }
    }
    // handle the state which caused the exception
    if (is_enter) {
      states_active.splice(states_active.indexOf(state), 1)
    } else {
      states_active.push(state)
    }
    // override the active states, reverting the un-executed transitions
    this.machine.states_active = states_active
    this.machine.log(
      `[exception] from ${state}, forced states to ${states_active.join(', ')}`
    )
    this.machine.log('[state:force] ' + states_active.join(', '), 1)
  }

  /**
   * Marks a steps relation between two states during the transition.
   */
  addStep(
    target: string | IStateStruct,
    source?: string | IStateStruct | null,
    type?: TransitionStepTypes,
    data?: any
  ): void {
    let step = this.addStepData(target, source, type, data)
    this.machine.emit('transition-step', step)
  }

  /**
   * Marks a steps relation between two states during the transition.
   */
  addStepData(
    target: string | IStateStruct,
    source?: string | IStateStruct | null,
    type?: TransitionStepTypes,
    data?: any
  ): ITransitionStep {
    let state = Array.isArray(target)
      ? (target as IStateStruct)
      : ([this.machine.id(true), target as string] as IStateStruct)
    let source_state: IStateStruct | undefined

    if (source) {
      source_state = Array.isArray(source)
        ? (source as IStateStruct)
        : [this.machine.id(true), source as string]
    }

    let step: ITransitionStep = [state, source_state, type, data]
    this.steps.push(step)
    return step
  }

  /**
   * Same as [[addStep]], but produces a step for many targets.
   */
  addStepsFor(
    targets: string[] | IStateStruct[],
    source?: string | IStateStruct | null,
    type?: TransitionStepTypes,
    data?: any
  ): void {
    // TODO `targets as string[]` required as of TS 2.0
    let steps: ITransitionStep[] = (targets as string[]).map(target => {
      return this.addStepData(target, source, type, data)
    })
    this.machine.emit('transition-step', ...steps)
  }

  /**
   * Produces a readable list of steps states.
   *
   * Example:
   * ```
   * A   REQUESTED
   * D   REQUESTED
   * A   SET
   * D   SET
   * D -> B   RELATION   add
   * D -> C   RELATION   add
   * B   SET
   * C   SET
   * E -> D   RELATION   drop
   * E   DROP
   * ```
   *
   * TODO loose casts once condition guards work again
   */
  toString() {
    let fields = TransitionStepFields
    let s = StateStructFields
    let types = TransitionStepTypes

    return this.steps
      .map(touch => {
        let line = ''
        if (touch[fields.SOURCE_STATE]) {
          line +=
            (touch[fields.SOURCE_STATE] as IStateStruct)[s.STATE_NAME] + ' -> '
        }
        line += touch[fields.STATE][s.STATE_NAME]
        line += '   '
        if (touch[fields.TYPE]) {
          line += types[touch[fields.TYPE] as TransitionStepTypes]
        }
        if (touch[fields.DATA]) {
          line += '   ' + touch[fields.DATA]
        }

        return line
      })
      .join('\n')
  }
}
