/*
	exec: ->
		task_lists = @getTaskLists

		for name, data of @config.queries
			continue if name is 'label_defaults'

			@query = data
			@query_name = name

			res = @getListForQuery name, data
			[ list, list_id ] = [ res[0], res[1] ]

			# execute search query
			threads = @getThreads data.query
			tasks = @getTasks list_id

			tasks_in_threads = []
			for thread in threads
				res = @getTaskForThread thread, tasks_in_threads
				[ task, was_created ] = [ res[0], res[1] ]
				# TODO optimize slicing tasks_matched
				if not was_created
					tasks_in_threads.push ret
					@syncTaskName task, thread

			@createThreadFromTasks tasks, list_id, threads

			@markTasksAsCompleted tasks, list_id, tasks_in_threads

			Tasks.Tasks.clear list_id
*/
import msm = module('multistatemachine')

class Query extends msm.AsyncMachine {

	state_FetchingTasklists = {};
	state_TasklistsFetched = {
		blocks: [ 'FetchingTasklists' ]
	};

	state_FetchingQuery = {};
	state_QueryFetched = {
		blocks: [ 'FetchingQuery' ]
	};

	state_FetchingTasks = {
		requires: [ 'QueryFetched' ]
	};
	state_TasksFetched = {};

	state_FetchingThreads = {
		requires: [ 'QueryFetched' ]
	};
	state_ThreadsFetched = {};

	state_ParsingThreads = {};

	state_SyncingTaskName = {};

	state_CreatingThread = {};

	state_CreatingTasklist = {};

	state_CompletingTask = {};

	state_Ready = {};

	state_Idle = {};

	state_Refreshing = {
		blocks: ['Ready']
	};

	constructor() {
		super('Idle')
		this.pipeInvert('Fetching.*', 'Idle')
	}
}

class QueryController extends msm.AsyncMachine {

	state_Fetching( states ) {

	}

	state_Idle = {};

	constructor(task_lists = []) {
		var connection = this.connection
		task_lists.forEach( (list) => {
			var query = new Query( list, connection )
			this.lists().push( query )
			//query.on('Fetching.*.enter', this.pushStateLater('Fetching'))
			//query.on('Fetching.*.exit', this.pushStateLater('Fetching'))
			// Pipe MSM events.
			query.pipeForward( this )
			// Pipe the Fetching* transitions from the query to the local Fetching state.
			query.pipeForward('Fetching.*', this, 'Fetching')
		})
	}
}