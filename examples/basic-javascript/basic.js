var am = require('../../build/pkg/build.js').main()

function QueryFetcher() {
	this.results = {}
	// Call the super contructor.
	am.AsyncMachine.call(this)
	// Turn on logging with a prefix.
	this.debugStates('[fetcher]')
	// Init states when logging is on or pass to the super contructor.
	this.initStates( ['ExecQuery1', 'ExecQuery2'] )
}
function Inherit() {
	this.constructor = QueryFetcher
}
Inherit.prototype = am.AsyncMachine.prototype
var p = QueryFetcher.prototype = new Inherit 
 
p.state_Start = {}
p.state_ExecQuery1 = {}
p.state_ExecQuery2 = {}
p.state_ExecQuery3 = {
	auto: true,
	requires: [ 'Query1Done', 'Query2Done' ]
}
p.state_ExecQuery4 = {
	auto: true,
	requires: [ 'Query1Done' ]
}	
p.state_Done = {
	auto: true,
	requires: [ 'Query1Done', 'Query2Done', 'Query3Done', 'Query4Done' ]
}	

p.state_Query1Done = {}
p.state_Query2Done = {}
p.state_Query3Done = {}
p.state_Query4Done = {}
p.state_Result = {}

p.ExecQuery1_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query1Done', 'Result']) )
}
p.ExecQuery2_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query2Done', 'Result']) )
}
p.ExecQuery3_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query3Done', 'Result']) )
}
p.ExecQuery4_enter = function() {
	this.query( 'foo bar baz', this.addStateLater( ['Query4Done', 'Result']) )
}

// Collect results from every callback.
p.Result_enter = function() {
	// Redirect to self transition, to keep it concise.
	this.Result_Result.apply( this, arguments )
}
p.Result_Result = function(states, params, callback_params) {
	this.results[ states[0] ] = callback_params[0]
}

// Mocked method
p.query = function( query, next ) {
	setTimeout(function() {
		next( query )
	}, 0)
}

// Usage outside of an AM object (eg a dynamic one)
var fetcher = new QueryFetcher()
// This will work even if fetcher is already done.
fetcher.on('Done.enter', function() {
	console.log( fetcher.results )
})
