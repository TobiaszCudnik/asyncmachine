/**
AsyncMachine Exception Example
 *
This example presents a simple fault tolerance (retrying) using the
Exception state

Scroll down to see the log output.

@link https://github.com/TobiaszCudnik/asyncmachine
 */

const { machine } = require('asyncmachine')
require('source-map-support').install()

const example = machine(['Stable', 'Broken'])
  .id('')
  .logLevel(2)

// state negotiation
example.Broken_enter = function() {
  let clock = this.clock('Exception')
  console.log('Exception clock ==', clock)
  if (clock > 5) {
    console.log('Too many errors, quitting')
    return false
  }
}

// state set
example.Broken_state = function() {
  throw Error('random exception')
}

// use the state negotiation for fault tolerance
example.Exception_state = function(
  err,
  target_states,
  base_states,
  exception_src_handler,
  async_target_states
) {
  // try to rescue the Broken state
  if (target_states.includes('Broken')) {
    console.log('Retrying the Broken state')
    this.drop('Exception')
    this.add('Broken')
  }
}

example.add(['Stable', 'Broken'])
console.log('state', example.is())

/*
Log output (level 2):

[add] Stable, Broken
[transition] Broken_enter
Exception clock == 0
[state] +Stable +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 1
[state] +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 2
[state] +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 3
[state] +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 4
[state] +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 5
[state] +Broken
[transition] Broken_state
[exception] from Broken, forced states to Stable
[state:force] Stable
[add] Exception
[state] +Exception
[transition] Exception_state
Retrying the Broken state
[queue:drop] Exception
[queue:add] Broken
[drop] Exception
[state] -Exception
[add] Broken
[transition] Broken_enter
Exception clock == 6
Too many errors, quitting
[cancelled] Broken, Stable by the method Broken_enter
state [ 'Stable' ]

*/
