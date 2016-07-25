const asyncmachine = require('../../build/asyncmachine.cjs.js')
const assert = require('assert')
require('source-map-support').install()


const states = asyncmachine.factory({
  SometimesBroken: {},
  A: { implies: ['SometimesBroken'] },
  B: {}
})

states.id('').logLevel(3)

// states.A_enter = function() {
//     if (this.clock('Exception') > 5) {
//         console.log('Too many errors, quitting')
//         return false
//     }
// }

states.SometimesBroken_enter = function() {
  console.log('clock', this.clock('Exception'))
  if (this.clock('Exception') > 5) {
    console.log('Too many errors, quitting')
    return false
  }
}

states.SometimesBroken_state = function() {
  throw Error('random exception')
}

// use the state negotiation for fault tolerance
states.Exception_state = function(states, err, exception_states, async_target_states) {
  // try to rescue the A state
  if (~states.indexOf('SometimesBroken')) {
    console.log('Retrying the SometimesBroken state')
    this.add('SometimesBroken')
    this.drop('Exception')
  }
}

states.add('A')
console.log('states', states.is())