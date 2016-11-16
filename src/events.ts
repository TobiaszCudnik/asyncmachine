import Transition from "./transition";
import {
    ITransitionStep,
    TPipeBindings,
} from './types'

// TODO support
// - pipe
// - when
// - add / set / get 
// - all of their variants
// Try to use "mapped types" to type call params per state 


// 2nd approach, use with "<IBind, IEmit>"

export interface IBind {
	(event: 'tick', listener:
		(before: string[]) => boolean | undefined, context?: Object): this;
	(event: 'id-changed', listener:
		(new_id: string, old_id: string) => boolean | undefined, context?: Object): this;
	(event: 'transition-init', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	(event: 'transition-start', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	(event: 'transition-end', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	(event: 'transition-step', listener:
		(...steps: ITransitionStep[]) => boolean | undefined, context?: Object): this;
	(event: 'pipe', listener:
		(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// TODO
	// (event: 'pipe-in', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// (event: 'pipe-out', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// (event: 'pipe-in-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// (event: 'pipe-out-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	(event: 'state-registered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	(event: 'state-deregistered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	(event: 'transition-cancelled', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	// State events
	// TODO optional params
	(event: 'Exception_enter', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> boolean | undefined, context?: Object): this;
	(event: 'Exception_state', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> any, context?: Object): this;
	(event: 'Exception_exit', listener: () => boolean | undefined, context?: Object): this;
	(event: 'Exception_end', listener: () => any, context?: Object): this;
	(event: 'Exception_Any', listener: () => boolean | undefined, context?: Object): this;
	(event: 'Any_Exception', listener: () => boolean | undefined, context?: Object): this;
	// skip compiler errors for dynamic calls
	(event: 'ts-dynamic', listener: Function): this;
}

export interface IEmit {
	(event: 'tick', before: string[]): boolean;
	(event: 'id-changed', new_id: string, old_id: string): boolean;
	(event: 'transition-init', transition: Transition): boolean;
	(event: 'transition-start', transition: Transition): boolean;
	(event: 'transition-end', transition: Transition): boolean;
	(event: 'transition-step', ...steps: ITransitionStep[]): boolean;
	// (event: 'pipe', pipe: TPipeBindings): boolean;
	(event: 'pipe'): boolean;
	// TODO
	// (event: 'pipe-in', pipe: TPipeBindings): boolean;
	// (event: 'pipe-out', pipe: TPipeBindings): boolean;
	// (event: 'pipe-in-removed', pipe: TPipeBindings): boolean;
	// (event: 'pipe-out-removed', pipe: TPipeBindings): boolean;
	(event: 'state-registered', state: string): boolean;
	(event: 'state-deregistered', state: string): boolean;
	(event: 'transition-cancelled', transition: Transition): boolean;
	// State events
	// TODO optional params
	(event: 'Exception_enter', err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[]): boolean;
	(event: 'Exception_state', err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[]): boolean;
	(event: 'Exception_exit'): boolean;
	(event: 'Exception_end'): boolean;
	(event: 'Exception_Any'): boolean;
	(event: 'Any_Exception'): boolean;
	// skip compiler errors for dynamic calls
	(event: 'ts-dynamic', ...params: any[]): boolean;
}

// 2nd approach, use with "implements IEvents"
/**
 * TODO missing here:
 * - transition-cancelled
 * - ts-dynamic
 */

export interface IEvents {
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

	once(event: 'tick', listener:
		(before: string[]) => boolean | undefined, context?: Object): this;
	once(event: 'id-changed', listener:
		(new_id: string, old_id: string) => boolean | undefined, context?: Object): this;
	once(event: 'transition-init', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	once(event: 'transition-start', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	once(event: 'transition-end', listener:
		(transition: Transition) => boolean | undefined, context?: Object): this;
	once(event: 'transition-step', listener:
		(...steps: ITransitionStep[]) => boolean | undefined, context?: Object): this;
	once(event: 'pipe', listener:
		(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// TODO
	// once(event: 'pipe-in', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// once(event: 'pipe-out', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// once(event: 'pipe-in-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	// once(event: 'pipe-out-removed', listener:
	// 	(pipe: TPipeBindings) => boolean | undefined, context?: Object): this;
	once(event: 'state-registered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	once(event: 'state-deregistered', listener:
		(state: string) => boolean | undefined, context?: Object): this;
	// State events
	// TODO optional params
	once(event: 'Exception_enter', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> boolean | undefined, context?: Object): this;
	once(event: 'Exception_state', listener: (err: Error, target_states: string[],
		base_states: string[], exception_transition: string, async_target_states?: string[])
		=> any, context?: Object): this;
	once(event: 'Exception_exit', listener: () => boolean | undefined, context?: Object): this;
	once(event: 'Exception_end', listener: () => any, context?: Object): this;
	once(event: 'Exception_Any', listener: () => boolean | undefined, context?: Object): this;
	once(event: 'Any_Exception', listener: () => boolean | undefined, context?: Object): this;

	emit(event: 'tick', before: string[]): this;
	emit(event: 'id-changed', new_id: string, old_id: string): this;
	emit(event: 'transition-init', transition: Transition): this;
	emit(event: 'transition-start', transition: Transition): this;
	emit(event: 'transition-end', transition: Transition): this;
	emit(event: 'transition-step', ...steps: ITransitionStep[]): this;
	// emit(event: 'pipe', pipe: TPipeBindings): this;
	emit(event: 'pipe'): this;
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