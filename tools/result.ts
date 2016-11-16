
export interface IBind {

    // Enabled
    (event: 'Enabled_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'Enabled_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // Syncing
    (event: 'Syncing_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'Syncing_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // Synced
    (event: 'Synced_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'Synced_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // Restart
    (event: 'Restart_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'Restart_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // PreparingList
    (event: 'PreparingList_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'PreparingList_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // ListReady
    (event: 'ListReady_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'ListReady_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // FetchingTasks
    (event: 'FetchingTasks_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'FetchingTasks_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // TasksFetched
    (event: 'TasksFetched_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'TasksFetched_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // TasksCached
    (event: 'TasksCached_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'TasksCached_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // SyncingThreadsToTasks
    (event: 'SyncingThreadsToTasks_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'SyncingThreadsToTasks_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // ThreadsToTasksSynced
    (event: 'ThreadsToTasksSynced_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'ThreadsToTasksSynced_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // SyncingTasksToThreads
    (event: 'SyncingTasksToThreads_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'SyncingTasksToThreads_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // TasksToThreadsSynced
    (event: 'TasksToThreadsSynced_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'TasksToThreadsSynced_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // SyncingCompletedThreads
    (event: 'SyncingCompletedThreads_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'SyncingCompletedThreads_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // CompletedThreadsSynced
    (event: 'CompletedThreadsSynced_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'CompletedThreadsSynced_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // SyncingCompletedTasks
    (event: 'SyncingCompletedTasks_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'SyncingCompletedTasks_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // CompletedTasksSynced
    (event: 'CompletedTasksSynced_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'CompletedTasksSynced_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // ThreadsFetched
    (event: 'ThreadsFetched_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'ThreadsFetched_state', listener: (/* param1, param2 */) => any, context?: Object): this;
    // MsgsFetched
    (event: 'MsgsFetched_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: 'MsgsFetched_state', listener: (/* param1, param2 */) => any, context?: Object): this;

}

export interface IEmit {

    // Enabled
    (event: 'Enabled_enter' /*, param1, param2 */): this;
    (event: 'Enabled_state' /*, param1, param2 */): this;
    // Syncing
    (event: 'Syncing_enter' /*, param1, param2 */): this;
    (event: 'Syncing_state' /*, param1, param2 */): this;
    // Synced
    (event: 'Synced_enter' /*, param1, param2 */): this;
    (event: 'Synced_state' /*, param1, param2 */): this;
    // Restart
    (event: 'Restart_enter' /*, param1, param2 */): this;
    (event: 'Restart_state' /*, param1, param2 */): this;
    // PreparingList
    (event: 'PreparingList_enter' /*, param1, param2 */): this;
    (event: 'PreparingList_state' /*, param1, param2 */): this;
    // ListReady
    (event: 'ListReady_enter' /*, param1, param2 */): this;
    (event: 'ListReady_state' /*, param1, param2 */): this;
    // FetchingTasks
    (event: 'FetchingTasks_enter' /*, param1, param2 */): this;
    (event: 'FetchingTasks_state' /*, param1, param2 */): this;
    // TasksFetched
    (event: 'TasksFetched_enter' /*, param1, param2 */): this;
    (event: 'TasksFetched_state' /*, param1, param2 */): this;
    // TasksCached
    (event: 'TasksCached_enter' /*, param1, param2 */): this;
    (event: 'TasksCached_state' /*, param1, param2 */): this;
    // SyncingThreadsToTasks
    (event: 'SyncingThreadsToTasks_enter' /*, param1, param2 */): this;
    (event: 'SyncingThreadsToTasks_state' /*, param1, param2 */): this;
    // ThreadsToTasksSynced
    (event: 'ThreadsToTasksSynced_enter' /*, param1, param2 */): this;
    (event: 'ThreadsToTasksSynced_state' /*, param1, param2 */): this;
    // SyncingTasksToThreads
    (event: 'SyncingTasksToThreads_enter' /*, param1, param2 */): this;
    (event: 'SyncingTasksToThreads_state' /*, param1, param2 */): this;
    // TasksToThreadsSynced
    (event: 'TasksToThreadsSynced_enter' /*, param1, param2 */): this;
    (event: 'TasksToThreadsSynced_state' /*, param1, param2 */): this;
    // SyncingCompletedThreads
    (event: 'SyncingCompletedThreads_enter' /*, param1, param2 */): this;
    (event: 'SyncingCompletedThreads_state' /*, param1, param2 */): this;
    // CompletedThreadsSynced
    (event: 'CompletedThreadsSynced_enter' /*, param1, param2 */): this;
    (event: 'CompletedThreadsSynced_state' /*, param1, param2 */): this;
    // SyncingCompletedTasks
    (event: 'SyncingCompletedTasks_enter' /*, param1, param2 */): this;
    (event: 'SyncingCompletedTasks_state' /*, param1, param2 */): this;
    // CompletedTasksSynced
    (event: 'CompletedTasksSynced_enter' /*, param1, param2 */): this;
    (event: 'CompletedTasksSynced_state' /*, param1, param2 */): this;
    // ThreadsFetched
    (event: 'ThreadsFetched_enter' /*, param1, param2 */): this;
    (event: 'ThreadsFetched_state' /*, param1, param2 */): this;
    // MsgsFetched
    (event: 'MsgsFetched_enter' /*, param1, param2 */): this;
    (event: 'MsgsFetched_state' /*, param1, param2 */): this;

}

export type TStates = 'Enabled'
  | 'Syncing'
  | 'Synced'
  | 'Restart'
  | 'PreparingList'
  | 'ListReady'
  | 'FetchingTasks'
  | 'TasksFetched'
  | 'TasksCached'
  | 'SyncingThreadsToTasks'
  | 'ThreadsToTasksSynced'
  | 'SyncingTasksToThreads'
  | 'TasksToThreadsSynced'
  | 'SyncingCompletedThreads'
  | 'CompletedThreadsSynced'
  | 'SyncingCompletedTasks'
  | 'CompletedTasksSynced'
  | 'ThreadsFetched'
  | 'MsgsFetched';

export type TTransitions = 'Enabled_Any'
  | 'Enabled_Syncing'
  | 'Enabled_Synced'
  | 'Enabled_Restart'
  | 'Enabled_PreparingList'
  | 'Enabled_ListReady'
  | 'Enabled_FetchingTasks'
  | 'Enabled_TasksFetched'
  | 'Enabled_TasksCached'
  | 'Enabled_SyncingThreadsToTasks'
  | 'Enabled_ThreadsToTasksSynced'
  | 'Enabled_SyncingTasksToThreads'
  | 'Enabled_TasksToThreadsSynced'
  | 'Enabled_SyncingCompletedThreads'
  | 'Enabled_CompletedThreadsSynced'
  | 'Enabled_SyncingCompletedTasks'
  | 'Enabled_CompletedTasksSynced'
  | 'Enabled_ThreadsFetched'
  | 'Enabled_MsgsFetched'
  | 'Enabled_Exception'
  | 'Syncing_Enabled'
  | 'Syncing_Any'
  | 'Syncing_Synced'
  | 'Syncing_Restart'
  | 'Syncing_PreparingList'
  | 'Syncing_ListReady'
  | 'Syncing_FetchingTasks'
  | 'Syncing_TasksFetched'
  | 'Syncing_TasksCached'
  | 'Syncing_SyncingThreadsToTasks'
  | 'Syncing_ThreadsToTasksSynced'
  | 'Syncing_SyncingTasksToThreads'
  | 'Syncing_TasksToThreadsSynced'
  | 'Syncing_SyncingCompletedThreads'
  | 'Syncing_CompletedThreadsSynced'
  | 'Syncing_SyncingCompletedTasks'
  | 'Syncing_CompletedTasksSynced'
  | 'Syncing_ThreadsFetched'
  | 'Syncing_MsgsFetched'
  | 'Syncing_Exception'
  | 'Synced_Enabled'
  | 'Synced_Syncing'
  | 'Synced_Any'
  | 'Synced_Restart'
  | 'Synced_PreparingList'
  | 'Synced_ListReady'
  | 'Synced_FetchingTasks'
  | 'Synced_TasksFetched'
  | 'Synced_TasksCached'
  | 'Synced_SyncingThreadsToTasks'
  | 'Synced_ThreadsToTasksSynced'
  | 'Synced_SyncingTasksToThreads'
  | 'Synced_TasksToThreadsSynced'
  | 'Synced_SyncingCompletedThreads'
  | 'Synced_CompletedThreadsSynced'
  | 'Synced_SyncingCompletedTasks'
  | 'Synced_CompletedTasksSynced'
  | 'Synced_ThreadsFetched'
  | 'Synced_MsgsFetched'
  | 'Synced_Exception'
  | 'Restart_Enabled'
  | 'Restart_Syncing'
  | 'Restart_Synced'
  | 'Restart_Any'
  | 'Restart_PreparingList'
  | 'Restart_ListReady'
  | 'Restart_FetchingTasks'
  | 'Restart_TasksFetched'
  | 'Restart_TasksCached'
  | 'Restart_SyncingThreadsToTasks'
  | 'Restart_ThreadsToTasksSynced'
  | 'Restart_SyncingTasksToThreads'
  | 'Restart_TasksToThreadsSynced'
  | 'Restart_SyncingCompletedThreads'
  | 'Restart_CompletedThreadsSynced'
  | 'Restart_SyncingCompletedTasks'
  | 'Restart_CompletedTasksSynced'
  | 'Restart_ThreadsFetched'
  | 'Restart_MsgsFetched'
  | 'Restart_Exception'
  | 'PreparingList_Enabled'
  | 'PreparingList_Syncing'
  | 'PreparingList_Synced'
  | 'PreparingList_Restart'
  | 'PreparingList_Any'
  | 'PreparingList_ListReady'
  | 'PreparingList_FetchingTasks'
  | 'PreparingList_TasksFetched'
  | 'PreparingList_TasksCached'
  | 'PreparingList_SyncingThreadsToTasks'
  | 'PreparingList_ThreadsToTasksSynced'
  | 'PreparingList_SyncingTasksToThreads'
  | 'PreparingList_TasksToThreadsSynced'
  | 'PreparingList_SyncingCompletedThreads'
  | 'PreparingList_CompletedThreadsSynced'
  | 'PreparingList_SyncingCompletedTasks'
  | 'PreparingList_CompletedTasksSynced'
  | 'PreparingList_ThreadsFetched'
  | 'PreparingList_MsgsFetched'
  | 'PreparingList_Exception'
  | 'ListReady_Enabled'
  | 'ListReady_Syncing'
  | 'ListReady_Synced'
  | 'ListReady_Restart'
  | 'ListReady_PreparingList'
  | 'ListReady_Any'
  | 'ListReady_FetchingTasks'
  | 'ListReady_TasksFetched'
  | 'ListReady_TasksCached'
  | 'ListReady_SyncingThreadsToTasks'
  | 'ListReady_ThreadsToTasksSynced'
  | 'ListReady_SyncingTasksToThreads'
  | 'ListReady_TasksToThreadsSynced'
  | 'ListReady_SyncingCompletedThreads'
  | 'ListReady_CompletedThreadsSynced'
  | 'ListReady_SyncingCompletedTasks'
  | 'ListReady_CompletedTasksSynced'
  | 'ListReady_ThreadsFetched'
  | 'ListReady_MsgsFetched'
  | 'ListReady_Exception'
  | 'FetchingTasks_Enabled'
  | 'FetchingTasks_Syncing'
  | 'FetchingTasks_Synced'
  | 'FetchingTasks_Restart'
  | 'FetchingTasks_PreparingList'
  | 'FetchingTasks_ListReady'
  | 'FetchingTasks_Any'
  | 'FetchingTasks_TasksFetched'
  | 'FetchingTasks_TasksCached'
  | 'FetchingTasks_SyncingThreadsToTasks'
  | 'FetchingTasks_ThreadsToTasksSynced'
  | 'FetchingTasks_SyncingTasksToThreads'
  | 'FetchingTasks_TasksToThreadsSynced'
  | 'FetchingTasks_SyncingCompletedThreads'
  | 'FetchingTasks_CompletedThreadsSynced'
  | 'FetchingTasks_SyncingCompletedTasks'
  | 'FetchingTasks_CompletedTasksSynced'
  | 'FetchingTasks_ThreadsFetched'
  | 'FetchingTasks_MsgsFetched'
  | 'FetchingTasks_Exception'
  | 'TasksFetched_Enabled'
  | 'TasksFetched_Syncing'
  | 'TasksFetched_Synced'
  | 'TasksFetched_Restart'
  | 'TasksFetched_PreparingList'
  | 'TasksFetched_ListReady'
  | 'TasksFetched_FetchingTasks'
  | 'TasksFetched_Any'
  | 'TasksFetched_TasksCached'
  | 'TasksFetched_SyncingThreadsToTasks'
  | 'TasksFetched_ThreadsToTasksSynced'
  | 'TasksFetched_SyncingTasksToThreads'
  | 'TasksFetched_TasksToThreadsSynced'
  | 'TasksFetched_SyncingCompletedThreads'
  | 'TasksFetched_CompletedThreadsSynced'
  | 'TasksFetched_SyncingCompletedTasks'
  | 'TasksFetched_CompletedTasksSynced'
  | 'TasksFetched_ThreadsFetched'
  | 'TasksFetched_MsgsFetched'
  | 'TasksFetched_Exception'
  | 'TasksCached_Enabled'
  | 'TasksCached_Syncing'
  | 'TasksCached_Synced'
  | 'TasksCached_Restart'
  | 'TasksCached_PreparingList'
  | 'TasksCached_ListReady'
  | 'TasksCached_FetchingTasks'
  | 'TasksCached_TasksFetched'
  | 'TasksCached_Any'
  | 'TasksCached_SyncingThreadsToTasks'
  | 'TasksCached_ThreadsToTasksSynced'
  | 'TasksCached_SyncingTasksToThreads'
  | 'TasksCached_TasksToThreadsSynced'
  | 'TasksCached_SyncingCompletedThreads'
  | 'TasksCached_CompletedThreadsSynced'
  | 'TasksCached_SyncingCompletedTasks'
  | 'TasksCached_CompletedTasksSynced'
  | 'TasksCached_ThreadsFetched'
  | 'TasksCached_MsgsFetched'
  | 'TasksCached_Exception'
  | 'SyncingThreadsToTasks_Enabled'
  | 'SyncingThreadsToTasks_Syncing'
  | 'SyncingThreadsToTasks_Synced'
  | 'SyncingThreadsToTasks_Restart'
  | 'SyncingThreadsToTasks_PreparingList'
  | 'SyncingThreadsToTasks_ListReady'
  | 'SyncingThreadsToTasks_FetchingTasks'
  | 'SyncingThreadsToTasks_TasksFetched'
  | 'SyncingThreadsToTasks_TasksCached'
  | 'SyncingThreadsToTasks_Any'
  | 'SyncingThreadsToTasks_ThreadsToTasksSynced'
  | 'SyncingThreadsToTasks_SyncingTasksToThreads'
  | 'SyncingThreadsToTasks_TasksToThreadsSynced'
  | 'SyncingThreadsToTasks_SyncingCompletedThreads'
  | 'SyncingThreadsToTasks_CompletedThreadsSynced'
  | 'SyncingThreadsToTasks_SyncingCompletedTasks'
  | 'SyncingThreadsToTasks_CompletedTasksSynced'
  | 'SyncingThreadsToTasks_ThreadsFetched'
  | 'SyncingThreadsToTasks_MsgsFetched'
  | 'SyncingThreadsToTasks_Exception'
  | 'ThreadsToTasksSynced_Enabled'
  | 'ThreadsToTasksSynced_Syncing'
  | 'ThreadsToTasksSynced_Synced'
  | 'ThreadsToTasksSynced_Restart'
  | 'ThreadsToTasksSynced_PreparingList'
  | 'ThreadsToTasksSynced_ListReady'
  | 'ThreadsToTasksSynced_FetchingTasks'
  | 'ThreadsToTasksSynced_TasksFetched'
  | 'ThreadsToTasksSynced_TasksCached'
  | 'ThreadsToTasksSynced_SyncingThreadsToTasks'
  | 'ThreadsToTasksSynced_Any'
  | 'ThreadsToTasksSynced_SyncingTasksToThreads'
  | 'ThreadsToTasksSynced_TasksToThreadsSynced'
  | 'ThreadsToTasksSynced_SyncingCompletedThreads'
  | 'ThreadsToTasksSynced_CompletedThreadsSynced'
  | 'ThreadsToTasksSynced_SyncingCompletedTasks'
  | 'ThreadsToTasksSynced_CompletedTasksSynced'
  | 'ThreadsToTasksSynced_ThreadsFetched'
  | 'ThreadsToTasksSynced_MsgsFetched'
  | 'ThreadsToTasksSynced_Exception'
  | 'SyncingTasksToThreads_Enabled'
  | 'SyncingTasksToThreads_Syncing'
  | 'SyncingTasksToThreads_Synced'
  | 'SyncingTasksToThreads_Restart'
  | 'SyncingTasksToThreads_PreparingList'
  | 'SyncingTasksToThreads_ListReady'
  | 'SyncingTasksToThreads_FetchingTasks'
  | 'SyncingTasksToThreads_TasksFetched'
  | 'SyncingTasksToThreads_TasksCached'
  | 'SyncingTasksToThreads_SyncingThreadsToTasks'
  | 'SyncingTasksToThreads_ThreadsToTasksSynced'
  | 'SyncingTasksToThreads_Any'
  | 'SyncingTasksToThreads_TasksToThreadsSynced'
  | 'SyncingTasksToThreads_SyncingCompletedThreads'
  | 'SyncingTasksToThreads_CompletedThreadsSynced'
  | 'SyncingTasksToThreads_SyncingCompletedTasks'
  | 'SyncingTasksToThreads_CompletedTasksSynced'
  | 'SyncingTasksToThreads_ThreadsFetched'
  | 'SyncingTasksToThreads_MsgsFetched'
  | 'SyncingTasksToThreads_Exception'
  | 'TasksToThreadsSynced_Enabled'
  | 'TasksToThreadsSynced_Syncing'
  | 'TasksToThreadsSynced_Synced'
  | 'TasksToThreadsSynced_Restart'
  | 'TasksToThreadsSynced_PreparingList'
  | 'TasksToThreadsSynced_ListReady'
  | 'TasksToThreadsSynced_FetchingTasks'
  | 'TasksToThreadsSynced_TasksFetched'
  | 'TasksToThreadsSynced_TasksCached'
  | 'TasksToThreadsSynced_SyncingThreadsToTasks'
  | 'TasksToThreadsSynced_ThreadsToTasksSynced'
  | 'TasksToThreadsSynced_SyncingTasksToThreads'
  | 'TasksToThreadsSynced_Any'
  | 'TasksToThreadsSynced_SyncingCompletedThreads'
  | 'TasksToThreadsSynced_CompletedThreadsSynced'
  | 'TasksToThreadsSynced_SyncingCompletedTasks'
  | 'TasksToThreadsSynced_CompletedTasksSynced'
  | 'TasksToThreadsSynced_ThreadsFetched'
  | 'TasksToThreadsSynced_MsgsFetched'
  | 'TasksToThreadsSynced_Exception'
  | 'SyncingCompletedThreads_Enabled'
  | 'SyncingCompletedThreads_Syncing'
  | 'SyncingCompletedThreads_Synced'
  | 'SyncingCompletedThreads_Restart'
  | 'SyncingCompletedThreads_PreparingList'
  | 'SyncingCompletedThreads_ListReady'
  | 'SyncingCompletedThreads_FetchingTasks'
  | 'SyncingCompletedThreads_TasksFetched'
  | 'SyncingCompletedThreads_TasksCached'
  | 'SyncingCompletedThreads_SyncingThreadsToTasks'
  | 'SyncingCompletedThreads_ThreadsToTasksSynced'
  | 'SyncingCompletedThreads_SyncingTasksToThreads'
  | 'SyncingCompletedThreads_TasksToThreadsSynced'
  | 'SyncingCompletedThreads_Any'
  | 'SyncingCompletedThreads_CompletedThreadsSynced'
  | 'SyncingCompletedThreads_SyncingCompletedTasks'
  | 'SyncingCompletedThreads_CompletedTasksSynced'
  | 'SyncingCompletedThreads_ThreadsFetched'
  | 'SyncingCompletedThreads_MsgsFetched'
  | 'SyncingCompletedThreads_Exception'
  | 'CompletedThreadsSynced_Enabled'
  | 'CompletedThreadsSynced_Syncing'
  | 'CompletedThreadsSynced_Synced'
  | 'CompletedThreadsSynced_Restart'
  | 'CompletedThreadsSynced_PreparingList'
  | 'CompletedThreadsSynced_ListReady'
  | 'CompletedThreadsSynced_FetchingTasks'
  | 'CompletedThreadsSynced_TasksFetched'
  | 'CompletedThreadsSynced_TasksCached'
  | 'CompletedThreadsSynced_SyncingThreadsToTasks'
  | 'CompletedThreadsSynced_ThreadsToTasksSynced'
  | 'CompletedThreadsSynced_SyncingTasksToThreads'
  | 'CompletedThreadsSynced_TasksToThreadsSynced'
  | 'CompletedThreadsSynced_SyncingCompletedThreads'
  | 'CompletedThreadsSynced_Any'
  | 'CompletedThreadsSynced_SyncingCompletedTasks'
  | 'CompletedThreadsSynced_CompletedTasksSynced'
  | 'CompletedThreadsSynced_ThreadsFetched'
  | 'CompletedThreadsSynced_MsgsFetched'
  | 'CompletedThreadsSynced_Exception'
  | 'SyncingCompletedTasks_Enabled'
  | 'SyncingCompletedTasks_Syncing'
  | 'SyncingCompletedTasks_Synced'
  | 'SyncingCompletedTasks_Restart'
  | 'SyncingCompletedTasks_PreparingList'
  | 'SyncingCompletedTasks_ListReady'
  | 'SyncingCompletedTasks_FetchingTasks'
  | 'SyncingCompletedTasks_TasksFetched'
  | 'SyncingCompletedTasks_TasksCached'
  | 'SyncingCompletedTasks_SyncingThreadsToTasks'
  | 'SyncingCompletedTasks_ThreadsToTasksSynced'
  | 'SyncingCompletedTasks_SyncingTasksToThreads'
  | 'SyncingCompletedTasks_TasksToThreadsSynced'
  | 'SyncingCompletedTasks_SyncingCompletedThreads'
  | 'SyncingCompletedTasks_CompletedThreadsSynced'
  | 'SyncingCompletedTasks_Any'
  | 'SyncingCompletedTasks_CompletedTasksSynced'
  | 'SyncingCompletedTasks_ThreadsFetched'
  | 'SyncingCompletedTasks_MsgsFetched'
  | 'SyncingCompletedTasks_Exception'
  | 'CompletedTasksSynced_Enabled'
  | 'CompletedTasksSynced_Syncing'
  | 'CompletedTasksSynced_Synced'
  | 'CompletedTasksSynced_Restart'
  | 'CompletedTasksSynced_PreparingList'
  | 'CompletedTasksSynced_ListReady'
  | 'CompletedTasksSynced_FetchingTasks'
  | 'CompletedTasksSynced_TasksFetched'
  | 'CompletedTasksSynced_TasksCached'
  | 'CompletedTasksSynced_SyncingThreadsToTasks'
  | 'CompletedTasksSynced_ThreadsToTasksSynced'
  | 'CompletedTasksSynced_SyncingTasksToThreads'
  | 'CompletedTasksSynced_TasksToThreadsSynced'
  | 'CompletedTasksSynced_SyncingCompletedThreads'
  | 'CompletedTasksSynced_CompletedThreadsSynced'
  | 'CompletedTasksSynced_SyncingCompletedTasks'
  | 'CompletedTasksSynced_Any'
  | 'CompletedTasksSynced_ThreadsFetched'
  | 'CompletedTasksSynced_MsgsFetched'
  | 'CompletedTasksSynced_Exception'
  | 'ThreadsFetched_Enabled'
  | 'ThreadsFetched_Syncing'
  | 'ThreadsFetched_Synced'
  | 'ThreadsFetched_Restart'
  | 'ThreadsFetched_PreparingList'
  | 'ThreadsFetched_ListReady'
  | 'ThreadsFetched_FetchingTasks'
  | 'ThreadsFetched_TasksFetched'
  | 'ThreadsFetched_TasksCached'
  | 'ThreadsFetched_SyncingThreadsToTasks'
  | 'ThreadsFetched_ThreadsToTasksSynced'
  | 'ThreadsFetched_SyncingTasksToThreads'
  | 'ThreadsFetched_TasksToThreadsSynced'
  | 'ThreadsFetched_SyncingCompletedThreads'
  | 'ThreadsFetched_CompletedThreadsSynced'
  | 'ThreadsFetched_SyncingCompletedTasks'
  | 'ThreadsFetched_CompletedTasksSynced'
  | 'ThreadsFetched_Any'
  | 'ThreadsFetched_MsgsFetched'
  | 'ThreadsFetched_Exception'
  | 'MsgsFetched_Enabled'
  | 'MsgsFetched_Syncing'
  | 'MsgsFetched_Synced'
  | 'MsgsFetched_Restart'
  | 'MsgsFetched_PreparingList'
  | 'MsgsFetched_ListReady'
  | 'MsgsFetched_FetchingTasks'
  | 'MsgsFetched_TasksFetched'
  | 'MsgsFetched_TasksCached'
  | 'MsgsFetched_SyncingThreadsToTasks'
  | 'MsgsFetched_ThreadsToTasksSynced'
  | 'MsgsFetched_SyncingTasksToThreads'
  | 'MsgsFetched_TasksToThreadsSynced'
  | 'MsgsFetched_SyncingCompletedThreads'
  | 'MsgsFetched_CompletedThreadsSynced'
  | 'MsgsFetched_SyncingCompletedTasks'
  | 'MsgsFetched_CompletedTasksSynced'
  | 'MsgsFetched_ThreadsFetched'
  | 'MsgsFetched_Any'
  | 'MsgsFetched_Exception'
  | 'Exception_Enabled'
  | 'Exception_Syncing'
  | 'Exception_Synced'
  | 'Exception_Restart'
  | 'Exception_PreparingList'
  | 'Exception_ListReady'
  | 'Exception_FetchingTasks'
  | 'Exception_TasksFetched'
  | 'Exception_TasksCached'
  | 'Exception_SyncingThreadsToTasks'
  | 'Exception_ThreadsToTasksSynced'
  | 'Exception_SyncingTasksToThreads'
  | 'Exception_TasksToThreadsSynced'
  | 'Exception_SyncingCompletedThreads'
  | 'Exception_CompletedThreadsSynced'
  | 'Exception_SyncingCompletedTasks'
  | 'Exception_CompletedTasksSynced'
  | 'Exception_ThreadsFetched'
  | 'Exception_MsgsFetched';

export interface IBind {

    // Non-params events
    (event: 'Enabled_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'Enabled_end', listener: () => any, context?: Object): this;
    (event: 'Syncing_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'Syncing_end', listener: () => any, context?: Object): this;
    (event: 'Synced_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'Synced_end', listener: () => any, context?: Object): this;
    (event: 'Restart_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'Restart_end', listener: () => any, context?: Object): this;
    (event: 'PreparingList_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'PreparingList_end', listener: () => any, context?: Object): this;
    (event: 'ListReady_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'ListReady_end', listener: () => any, context?: Object): this;
    (event: 'FetchingTasks_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'FetchingTasks_end', listener: () => any, context?: Object): this;
    (event: 'TasksFetched_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'TasksFetched_end', listener: () => any, context?: Object): this;
    (event: 'TasksCached_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'TasksCached_end', listener: () => any, context?: Object): this;
    (event: 'SyncingThreadsToTasks_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'SyncingThreadsToTasks_end', listener: () => any, context?: Object): this;
    (event: 'ThreadsToTasksSynced_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'ThreadsToTasksSynced_end', listener: () => any, context?: Object): this;
    (event: 'SyncingTasksToThreads_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'SyncingTasksToThreads_end', listener: () => any, context?: Object): this;
    (event: 'TasksToThreadsSynced_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'TasksToThreadsSynced_end', listener: () => any, context?: Object): this;
    (event: 'SyncingCompletedThreads_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'SyncingCompletedThreads_end', listener: () => any, context?: Object): this;
    (event: 'CompletedThreadsSynced_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'CompletedThreadsSynced_end', listener: () => any, context?: Object): this;
    (event: 'SyncingCompletedTasks_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'SyncingCompletedTasks_end', listener: () => any, context?: Object): this;
    (event: 'CompletedTasksSynced_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'CompletedTasksSynced_end', listener: () => any, context?: Object): this;
    (event: 'ThreadsFetched_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'ThreadsFetched_end', listener: () => any, context?: Object): this;
    (event: 'MsgsFetched_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: 'MsgsFetched_end', listener: () => any, context?: Object): this;

    // Transitions
	(event: TTransitions): this;
}

export interface IEmit {
    // Non-params events
    (event: 'Enabled_exit'): this;
    (event: 'Enabled_end'): this;
    (event: 'Syncing_exit'): this;
    (event: 'Syncing_end'): this;
    (event: 'Synced_exit'): this;
    (event: 'Synced_end'): this;
    (event: 'Restart_exit'): this;
    (event: 'Restart_end'): this;
    (event: 'PreparingList_exit'): this;
    (event: 'PreparingList_end'): this;
    (event: 'ListReady_exit'): this;
    (event: 'ListReady_end'): this;
    (event: 'FetchingTasks_exit'): this;
    (event: 'FetchingTasks_end'): this;
    (event: 'TasksFetched_exit'): this;
    (event: 'TasksFetched_end'): this;
    (event: 'TasksCached_exit'): this;
    (event: 'TasksCached_end'): this;
    (event: 'SyncingThreadsToTasks_exit'): this;
    (event: 'SyncingThreadsToTasks_end'): this;
    (event: 'ThreadsToTasksSynced_exit'): this;
    (event: 'ThreadsToTasksSynced_end'): this;
    (event: 'SyncingTasksToThreads_exit'): this;
    (event: 'SyncingTasksToThreads_end'): this;
    (event: 'TasksToThreadsSynced_exit'): this;
    (event: 'TasksToThreadsSynced_end'): this;
    (event: 'SyncingCompletedThreads_exit'): this;
    (event: 'SyncingCompletedThreads_end'): this;
    (event: 'CompletedThreadsSynced_exit'): this;
    (event: 'CompletedThreadsSynced_end'): this;
    (event: 'SyncingCompletedTasks_exit'): this;
    (event: 'SyncingCompletedTasks_end'): this;
    (event: 'CompletedTasksSynced_exit'): this;
    (event: 'CompletedTasksSynced_end'): this;
    (event: 'ThreadsFetched_exit'): this;
    (event: 'ThreadsFetched_end'): this;
    (event: 'MsgsFetched_exit'): this;
    (event: 'MsgsFetched_end'): this;

    // Transitions
	(event: TTransitions): boolean;
}

