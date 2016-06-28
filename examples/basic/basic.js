var asyncmachine = require('../../build/asyncmachine.cjs.js')


class States extends asyncmachine.AsyncMachine {
	constructor(...params) {
		super(...params)

		this.A = {}
	}
}

class QueryFetcherStates extends asyncmachine.AsyncMachine {
	constructor(target) {
		super(target)
		this.registerAll()
		this.debug('', 1)
	}
}

Object.mixin(QueryFetcherStates.prototype, {
	Enabled: {},

	Query1Running: {auto: true, requires: ['Enabled']},
	Query1Done: {},

	Query2Running: {auto: true, requires: ['Enabled']},
	Query2Done: {},

	Query3Running: {
		auto: true,
		requires: ['Query1Done', 'Query2Done', 'Enabled']
	},
	Query3Done: {},

	Query4Running: {
		auto: true,
		requires: ['Query1Done', 'Enabled']
	},
	Query4Done: {},

	Result: {},

	Done: {
		auto: true,
		requires: ['Query1Done', 'Query2Done', 'Query3Done', 'Query4Done']
	}
})


class QueryFetcher {
	constructor() {
		this.results = {}

		this.states = new QueryFetcherStates(this)
		this.states.add('Enabled')
	}

	Query1Running_state() {
		this.query('foo',
			this.states.addByCallback(['Query1Done', 'Result'])
		)
	}
	Query2Running_state() {
		this.query('bar',
			this.states.addByCallback(['Query2Done', 'Result'])
		)
	}
	Query3Running_state() {
		this.query('foo bar',
			this.states.addByCallback(['Query3Done', 'Result'])
		)
	}
	Query4Running_state() {
		this.query('baz',
			this.states.addByCallback(['Query4Done', 'Result'])
		)
	}

	// Collect results from every callback.

	// First state enter
	Result_state(states, result) {
		this.results[states[0]] = result
	}

	// Active state self transition
	Result_Result(states, result) {
		this.Result_state(states, result)
	}

	// Mocked async method
	query(query, next) {
		setTimeout(() => {
			next( null, query )
		}, 0)
	}
}


var fetcher = new QueryFetcher()

// This will work even if fetcher is already done.
fetcher.states.on('Done_state', () => {
	console.log( fetcher.results )
})
