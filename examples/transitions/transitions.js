/**
 * AsyncMachine Transition Handlers Example
 *
 * This example shows various types of Transition Handlers and the way params
 * get passed to them:
 * - negotiation handlers
 * - final handlers
 * - self handlers
 *
 * It also makes use of Relations (`add`) to present the difference between
 * Requested and Implied states.
 *
 * The handlers are using `this.to()` and `this.is()` methods fetch the Target
 * States of transitions.
 *
 * Scroll down to see log outputs.
 *
 * @link https://github.com/TobiaszCudnik/asyncmachine
 */

const { machine } = require('asyncmachine')
const assert = require('assert')

const example = machine({
  Requested: { add: ['Implied'] },
  Implied: {},
  Delayed: {}
})
example.id('').logLevel(3)

// SETUP TRANSITIONS

example.Requested_enter = function(name, value) {
	// target states inside of a negotiation handler are available as `this.to()`
  assert(this.to().includes('Requested'))
  assert(this.to().includes('Implied'))
  assert(name == 'john')
  assert(value == 5)
}

example.Requested_state = function(name, value) {
  assert(this.is().includes('Requested'))
  assert(this.is().includes('Implied'))
  assert(name == 'john')
  assert(value == 5)

  this.addByListener('Delayed')(name, value)
}

example.Implied_state = function(name, value) {
  assert(this.is().includes('Requested'))
  assert(this.is().includes('Implied'))
  // only the Requested states get the call params passed through
  assert(name === undefined)
  assert(value === undefined)
}

example.Delayed_state = function(name, value) {
  assert(this.is().includes('Delayed'))
  assert(this.is().includes('Requested'))
  assert(this.is().includes('Implied'))
  assert(name == 'john')
  assert(value == 5)

  // this will trigger a self transition, using the node-style callback
  this.addByCallback('Delayed')(null, name, value)
}

example.Delayed_Delayed = function(name, value) {
  assert(this.is().includes('Delayed'))
  assert(this.is().includes('Requested'))
  assert(this.is().includes('Implied'))
  assert(name == 'john')
  assert(value == 5)
}

// RUN

example.add('Requested', 'john', 5)

/*
Log output (level 3):

[add] Requested
[add:implied] Implied
[transition] Requested_enter
[state] +Requested +Implied
[transition] Requested_state
[queue:add] Delayed
[postpone] postponing the transition, the queue is running
[transition] Implied_state
[add] Delayed
[state] +Delayed
     Requested, Implied
[transition] Delayed_state
[queue:add] Delayed
[postpone] postponing the transition, the queue is running
[add] Delayed
[transition] Delayed_Delayed
[state] Delayed, Requested, Implied
*/
