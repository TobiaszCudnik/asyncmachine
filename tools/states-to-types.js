const fs = require('fs')
const path = require('path')
const asyncmachine = require('..')

if (!process.argv[2]) {
	console.log(`USAGE:

1. Print to the console
node states-to-type.js SOURCE_FILE.js

2. Save as a "SOURCE_FILE-types.ts" file
node states-to-type.js SOURCE_FILE.js -s`)
	process.exit(0)
}

const filename = path.join(process.cwd(), process.argv[2])

let states
if (filename.match(/\.json$/))
	states = JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }))
else {
	let mod = require(filename)
	states = mod.States || mod.default || mod

	if (states.constructor) {
		let instance = new states
		if (instance instanceof asyncmachine.default)
			states = (new states).states_all
	} else
		states = Object.keys(states)
}

// 	{

// 	Enabled: {},

// 	Syncing: {
// 		auto: true,
// 		require: ['Enabled'],
// 		drop: ['Synced', 'Restart']
// 	},
// 	Synced: {
// 		drop: ['Syncing'],
// 		require: ['CompletedTasksSynced', 'ThreadsToTasksSynced',
// 			'TasksToThreadsSynced', 'CompletedThreadsSynced']
// 	},

// 	Restart: {
// 		drop: ['TasksFetched', 'CompletedTasksSynced', 'ThreadsToTasksSynced',
// 			'TasksToThreadsSynced', 'CompletedThreadsSynced', 'TasksCached']
// 	},

// 	// list
// 	PreparingList: {
// 		auto: true,
// 		require: ['Syncing'],
// 		drop: ['ListReady']
// 	},
// 	ListReady: {
// 		drop: ['PreparingList']
// 	},

// 	// tasks
// 	FetchingTasks: {
// 		auto: true,
// 		require: ['Syncing', 'ListReady'],
// 		drop: ['TasksFetched']
// 	},
// 	TasksFetched: {
// 		require: ['ListReady'], 
// 		drop: ['FetchingTasks']
// 	},
// 	TasksCached: {},

// 	// thread-to-tasks
// 	SyncingThreadsToTasks: {
// 		auto: true,
// 		require: ['Syncing', 'TasksFetched', 'MsgsFetched'],
// 		drop: ['ThreadsToTasksSynced']
// 	},
// 	ThreadsToTasksSynced: {
// 		drop: ['SyncingThreadsToTasks']
// 	},

// 	// tasks-to-threads
// 	SyncingTasksToThreads: {
// 		auto: true,
// 		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
// 		drop: ['TasksToThreadsSynced']
// 	},
// 	TasksToThreadsSynced: {
// 		drop: ['SyncingTasksToThreads']
// 	},

// 	// complete threads
// 	SyncingCompletedThreads: {
// 		auto: true,
// 		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
// 		drop: ['CompletedThreadsSynced']
// 	},
// 	CompletedThreadsSynced: {
// 		drop: ['SyncingCompletedThreads']
// 	},

// 	// complete tasks
// 	SyncingCompletedTasks: {
// 		auto: true,
// 		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
// 		drop: ['CompletedTasksSynced']
// 	},
// 	CompletedTasksSynced: {
// 		drop: ['SyncingCompletedTasks']
// 	},

// //	SyncingTaskNames: {}

// 	// ----- External States

// 	ThreadsFetched: {},

// 	MsgsFetched: {},
// })

// TODO skip state call for exception
states.push('Exception')
let transitions = []

for (let state1 of states) {
    for (let state2 of states) {
        if (state1 == state2) {
            if (state1 == 'Exception')
                continue
            state2 = 'Any'
        }
        transitions.push(state1 + '_' + state2)
    }
}

states = states.filter(state=> state != 'Exception')

let output = `
export interface IBind {

${states.map(name=>(
`    // ${name}
    (event: '${name}_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: '${name}_state', listener: (/* param1, param2 */) => any, context?: Object): this;
`)).join('')}
}

export interface IEmit {

${states.map(name => (
	`    // ${name}
    (event: '${name}_enter' /*, param1, param2 */): this;
    (event: '${name}_state' /*, param1, param2 */): this;
`)).join('')}
}

export type TStates = '${states.join("'\n  | '")}';

export type TTransitions = '${transitions.join("'\n  | '")}';

export interface IBind {

    // Non-params events
${states.map(name=>(
`    (event: '${name}_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: '${name}_end', listener: () => any, context?: Object): this;
`)).join('')}
    // Transitions
    (event: TTransitions): this;
}

export interface IEmit {
    // Non-params events
${states.map(name=>(
`    (event: '${name}_exit'): this;
    (event: '${name}_end'): this;
`)).join('')}
    // Transitions
    (event: TTransitions): boolean;
}
`

if (process.argv[3] == '-s')
	fs.writeFileSync(filename.replace(/(\.[^.]+$)/, '-types.ts'), output)
else
	console.log(output)