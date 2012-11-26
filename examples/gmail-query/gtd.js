var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}

var def = flow.define;
var ex = flow.exec;


var ImapConnection = imap.ImapConnection;




var prop = jsprops.property;



var BaseClass = (function () {
    function BaseClass() { }
    BaseClass.prototype.repl = function () {
        var repl = repl.start({
            prompt: "repl> ",
            input: process.stdin,
            output: process.stdout
        });
        repl.context.this = this;
    };
    BaseClass.prototype.log = function () {
        var msgs = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            msgs[_i] = arguments[_i + 0];
        }
        console.log.apply(console, msgs);
    };
    return BaseClass;
})();
Object.merge(settings, {
    gmail_max_results: 300
});

var GmailSearch = (function (_super) {
    __extends(GmailSearch, _super);
    function GmailSearch(manager, name, update_interval) {
        if (typeof name === "undefined") { name = "noname"; }
        if (typeof update_interval === "undefined") { update_interval = 10 * 1000; }
        _super.call(this);
        this.manager = manager;
        this.name = name;
        this.update_interval = update_interval;
        this.active = true;
        this.last_update = 0;
        this.cmd = prop('cmd');
        this.monitored = prop('monitored', null, []);
    }
    GmailSearch.prototype.fetch = function (next) {
        this.log("performing a search for #{@name}");
        var deferred = Promise.defer();
        if(next) {
            deferred.promise.then(next);
        }
        this.query_(deferred);
        return deferred.promise;
    };
    GmailSearch.prototype.query_ = function (deferred) {
        var _this = this;
        var imap = this.manager.connection;
        var next = function (err, results) {
            return _this.results_(deferred, err, results);
        };
        imap.search([
            [
                'X-GM-RAW', 
                this.name
            ]
        ], next);
        this.monitored()[0].test;
    };
    GmailSearch.prototype.results_ = function (deferred, err, results) {
        var _this = this;
        var imap = this.manager.connection;
        this.log('got search results');
        var content = {
            headers: [
                "id", 
                "from", 
                "to", 
                "subject", 
                "date"
            ]
        };
        var fetch = imap.fetch(results, content);
        fetch.on("message", function (msg) {
            msg.on("end", function () {
                if(!~_this.monitored().indexOf(msg.id)) {
                    _this.log('new msg');
                    _this.monitored().push(msg.id);
                }
            });
        });
        fetch.on("end", function (err) {
            _this.log('fetch ended');
            deferred.resolve();
        });
        fetch.on("error", function (err) {
            deferred.reject(err);
        });
    };
    return GmailSearch;
})(BaseClass);
var GmailManager = (function (_super) {
    __extends(GmailManager, _super);
    function GmailManager(settings) {
        _super.prototype('Disconnected');
        this.settings = settings;
        this.state_Disconnected = {
            blocks: [
                'Connected', 
                'Connecting', 
                'Disconnecting'
            ]
        };
        this.state_Disconnecting = {
            blocks: [
                'Connected', 
                'Connecting', 
                'Disconnected'
            ]
        };
        this.state_Connected = {
            blocks: [
                'Connecting', 
                'Disconnecting', 
                'Disconnected'
            ]
        };
        this.state_Connecting = {
            blocks: [
                'Connected', 
                'Disconnecting', 
                'Disconnected'
            ]
        };
        this.state_Idle = {
            requires: [
                'Connected'
            ]
        };
        this.state_Active = {
            requires: [
                'Connected'
            ]
        };
        this.state_Fetched = {
        };
        this.state_Fetching = {
            requires: [
                'BoxOpened'
            ],
            blocks: [
                'Idle', 
                'Delayed'
            ]
        };
        this.state_Delayed = {
            requires: [
                'Active'
            ],
            blocks: [
                'Fetching', 
                'Idle'
            ]
        };
        this.state_BoxOpened = {
            requires: [
                'Active'
            ],
            blocks: [
                'BoxOpening', 
                'BoxClosing'
            ]
        };
        this.state_BoxOpening = {
            requires: [
                'Active'
            ],
            blocks: [
                'BoxOpened', 
                'BoxClosing'
            ]
        };
        this.state_BoxClosing = {
            blocks: [
                'BoxOpened', 
                'BoxOpening'
            ]
        };
        this.searches = prop('searches', null, []);
        this.pushState('Connecting');
        if(settings.repl) {
            this.repl();
        }
    }
    GmailManager.prototype.addSearch = function (name, update_interval) {
        this.searches().push(new GmailSearch(this, name, update_interval));
    };
    GmailManager.prototype.Connecting_enter = function () {
        var data = this.settings;
        this.connection = new ImapConnection({
            username: data.gmail_username,
            password: data.gmail_password,
            host: data.gmail_host || "imap.gmail.com",
            port: 993,
            secure: true
        });
        this.connection.connect(this, this.pushStateLater('Connected'));
    };
    GmailManager.prototype.Connecting_exit = function (target_states) {
        if(~target_states.indexOf('Disconnected')) {
        }
    };
    GmailManager.prototype.Connect_exit = function () {
        this.connection.logout(this.pushStateLater('Disconnected'));
        this.pushState('Disconnecting');
    };
    GmailManager.prototype.BoxOpening_enter = function () {
        this.connection.openBox("[Gmail]/All Mail", false, this.pushStateLater('BoxOpened').fulfill);
        this.box_opening_promise = this.last_promise;
    };
    GmailManager.prototype.BoxOpening_exit = function () {
        var promise = this.box_opening_promise;
        if(promise && !promise.isResolved) {
            promise.reject();
        }
    };
    GmailManager.prototype.BoxClosing_enter = function () {
        this.connection.closeBox(this.dropStateLater('BoxClosing').fulfill);
    };
    GmailManager.prototype.BoxClosing_exit = function () {
    };
    GmailManager.prototype.Delayed_enter = function () {
        this.delayed_timer = setTimeout(this.pushStateLater('Fetching').fulfill, this.minInterval_());
    };
    GmailManager.prototype.Delayed_exit = function () {
        clearTimeout(this.delayed_timer);
    };
    GmailManager.prototype.Fetching_enter = function () {
        this.log("activating #{search.name}");
        var search = this.searches().sortBy("last_update").first();
        search.fetch(this.pushStateLater([
            'Fetched', 
            'Delayed'
        ]));
    };
    GmailManager.prototype.Fetching_exit = function (target_states) {
        if(!~target_states.indexOf('Active')) {
            this.log('cancel fetching');
        }
    };
    GmailManager.prototype.minInterval_ = function () {
        var intervals = this.searches().map(function (ch) {
            return ch.update_interval;
        });
        return Math.min.apply(this, intervals);
    };
    GmailManager.prototype.repl = function () {
        var repl = repl.start({
            prompt: "repl> ",
            input: process.stdin,
            output: process.stdout
        });
        repl.context.this = this;
    };
    GmailManager.prototype.log = function () {
        var msgs = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            msgs[_i] = arguments[_i + 0];
        }
        console.log.apply(console, msgs);
    };
    return GmailManager;
})(asyncmachine.AsyncMachine);
var App = (function (_super) {
    __extends(App, _super);
    function App() {
        _super.apply(this, arguments);

    }
    App.prototype.Connected_enter = function (states) {
        this.addSearch('*', 5000);
        this.pushState('Activate');
    };
    return App;
})(GmailManager);
var gmail = new App(settings);
setTimeout(gmail.setStateLater('Disconnected'), 10 * 1000);

