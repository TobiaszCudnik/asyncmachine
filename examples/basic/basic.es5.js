"use strict";

var _inherits = function (child, parent) {
  if (typeof parent !== "function" && parent !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
  }
  child.prototype = Object.create(parent && parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (parent) child.__proto__ = parent;
};

var asyncmachine = require("../../lib/asyncmachine");
require("object-mixin");


var QueryFetcherStates = (function () {
  var _asyncmachine$AsyncMachine = asyncmachine.AsyncMachine;
  var QueryFetcherStates = function QueryFetcherStates(target) {
    _asyncmachine$AsyncMachine.call(this, target);
    this.registerAll();
    this.debug("", 1);
  };

  _inherits(QueryFetcherStates, _asyncmachine$AsyncMachine);

  return QueryFetcherStates;
})();

Object.mixin(QueryFetcherStates.prototype, {
  Enabled: {},

  Query1Running: { auto: true, requires: ["Enabled"] },
  Query1Done: {},

  Query2Running: { auto: true, requires: ["Enabled"] },
  Query2Done: {},

  Query3Running: {
    auto: true,
    requires: ["Query1Done", "Query2Done", "Enabled"]
  },
  Query3Done: {},

  Query4Running: {
    auto: true,
    requires: ["Query1Done", "Enabled"]
  },
  Query4Done: {},

  Result: {},

  Done: {
    auto: true,
    requires: ["Query1Done", "Query2Done", "Query3Done", "Query4Done"]
  }
});


var QueryFetcher = function QueryFetcher() {
  this.results = {};

  this.states = new QueryFetcherStates(this);
  this.states.add("Enabled");
};

QueryFetcher.prototype.Query1Running_state = function () {
  this.query("foo", this.states.addByCallback(["Query1Done", "Result"]));
};

QueryFetcher.prototype.Query2Running_state = function () {
  this.query("bar", this.states.addByCallback(["Query2Done", "Result"]));
};

QueryFetcher.prototype.Query3Running_state = function () {
  this.query("foo bar", this.states.addByCallback(["Query3Done", "Result"]));
};

QueryFetcher.prototype.Query4Running_state = function () {
  this.query("baz", this.states.addByCallback(["Query4Done", "Result"]));
};

// Collect results from every callback.

// First state enter
QueryFetcher.prototype.Result_state = function (states, result) {
  this.results[states[0]] = result;
};

// Active state self transition
QueryFetcher.prototype.Result_Result = function (states, result) {
  this.Result_state(states, result);
};

// Mocked async method
QueryFetcher.prototype.query = function (query, next) {
  setTimeout(function () {
    next(null, query);
  }, 0);
};




var fetcher = new QueryFetcher();

// This will work even if fetcher is already done.
fetcher.states.on("Done_state", function () {
  console.log(fetcher.results);
});
