
var Query = (function (_super) {
    __extends(Query, _super);
    function Query() {
        _super.prototype('Idle');
        this.state_FetchingTasklists = {
        };
        this.state_TasklistsFetched = {
            blocks: [
                'FetchingTasklists'
            ]
        };
        this.state_FetchingQuery = {
        };
        this.state_QueryFetched = {
            blocks: [
                'FetchingQuery'
            ]
        };
        this.state_FetchingTasks = {
            requires: [
                'QueryFetched'
            ]
        };
        this.state_TasksFetched = {
        };
        this.state_FetchingThreads = {
            requires: [
                'QueryFetched'
            ]
        };
        this.state_ThreadsFetched = {
        };
        this.state_ParsingThreads = {
        };
        this.state_SyncingTaskName = {
        };
        this.state_CreatingThread = {
        };
        this.state_CreatingTasklist = {
        };
        this.state_CompletingTask = {
        };
        this.state_Ready = {
        };
        this.state_Idle = {
        };
        this.state_Refreshing = {
            blocks: [
                'Ready'
            ]
        };
        this.pipeInvert('Fetching.*', 'Idle');
    }
    return Query;
})(msm.MultiStateMachine);
var QueryController = (function (_super) {
    __extends(QueryController, _super);
    function QueryController(task_lists) {
        if (typeof task_lists === "undefined") { task_lists = []; }
        var _this = this;
        var connection = this.connection;
        this.state_Idle = {
        };
        task_lists.forEach(function (list) {
            var query = new Query(list, connection);
            _this.lists().push(query);
            query.pipeForward(_this);
            query.pipeForward('Fetching.*', _this, 'Fetching');
        });
    }
    QueryController.prototype.state_Fetching = function (states) {
    };
    return QueryController;
})(msm.MultiStateMachine);

