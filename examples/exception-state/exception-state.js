const asyncmachine = require('../../build/asyncmachine.cjs.js')
const assert = require('assert')
require('source-map-support').install()


/**
 * This example presents a simple fault tolerance (retrying) using the Exception state.
 * 
 * Log level 2 output:
[add] A
[add:implied] SometimesBroken
[transition] SometimesBroken_enter
clock 0
[states] +A +SometimesBroken
[transition] SometimesBroken_state
[exception] from SometimesBroken, forced states to A
[add] Exception
[add:implied] SometimesBroken
[transition] SometimesBroken_enter
clock 0
[states] +Exception +SometimesBroken
[transition] Exception_state
[transition] SometimesBroken_state
[exception] from SometimesBroken, forced states to Exception, A
[add] Exception
[add:implied] SometimesBroken
[transition] SometimesBroken_enter
clock 1
[states] +SometimesBroken
[transition] Exception_state
[transition] SometimesBroken_state
[exception] from SometimesBroken, forced states to Exception, A
[add] Exception
[add:implied] SometimesBroken
[transition] SometimesBroken_enter
clock 2
[states] +SometimesBroken
[transition] Exception_state
[transition] SometimesBroken_state
[exception] from SometimesBroken, forced states to Exception, A
[add] Exception
[add:implied] SometimesBroken
[transition] SometimesBroken_enter
clock 3                                                                                                                                                        
[states] +SometimesBroken                                                                                                                                      
[transition] Exception_state                                                                                                                                   
[transition] SometimesBroken_state                                                                                                                             
[exception] from SometimesBroken, forced states to Exception, A                                                                                                
[add] Exception                                                                                                                                                
[add:implied] SometimesBroken                                                                                                                                  
[transition] SometimesBroken_enter                                                                                                                             
clock 4                                                                                                                                                        
[states] +SometimesBroken                                                                                                                                      
[transition] Exception_state                                                                                                                                   
[transition] SometimesBroken_state                                                                                                                             
[exception] from SometimesBroken, forced states to Exception, A                                                                                                
[add] Exception                                                                                                                                                
[add:implied] SometimesBroken                                                                                                                                  
[transition] SometimesBroken_enter                                                                                                                             
clock 5                                                                                                                                                        
[states] +SometimesBroken                                                                                                                                      
[transition] Exception_state                                                                                                                                   
[transition] SometimesBroken_state                                                                                                                             
[exception] from SometimesBroken, forced states to Exception, A                                                                                                
[add] Exception                                                                                                                                                
[add:implied] SometimesBroken                                                                                                                                  
[transition] SometimesBroken_enter                                                                                                                             
clock 6                                                                                                                                                        
Too many errors, quitting                                                                                                                                      
[cancelled] Exception, A, SometimesBroken by the method SometimesBroken_enter                                                                                  
states [ 'Exception', 'A' ]
 */

const states = asyncmachine.factory({
  SometimesBroken: {},
  A: { add: ['SometimesBroken'] },
  B: {}
})

states.id('').logLevel(2)

// state negotiation
states.SometimesBroken_enter = function() {
  console.log('clock', this.clock('Exception'))
  if (this.clock('Exception') > 5) {
    console.log('Too many errors, quitting')
    return false
  }
}

// state set
states.SometimesBroken_state = function() {
  throw Error('random exception')
}

// use the state negotiation for fault tolerance
states.Exception_state = function(err, target_states, base_states, 
    exception_transition, async_target_states) {
  // try to rescue the SometimesBroken state
  if (~target_states.indexOf('SometimesBroken')) {
    console.log('Retrying the SometimesBroken state')
    this.add('SometimesBroken')
    this.drop('Exception')
  }
}

states.add('A')
console.log('states', states.is())