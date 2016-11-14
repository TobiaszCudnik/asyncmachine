let states = Object.keys({

	Enabled: {},

	Syncing: {
		auto: true,
		require: ['Enabled'],
		drop: ['Synced', 'Restart']
	},
	Synced: {
		drop: ['Syncing'],
		require: ['CompletedTasksSynced', 'ThreadsToTasksSynced',
			'TasksToThreadsSynced', 'CompletedThreadsSynced']
	},

	Restart: {
		drop: ['TasksFetched', 'CompletedTasksSynced', 'ThreadsToTasksSynced',
			'TasksToThreadsSynced', 'CompletedThreadsSynced', 'TasksCached']
	},

	// list
	PreparingList: {
		auto: true,
		require: ['Syncing'],
		drop: ['ListReady']
	},
	ListReady: {
		drop: ['PreparingList']
	},

	// tasks
	FetchingTasks: {
		auto: true,
		require: ['Syncing', 'ListReady'],
		drop: ['TasksFetched']
	},
	TasksFetched: {
		require: ['ListReady'], 
		drop: ['FetchingTasks']
	},
	TasksCached: {},

	// thread-to-tasks
	SyncingThreadsToTasks: {
		auto: true,
		require: ['Syncing', 'TasksFetched', 'MsgsFetched'],
		drop: ['ThreadsToTasksSynced']
	},
	ThreadsToTasksSynced: {
		drop: ['SyncingThreadsToTasks']
	},

	// tasks-to-threads
	SyncingTasksToThreads: {
		auto: true,
		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
		drop: ['TasksToThreadsSynced']
	},
	TasksToThreadsSynced: {
		drop: ['SyncingTasksToThreads']
	},

	// complete threads
	SyncingCompletedThreads: {
		auto: true,
		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
		drop: ['CompletedThreadsSynced']
	},
	CompletedThreadsSynced: {
		drop: ['SyncingCompletedThreads']
	},

	// complete tasks
	SyncingCompletedTasks: {
		auto: true,
		require: ['Syncing', 'TasksFetched', 'ThreadsFetched'],
		drop: ['CompletedTasksSynced']
	},
	CompletedTasksSynced: {
		drop: ['SyncingCompletedTasks']
	},

//	SyncingTaskNames: {}

	// ----- External States

	ThreadsFetched: {},

	MsgsFetched: {},
})

// TODO skip state call for exception
states.push('Exception')

console.log(`
export enum States {
${states.map(name=>(
`    ${name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()} = <any>'${name}'`
)).join(',\n')}
}
`)
