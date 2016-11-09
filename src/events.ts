import Transition from "./transition";
import {
    ITransitionStep,
    TPipeBindings,
} from './types'


export interface IBind {
	on(event: 'tick', listener:
		(before: string[]) => boolean | undefined, context?: Object): this;
	on(event: 'id-changed', listener:
		(new_id: string, old_id: string) => boolean | undefined, context?: Object): this;
	on(event: 'transition-init', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	on(event: 'transition-start', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	on(event: 'transition-end', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	on(event: 'transition-step', listener:
		(...steps: ITransitionStep[]) => boolean | undefined, context?: Object): this;
	on(event: 'pipe', listener:
		(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// TODO
	// on(event: 'pipe-in', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// on(event: 'pipe-out', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// on(event: 'pipe-in-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// on(event: 'pipe-out-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	on(event: 'state-registered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	on(event: 'state-deregistered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	// State events
	// TODO optional params
	on(event: 'Exception_enter', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> boolean | undefined, context?: Object): this;
	on(event: 'Exception_state', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> any, context?: Object): this;
	on(event: 'Exception_exit', listener: () => boolean | undefined, context?: Object): this;
	on(event: 'Exception_end', listener: () => any, context?: Object): this;
	on(event: 'Exception_Any', listener: () => boolean | undefined, context?: Object): this;
	on(event: 'Any_Exception', listener: () => boolean | undefined, context?: Object): this;
}

export interface IEmit {
	emit(event: 'tick', before: string[]): this;
	emit(event: 'id-changed', new_id: string, old_id: string): this;
	emit(event: 'transition-init', transition: Transition): this;
	emit(event: 'transition-start', transition: Transition): this;
	emit(event: 'transition-end', transition: Transition): this;
	emit(event: 'transition-step', ...steps: ITransitionStep[]): this;
	emit(event: 'pipe', pipe: TPipeBindings): this;
	// TODO
	// emit(event: 'pipe-in', pipe: TPipeBindings): this;
	// emit(event: 'pipe-out', pipe: TPipeBindings): this;
	// emit(event: 'pipe-in-removed', pipe: TPipeBindings): this;
	// emit(event: 'pipe-out-removed', pipe: TPipeBindings): this;
	emit(event: 'state-registered', state: string): this;
	emit(event: 'state-deregistered', state: string): this;
	// State events
	// TODO optional params
	emit(event: 'Exception_enter', err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[]): this;
	emit(event: 'Exception_state', err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[]): this;
	emit(event: 'Exception_exit'): this;
	emit(event: 'Exception_end'): this;
	emit(event: 'Exception_Any'): this;
	emit(event: 'Any_Exception'): this;
}