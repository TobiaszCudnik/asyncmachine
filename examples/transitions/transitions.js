const asyncmachine = require('../../build/asyncmachine.cjs.js')
const assert = require('assert')
require('source-map-support').install()


// SETUP THE MDirectCHINES DirectND LOGGING


const states = asyncmachine.factory({
	Direct: { implies: ['Implied'] },
	Implied: {},
	Delayed: {}
})
states.id('').logLevel(1)


// SETUP TRANSITIONS


states.Direct_enter = function(target_states, name, value) {
	assert(~target_states.indexOf('Direct'))
	assert(~target_states.indexOf('Implied'))
	assert(name == 'john')
	assert(value == 5)
}

states.Direct_state = function(target_states, name, value) {
	assert(~target_states.indexOf('Direct'))
	assert(~target_states.indexOf('Implied'))
	assert(name == 'john')
	assert(value == 5)

	this.addByListener('Delayed')(name, value)
}

states.Implied_state = function(target_states, name, value) {
	assert(~target_states.indexOf('Direct'))
	assert(~target_states.indexOf('Implied'))
	// only the direct states get the call params passed through
	assert(name === undefined)
	assert(value === undefined)
}

states.Delayed_state = function(target_states, name, value) {
	assert(~target_states.indexOf('Delayed'))
	assert(~target_states.indexOf('Direct'))
	assert(~target_states.indexOf('Implied'))
	assert(name == 'john')
	assert(value == 5)

	// this gonna trigger a self transition, using the node callback style
	this.addByCallback('Delayed')(null, name, value)
}

states.Delayed_Delayed = function(target_states, name, value) {
	assert(~target_states.indexOf('Delayed'))
	assert(~target_states.indexOf('Direct'))
	assert(~target_states.indexOf('Implied'))
	assert(name == 'john')
	assert(value == 5)
}


// RUN

states.add('Direct', 'john', 5)


/*
Log output (level 3):

[add] Direct
[transition] any_Direct
[transition] Direct_enter
[transition] any_Implied
[transition] Implied_enter
[states] +Direct +Implied
[transition] Direct_state
[transition] Implied_state
[add] Delayed
[transition] any_Delayed
[transition] Delayed_enter
[states] +Delayed 
	Direct, Implied
[transition] Delayed_state
[add] Delayed
[transition] Delayed_Delayed
[states] Delayed, Direct, Implied
*/
