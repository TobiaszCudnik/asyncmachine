/*global require:false, Buffer:false, process:false, module:false */
var asyncmachineTest = (function(unused, undefined){
  var DEBUG         = false,
      pkgdefs       = {},
      pkgmap        = {},
      global        = {},
      lib,
      nativeRequire = typeof require != 'undefined' && require,
      nativeBuffer  = typeof Buffer != 'undefined' && Buffer,
      ties, locals;
  lib = (function(exports){
  exports.path = (function(exports){
    // Copyright Joyent, Inc. and other Node contributors.
// Minimized fork of NodeJS' path module, based on its an early version.
exports.join = function () {
  return exports.normalize(Array.prototype.join.call(arguments, "/"));
};
exports.normalizeArray = function (parts, keepBlanks) {
  var directories = [], prev;
  for (var i = 0, l = parts.length - 1; i <= l; i++) {
    var directory = parts[i];
    // if it's blank, but it's not the first thing, and not the last thing, skip it.
    if (directory === "" && i !== 0 && i !== l && !keepBlanks) continue;
    // if it's a dot, and there was some previous dir already, then skip it.
    if (directory === "." && prev !== undefined) continue;
    if (
      directory === ".." &&
      directories.length &&
      prev !== ".." &&
      prev !== "." &&
      prev !== undefined &&
      (prev !== "" || keepBlanks)
    ) {
      directories.pop();
      prev = directories.slice(-1)[0];
    } else {
      if (prev === ".") directories.pop();
      directories.push(directory);
      prev = directory;
    }
  }
  return directories;
};
exports.normalize = function (path, keepBlanks) {
  return exports.normalizeArray(path.split("/"), keepBlanks).join("/");
};
exports.dirname = function (path) {
  return path && path.substr(0, path.lastIndexOf("/")) || ".";
};
    return exports;
  }({}));
    global.process = exports.process = (function(exports){
    /**
 * This is module's purpose is to partly emulate NodeJS' process object on web browsers. It's not an alternative
 * and/or implementation of the "process" object.
 */
function Buffer(size){
  if (!(this instanceof Buffer)) return new Buffer(size);
  this.content = '';
};
Buffer.prototype.isBuffer = function isBuffer(){
  return true;
};
Buffer.prototype.write = function write(string){
  this.content += string;
};
global.Buffer = exports.Buffer = Buffer;
function Stream(writable, readable){
  if (!(this instanceof Stream)) return new Stream(writable, readable);
  Buffer.call(this);
  this.emulation = true;
  this.readable = readable;
  this.writable = writable;
  this.type = 'file';
};
Stream.prototype = Buffer(0,0);
exports.Stream = Stream;
function notImplemented(){
  throw new Error('Not Implemented.');
}
exports.binding = (function(){
  var table = {
    'buffer':{ 'Buffer':Buffer, 'SlowBuffer':Buffer }
  };
  return function binding(bname){
    if(!table.hasOwnProperty(bname)){
      throw new Error('No such module.');
    }
    return table[bname];
  };
})();
exports.argv = ['onejs'];
exports.env = {};
exports.nextTick = function nextTick(fn){
  return setTimeout(fn, 0);
};
exports.stderr = Stream(true, false);
exports.stdin = Stream(false, true);
exports.stdout = Stream(true, false);
exports.version = '1.7.12';
exports.versions = {"one":"1.7.12"};
/**
 * void definitions
 */
exports.pid =
exports.uptime = 0;
exports.arch =
exports.execPath =
exports.installPrefix =
exports.platform =
exports.title = '';
exports.chdir =
exports.cwd =
exports.exit =
exports.getgid =
exports.setgid =
exports.getuid =
exports.setuid =
exports.memoryUsage =
exports.on =
exports.umask = notImplemented;
    return exports;
  }({}));
  return exports;
}({}));
  function findPkg(uri){
    return pkgmap[uri];
  }
  function findModule(workingModule, uri){
    var module,
        moduleId = lib.path.join(lib.path.dirname(workingModule.id), uri).replace(/\.js$/, ''),
        moduleIndexId = lib.path.join(moduleId, 'index'),
        pkg = workingModule.pkg;
    var i = pkg.modules.length,
        id;
    while(i-->0){
      id = pkg.modules[i].id;
      if(id==moduleId || id == moduleIndexId){
        module = pkg.modules[i];
        break;
      }
    }
    return module;
  }
  function genRequire(callingModule){
    return function require(uri){
      var module,
          pkg;
      if(/^\./.test(uri)){
        module = findModule(callingModule, uri);
      } else if ( ties && ties.hasOwnProperty( uri ) ) {
        return ties[ uri ];
      } else {
        pkg = findPkg(uri);
        if(!pkg && nativeRequire){
          try {
            pkg = nativeRequire(uri);
          } catch (nativeRequireError) {}
          if(pkg) return pkg;
        }
        if(!pkg){
          throw new Error('Cannot find module "'+uri+'" @[module: '+callingModule.id+' package: '+callingModule.pkg.name+']');
        }
        module = pkg.index;
      }
      if(!module){
        throw new Error('Cannot find module "'+uri+'" @[module: '+callingModule.id+' package: '+callingModule.pkg.name+']');
      }
      module.parent = callingModule;
      return module.call();
    };
  }
  function module(parentId, wrapper){
    var parent = pkgdefs[parentId],
        mod = wrapper(parent),
        cached = false;
    mod.exports = {};
    mod.require = genRequire(mod);
    mod.call = function(){
            if(cached) {
        return mod.exports;
      }
      cached = true;
      global.require = mod.require;
      mod.wrapper(mod, mod.exports, global, nativeBuffer || global.Buffer, global.process,global.require);
      return mod.exports;
    };
    if(parent.mainModuleId == mod.id){
      parent.index = mod;
      parent.parents.length === 0 && ( locals.main = mod.call );
    }
    parent.modules.push(mod);
  }
  function pkg(/* [ parentId ...], wrapper */){
    var wrapper = arguments[ arguments.length - 1 ],
        parents = Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        ctx = wrapper(parents);
    if(pkgdefs.hasOwnProperty(ctx.id)){
      throw new Error('Package#'+ctx.id+' "' + ctx.name + '" has duplication of itself.');
    }
    pkgdefs[ctx.id] = ctx;
    pkgmap[ctx.name] = ctx;
    arguments.length == 1 && ( pkgmap.main = ctx );
  }
  function mainRequire(uri){
    return pkgmap.main.index.require(uri);
  }
  function stderr(){
    return lib.process.stderr.content;
  }
  function stdin(){
    return lib.process.stdin.content;
  }
  function stdout(){
    return lib.process.stdout.content;
  }
  return (locals = {
    'lib'        : lib,
    'findPkg'    : findPkg,
    'findModule' : findModule,
    'name'       : 'asyncmachineTest',
    'module'     : module,
    'pkg'        : pkg,
    'packages'   : pkgmap,
    'stderr'     : stderr,
    'stdin'      : stdin,
    'stdout'     : stdout,
    'require'    : mainRequire
});
}(this));
asyncmachineTest.pkg(1, function(parents){
  return {
    'id':3,
    'name':'asyncmachine',
    'main':undefined,
    'mainModuleId':'build/lib/asyncmachine',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(3, function(/* parent */){
  return {
    'id': 'build/lib/asyncmachine',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="headers/commonjs.d.ts" />
///<reference path="headers/lucidjs.d.ts" />
///<reference path="headers/rsvp.d.ts" />
///<reference path="headers/es5-shim.d.ts" />
(function (asyncmachine) {
    var LucidJS = require('lucidjs')//; required!
    
    var rsvp = require('rsvp')
    var Promise = rsvp.Promise;
    require('es5-shim');
    //export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
    var AsyncMachine = (function () {
        function AsyncMachine(state, config) {
            this.config = config;
            this.debug_states_ = false;
            this.queue = [];
            this.lock = false;
            LucidJS.emitter(this);
            if(config && config.debug) {
                this.debugStates();
            }
            if(state) {
                state = Array.isArray(state) ? state : [
                    state
                ];
                this.initStates(state);
            }
        }
        // Prepare class'es states. Required to be called manually for inheriting classes.
                AsyncMachine.prototype.initStates = function (state) {
            var states = [];
            for(var name in this) {
                var match = name.match(/^state_(.+)/);
                if(match) {
                    states.push(match[1]);
                }
            }
            this.states = states;
            this.states_active = [];
            this.setState(state);
        };
        AsyncMachine.prototype.getState = function (name) {
            return this['state_' + name] || (this).constructor['state_' + name];
        }// Tells if a state is active now.
        ;
        AsyncMachine.prototype.state = function (name) {
            var _this = this;
            if(name) {
                if(Array.isArray(name)) {
                    return name.every(function (name) {
                        return ~_this.states_active.indexOf(name);
                    });
                } else {
                    return !!~this.states_active.indexOf(name);
                }
            }
            return this.states_active;
        }// Activate certain states and deactivate the current ones.
        ;
        AsyncMachine.prototype.setState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.setState_(states, params);
        }// Curried version of setState.
        ;
        AsyncMachine.prototype.setStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.setState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        }// Activate certain states and keep the current ones.
        ;
        AsyncMachine.prototype.addState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.addState_(states, params);
        }// Curried version of addState
        ;
        AsyncMachine.prototype.addStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.addState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        }// Deactivate certain states.
        ;
        AsyncMachine.prototype.dropState = function (states) {
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            return this.dropState_(states, params);
        }// Deactivate certain states.
        ;
        AsyncMachine.prototype.dropStateLater = function (states) {
            var _this = this;
            var params = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                params[_i] = arguments[_i + 1];
            }
            var promise = new Promise();
            promise.then(function () {
                var callback_params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    callback_params[_i] = arguments[_i + 0];
                }
                _this.dropState_(states, params, callback_params);
            });
            this.last_promise = promise;
            return function () {
                var params = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    params[_i] = arguments[_i + 0];
                }
                promise.resolve(params);
            }
        };
        AsyncMachine.prototype.pipeForward = function (state, machine, target_state) {
            var _this = this;
            if(state instanceof AsyncMachine) {
                target_state = machine;
                machine = state;
                state = this.states;
            }
            [].concat(state).forEach(function (state) {
                var new_state = target_state || state;
                state = _this.namespaceStateName(state);
                _this.on(state + '.enter', function () {
                    return machine.addState(new_state);
                });
                _this.on(state + '.exit', function () {
                    return machine.dropState(new_state);
                });
            });
        };
        AsyncMachine.prototype.pipeInvert = function (state, machine, target_state) {
            state = this.namespaceStateName(state);
            this.on(state + '.enter', function () {
                machine.dropState(target_state);
            });
            this.on(state + '.exit', function () {
                machine.addState(target_state);
            });
        };
        AsyncMachine.prototype.pipeOff = function () {
            throw new Error('not implemented yet');
        }// TODO use a regexp lib for IE8's 'g' flag compat?
        ;
        AsyncMachine.prototype.namespaceStateName = function (state) {
            // CamelCase to Camel.Case
            return state.replace(/([a-zA-Z])([A-Z])/g, '$1.$2');
        };
        AsyncMachine.prototype.defineState = function (name, config) {
            throw new Error('not implemented yet');
        };
        AsyncMachine.prototype.debugStates = function (prefix, log_handler) {
            this.debug_states_ = !this.debug_states_;
            if(this.debug_states_) {
                this.log_handler_ = function () {
                    var msgs = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        msgs[_i] = arguments[_i + 0];
                    }
                    var args = prefix ? [
                        prefix
                    ].concat(msgs) : msgs;
                    log_handler.apply(null, args);
                };
            }
        };
        AsyncMachine.prototype.amLog = function () {
            var msgs = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                msgs[_i] = arguments[_i + 0];
            }
            if(!this.debug_states_) {
                return;
            }
            var a = arguments;
            // ie6 love
            if(console.log.apply) {
                console.log.apply(console, arguments);
            } else {
                console.log(a[0], a[1]);
            }
        }// Initializes the mixin.
        ;
        AsyncMachine.prototype.initAsyncMachine = function (state, config) {
            AsyncMachine.apply(this, arguments);
        }// Mixin asyncmachine into a prototype of another constructor.
        ;
        AsyncMachine.mixin = function mixin(prototype) {
            var _this = this;
            Object.keys(this.prototype).forEach(function (key) {
                prototype[key] = _this.prototype[key];
            });
        }
        AsyncMachine.mergeState = function mergeState(name) {
            // TODO merge a state with the given name with the super
            // class' state
            // TODO2 merge by a definition
                    }
        ////////////////////////////
        // PRIVATES
        ////////////////////////////
                AsyncMachine.prototype.processAutoStates = function (excluded) {
            if (typeof excluded === "undefined") { excluded = []; }
            var _this = this;
            var add = [];
            this.states.forEach(function (state) {
                var is_excluded = ~excluded.indexOf(state);
                var is_current = _this.state(state);
                if(_this.getState(state).auto && !is_excluded && !is_current) {
                    add.push(state);
                }
            });
            return this.addState(add);
        };
        AsyncMachine.prototype.setState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_set = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_set.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    2, 
                    states_to_set, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Set state ' + states_to_set.join(', '));
            }
            var states_before = this.state();
            var ret = this.selfTransitionExec_(states_to_set, exec_params, callback_params);
            if(ret === false) {
                return false;
            }
            states = this.setupTargetStates_(states_to_set);
            var states_to_set_valid = states_to_set.some(function (state) {
                return ~states.indexOf(state);
            });
            if(!states_to_set_valid) {
                if(this.log_handler_) {
                    this.log_handler_('[i] Transition cancelled, as target ' + 'states wasn\'t accepted');
                }
                return this.lock = false;
            }
            var queue = this.queue;
            this.queue = [];
            ret = this.transition_(states, states_to_set, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false ? false : this.allStatesSet(states_to_set);
        }// TODO Maybe avoid double concat of states_active
        ;
        AsyncMachine.prototype.addState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_add = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_add.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    1, 
                    states_to_add, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Add state ' + states_to_add.join(', '));
            }
            var states_before = this.state();
            var ret = this.selfTransitionExec_(states_to_add, exec_params, callback_params);
            if(ret === false) {
                return false;
            }
            states = states_to_add.concat(this.states_active);
            states = this.setupTargetStates_(states);
            var states_to_add_valid = states_to_add.some(function (state) {
                return ~states.indexOf(state);
            });
            if(!states_to_add_valid) {
                if(this.log_handler_) {
                    this.log_handler_('[i] Transition cancelled, as target ' + 'states wasn\'t accepted');
                }
                return this.lock = false;
            }
            var queue = this.queue;
            this.queue = [];
            ret = this.transition_(states, states_to_add, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false ? false : this.allStatesSet(states_to_add);
        };
        AsyncMachine.prototype.dropState_ = function (states, exec_params, callback_params) {
            if (typeof callback_params === "undefined") { callback_params = []; }
            var states_to_drop = Array.isArray(states) ? states : [
                states
            ];
            if(!states_to_drop.length) {
                return;
            }
            if(this.lock) {
                this.queue.push([
                    0, 
                    states_to_drop, 
                    exec_params, 
                    callback_params
                ]);
                return;
            }
            this.lock = true;
            if(this.log_handler_) {
                this.log_handler_('[*] Drop state ' + states_to_drop.join(', '));
            }
            var states_before = this.state();
            // Invert states to target ones.
            states = this.states_active.filter(function (state) {
                return !~states_to_drop.indexOf(state);
            });
            states = this.setupTargetStates_(states);
            // TODO validate if transition still makes sense? like in set/add
            var queue = this.queue;
            this.queue = [];
            var ret = this.transition_(states, states_to_drop, exec_params, callback_params);
            this.queue = ret === false ? queue : queue.concat(this.queue);
            this.lock = false;
            ret = this.processQueue_(ret);
            // If length equals and all previous states are set, we assume there
            // wasnt any change
            var length_equals = this.state().length === states_before.length;
            if(!this.state(states_before) || !length_equals) {
                this.processAutoStates();
            }
            return ret === false || this.allStatesNotSet(states_to_drop);
        };
        AsyncMachine.prototype.processQueue_ = function (previous_ret) {
            if(previous_ret === false) {
                // Cancel the current queue.
                this.queue = [];
                return false;
            }
            var ret = [], row;
            while(row = this.queue.shift()) {
                switch(row[0]) {
                    case 0: {
                        ret.push(this.dropState(row[1], row[2], row[3]));
                        break;

                    }
                    case 1: {
                        ret.push(this.addState(row[1], row[2], row[3]));
                        break;

                    }
                    case 2: {
                        ret.push(this.setState(row[1], row[2], row[3]));
                        break;

                    }
                }
            }
            return !~ret.indexOf(false);
        };
        AsyncMachine.prototype.allStatesSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || !_this.state(state);
            }, false);
        };
        AsyncMachine.prototype.allStatesNotSet = function (states) {
            var _this = this;
            return !states.reduce(function (ret, state) {
                return ret || _this.state(state);
            }, false);
        };
        AsyncMachine.prototype.namespaceTransition_ = function (transition) {
            // CamelCase to Camel.Case
            return this.namespaceStateName(transition).replace(// A_exit -> A.exit
            /_([a-z]+)$/, '.$1').replace(// A_B -> A._.B
            '_', '._.');
        }// Executes self transitions (eg ::A_A) based on active states.
        ;
        AsyncMachine.prototype.selfTransitionExec_ = function (states, exec_params, callback_params) {
            if (typeof exec_params === "undefined") { exec_params = []; }
            if (typeof callback_params === "undefined") { callback_params = []; }
            var _this = this;
            var ret = states.some(function (state) {
                var ret, name = state + '_' + state;
                var method = _this[name];
                if(method && ~_this.states_active.indexOf(state)) {
                    var transition_params = [
                        states
                    ].concat([
                        exec_params
                    ], callback_params);
                    ret = method.apply(_this, transition_params);
                    if(ret === false) {
                        return true;
                    }
                    var event = _this.namespaceTransition_(name);
                    transition_params = [
                        event, 
                        states
                    ].concat([
                        exec_params
                    ], callback_params);
                    return _this.trigger.apply(_this, transition_params) === false;
                }
            });
            return ret === true ? false : true;
        };
        AsyncMachine.prototype.setupTargetStates_ = function (states, exclude) {
            if (typeof exclude === "undefined") { exclude = []; }
            var _this = this;
            // Remove non existing states
            states = states.filter(function (name) {
                var ret = ~_this.states.indexOf(name);
                if(!ret && _this.log_handler_) {
                    _this.log_handler_('[i] State ' + name + ' doesn\'t exist');
                }
                return ret;
            });
            states = this.parseImplies_(states);
            states = this.removeDuplicateStates_(states);
            // Check if state is blocked or excluded
            var already_blocked = [];
            states = states.reverse().filter(function (name) {
                var blocked_by = _this.isStateBlocked_(states, name);
                // Remove states already blocked.
                blocked_by = blocked_by.filter(function (blocker_name) {
                    return !~already_blocked.indexOf(blocker_name);
                });
                if(blocked_by.length) {
                    already_blocked.push(name);
                    if(_this.log_handler_) {
                        _this.log_handler_('[i] State ' + name + ' blocked by ' + blocked_by.join(', '));
                    }
                }
                return !blocked_by.length && !~exclude.indexOf(name);
            }).reverse();
            return this.parseRequires_(states);
        }// Collect implied states
        ;
        AsyncMachine.prototype.parseImplies_ = function (states) {
            var _this = this;
            states.forEach(function (name) {
                var state = _this.getState(name);
                if(!state.implies) {
                    return;
                }
                states = states.concat(state.implies);
            });
            return states;
        }// Check required states
        // Loop until no change happens, as state can requires themselves in a vector.
        ;
        AsyncMachine.prototype.parseRequires_ = function (states) {
            var _this = this;
            var length_before = 0, length_after;
            while(length_before != states.length) {
                length_before = states.length;
                states = states.filter(function (name) {
                    var state = _this.getState(name);
                    return !(state.requires || []).reduce(function (memo, req) {
                        var found = ~states.indexOf(req);
                        if(!found && _this.log_handler_) {
                            _this.log_handler_('[i] State ' + name + ' dropped as required state ' + req + ' is missing');
                        }
                        return memo || !found;
                    }, false);
                });
            }
            return states;
        };
        AsyncMachine.prototype.removeDuplicateStates_ = function (states) {
            // Remove duplicates.
            var states2 = [];
            states.forEach(function (name) {
                if(!~states2.indexOf(name)) {
                    states2.push(name);
                }
            });
            return states2;
        };
        AsyncMachine.prototype.isStateBlocked_ = function (states, name) {
            var _this = this;
            var blocked_by = [];
            states.forEach(function (name2) {
                var state = _this.getState(name2);
                if(state.blocks && ~state.blocks.indexOf(name)) {
                    blocked_by.push(name2);
                }
            });
            return blocked_by;
        };
        AsyncMachine.prototype.transition_ = function (to, explicit_states, exec_params, callback_params) {
            if (typeof exec_params === "undefined") { exec_params = []; }
            if (typeof callback_params === "undefined") { callback_params = []; }
            var _this = this;
            // TODO handle args
            if(!to.length) {
                return true;
            }
            // Remove active states.
            var from = this.states_active.filter(function (state) {
                return !~to.indexOf(state);
            });
            this.orderStates_(to);
            this.orderStates_(from);
            var params = [
                exec_params
            ].concat(callback_params);
            // var wait = <Function[]>[]
            var ret = from.some(function (state) {
                var ret = _this.transitionExit_(state, to, explicit_states, params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            ret = to.some(function (state) {
                // Skip transition if state is already active.
                if(~_this.states_active.indexOf(state)) {
                    return false;
                }
                var transition_params = ~explicit_states.indexOf(state) ? params : [];
                var ret = _this.transitionEnter_(state, to, transition_params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            this.setActiveStates_(to);
            return true;
        };
        AsyncMachine.prototype.setActiveStates_ = function (target) {
            var _this = this;
            var previous = this.states_active;
            var all = this.states;
            this.states_active = target;
            // Set states in LucidJS emitter
            // TODO optimise these loops
            all.forEach(function (state) {
                if(~target.indexOf(state)) {
                    //					if ( ! ~previous.indexOf( state ) )
                    //						this.set( state + '.enter' );
                    (_this.set).clear(state + '.exit');
                } else {
                    //					if ( ~previous.indexOf( state ) )
                    (_this.set).clear(state + '.enter');
                    //					this.set( state + '.exit' )
                                    }
            });
        }// Exit transition handles state-to-state methods.
        ;
        AsyncMachine.prototype.transitionExit_ = function (from, to, explicit_states, params) {
            var _this = this;
            var method, callbacks = [];
            var transition_params = ~explicit_states.indexOf(from) ? params : [];
            var ret = this.transitionExec_(from + '_exit', to, transition_params);
            if(ret === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var transition = 'exit.' + this.namespaceStateName(from);
            ret = this.transitionExec_(transition, to, transition_params);
            if(ret === false) {
                return false;
            }
            ret = to.some(function (state) {
                var transition = from + '_' + state;
                var transition_params = ~explicit_states.indexOf(state) ? params : [];
                var ret = _this.transitionExec_(transition, to, transition_params);
                return ret === false;
            });
            if(ret === true) {
                return false;
            }
            // TODO pass args to explicitly dropped states
            ret = this.transitionExec_(from + '_any', to) === false;
            return ret === true ? false : true;
        };
        AsyncMachine.prototype.transitionEnter_ = function (to, target_states, params) {
            var method, callbacks = [];
            var ret = this.transitionExec_('any_' + to, target_states, params);
            if(ret === false) {
                return false;
            }
            ret = this.transitionExec_(to + '_enter', target_states, params);
            if(ret === false) {
                return false;
            }
            // Duplicate event for namespacing.
            var event_args = [
                'enter.' + this.namespaceStateName(to), 
                target_states
            ];
            ret = this.trigger.apply(this, event_args.concat(params));
            return ret === false ? false : true;
        };
        AsyncMachine.prototype.transitionExec_ = function (method, target_states, params) {
            if (typeof params === "undefined") { params = []; }
            params = [].concat([
                target_states
            ], params);
            var ret, event = this.namespaceTransition_(method);
            if(this.log_handler_) {
                this.log_handler_(event);
            }
            if(this[method] instanceof Function) {
                ret = this[method].apply(this, params);
            }
            // TODO reduce this 2 log msgs to 1
            if(ret !== false) {
                var fn = ~event.indexOf('_') ? 'trigger' : 'set';
                ret = this[fn](event, params);
                if(ret === false && this.log_handler_) {
                    this.log_handler_('[i] Transition event ' + event + ' cancelled');
                }
            }
            if(ret === false && this.log_handler_) {
                this.log_handler_('[i] Transition method ' + method + ' cancelled');
            }
            return ret;
        }// is_exit tells that the order is exit transitions
        ;
        AsyncMachine.prototype.orderStates_ = function (states) {
            var _this = this;
            states.sort(function (e1, e2) {
                var state1 = _this.getState(e1);
                var state2 = _this.getState(e2);
                var ret = 0;
                if(state1.depends && ~state1.depends.indexOf(e2)) {
                    ret = 1;
                } else {
                    if(state2.depends && ~state2.depends.indexOf(e1)) {
                        ret = -1;
                    }
                }
                return ret;
            });
        }// Event Emitter interface
        // TODO cover as mixin in the d.ts file
        ;
        AsyncMachine.prototype.on = function (event, VarArgsBoolFn) {
            return {
            };
        };
        AsyncMachine.prototype.once = function (event, VarArgsBoolFn) {
            return {
            };
        };
        AsyncMachine.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return true;
        };
        AsyncMachine.prototype.set = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            return {
            };
        };
        return AsyncMachine;
    })();
    asyncmachine.AsyncMachine = AsyncMachine;    
    // Support LucidJS mixin
    // TODO make it sucks less
    delete AsyncMachine.prototype.on;
    delete AsyncMachine.prototype.once;
    delete AsyncMachine.prototype.trigger;
    delete AsyncMachine.prototype.set;
})(exports.asyncmachine || (exports.asyncmachine = {}));
var asyncmachine = exports.asyncmachine;
// Fake class for sane export.
var AsyncMachine = (function (_super) {
    __extends(AsyncMachine, _super);
    function AsyncMachine() {
        _super.apply(this, arguments);

    }
    return AsyncMachine;
})(asyncmachine.AsyncMachine);
exports.AsyncMachine = AsyncMachine;
//export class Task extends asyncmachine.Task {}
//@ sourceMappingURL=asyncmachine.js.map
    }
  };
});
asyncmachineTest.pkg(function(parents){
  return {
    'id':1,
    'name':'asyncmachine-test',
    'main':undefined,
    'mainModuleId':'test',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(1, function(/* parent */){
  return {
    'id': 'test',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Promise, asyncmachine, expect, sinon,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  asyncmachine = require('asyncmachine');
  expect = require('chai').expect;
  sinon = require('sinon');
  Promise = require('rsvp').Promise;
  describe("asyncmachine", function() {
    var FooMachine, assert_order, mock_states;
    FooMachine = (function(_super) {
      __extends(FooMachine, _super);
      FooMachine.prototype.state_A = {};
      FooMachine.prototype.state_B = {};
      FooMachine.prototype.state_C = {};
      FooMachine.prototype.state_D = {};
      function FooMachine(state, config) {
        FooMachine.__super__.constructor.call(this, state, config);
      }
      return FooMachine;
    })(asyncmachine.AsyncMachine);
    mock_states = function(instance, states) {
      var inner, state, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = states.length; _i < _len; _i++) {
        state = states[_i];
        instance.constructor["" + state + "_" + state] = sinon.spy();
        instance["" + state + "_enter"] = sinon.spy();
        instance["" + state + "_exit"] = sinon.spy();
        instance["" + state + "_any"] = sinon.spy();
        instance["any_" + state] = sinon.spy();
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = states.length; _j < _len1; _j++) {
            inner = states[_j];
            _results1.push(instance["" + inner + "_" + state] = sinon.spy());
          }
          return _results1;
        })());
      }
      return _results;
    };
    assert_order = function(order) {
      var check, k, m, _i, _j, _len, _len1, _ref, _ref1, _results;
      _ref = order.slice(0, -1);
      for (k = _i = 0, _len = _ref.length; _i < _len; k = ++_i) {
        m = _ref[k];
        order[k] = m.calledBefore(order[k + 1]);
      }
      _ref1 = order.slice(0, -1);
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        check = _ref1[_j];
        _results.push(expect(check).to.be.ok);
      }
      return _results;
    };
    beforeEach(function() {
      return this.machine = new FooMachine('A');
    });
    it('should allow to check if single state is active');
    it('should allow to check if many states are active');
    it("should allow for a delayed start");
    it("should accept the starting state", function() {
      return expect(this.machine.state()).to.eql(["A"]);
    });
    it("should allow to set the state", function() {
      this.machine.setState("B");
      return expect(this.machine.state()).to.eql(["B"]);
    });
    it("should allow to add a new state", function() {
      this.machine.addState("B");
      return expect(this.machine.state()).to.eql(["B", "A"]);
    });
    it("should allow to drop a state", function() {
      this.machine.setState(["B", "C"]);
      this.machine.dropState('C');
      return expect(this.machine.state()).to.eql(["B"]);
    });
    it("should throw when setting an unknown state", function() {
      var func,
        _this = this;
      func = function() {
        return _this.machine.setState("unknown");
      };
      return expect(func).to["throw"]();
    });
    it('should allow to define a new state');
    it("should skip non existing states", function() {
      this.machine.A_exit = sinon.spy();
      this.machine.setState("unknown");
      return expect(this.machine.A_exit.calledOnce).not.to.be.ok;
    });
    describe("when single to single state transition", function() {
      beforeEach(function() {
        this.machine = new FooMachine('A');
        mock_states(this.machine, ['A', 'B']);
        return this.machine.setState('B');
      });
      it("should trigger the state to state transition", function() {
        return expect(this.machine.A_B.calledOnce).to.be.ok;
      });
      it("should trigger the state exit transition", function() {
        return expect(this.machine.A_exit.calledOnce).to.be.ok;
      });
      it("should trigger the transition to the new state", function() {
        return expect(this.machine.B_enter.calledOnce).to.be.ok;
      });
      it("should trigger the transition to \"Any\" state", function() {
        return expect(this.machine.A_any.calledOnce).to.be.ok;
      });
      it("should trigger the transition from \"Any\" state", function() {
        return expect(this.machine.any_B.calledOnce).to.be.ok;
      });
      it('should set the correct state', function() {
        return expect(this.machine.state()).to.eql(['B']);
      });
      return it("should remain the correct order", function() {
        var order;
        order = [this.machine.A_exit, this.machine.A_B, this.machine.A_any, this.machine.any_B, this.machine.B_enter];
        return assert_order(order);
      });
    });
    describe("when single to multi state transition", function() {
      beforeEach(function() {
        this.machine = new FooMachine('A');
        mock_states(this.machine, ['A', 'B', 'C']);
        return this.machine.setState(['B', 'C']);
      });
      it("should trigger the state to state transitions", function() {
        expect(this.machine.A_B.calledOnce).to.be.ok;
        return expect(this.machine.A_C.calledOnce).to.be.ok;
      });
      it("should trigger the state exit transition", function() {
        return expect(this.machine.A_exit.calledOnce).to.be.ok;
      });
      it("should trigger the transition to new states", function() {
        expect(this.machine.B_enter.calledOnce).to.be.ok;
        return expect(this.machine.C_enter.calledOnce).to.be.ok;
      });
      it("should trigger the transition to \"Any\" state", function() {
        return expect(this.machine.A_any.calledOnce).to.be.ok;
      });
      it("should trigger the transition from \"Any\" state", function() {
        expect(this.machine.any_B.calledOnce).to.be.ok;
        return expect(this.machine.any_C.calledOnce).to.be.ok;
      });
      it('should set the correct state', function() {
        return expect(this.machine.state()).to.eql(['B', 'C']);
      });
      return it("should remain the correct order", function() {
        var order;
        order = [this.machine.A_exit, this.machine.A_B, this.machine.A_C, this.machine.A_any, this.machine.any_B, this.machine.B_enter, this.machine.any_C, this.machine.C_enter];
        return assert_order(order);
      });
    });
    describe("when multi to single state transition", function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A', 'B']);
        mock_states(this.machine, ['A', 'B', 'C']);
        return this.machine.setState(['C']);
      });
      it("should trigger the state to state transitions", function() {
        expect(this.machine.B_C.calledOnce).to.be.ok;
        return expect(this.machine.A_C.calledOnce).to.be.ok;
      });
      it("should trigger the state exit transition", function() {
        expect(this.machine.A_exit.calledOnce).to.be.ok;
        return expect(this.machine.B_exit.calledOnce).to.be.ok;
      });
      it("should trigger the transition to the new state", function() {
        return expect(this.machine.C_enter.calledOnce).to.be.ok;
      });
      it("should trigger the transition to \"Any\" state", function() {
        expect(this.machine.A_any.calledOnce).to.be.ok;
        return expect(this.machine.B_any.calledOnce).to.be.ok;
      });
      it("should trigger the transition from \"Any\" state", function() {
        return expect(this.machine.any_C.calledOnce).to.be.ok;
      });
      it('should set the correct state', function() {
        return expect(this.machine.state()).to.eql(['C']);
      });
      return it("should remain the correct order", function() {
        var order;
        order = [this.machine.A_exit, this.machine.A_C, this.machine.A_any, this.machine.B_exit, this.machine.B_C, this.machine.B_any, this.machine.any_C, this.machine.C_enter];
        return assert_order(order);
      });
    });
    describe("when multi to multi state transition", function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A', 'B']);
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        return this.machine.setState(['D', 'C']);
      });
      it("should trigger the state to state transitions", function() {
        expect(this.machine.A_C.calledOnce).to.be.ok;
        expect(this.machine.A_D.calledOnce).to.be.ok;
        expect(this.machine.B_C.calledOnce).to.be.ok;
        return expect(this.machine.B_D.calledOnce).to.be.ok;
      });
      it("should trigger the state exit transition", function() {
        expect(this.machine.A_exit.calledOnce).to.be.ok;
        return expect(this.machine.B_exit.calledOnce).to.be.ok;
      });
      it("should trigger the transition to the new state", function() {
        expect(this.machine.C_enter.calledOnce).to.be.ok;
        return expect(this.machine.D_enter.calledOnce).to.be.ok;
      });
      it("should trigger the transition to \"Any\" state", function() {
        expect(this.machine.A_any.calledOnce).to.be.ok;
        return expect(this.machine.B_any.calledOnce).to.be.ok;
      });
      it("should trigger the transition from \"Any\" state", function() {
        expect(this.machine.any_C.calledOnce).to.be.ok;
        return expect(this.machine.any_D.calledOnce).to.be.ok;
      });
      it('should set the correct state', function() {
        return expect(this.machine.state()).to.eql(['D', 'C']);
      });
      return it("should remain the correct order", function() {
        var order;
        order = [this.machine.A_exit, this.machine.A_D, this.machine.A_C, this.machine.A_any, this.machine.B_exit, this.machine.B_D, this.machine.B_C, this.machine.B_any, this.machine.any_D, this.machine.D_enter, this.machine.any_C, this.machine.C_enter];
        return assert_order(order);
      });
    });
    describe("when transitioning to an active state", function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A', 'B']);
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        return this.machine.setState(['A']);
      });
      it('shouldn\'t trigger transition methods', function() {
        expect(this.machine.A_exit.called).not.to.be.ok;
        expect(this.machine.A_any.called).not.to.be.ok;
        return expect(this.machine.any_A.called).not.to.be.ok;
      });
      return it('should remain in the requested state', function() {
        return expect(this.machine.state()).to.eql(['A']);
      });
    });
    describe('when order is defined by the depends attr', function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A', 'B']);
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        this.machine.state_C.depends = ['D'];
        this.machine.state_A.depends = ['B'];
        return this.machine.setState(['C', 'D']);
      });
      after(function() {
        delete this.machine.state_C.depends;
        return delete this.machine.state_A.depends;
      });
      describe('when entering', function() {
        return it('should handle dependand states first', function() {
          var order;
          order = [this.machine.A_D, this.machine.A_C, this.machine.any_D, this.machine.D_enter, this.machine.any_C, this.machine.C_enter];
          return assert_order(order);
        });
      });
      return describe('when exiting', function() {
        return it('should handle dependand states last', function() {
          var order;
          order = [this.machine.B_exit, this.machine.B_D, this.machine.B_C, this.machine.B_any, this.machine.A_exit, this.machine.A_D, this.machine.A_C, this.machine.A_any];
          return assert_order(order);
        });
      });
    });
    describe('when one state blocks another', function() {
      beforeEach(function() {
        var _this = this;
        this.log = [];
        this.machine = new FooMachine(['A', 'B']);
        this.machine.debugStates('', function(msg) {
          return _this.log.push(msg);
        });
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        this.machine.state_C = {
          blocks: ['D']
        };
        return this.machine.setState('D');
      });
      describe('and they are set simultaneously', function() {
        beforeEach(function() {
          return this.ret = this.machine.setState(['C', 'D']);
        });
        it('should skip the second state', function() {
          return expect(this.machine.state()).to.eql(['C']);
        });
        it('should return false', function() {
          return expect(this.ret).to.eql(false);
        });
        it('should explain the reson in the log', function() {
          return expect(~this.log.indexOf('[i] State D blocked by C')).to.be.ok;
        });
        return afterEach(function() {
          return delete this.ret;
        });
      });
      describe('and blocking one is added', function() {
        return it('should unset the blocked one', function() {
          this.machine.addState(['C']);
          return expect(this.machine.state()).to.eql(['C']);
        });
      });
      return describe('and cross blocking one is added', function() {
        beforeEach(function() {
          return this.machine.state_D = {
            blocks: ['C']
          };
        });
        after(function() {
          return this.machine.state_D = {};
        });
        describe('using setState', function() {
          it('should unset the old one', function() {
            this.machine.setState('C');
            return expect(this.machine.state()).to.eql(['C']);
          });
          return it('should work in both ways', function() {
            this.machine.setState('C');
            expect(this.machine.state()).to.eql(['C']);
            this.machine.setState('D');
            return expect(this.machine.state()).to.eql(['D']);
          });
        });
        return describe('using addState', function() {
          it('should unset the old one', function() {
            this.machine.addState('C');
            return expect(this.machine.state()).to.eql(['C']);
          });
          return it('should work in both ways', function() {
            this.machine.addState('C');
            expect(this.machine.state()).to.eql(['C']);
            this.machine.addState('D');
            return expect(this.machine.state()).to.eql(['D']);
          });
        });
      });
    });
    describe('when state is implied', function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A']);
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        this.machine.state_C = {
          implies: ['D']
        };
        this.machine.state_A = {
          blocks: ['D']
        };
        return this.machine.setState(['C']);
      });
      it('should be activated', function() {
        return expect(this.machine.state()).to.eql(['C', 'D']);
      });
      return it('should be skipped if blocked at the same time', function() {
        this.machine.setState(['A', 'D']);
        return expect(this.machine.state()).to.eql(['A']);
      });
    });
    describe('when state requires another one', function() {
      beforeEach(function() {
        this.machine = new FooMachine(['A']);
        mock_states(this.machine, ['A', 'B', 'C', 'D']);
        return this.machine.state_C = {
          requires: ['D']
        };
      });
      after(function() {
        return this.machine.state_C = {};
      });
      it('should be set when required state is active', function() {
        this.machine.setState(['C', 'D']);
        return expect(this.machine.state()).to.eql(['C', 'D']);
      });
      return describe('when required state isn\'t active', function() {
        beforeEach(function() {
          var _this = this;
          this.log = [];
          this.logger = function(msg) {
            return _this.log.push(msg);
          };
          this.machine.debugStates('', this.logger);
          return this.machine.setState(['C', 'A']);
        });
        afterEach(function() {
          return delete this.log;
        });
        it('should\'t be set', function() {
          return expect(this.machine.state()).to.eql(['A']);
        });
        return it('should explain the reason in the log', function() {
          var msg;
          msg = '[i] State C dropped as required state D is missing';
          return expect(this.log).to.contain(msg);
        });
      });
    });
    describe('when state is changed', function() {
      beforeEach(function() {
        this.machine = new FooMachine('A');
        return mock_states(this.machine, ['A', 'B', 'C', 'D']);
      });
      describe('during another state change', function() {
        return it('should be scheduled synchronously', function() {
          this.machine.B_enter = function(states) {
            return this.addState('C');
          };
          this.machine.C_enter = sinon.spy();
          this.machine.A_exit = sinon.spy();
          this.machine.setState('B');
          expect(this.machine.C_enter.calledOnce).to.be.ok;
          expect(this.machine.A_exit.calledOnce).to.be.ok;
          return expect(this.machine.state()).to.eql(['C', 'B']);
        });
      });
      describe('and transition is canceled', function() {
        beforeEach(function() {
          return this.machine.D_enter = function() {
            return false;
          };
        });
        describe('when setting a new state', function() {
          beforeEach(function() {
            var _this = this;
            this.log = [];
            this.logger = function(msg) {
              return _this.log.push(msg);
            };
            this.machine.debugStates('', this.logger);
            return this.ret = this.machine.setState('D');
          });
          it('should return false', function() {
            return expect(this.machine.setState('D')).not.to.be.ok;
          });
          it('should not change the previous state', function() {
            return expect(this.machine.state()).to.eql(['A']);
          });
          it('should explain the reason in the log', function() {
            return expect(~this.log.indexOf('[i] Transition method D_enter cancelled')).to.be.ok;
          });
          return it('should not change the auto states');
        });
        describe('when adding an additional state', function() {
          beforeEach(function() {
            return this.ret = this.machine.addState('D');
          });
          it('should return false', function() {
            return expect(this.ret).not.to.be.ok;
          });
          it('should not change the previous state', function() {
            return expect(this.machine.state()).to.eql(['A']);
          });
          it('should explain the reason in the log', function() {
            return expect(~this.log.indexOf('[i] Transition method D_enter cancelled')).to.be.ok;
          });
          return it('should not change the auto states');
        });
        return describe('when droppping a current state', function() {
          it('should return false');
          it('should not change the previous state');
          it('should explain the reason in the log');
          return it('should not change the auto states');
        });
      });
      describe('and transition is successful', function() {
        it('should return true', function() {
          return expect(this.machine.setState('D')).to.be.ok;
        });
        return it('should set the auto states');
      });
      it('should provide previous state information', function(done) {
        this.machine.D_enter = function() {
          expect(this.state()).to.eql(['A']);
          return done();
        };
        return this.machine.setState('D');
      });
      it('should provide target state information', function(done) {
        this.machine.D_enter = function(target) {
          expect(target).to.eql(['D']);
          return done();
        };
        return this.machine.setState('D');
      });
      describe('with arguments', function() {
        beforeEach(function() {
          return this.machine.state_D = {
            implies: ['B'],
            blocks: ['A']
          };
        });
        after(function() {
          return this.machine.state_D = {};
        });
        describe('and synchronous', function() {
          beforeEach(function() {
            this.machine.setState(['A', 'C']);
            this.machine.setState('D', 'foo', 2);
            this.machine.setState('D', 'foo', 2);
            return this.machine.dropState('D', 'foo', 2);
          });
          describe('and is explicit', function() {
            it('should forward arguments to exit methods', function() {
              return expect(this.machine.D_exit.calledWith(['B'], ['foo', 2])).to.be.ok;
            });
            it('should forward arguments to enter methods', function() {
              return expect(this.machine.D_enter.calledWith(['D', 'B'], ['foo', 2])).to.be.ok;
            });
            it('should forward arguments to self transition methods', function() {
              return expect(this.machine.D_D.calledWith(['D'], ['foo', 2])).to.be.ok;
            });
            return it('should forward arguments to transition methods', function() {
              return expect(this.machine.C_D.calledWith(['D', 'B'], ['foo', 2])).to.be.ok;
            });
          });
          return describe('and is non-explicit', function() {
            it('should not forward arguments to exit methods', function() {
              return expect(this.machine.A_exit.calledWith(['D', 'B'])).to.be.ok;
            });
            it('should not forward arguments to enter methods', function() {
              return expect(this.machine.B_enter.calledWith(['D', 'B'])).to.be.ok;
            });
            return it('should not forward arguments to transition methods', function() {
              return expect(this.machine.A_B.calledWith(['D', 'B'])).to.be.ok;
            });
          });
        });
        return describe('and delayed', function() {
          beforeEach(function(done) {
            var resolve,
              _this = this;
            resolve = this.machine.setStateLater(['A', 'C']);
            resolve();
            return this.machine.last_promise.then(function() {
              resolve = _this.machine.setStateLater('D', 'foo', 2);
              resolve();
              return _this.machine.last_promise;
            }).then(function() {
              resolve = _this.machine.setStateLater('D', 'foo', 2);
              resolve();
              return _this.machine.last_promise;
            }).then(function() {
              resolve = _this.machine.dropStateLater('D', 'foo', 2);
              resolve();
              return _this.machine.last_promise;
            }).then(function() {
              return done();
            });
          });
          describe('and is explicit', function() {
            it('should forward arguments to exit methods', function() {
              return expect(this.machine.D_exit.calledWith(['B'], ['foo', 2])).to.be.ok;
            });
            it('should forward arguments to enter methods', function() {
              return expect(this.machine.D_enter.calledWith(['D', 'B'], ['foo', 2])).to.be.ok;
            });
            it('should forward arguments to self transition methods', function() {
              return expect(this.machine.D_D.calledWith(['D'], ['foo', 2])).to.be.ok;
            });
            return it('should forward arguments to transition methods', function() {
              return expect(this.machine.C_D.calledWith(['D', 'B'], ['foo', 2])).to.be.ok;
            });
          });
          return describe('and is non-explicit', function() {
            it('should not forward arguments to exit methods', function() {
              return expect(this.machine.A_exit.calledWith(['D', 'B'])).to.be.ok;
            });
            it('should not forward arguments to enter methods', function() {
              return expect(this.machine.B_enter.calledWith(['D', 'B'])).to.be.ok;
            });
            return it('should not forward arguments to transition methods', function() {
              return expect(this.machine.A_B.calledWith(['D', 'B'])).to.be.ok;
            });
          });
        });
      });
      describe('and delayed', function() {
        beforeEach(function() {
          this.machine.setStateLater('D');
          return this.promise = this.machine.last_promise;
        });
        afterEach(function() {
          return delete this.promise;
        });
        it('should return a promise', function() {
          return expect(this.promise instanceof Promise).to.be.ok;
        });
        it('should execute the change', function(done) {
          var _this = this;
          this.promise.resolve();
          return this.promise.then(function() {
            expect(_this.machine.any_D.calledOnce).to.be.ok;
            expect(_this.machine.D_enter.calledOnce).to.be.ok;
            return done();
          });
        });
        it('should expose a ref to the last promise', function() {
          return expect(this.machine.last_promise).to.equal(this.promise);
        });
        it('should be called with params passed to the delayed function', function(done) {
          this.machine.D_enter = function() {
            expect(arguments).to.be.eql([['D'], [], ['foo', 2]]);
            return done();
          };
          return this.promise.resolve(['foo', 2]);
        });
        return describe('and then canceled', function() {
          beforeEach(function() {
            return this.promise.reject();
          });
          return it('should not execute the change', function() {
            expect(this.machine.any_D.called).not.to.be.ok;
            return expect(this.machine.D_enter.called).not.to.be.ok;
          });
        });
      });
      describe('and active state is also the target one', function() {
        it('should trigger self transition at the very beginning', function() {
          var order;
          this.machine.setState(['A', 'B']);
          order = [this.machine.A_A, this.machine.any_B, this.machine.B_enter];
          return assert_order(order);
        });
        it('should be executed only for explicitly called states');
        it('should be cancellable', function() {
          this.machine.A_A = sinon.stub().returns(false);
          this.machine.setState(['A', 'B']);
          expect(this.machine.A_A.calledOnce).to.be.ok;
          return expect(this.machine.any_B.called).not.to.be.ok;
        });
        return after(function() {
          return delete this.machine.A_A;
        });
      });
      return describe('should trigger events', function() {
        beforeEach(function() {
          this.machine = new FooMachine('A');
          mock_states(this.machine, ['A', 'B', 'C', 'D']);
          this.machine.setState(['A', 'C']);
          this.machine.on('A._.A', this.A_A = sinon.spy());
          this.machine.on('B.enter', this.B_enter = sinon.spy());
          this.machine.on('C.exit', this.C_exit = sinon.spy());
          this.machine.on('D.exit', function() {
            return false;
          });
          this.machine.on('state.set', this.setState = sinon.spy());
          this.machine.on('state.cancel', this.cancelTransition = sinon.spy());
          this.machine.on('state.add', this.addState = sinon.spy());
          this.machine.setState(['A', 'B']);
          this.machine.addState(['C']);
          return this.machine.addState(['D']);
        });
        afterEach(function() {
          delete this.C_exit;
          delete this.A_A;
          delete this.B_enter;
          delete this.addState;
          delete this.setState;
          return delete this.cancelTransition;
        });
        it('for self transitions', function() {
          return expect(this.A_A.called).to.be.ok;
        });
        it('for enter transitions', function() {
          return expect(this.B_enter.called).to.be.ok;
        });
        it('for exit transtions', function() {
          return expect(this.C_exit.called).to.be.ok;
        });
        it('which can cancel the transition', function() {
          this.machine.on('D_enter', sinon.stub().returns(false));
          this.machine.setState('D');
          return expect(this.machine.D_any.called).not.to.be.ok;
        });
        it('for setting a new state', function() {
          return expect(this.setState.called).to.be.ok;
        });
        it('for adding a new state', function() {
          return expect(this.addState.called).to.be.ok;
        });
        return it('for cancelling the transition', function() {
          return expect(this.cancelTransition.called).to.be.ok;
        });
      });
    });
    describe('Events', function() {
      var EventMachine;
      EventMachine = (function(_super) {
        __extends(EventMachine, _super);
        function EventMachine() {
          return EventMachine.__super__.constructor.apply(this, arguments);
        }
        EventMachine.prototype.state_TestNamespace = {};
        return EventMachine;
      })(FooMachine);
      beforeEach(function() {
        return this.machine = new EventMachine('A');
      });
      describe('should support states', function() {
        it('by triggering the *.enter listener at once for active states', function() {
          var i, l, _i;
          l = [];
          for (i = _i = 0; _i <= 2; i = ++_i) {
            l[i] = sinon.stub();
          }
          i = 0;
          this.machine.setState('B');
          this.machine.on('A.enter', l[i++]);
          this.machine.on('B.enter', l[i++]);
          i = 0;
          expect(l[i++].called).not.to.be.ok;
          return expect(l[i++].calledOnce).to.be.ok;
        });
        it('by triggering the *.exit listeners at once for non active states', function() {
          var i, l, _i;
          l = [];
          for (i = _i = 0; _i <= 2; i = ++_i) {
            l[i] = sinon.stub();
          }
          i = 0;
          this.machine.setState('B');
          this.machine.on('A.exit', l[i++]);
          this.machine.on('B.exit', l[i++]);
          i = 0;
          expect(l[i++].calledOnce).to.be.ok;
          return expect(l[i++].called).not.to.be.ok;
        });
        return it('shouldn\'t duplicate events');
      });
      describe('should support namespaces', function() {
        describe('with wildcards', function() {
          beforeEach(function() {
            this.listeners = [];
            this.listeners.push(sinon.stub());
            this.listeners.push(sinon.stub());
            this.listeners.push(sinon.stub());
            this.machine.on('enter.Test', this.listeners[0]);
            this.machine.on('enter', this.listeners[1]);
            this.machine.on('A', this.listeners[2]);
            return this.machine.setState(['TestNamespace', 'B']);
          });
          it('should handle "enter.Test" sub event', function() {
            return expect(this.listeners[0].callCount).to.eql(1);
          });
          it('should handle "enter.*" sub event', function() {
            return expect(this.listeners[1].calledTwice).to.be.ok;
          });
          return it('should handle "A" sub events', function() {
            return expect(this.listeners[2].callCount).to.eql(4);
          });
        });
        return it('for all transitions', function() {
          var l1, l2;
          l1 = sinon.stub();
          l2 = sinon.stub();
          this.machine.on('Test.Namespace.enter', l1);
          this.machine.on('A._.Test.Namespace', l2);
          this.machine.setState('TestNamespace');
          expect(l1.calledOnce).to.be.ok;
          return expect(l2.calledOnce).to.be.ok;
        });
      });
      return describe('piping', function() {
        it('should forward a specific state', function() {
          var emitter;
          emitter = new EventMachine('A');
          this.machine.pipeForward('B', emitter);
          this.machine.setState('B');
          return expect(emitter.state()).to.eql(['B', 'A']);
        });
        it('should forward a specific state as a different one', function() {
          var emitter;
          emitter = new EventMachine('A');
          this.machine.pipeForward('B', emitter, 'C');
          this.machine.setState('B');
          return expect(emitter.state()).to.eql(['C', 'A']);
        });
        it('should invert a specific state as a different one', function() {
          var emitter;
          emitter = new EventMachine('A');
          this.machine.pipeInvert('A', emitter, 'C');
          this.machine.setState('B');
          return expect(emitter.state()).to.eql(['C', 'A']);
        });
        it('should forward a whole machine', function() {
          var machine2;
          machine2 = new EventMachine(['A', 'D']);
          expect(machine2.state()).to.eql(['A', 'D']);
          this.machine.pipeForward(machine2);
          this.machine.setState(['B', 'C']);
          return expect(machine2.state()).to.eql(['C', 'B', 'D']);
        });
        return it('can be turned off');
      });
    });
    describe('bugs', function() {
      it('should trigger the enter state of a subclass', function() {
        var Sub, a_enter_spy, b_enter_spy, sub;
        a_enter_spy = sinon.spy();
        b_enter_spy = sinon.spy();
        Sub = (function(_super) {
          __extends(Sub, _super);
          function Sub() {
            return Sub.__super__.constructor.apply(this, arguments);
          }
          Sub.prototype.state_A = {};
          Sub.prototype.state_B = {};
          Sub.prototype.A_enter = a_enter_spy;
          Sub.prototype.B_enter = b_enter_spy;
          return Sub;
        })(asyncmachine.AsyncMachine);
        sub = new Sub('A');
        sub.setState('B');
        expect(a_enter_spy.called).to.be.ok;
        return expect(b_enter_spy.called).to.be.ok;
      });
      it('should drop states cross-blocked by implied states', function() {
        var Sub, sub;
        Sub = (function(_super) {
          __extends(Sub, _super);
          Sub.prototype.state_A = {
            blocks: ['B']
          };
          Sub.prototype.state_B = {
            blocks: ['A']
          };
          Sub.prototype.state_C = {
            implies: ['B']
          };
          function Sub() {
            Sub.__super__.constructor.call(this);
            this.initStates('A');
            this.setState('C');
          }
          Sub.prototype.getState = function(name) {
            return this.constructor['state_' + name];
          };
          return Sub;
        })(asyncmachine.AsyncMachine);
        sub = new Sub;
        return expect(sub.state()).to.eql(['C', 'B']);
      });
      it('should pass args to transition methods');
      return it('addStatesLater');
    });
    describe('Promises', function() {
      it('can be resolved');
      it('can be rejected');
      it('can be chainable');
      return describe('delayed methods', function() {
        return it('should return correctly bound resolve method');
      });
    });
    describe('Task', function() {
      describe('states\' relations', function() {});
      describe('after scheduling a function', function() {
        it('should execute it after a given timeout');
        it('should be cancellable');
        return it('should have a Waiting state');
      });
      describe('after executing a function', function() {
        return it('should have an Idle sttae');
      });
      return describe('when executing a list of async functions', function() {
        it('should have a Running state');
        return it('should be cancellable');
      });
    });
    describe('auto states', function() {
      it('should work when more than one auto state present');
      it('should work when auto state if blocked');
      return it('shouldn\'t trigger any change if auto state is missing from target states');
    });
    return describe('piping', function() {
      return it('should pipe with states implied by another one');
    });
  });
}).call(this);
    }
  };
});
asyncmachineTest.pkg(8, function(parents){
  return {
    'id':9,
    'name':'buster-core',
    'main':undefined,
    'mainModuleId':'lib/buster-core',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(9, function(/* parent */){
  return {
    'id': 'lib/buster-core',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      var buster = (function (setTimeout, B) {
    var isNode = typeof require == "function" && typeof module == "object";
    var div = typeof document != "undefined" && document.createElement("div");
    var F = function () {};
    var buster = {
        bind: function bind(obj, methOrProp) {
            var method = typeof methOrProp == "string" ? obj[methOrProp] : methOrProp;
            var args = Array.prototype.slice.call(arguments, 2);
            return function () {
                var allArgs = args.concat(Array.prototype.slice.call(arguments));
                return method.apply(obj, allArgs);
            };
        },
        partial: function partial(fn) {
            var args = [].slice.call(arguments, 1);
            return function () {
                return fn.apply(this, args.concat([].slice.call(arguments)));
            };
        },
        create: function create(object) {
            F.prototype = object;
            return new F();
        },
        extend: function extend(target) {
            if (!target) { return; }
            for (var i = 1, l = arguments.length, prop; i < l; ++i) {
                for (prop in arguments[i]) {
                    target[prop] = arguments[i][prop];
                }
            }
            return target;
        },
        nextTick: function nextTick(callback) {
            if (typeof process != "undefined" && process.nextTick) {
                return process.nextTick(callback);
            }
            setTimeout(callback, 0);
        },
        functionName: function functionName(func) {
            if (!func) return "";
            if (func.displayName) return func.displayName;
            if (func.name) return func.name;
            var matches = func.toString().match(/function\s+([^\(]+)/m);
            return matches && matches[1] || "";
        },
        isNode: function isNode(obj) {
            if (!div) return false;
            try {
                obj.appendChild(div);
                obj.removeChild(div);
            } catch (e) {
                return false;
            }
            return true;
        },
        isElement: function isElement(obj) {
            return obj && obj.nodeType === 1 && buster.isNode(obj);
        },
        isArray: function isArray(arr) {
            return Object.prototype.toString.call(arr) == "[object Array]";
        },
        flatten: function flatten(arr) {
            var result = [], arr = arr || [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                result = result.concat(buster.isArray(arr[i]) ? flatten(arr[i]) : arr[i]);
            }
            return result;
        },
        each: function each(arr, callback) {
            for (var i = 0, l = arr.length; i < l; ++i) {
                callback(arr[i]);
            }
        },
        map: function map(arr, callback) {
            var results = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                results.push(callback(arr[i]));
            }
            return results;
        },
        parallel: function parallel(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                    callback = null;
                }
            }
            if (fns.length == 0) { return cb(null, []); }
            var remaining = fns.length, results = [];
            function makeDone(num) {
                return function done(err, result) {
                    if (err) { return cb(err); }
                    results[num] = result;
                    if (--remaining == 0) { cb(null, results); }
                };
            }
            for (var i = 0, l = fns.length; i < l; ++i) {
                fns[i](makeDone(i));
            }
        },
        series: function series(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                }
            }
            var remaining = fns.slice();
            var results = [];
            function callNext() {
                if (remaining.length == 0) return cb(null, results);
                var promise = remaining.shift()(next);
                if (promise && typeof promise.then == "function") {
                    promise.then(buster.partial(next, null), next);
                }
            }
            function next(err, result) {
                if (err) return cb(err);
                results.push(result);
                callNext();
            }
            callNext();
        },
        countdown: function countdown(num, done) {
            return function () {
                if (--num == 0) done();
            };
        }
    };
    if (typeof process === "object" &&
        typeof require === "function" && typeof module === "object") {
        var crypto = require("crypto");
        var path = require("path");
        buster.tmpFile = function (fileName) {
            var hashed = crypto.createHash("sha1");
            hashed.update(fileName);
            var tmpfileName = hashed.digest("hex");
            if (process.platform == "win32") {
                return path.join(process.env["TEMP"], tmpfileName);
            } else {
                return path.join("/tmp", tmpfileName);
            }
        };
    }
    if (Array.prototype.some) {
        buster.some = function (arr, fn, thisp) {
            return arr.some(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
        buster.some = function (arr, fun, thisp) {
            "use strict";
            if (arr == null) { throw new TypeError(); }
            arr = Object(arr);
            var len = arr.length >>> 0;
            if (typeof fun !== "function") { throw new TypeError(); }
            for (var i = 0; i < len; i++) {
                if (arr.hasOwnProperty(i) && fun.call(thisp, arr[i], i, arr)) {
                    return true;
                }
            }
            return false;
        };
    }
    if (Array.prototype.filter) {
        buster.filter = function (arr, fn, thisp) {
            return arr.filter(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
        buster.filter = function (fn, thisp) {
            "use strict";
            if (this == null) { throw new TypeError(); }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fn != "function") { throw new TypeError(); }
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fn.call(thisp, val, i, t)) { res.push(val); }
                }
            }
            return res;
        };
    }
    if (isNode) {
        module.exports = buster;
        buster.eventEmitter = require("./buster-event-emitter");
        Object.defineProperty(buster, "defineVersionGetter", {
            get: function () {
                return require("./define-version-getter");
            }
        });
    }
    return buster.extend(B || {}, buster);
}(setTimeout, buster));
    }
  };
});
asyncmachineTest.module(9, function(/* parent */){
  return {
    'id': 'lib/buster-core',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      var buster = (function (setTimeout, B) {
    var isNode = typeof require == "function" && typeof module == "object";
    var div = typeof document != "undefined" && document.createElement("div");
    var F = function () {};
    var buster = {
        bind: function bind(obj, methOrProp) {
            var method = typeof methOrProp == "string" ? obj[methOrProp] : methOrProp;
            var args = Array.prototype.slice.call(arguments, 2);
            return function () {
                var allArgs = args.concat(Array.prototype.slice.call(arguments));
                return method.apply(obj, allArgs);
            };
        },
        partial: function partial(fn) {
            var args = [].slice.call(arguments, 1);
            return function () {
                return fn.apply(this, args.concat([].slice.call(arguments)));
            };
        },
        create: function create(object) {
            F.prototype = object;
            return new F();
        },
        extend: function extend(target) {
            if (!target) { return; }
            for (var i = 1, l = arguments.length, prop; i < l; ++i) {
                for (prop in arguments[i]) {
                    target[prop] = arguments[i][prop];
                }
            }
            return target;
        },
        nextTick: function nextTick(callback) {
            if (typeof process != "undefined" && process.nextTick) {
                return process.nextTick(callback);
            }
            setTimeout(callback, 0);
        },
        functionName: function functionName(func) {
            if (!func) return "";
            if (func.displayName) return func.displayName;
            if (func.name) return func.name;
            var matches = func.toString().match(/function\s+([^\(]+)/m);
            return matches && matches[1] || "";
        },
        isNode: function isNode(obj) {
            if (!div) return false;
            try {
                obj.appendChild(div);
                obj.removeChild(div);
            } catch (e) {
                return false;
            }
            return true;
        },
        isElement: function isElement(obj) {
            return obj && obj.nodeType === 1 && buster.isNode(obj);
        },
        isArray: function isArray(arr) {
            return Object.prototype.toString.call(arr) == "[object Array]";
        },
        flatten: function flatten(arr) {
            var result = [], arr = arr || [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                result = result.concat(buster.isArray(arr[i]) ? flatten(arr[i]) : arr[i]);
            }
            return result;
        },
        each: function each(arr, callback) {
            for (var i = 0, l = arr.length; i < l; ++i) {
                callback(arr[i]);
            }
        },
        map: function map(arr, callback) {
            var results = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                results.push(callback(arr[i]));
            }
            return results;
        },
        parallel: function parallel(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                    callback = null;
                }
            }
            if (fns.length == 0) { return cb(null, []); }
            var remaining = fns.length, results = [];
            function makeDone(num) {
                return function done(err, result) {
                    if (err) { return cb(err); }
                    results[num] = result;
                    if (--remaining == 0) { cb(null, results); }
                };
            }
            for (var i = 0, l = fns.length; i < l; ++i) {
                fns[i](makeDone(i));
            }
        },
        series: function series(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                }
            }
            var remaining = fns.slice();
            var results = [];
            function callNext() {
                if (remaining.length == 0) return cb(null, results);
                var promise = remaining.shift()(next);
                if (promise && typeof promise.then == "function") {
                    promise.then(buster.partial(next, null), next);
                }
            }
            function next(err, result) {
                if (err) return cb(err);
                results.push(result);
                callNext();
            }
            callNext();
        },
        countdown: function countdown(num, done) {
            return function () {
                if (--num == 0) done();
            };
        }
    };
    if (typeof process === "object" &&
        typeof require === "function" && typeof module === "object") {
        var crypto = require("crypto");
        var path = require("path");
        buster.tmpFile = function (fileName) {
            var hashed = crypto.createHash("sha1");
            hashed.update(fileName);
            var tmpfileName = hashed.digest("hex");
            if (process.platform == "win32") {
                return path.join(process.env["TEMP"], tmpfileName);
            } else {
                return path.join("/tmp", tmpfileName);
            }
        };
    }
    if (Array.prototype.some) {
        buster.some = function (arr, fn, thisp) {
            return arr.some(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
        buster.some = function (arr, fun, thisp) {
            "use strict";
            if (arr == null) { throw new TypeError(); }
            arr = Object(arr);
            var len = arr.length >>> 0;
            if (typeof fun !== "function") { throw new TypeError(); }
            for (var i = 0; i < len; i++) {
                if (arr.hasOwnProperty(i) && fun.call(thisp, arr[i], i, arr)) {
                    return true;
                }
            }
            return false;
        };
    }
    if (Array.prototype.filter) {
        buster.filter = function (arr, fn, thisp) {
            return arr.filter(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
        buster.filter = function (fn, thisp) {
            "use strict";
            if (this == null) { throw new TypeError(); }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fn != "function") { throw new TypeError(); }
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fn.call(thisp, val, i, t)) { res.push(val); }
                }
            }
            return res;
        };
    }
    if (isNode) {
        module.exports = buster;
        buster.eventEmitter = require("./buster-event-emitter");
        Object.defineProperty(buster, "defineVersionGetter", {
            get: function () {
                return require("./define-version-getter");
            }
        });
    }
    return buster.extend(B || {}, buster);
}(setTimeout, buster));
    }
  };
});
asyncmachineTest.module(9, function(/* parent */){
  return {
    'id': 'lib/buster-event-emitter',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global buster, require, module*/
if (typeof require == "function" && typeof module == "object") {
    var buster = require("./buster-core");
}
(function () {
    function eventListeners(eventEmitter, event) {
        if (!eventEmitter.listeners) {
            eventEmitter.listeners = {};
        }
        if (!eventEmitter.listeners[event]) {
            eventEmitter.listeners[event] = [];
        }
        return eventEmitter.listeners[event];
    }
    function throwLater(event, error) {
        buster.nextTick(function () {
            error.message = event + " listener threw error: " + error.message;
            throw error;
        });
    }
    function addSupervisor(emitter, listener, thisObject) {
        if (!emitter.supervisors) { emitter.supervisors = []; }
        emitter.supervisors.push({
            listener: listener,
            thisObject: thisObject
        });
    }
    function notifyListener(emitter, event, listener, args) {
        try {
            listener.listener.apply(listener.thisObject || emitter, args);
        } catch (e) {
            throwLater(event, e);
        }
    }
    buster.eventEmitter = {
        create: function () {
            return buster.create(this);
        },
        addListener: function addListener(event, listener, thisObject) {
            if (typeof event === "function") {
                return addSupervisor(this, event, listener);
            }
            if (typeof listener != "function") {
                throw new TypeError("Listener is not function");
            }
            eventListeners(this, event).push({
                listener: listener,
                thisObject: thisObject
            });
        },
        once: function once(event, listener, thisObject) {
            var self = this;
            this.addListener(event, listener);
            var wrapped = function () {
                self.removeListener(event, listener);
                self.removeListener(event, wrapped);
            };
            this.addListener(event, wrapped);
        },
        hasListener: function hasListener(event, listener, thisObject) {
            var listeners = eventListeners(this, event);
            for (var i = 0, l = listeners.length; i < l; i++) {
                if (listeners[i].listener === listener &&
                    listeners[i].thisObject === thisObject) {
                    return true;
                }
            }
            return false;
        },
        removeListener: function (event, listener) {
            var listeners = eventListeners(this, event);
            for (var i = 0, l = listeners.length; i < l; ++i) {
                if (listeners[i].listener == listener) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        },
        emit: function emit(event) {
            var listeners = eventListeners(this, event).slice();
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, l = listeners.length; i < l; i++) {
                notifyListener(this, event, listeners[i], args);
            }
            listeners = this.supervisors || [];
            args = Array.prototype.slice.call(arguments);
            for (i = 0, l = listeners.length; i < l; ++i) {
                notifyListener(this, event, listeners[i], args);
            }
        },
        bind: function (object, events) {
            var method;
            if (!events) {
                for (method in object) {
                    if (object.hasOwnProperty(method) && typeof object[method] == "function") {
                        this.addListener(method, object[method], object);
                    }
                }
            } else if (typeof events == "string" ||
                       Object.prototype.toString.call(events) == "[object Array]") {
                events = typeof events == "string" ? [events] : events;
                for (var i = 0, l = events.length; i < l; ++i) {
                    this.addListener(events[i], object[events[i]], object);
                }
            } else {
                for (var prop in events) {
                    if (events.hasOwnProperty(prop)) {
                        method = events[prop];
                        if (typeof method == "function") {
                            object[buster.functionName(method) || prop] = method;
                        } else {
                            method = object[events[prop]];
                        }
                        this.addListener(prop, method, object);
                    }
                }
            }
            return object;
        }
    };
    buster.eventEmitter.on = buster.eventEmitter.addListener;
}());
if (typeof module != "undefined") {
    module.exports = buster.eventEmitter;
}
    }
  };
});
asyncmachineTest.module(9, function(/* parent */){
  return {
    'id': 'lib/define-version-getter',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      var path = require("path");
var fs = require("fs");
module.exports = function defineVersionGetter(mod, dirname) {
    Object.defineProperty(mod, "VERSION", {
        get: function () {
            if (!this.version) {
                var pkgJSON = path.resolve(dirname, "..", "package.json");
                var pkg = JSON.parse(fs.readFileSync(pkgJSON, "utf8"));
                this.version = pkg.version;
            }
            return this.version;
        }
    });
};
    }
  };
});
asyncmachineTest.pkg(7, function(parents){
  return {
    'id':8,
    'name':'buster-format',
    'main':undefined,
    'mainModuleId':'lib/buster-format',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(8, function(/* parent */){
  return {
    'id': 'lib/buster-format',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      if (typeof buster === "undefined") {
    var buster = {};
}
if (typeof module === "object" && typeof require === "function") {
    buster = require("buster-core");
}
buster.format = buster.format || {};
buster.format.excludeConstructors = ["Object", /^.$/];
buster.format.quoteStrings = true;
buster.format.ascii = (function () {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    var specialObjects = [];
    if (typeof global != "undefined") {
        specialObjects.push({ obj: global, value: "[object global]" });
    }
    if (typeof document != "undefined") {
        specialObjects.push({ obj: document, value: "[object HTMLDocument]" });
    }
    if (typeof window != "undefined") {
        specialObjects.push({ obj: window, value: "[object Window]" });
    }
    function keys(object) {
        var k = Object.keys && Object.keys(object) || [];
        if (k.length == 0) {
            for (var prop in object) {
                if (hasOwn.call(object, prop)) {
                    k.push(prop);
                }
            }
        }
        return k.sort();
    }
    function isCircular(object, objects) {
        if (typeof object != "object") {
            return false;
        }
        for (var i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) {
                return true;
            }
        }
        return false;
    }
    function ascii(object, processed, indent) {
        if (typeof object == "string") {
            var quote = typeof this.quoteStrings != "boolean" || this.quoteStrings;
            return processed || quote ? '"' + object + '"' : object;
        }
        if (typeof object == "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }
        processed = processed || [];
        if (isCircular(object, processed)) {
            return "[Circular]";
        }
        if (Object.prototype.toString.call(object) == "[object Array]") {
            return ascii.array.call(this, object, processed);
        }
        if (!object) {
            return "" + object;
        }
        if (buster.isElement(object)) {
            return ascii.element(object);
        }
        if (typeof object.toString == "function" &&
            object.toString !== Object.prototype.toString) {
            return object.toString();
        }
        for (var i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].obj) {
                return specialObjects[i].value;
            }
        }
        return ascii.object.call(this, object, processed, indent);
    }
    ascii.func = function (func) {
        return "function " + buster.functionName(func) + "() {}";
    };
    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];
        for (var i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii.call(this, array[i], processed));
        }
        return "[" + pieces.join(", ") + "]";
    };
    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = keys(object), prop, str, obj;
        var is = "";
        var length = 3;
        for (var i = 0, l = indent; i < l; ++i) {
            is += " ";
        }
        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];
            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii.call(this, obj, processed, indent + 2);
            }
            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }
        var cons = ascii.constructorName.call(this, object);
        var prefix = cons ? "[" + cons + "] " : ""
        return (length + indent) > 80 ?
            prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" + is + "}" :
            prefix + "{ " + pieces.join(", ") + " }";
    };
    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attribute, pairs = [], attrName;
        for (var i = 0, l = attrs.length; i < l; ++i) {
            attribute = attrs.item(i);
            attrName = attribute.nodeName.toLowerCase().replace("html:", "");
            if (attrName == "contenteditable" && attribute.nodeValue == "inherit") {
                continue;
            }
            if (!!attribute.nodeValue) {
                pairs.push(attrName + "=\"" + attribute.nodeValue + "\"");
            }
        }
        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;
        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }
        var res = formatted + pairs.join(" ") + ">" + content + "</" + tagName + ">";
        return res.replace(/ contentEditable="inherit"/, "");
    };
    ascii.constructorName = function (object) {
        var name = buster.functionName(object && object.AsyncMachine);
        var excludes = this.excludeConstructors || buster.format.excludeConstructors || [];
        for (var i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] == "string" && excludes[i] == name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }
        return name;
    };
    return ascii;
}());
if (typeof module != "undefined") {
    module.exports = buster.format;
}
    }
  };
});
asyncmachineTest.module(8, function(/* parent */){
  return {
    'id': 'lib/buster-format',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      if (typeof buster === "undefined") {
    var buster = {};
}
if (typeof module === "object" && typeof require === "function") {
    buster = require("buster-core");
}
buster.format = buster.format || {};
buster.format.excludeConstructors = ["Object", /^.$/];
buster.format.quoteStrings = true;
buster.format.ascii = (function () {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    var specialObjects = [];
    if (typeof global != "undefined") {
        specialObjects.push({ obj: global, value: "[object global]" });
    }
    if (typeof document != "undefined") {
        specialObjects.push({ obj: document, value: "[object HTMLDocument]" });
    }
    if (typeof window != "undefined") {
        specialObjects.push({ obj: window, value: "[object Window]" });
    }
    function keys(object) {
        var k = Object.keys && Object.keys(object) || [];
        if (k.length == 0) {
            for (var prop in object) {
                if (hasOwn.call(object, prop)) {
                    k.push(prop);
                }
            }
        }
        return k.sort();
    }
    function isCircular(object, objects) {
        if (typeof object != "object") {
            return false;
        }
        for (var i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) {
                return true;
            }
        }
        return false;
    }
    function ascii(object, processed, indent) {
        if (typeof object == "string") {
            var quote = typeof this.quoteStrings != "boolean" || this.quoteStrings;
            return processed || quote ? '"' + object + '"' : object;
        }
        if (typeof object == "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }
        processed = processed || [];
        if (isCircular(object, processed)) {
            return "[Circular]";
        }
        if (Object.prototype.toString.call(object) == "[object Array]") {
            return ascii.array.call(this, object, processed);
        }
        if (!object) {
            return "" + object;
        }
        if (buster.isElement(object)) {
            return ascii.element(object);
        }
        if (typeof object.toString == "function" &&
            object.toString !== Object.prototype.toString) {
            return object.toString();
        }
        for (var i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].obj) {
                return specialObjects[i].value;
            }
        }
        return ascii.object.call(this, object, processed, indent);
    }
    ascii.func = function (func) {
        return "function " + buster.functionName(func) + "() {}";
    };
    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];
        for (var i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii.call(this, array[i], processed));
        }
        return "[" + pieces.join(", ") + "]";
    };
    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = keys(object), prop, str, obj;
        var is = "";
        var length = 3;
        for (var i = 0, l = indent; i < l; ++i) {
            is += " ";
        }
        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];
            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii.call(this, obj, processed, indent + 2);
            }
            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }
        var cons = ascii.constructorName.call(this, object);
        var prefix = cons ? "[" + cons + "] " : ""
        return (length + indent) > 80 ?
            prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" + is + "}" :
            prefix + "{ " + pieces.join(", ") + " }";
    };
    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attribute, pairs = [], attrName;
        for (var i = 0, l = attrs.length; i < l; ++i) {
            attribute = attrs.item(i);
            attrName = attribute.nodeName.toLowerCase().replace("html:", "");
            if (attrName == "contenteditable" && attribute.nodeValue == "inherit") {
                continue;
            }
            if (!!attribute.nodeValue) {
                pairs.push(attrName + "=\"" + attribute.nodeValue + "\"");
            }
        }
        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;
        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }
        var res = formatted + pairs.join(" ") + ">" + content + "</" + tagName + ">";
        return res.replace(/ contentEditable="inherit"/, "");
    };
    ascii.constructorName = function (object) {
        var name = buster.functionName(object && object.AsyncMachine);
        var excludes = this.excludeConstructors || buster.format.excludeConstructors || [];
        for (var i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] == "string" && excludes[i] == name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }
        return name;
    };
    return ascii;
}());
if (typeof module != "undefined") {
    module.exports = buster.format;
}
    }
  };
});
asyncmachineTest.pkg(1, function(parents){
  return {
    'id':2,
    'name':'chai',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      module.exports = (process && process.env && process.env.CHAI_COV)
  ? require('./lib-cov/chai')
  : require('./lib/chai');
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var used = []
  , exports = module.exports = {};
/*!
 * Chai version
 */
exports.version = '1.3.0';
/*!
 * Primary `Assertion` prototype
 */
exports.Assertion = require('./chai/assertion');
/*!
 * Assertion Error
 */
exports.AssertionError = require('./chai/error');
/*!
 * Utils for plugins (not exported)
 */
var util = require('./chai/utils');
/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */
exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }
  return this;
};
/*!
 * Core Assertions
 */
var core = require('./chai/core/assertions');
exports.use(core);
/*!
 * Expect interface
 */
var expect = require('./chai/interface/expect');
exports.use(expect);
/*!
 * Should interface
 */
var should = require('./chai/interface/should');
exports.use(should);
/*!
 * Assert interface
 */
var assert = require('./chai/interface/assert');
exports.use(assert);
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/assertion',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Module dependencies.
 */
var AssertionError = require('./error')
  , util = require('./utils')
  , flag = util.flag;
/*!
 * Module export.
 */
module.exports = Assertion;
/*!
 * Assertion Constructor
 *
 * Creates object for chaining.
 *
 * @api private
 */
function Assertion (obj, msg, stack) {
  flag(this, 'ssfi', stack || arguments.callee);
  flag(this, 'object', obj);
  flag(this, 'message', msg);
}
/*!
  * ### Assertion.includeStack
  *
  * User configurable property, influences whether stack trace
  * is included in Assertion error message. Default of false
  * suppresses stack trace in the error message
  *
  *     Assertion.includeStack = true;  // enable stack on error
  *
  * @api public
  */
Assertion.includeStack = false;
Assertion.addProperty = function (name, fn) {
  util.addProperty(this.prototype, name, fn);
};
Assertion.addMethod = function (name, fn) {
  util.addMethod(this.prototype, name, fn);
};
Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
  util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
};
Assertion.overwriteProperty = function (name, fn) {
  util.overwriteProperty(this.prototype, name, fn);
};
Assertion.overwriteMethod = function (name, fn) {
  util.overwriteMethod(this.prototype, name, fn);
};
/*!
 * ### .assert(expression, message, negateMessage, expected, actual)
 *
 * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
 *
 * @name assert
 * @param {Philosophical} expression to be tested
 * @param {String} message to display if fails
 * @param {String} negatedMessage to display if negated expression fails
 * @param {Mixed} expected value (remember to check for negation)
 * @param {Mixed} actual (optional) will default to `this.obj`
 * @api private
 */
Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual) {
  var ok = util.test(this, arguments);
  if (!ok) {
    var msg = util.getMessage(this, arguments)
      , actual = util.getActual(this, arguments);
    throw new AssertionError({
        message: msg
      , actual: actual
      , expected: expected
      , stackStartFunction: (Assertion.includeStack) ? this.assert : flag(this, 'ssfi')
    });
  }
};
/*!
 * ### ._obj
 *
 * Quick reference to stored `actual` value for plugin developers.
 *
 * @api private
 */
Object.defineProperty(Assertion.prototype, '_obj',
  { get: function () {
      return flag(this, 'object');
    }
  , set: function (val) {
      flag(this, 'object', val);
    }
});
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/browser/error',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
module.exports = AssertionError;
function AssertionError (options) {
  options = options || {};
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.stackStartFunction && Error.captureStackTrace) {
    var stackStartFunction = options.stackStartFunction;
    Error.captureStackTrace(this, stackStartFunction);
  }
}
AssertionError.prototype = Object.create(Error.prototype);
AssertionError.prototype.name = 'AssertionError';
AssertionError.prototype.constructor = AssertionError;
AssertionError.prototype.toString = function() {
  return this.message;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/core/assertions',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;
  /**
   * ### Language Chains
   *
   * The following are provide as chainable getters to
   * improve the readability of your assertions. They
   * do not provide an testing capability unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - and
   * - have
   * - with
   *
   * @name language chains
   * @api public
   */
  [ 'to', 'be', 'been'
  , 'is', 'and', 'have'
  , 'with', 'that' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });
  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @api public
   */
  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });
  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * @name deep
   * @api public
   */
  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });
  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type (as revealed by `Object.prototype.toString`).
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @api public
   */
  function an(type, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , klassStart = type.charAt(0).toUpperCase()
      , klass = klassStart + type.slice(1)
      , article = ~[ 'A', 'E', 'I', 'O', 'U' ].indexOf(klassStart) ? 'an ' : 'a ';
    this.assert(
        '[object ' + klass + ']' === toString.call(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }
  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);
  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contain` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @api public
   */
  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }
  function include (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
    this.assert(
        ~obj.indexOf(val)
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }
  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everthing').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * @name ok
   * @api public
   */
  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });
  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * @name true
   * @api public
   */
  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });
  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * @name false
   * @api public
   */
  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });
  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).not.to.be.null;
   *
   * @name null
   * @api public
   */
  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });
  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *      expect(undefined).to.be.undefined;
   *      expect(null).to.not.be.undefined;
   *
   * @name undefined
   * @api public
   */
  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });
  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * @name exist
   * @api public
   */
  Assertion.addProperty('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });
  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * @name empty
   * @api public
   */
  Assertion.addProperty('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;
    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }
    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });
  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @api public
   */
  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }
  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);
  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */
  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
      );
    }
  }
  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);
  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('eql', function (obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
    );
  });
  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */
  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }
  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);
  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */
  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }
  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);
  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });
  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @api public
   */
  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };
  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);
  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };
   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @api public
   */
  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);
    var descriptor = flag(this, 'deep') ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , value = flag(this, 'deep')
        ? _.getPathValue(name, obj)
        : obj[name];
    if (negate && undefined !== val) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          undefined !== value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }
    if (undefined !== val) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }
    flag(this, 'object', value);
  });
  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @api public
   */
  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }
  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);
  /**
   * ### .length(value)
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.length(3);
   *     expect('foobar').to.have.length(6);
   *
   * Can also be used as a chain precursor to a value
   * comparison for the length property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name length
   * @alias lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @api public
   */
  function assertLengthChain () {
    flag(this, 'doLength', true);
  }
  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;
    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }
  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength, assertLengthChain);
  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('match', function (re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  });
  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');
    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });
  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target has exactly the given keys, or
   * asserts the inclusion of some keys when using the
   * `include` or `contain` modifiers.
   *
   *     expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');
   *
   * @name keys
   * @alias key
   * @param {String...|Array} keys
   * @api public
   */
  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true;
    keys = keys instanceof Array
      ? keys
      : Array.prototype.slice.call(arguments);
    if (!keys.length) throw new Error('keys required');
    var actual = Object.keys(obj)
      , len = keys.length;
    // Inclusion
    ok = keys.every(function(key){
      return ~actual.indexOf(key);
    });
    // Strict
    if (!flag(this, 'negate') && !flag(this, 'contains')) {
      ok = ok && keys.length == actual.length;
    }
    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      str = keys.join(', ') + ', and ' + last;
    } else {
      str = _.inspect(keys[0]);
    }
    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;
    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;
    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
    );
  }
  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);
  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *     expect(fn).to.not.throw(new RangeError('Out of range.'));
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */
  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');
    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;
    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = (new constructor()).name;
    } else {
      constructor = null;
    }
    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw ' + _.inspect(desiredError) + ' but ' + _.inspect(err) + ' was thrown'
          , 'expected #{this} to not throw ' + _.inspect(desiredError)
        );
        return this;
      }
      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw ' + name + ' but ' + _.inspect(err) + ' was thrown'
          , 'expected #{this} to not throw ' + name + ' but ' + _.inspect(err) + ' was thrown');
        if (!errMsg) return this;
      }
      // next, check message
      if (err.message && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(err.message)
          , 'expected #{this} to throw error matching ' + errMsg + ' but got ' + _.inspect(err.message)
          , 'expected #{this} to throw error not matching ' + errMsg
        );
        return this;
      } else if (err.message && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~err.message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , err.message
        );
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }
    var expectedThrown = name ? name : desiredError ? _.inspect(desiredError) : 'an error';
    var actuallyGot = ''
    if (thrown) {
      actuallyGot = ' but ' + _.inspect(thrownError) + ' was thrown'
    }
    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
    );
  };
  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);
  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *    Klass.baz = function(){};
   *    expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @param {String} method
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('respondTo', function (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === typeof obj && !itself)
        ? obj.prototype[method]
        : obj[method];
    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  });
  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *    function Foo() {}
   *    Foo.bar = function() {}
   *    Foo.prototype.baz = function() {}
   *
   *    expect(Foo).itself.to.respondTo('bar');
   *    expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @api public
   */
  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });
  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @param {Function} matcher
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('satisfy', function (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        matcher(obj)
      , 'expected #{this} to satisfy ' + _.inspect(matcher)
      , 'expected #{this} to not satisfy' + _.inspect(matcher)
      , this.negate ? false : true
      , matcher(obj)
    );
  });
  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @api public
   */
  Assertion.addMethod('closeTo', function (expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  });
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/error',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Main export
 */
module.exports = AssertionError;
/**
 * # AssertionError (constructor)
 *
 * Create a new assertion error based on the Javascript
 * `Error` prototype.
 *
 * **Options**
 * - message
 * - actual
 * - expected
 * - operator
 * - startStackFunction
 *
 * @param {Object} options
 * @api public
 */
function AssertionError (options) {
  options = options || {};
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.stackStartFunction && Error.captureStackTrace) {
    var stackStartFunction = options.stackStartFunction;
    Error.captureStackTrace(this, stackStartFunction);
  }
}
/*!
 * Inherit from Error
 */
AssertionError.prototype = Object.create(Error.prototype);
AssertionError.prototype.name = 'AssertionError';
AssertionError.prototype.constructor = AssertionError;
/**
 * # toString()
 *
 * Override default to string method
 */
AssertionError.prototype.toString = function() {
  return this.message;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/interface/assert',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
module.exports = function (chai, util) {
  /*!
   * Chai dependencies.
   */
  var Assertion = chai.Assertion
    , flag = util.flag;
  /*!
   * Module export.
   */
  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @api public
   */
  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };
  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @api public
   */
  assert.fail = function (actual, expected, message, operator) {
    throw new chai.AssertionError({
        actual: actual
      , expected: expected
      , message: message
      , operator: operator
      , stackStartFunction: assert.fail
    });
  };
  /**
   * ### .ok(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.ok('everything', 'everything is ok');
   *     assert.ok(false, 'this will fail');
   *
   * @name ok
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */
  assert.ok = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };
  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg);
    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };
  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg);
    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };
  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };
  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };
  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };
  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */
  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };
  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };
  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };
  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };
  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };
  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };
  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };
  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };
  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };
  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object (as revealed by
   * `Object.prototype.toString`).
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };
  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object.
   *
   *     var selection = 'chai'
   *     assert.isObject(selection, 'tea selection is not an object');
   *     assert.isObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };
  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };
  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };
  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };
  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };
  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @api public
   */
  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };
  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };
  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };
  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };
  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @api public
   */
  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };
  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @api public
   */
  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };
  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */
  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };
  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */
  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };
  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */
  assert.include = function (exp, inc, msg) {
    var obj = new Assertion(exp, msg);
    if (Array.isArray(exp)) {
      obj.to.include(inc);
    } else if ('string' === typeof exp) {
      obj.to.contain.string(inc);
    }
  };
  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */
  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };
  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */
  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };
  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */
  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };
  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */
  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };
  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */
  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };
  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */
  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };
  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };
  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };
  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };
  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */
  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };
  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 5, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @api public
   */
  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };
  /**
   * ### .throws(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throw(fn, ReferenceError, 'function throws a reference error');
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */
  assert.Throw = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }
    new Assertion(fn, msg).to.Throw(type);
  };
  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */
  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }
    new Assertion(fn, msg).to.not.Throw(type);
  };
  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @api public
   */
  assert.operator = function (val, operator, val2, msg) {
    if (!~['==', '===', '>', '>=', '<', '<=', '!=', '!=='].indexOf(operator)) {
      throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(eval(val + operator + val2), msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };
  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @api public
   */
  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };
  /*!
   * Undocumented / untested
   */
  assert.ifError = function (val, msg) {
    new Assertion(val, msg).to.not.be.ok;
  };
  /*!
   * Aliases.
   */
  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('Throw', 'throw')
  ('Throw', 'throws');
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/interface/expect',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/interface/should',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
module.exports = function (chai, util) {
  var Assertion = chai.Assertion;
  function loadShould () {
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should',
      {
        set: function (value) {
          // See https://github.com/chaijs/chai/issues/86: this makes
          // `whatever.should = someValue` actually set `someValue`, which is
          // especially useful for `global.should = require('chai').should()`.
          //
          // Note that we have to use [[DefineProperty]] instead of [[Put]]
          // since otherwise we would trigger this very setter!
          Object.defineProperty(this, 'should', {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        }
      , get: function(){
          if (this instanceof String || this instanceof Number) {
            return new Assertion(this.constructor(this));
          } else if (this instanceof Boolean) {
            return new Assertion(this == true);
          }
          return new Assertion(this);
        }
      , configurable: true
    });
    var should = {};
    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };
    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };
    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }
    // negation
    should.not = {}
    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };
    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };
    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }
    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];
    return should;
  };
  chai.should = loadShould;
  chai.Should = loadShould;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/addChainableMethod',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Module dependencies
 */
var transferFlags = require('./transferFlags');
/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @name addChainableMethod
 * @api public
 */
module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function')
    chainingBehavior = function () { };
  Object.defineProperty(ctx, name,
    { get: function () {
        chainingBehavior.call(this);
        var assert = function () {
          var result = method.apply(this, arguments);
          return result === undefined ? this : result;
        };
        // Re-enumerate every time to better accomodate plugins.
        var asserterNames = Object.getOwnPropertyNames(ctx);
        asserterNames.forEach(function (asserterName) {
          var pd = Object.getOwnPropertyDescriptor(ctx, asserterName)
            , functionProtoPD = Object.getOwnPropertyDescriptor(Function.prototype, asserterName);
          // Avoid trying to overwrite things that we can't, like `length` and `arguments`.
          if (functionProtoPD && !functionProtoPD.configurable) return;
          if (asserterName === 'arguments') return; // @see chaijs/chai/issues/69
          Object.defineProperty(assert, asserterName, pd);
        });
        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/addMethod',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - addMethod utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @name addMethod
 * @api public
 */
module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/addProperty',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - addProperty utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @name addProperty
 * @api public
 */
module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/eql',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // This is (almost) directly from Node.js assert
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/assert.js
module.exports = _deepEqual;
// for the browser
var Buffer;
try {
  Buffer = require('buffer').Buffer;
} catch (ex) {
  Buffer = {
    isBuffer: function () { return false; }
  };
}
function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;
    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }
    return true;
  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual === expected;
  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}
function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}
function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}
function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = Object.keys(a),
        kb = Object.keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/flag',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - flag utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### flag(object ,key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object (constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @name flag
 * @api private
 */
module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/getActual',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - getActual utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */
module.exports = function (obj, args) {
  var actual = args[4];
  return 'undefined' !== actual ? actual : obj._obj;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/getMessage',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - message composition utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Module dependancies
 */
var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');
/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Messsage template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @name getMessage
 * @api public
 */
module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');
  msg = msg || '';
  msg = msg
    .replace(/#{this}/g, objDisplay(val))
    .replace(/#{act}/g, objDisplay(actual))
    .replace(/#{exp}/g, objDisplay(expected));
  return flagMsg ? flagMsg + ': ' + msg : msg;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/getName',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - getName utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 */
module.exports = function (func) {
  if (func.name) return func.name;
  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/getPathValue',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - getPathValue utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */
/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @name getPathValue
 * @api public
 */
var getPathValue = module.exports = function (path, obj) {
  var parsed = parsePath(path);
  return _getPathValue(parsed, obj);
};
/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */
function parsePath (path) {
  var str = path.replace(/\[/g, '.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /\[(\d+)\]$/
      , mArr = re.exec(value)
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value };
  });
};
/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */
function _getPathValue (parsed, obj) {
  var tmp = obj
    , res;
  for (var i = 0, l = parsed.length; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Main exports
 */
var exports = module.exports = {};
/*!
 * test utility
 */
exports.test = require('./test');
/*!
 * message utility
 */
exports.getMessage = require('./getMessage');
/*!
 * actual utility
 */
exports.getActual = require('./getActual');
/*!
 * Inspect util
 */
exports.inspect = require('./inspect');
/*!
 * Object Display util
 */
exports.objDisplay = require('./objDisplay');
/*!
 * Flag utility
 */
exports.flag = require('./flag');
/*!
 * Flag transferring utility
 */
exports.transferFlags = require('./transferFlags');
/*!
 * Deep equal utility
 */
exports.eql = require('./eql');
/*!
 * Deep path value
 */
exports.getPathValue = require('./getPathValue');
/*!
 * Function name
 */
exports.getName = require('./getName');
/*!
 * add Property
 */
exports.addProperty = require('./addProperty');
/*!
 * add Method
 */
exports.addMethod = require('./addMethod');
/*!
 * overwrite Property
 */
exports.overwriteProperty = require('./overwriteProperty');
/*!
 * overwrite Method
 */
exports.overwriteMethod = require('./overwriteMethod');
/*!
 * Add a chainable method
 */
exports.addChainableMethod = require('./addChainableMethod');
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/inspect',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js
var getName = require('./getName');
module.exports = inspect;
/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}
// https://gist.github.com/1044128/
var getOuterHTML = function(element) {
  if ('outerHTML' in element) return element.outerHTML;
  var ns = "http://www.w3.org/1999/xhtml";
  var container = document.createElementNS(ns, '_');
  var elemProto = (window.HTMLElement || window.Element).prototype;
  var xmlSerializer = new XMLSerializer();
  var html;
  if (document.xmlVersion) {
    return xmlSerializer.serializeToString(element);
  } else {
    container.appendChild(element.cloneNode(false));
    html = container.innerHTML.replace('><', '>' + element.innerHTML + '<');
    container.innerHTML = '';
    return html;
  }
};
  
// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};
function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.AsyncMachine && value.AsyncMachine.prototype === value)) {
    return value.inspect(recurseTimes);
  }
  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }
  // If it's DOM elem, get outer HTML.
  if (isDOMElement(value)) {
    return getOuterHTML(value);
  }
  // Look up the keys of the object.
  var visibleKeys = Object.keys(value);
  var keys = ctx.showHidden ? Object.getOwnPropertyNames(value) : visibleKeys;
  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }
  var base = '', array = false, braces = ['{', '}'];
  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }
  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }
  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }
  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }
  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }
  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }
  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }
  ctx.seen.push(value);
  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }
  ctx.seen.pop();
  return reduceToSingleString(output, base, braces);
}
function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');
    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    case 'number':
      return ctx.stylize('' + value, 'number');
    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}
function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }
  return name + ': ' + str;
}
function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);
  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }
  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}
function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}
function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}
function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}
function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}
function objectToString(o) {
  return Object.prototype.toString.call(o);
}
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/objDisplay',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - flag utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Module dependancies
 */
var inspect = require('./inspect');
/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @api public
 */
module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);
  if (str.length >= 40) {
    if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/overwriteMethod',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @name overwriteMethod
 * @api public
 */
module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };
  if (_method && 'function' === typeof _method)
    _super = _method;
  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/overwriteProperty',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @name overwriteProperty
 * @api public
 */
module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};
  if (_get && 'function' === typeof _get.get)
    _super = _get.get
  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/test',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - test utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/*!
 * Module dependancies
 */
var flag = require('./flag');
/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */
module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};
    }
  };
});
asyncmachineTest.module(2, function(/* parent */){
  return {
    'id': 'lib/chai/utils/transferFlags',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Chai - transferFlags utility
 * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags too; usually a new assertion
 * @param {Boolean} includeAll
 * @name getAllFlags
 * @api private
 */
module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));
  if (!object.__flags) {
    object.__flags = Object.create(null);
  }
  includeAll = arguments.length === 3 ? includeAll : true;
  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};
    }
  };
});
asyncmachineTest.pkg(1, function(parents){
  return {
    'id':18,
    'name':'coffee-script',
    'main':undefined,
    'mainModuleId':'coffee-script',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'browser',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var CoffeeScript, runScripts;
  CoffeeScript = require('./coffee-script');
  CoffeeScript.require = require;
  CoffeeScript["eval"] = function(code, options) {
    var _ref;
    if (options == null) {
      options = {};
    }
    if ((_ref = options.bare) == null) {
      options.bare = true;
    }
    return eval(CoffeeScript.compile(code, options));
  };
  CoffeeScript.run = function(code, options) {
    if (options == null) {
      options = {};
    }
    options.bare = true;
    return Function(CoffeeScript.compile(code, options))();
  };
  if (typeof window === "undefined" || window === null) {
    return;
  }
  CoffeeScript.load = function(url, callback) {
    var xhr;
    xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
    xhr.open('GET', url, true);
    if ('overrideMimeType' in xhr) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.onreadystatechange = function() {
      var _ref;
      if (xhr.readyState === 4) {
        if ((_ref = xhr.status) === 0 || _ref === 200) {
          CoffeeScript.run(xhr.responseText);
        } else {
          throw new Error("Could not load " + url);
        }
        if (callback) {
          return callback();
        }
      }
    };
    return xhr.send(null);
  };
  runScripts = function() {
    var coffees, execute, index, length, s, scripts;
    scripts = document.getElementsByTagName('script');
    coffees = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = scripts.length; _i < _len; _i++) {
        s = scripts[_i];
        if (s.type === 'text/coffeescript') {
          _results.push(s);
        }
      }
      return _results;
    })();
    index = 0;
    length = coffees.length;
    (execute = function() {
      var script;
      script = coffees[index++];
      if ((script != null ? script.type : void 0) === 'text/coffeescript') {
        if (script.src) {
          return CoffeeScript.load(script.src, execute);
        } else {
          CoffeeScript.run(script.innerHTML);
          return execute();
        }
      }
    })();
    return null;
  };
  if (window.addEventListener) {
    addEventListener('DOMContentLoaded', runScripts, false);
  } else {
    attachEvent('onload', runScripts);
  }
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'cake',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var CoffeeScript, cakefileDirectory, existsSync, fatalError, fs, helpers, missingTask, oparse, options, optparse, path, printTasks, switches, tasks;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  optparse = require('./optparse');
  CoffeeScript = require('./coffee-script');
  existsSync = fs.existsSync || path.existsSync;
  tasks = {};
  options = {};
  switches = [];
  oparse = null;
  helpers.extend(global, {
    task: function(name, description, action) {
      var _ref;
      if (!action) {
        _ref = [description, action], action = _ref[0], description = _ref[1];
      }
      return tasks[name] = {
        name: name,
        description: description,
        action: action
      };
    },
    option: function(letter, flag, description) {
      return switches.push([letter, flag, description]);
    },
    invoke: function(name) {
      if (!tasks[name]) {
        missingTask(name);
      }
      return tasks[name].action(options);
    }
  });
  exports.run = function() {
    var arg, args, _i, _len, _ref, _results;
    global.__originalDirname = fs.realpathSync('.');
    process.chdir(cakefileDirectory(__originalDirname));
    args = process.argv.slice(2);
    CoffeeScript.run(fs.readFileSync('Cakefile').toString(), {
      filename: 'Cakefile'
    });
    oparse = new optparse.OptionParser(switches);
    if (!args.length) {
      return printTasks();
    }
    try {
      options = oparse.parse(args);
    } catch (e) {
      return fatalError("" + e);
    }
    _ref = options["arguments"];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      _results.push(invoke(arg));
    }
    return _results;
  };
  printTasks = function() {
    var cakefilePath, desc, name, relative, spaces, task;
    relative = path.relative || path.resolve;
    cakefilePath = path.join(relative(__originalDirname, process.cwd()), 'Cakefile');
    console.log("" + cakefilePath + " defines the following tasks:\n");
    for (name in tasks) {
      task = tasks[name];
      spaces = 20 - name.length;
      spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
      desc = task.description ? "# " + task.description : '';
      console.log("cake " + name + spaces + " " + desc);
    }
    if (switches.length) {
      return console.log(oparse.help());
    }
  };
  fatalError = function(message) {
    console.error(message + '\n');
    console.log('To see a list of all tasks/options, run "cake"');
    return process.exit(1);
  };
  missingTask = function(task) {
    return fatalError("No such task: " + task);
  };
  cakefileDirectory = function(dir) {
    var parent;
    if (existsSync(path.join(dir, 'Cakefile'))) {
      return dir;
    }
    parent = path.normalize(path.join(dir, '..'));
    if (parent !== dir) {
      return cakefileDirectory(parent);
    }
    throw new Error("Cakefile not found in " + (process.cwd()));
  };
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'coffee-script',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Lexer, RESERVED, compile, fs, lexer, parser, path, stripBOM, vm, _ref,
    __hasProp = {}.hasOwnProperty;
  fs = require('fs');
  path = require('path');
  _ref = require('./lexer'), Lexer = _ref.Lexer, RESERVED = _ref.RESERVED;
  parser = require('./parser').parser;
  vm = require('vm');
  stripBOM = function(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
      return content.substring(1);
    } else {
      return content;
    }
  };
  if (require.extensions) {
    require.extensions['.coffee'] = function(module, filename) {
      var content;
      content = compile(stripBOM(fs.readFileSync(filename, 'utf8')), {
        filename: filename
      });
      return module._compile(content, filename);
    };
  }
  exports.VERSION = '1.4.0';
  exports.RESERVED = RESERVED;
  exports.helpers = require('./helpers');
  exports.compile = compile = function(code, options) {
    var header, js, merge;
    if (options == null) {
      options = {};
    }
    merge = exports.helpers.merge;
    try {
      js = (parser.parse(lexer.tokenize(code))).compile(options);
      if (!options.header) {
        return js;
      }
    } catch (err) {
      if (options.filename) {
        err.message = "In " + options.filename + ", " + err.message;
      }
      throw err;
    }
    header = "Generated by CoffeeScript " + this.VERSION;
    return "// " + header + "\n" + js;
  };
  exports.tokens = function(code, options) {
    return lexer.tokenize(code, options);
  };
  exports.nodes = function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  };
  exports.run = function(code, options) {
    var mainModule;
    if (options == null) {
      options = {};
    }
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '.';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    mainModule.paths = require('module')._nodeModulePaths(path.dirname(fs.realpathSync(options.filename)));
    if (path.extname(mainModule.filename) !== '.coffee' || require.extensions) {
      return mainModule._compile(compile(code, options), mainModule.filename);
    } else {
      return mainModule._compile(code, mainModule.filename);
    }
  };
  exports["eval"] = function(code, options) {
    var Module, Script, js, k, o, r, sandbox, v, _i, _len, _module, _ref1, _ref2, _require;
    if (options == null) {
      options = {};
    }
    if (!(code = code.trim())) {
      return;
    }
    Script = vm.Script;
    if (Script) {
      if (options.sandbox != null) {
        if (options.sandbox instanceof Script.createContext().constructor) {
          sandbox = options.sandbox;
        } else {
          sandbox = Script.createContext();
          _ref1 = options.sandbox;
          for (k in _ref1) {
            if (!__hasProp.call(_ref1, k)) continue;
            v = _ref1[k];
            sandbox[k] = v;
          }
        }
        sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
      } else {
        sandbox = global;
      }
      sandbox.__filename = options.filename || 'eval';
      sandbox.__dirname = path.dirname(sandbox.__filename);
      if (!(sandbox !== global || sandbox.module || sandbox.require)) {
        Module = require('module');
        sandbox.module = _module = new Module(options.modulename || 'eval');
        sandbox.require = _require = function(path) {
          return Module._load(path, _module, true);
        };
        _module.filename = sandbox.__filename;
        _ref2 = Object.getOwnPropertyNames(require);
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          r = _ref2[_i];
          if (r !== 'paths') {
            _require[r] = require[r];
          }
        }
        _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
        _require.resolve = function(request) {
          return Module._resolveFilename(request, _module);
        };
      }
    }
    o = {};
    for (k in options) {
      if (!__hasProp.call(options, k)) continue;
      v = options[k];
      o[k] = v;
    }
    o.bare = true;
    js = compile(code, o);
    if (sandbox === global) {
      return vm.runInThisContext(js);
    } else {
      return vm.runInContext(js, sandbox);
    }
  };
  lexer = new Lexer;
  parser.lexer = {
    lex: function() {
      var tag, _ref1;
      _ref1 = this.tokens[this.pos++] || [''], tag = _ref1[0], this.yytext = _ref1[1], this.yylineno = _ref1[2];
      return tag;
    },
    setInput: function(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };
  parser.yy = require('./nodes');
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'command',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var BANNER, CoffeeScript, EventEmitter, SWITCHES, compileJoin, compileOptions, compilePath, compileScript, compileStdio, exec, exists, forkNode, fs, helpers, hidden, joinTimeout, lint, loadRequires, notSources, optionParser, optparse, opts, outputPath, parseOptions, path, printLine, printTokens, printWarn, removeSource, sourceCode, sources, spawn, timeLog, unwatchDir, usage, version, wait, watch, watchDir, watchers, writeJs, _ref;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  optparse = require('./optparse');
  CoffeeScript = require('./coffee-script');
  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
  EventEmitter = require('events').EventEmitter;
  exists = fs.exists || path.exists;
  helpers.extend(CoffeeScript, new EventEmitter);
  printLine = function(line) {
    return process.stdout.write(line + '\n');
  };
  printWarn = function(line) {
    return process.stderr.write(line + '\n');
  };
  hidden = function(file) {
    return /^\.|~$/.test(file);
  };
  BANNER = 'Usage: coffee [options] path/to/script.coffee -- [args]\n\nIf called without options, `coffee` will run your script.';
  SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper'], ['-c', '--compile', 'compile to JavaScript and save as .js files'], ['-e', '--eval', 'pass a string from the command line as input'], ['-h', '--help', 'display this help message'], ['-i', '--interactive', 'run an interactive CoffeeScript REPL'], ['-j', '--join [FILE]', 'concatenate the source CoffeeScript before compiling'], ['-l', '--lint', 'pipe the compiled JavaScript through JavaScript Lint'], ['-n', '--nodes', 'print out the parse tree that the parser produces'], ['--nodejs [ARGS]', 'pass options directly to the "node" binary'], ['-o', '--output [DIR]', 'set the output directory for compiled JavaScript'], ['-p', '--print', 'print out the compiled JavaScript'], ['-r', '--require [FILE*]', 'require a library before executing your script'], ['-s', '--stdio', 'listen for and compile scripts over stdio'], ['-t', '--tokens', 'print out the tokens that the lexer/rewriter produce'], ['-v', '--version', 'display the version number'], ['-w', '--watch', 'watch scripts for changes and rerun commands']];
  opts = {};
  sources = [];
  sourceCode = [];
  notSources = {};
  watchers = {};
  optionParser = null;
  exports.run = function() {
    var literals, source, _i, _len, _results;
    parseOptions();
    if (opts.nodejs) {
      return forkNode();
    }
    if (opts.help) {
      return usage();
    }
    if (opts.version) {
      return version();
    }
    if (opts.require) {
      loadRequires();
    }
    if (opts.interactive) {
      return require('./repl');
    }
    if (opts.watch && !fs.watch) {
      return printWarn("The --watch feature depends on Node v0.6.0+. You are running " + process.version + ".");
    }
    if (opts.stdio) {
      return compileStdio();
    }
    if (opts["eval"]) {
      return compileScript(null, sources[0]);
    }
    if (!sources.length) {
      return require('./repl');
    }
    literals = opts.run ? sources.splice(1) : [];
    process.argv = process.argv.slice(0, 2).concat(literals);
    process.argv[0] = 'coffee';
    process.execPath = require.main.filename;
    _results = [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      _results.push(compilePath(source, true, path.normalize(source)));
    }
    return _results;
  };
  compilePath = function(source, topLevel, base) {
    return fs.stat(source, function(err, stats) {
      if (err && err.code !== 'ENOENT') {
        throw err;
      }
      if ((err != null ? err.code : void 0) === 'ENOENT') {
        if (topLevel && source.slice(-7) !== '.coffee') {
          source = sources[sources.indexOf(source)] = "" + source + ".coffee";
          return compilePath(source, topLevel, base);
        }
        if (topLevel) {
          console.error("File not found: " + source);
          process.exit(1);
        }
        return;
      }
      if (stats.isDirectory()) {
        if (opts.watch) {
          watchDir(source, base);
        }
        return fs.readdir(source, function(err, files) {
          var file, index, _ref1, _ref2;
          if (err && err.code !== 'ENOENT') {
            throw err;
          }
          if ((err != null ? err.code : void 0) === 'ENOENT') {
            return;
          }
          index = sources.indexOf(source);
          files = files.filter(function(file) {
            return !hidden(file);
          });
          [].splice.apply(sources, [index, index - index + 1].concat(_ref1 = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              _results.push(path.join(source, file));
            }
            return _results;
          })())), _ref1;
          [].splice.apply(sourceCode, [index, index - index + 1].concat(_ref2 = files.map(function() {
            return null;
          }))), _ref2;
          return files.forEach(function(file) {
            return compilePath(path.join(source, file), false, base);
          });
        });
      } else if (topLevel || path.extname(source) === '.coffee') {
        if (opts.watch) {
          watch(source, base);
        }
        return fs.readFile(source, function(err, code) {
          if (err && err.code !== 'ENOENT') {
            throw err;
          }
          if ((err != null ? err.code : void 0) === 'ENOENT') {
            return;
          }
          return compileScript(source, code.toString(), base);
        });
      } else {
        notSources[source] = true;
        return removeSource(source, base);
      }
    });
  };
  compileScript = function(file, input, base) {
    var o, options, t, task;
    o = opts;
    options = compileOptions(file);
    try {
      t = task = {
        file: file,
        input: input,
        options: options
      };
      CoffeeScript.emit('compile', task);
      if (o.tokens) {
        return printTokens(CoffeeScript.tokens(t.input));
      } else if (o.nodes) {
        return printLine(CoffeeScript.nodes(t.input).toString().trim());
      } else if (o.run) {
        return CoffeeScript.run(t.input, t.options);
      } else if (o.join && t.file !== o.join) {
        sourceCode[sources.indexOf(t.file)] = t.input;
        return compileJoin();
      } else {
        t.output = CoffeeScript.compile(t.input, t.options);
        CoffeeScript.emit('success', task);
        if (o.print) {
          return printLine(t.output.trim());
        } else if (o.compile) {
          return writeJs(t.file, t.output, base);
        } else if (o.lint) {
          return lint(t.file, t.output);
        }
      }
    } catch (err) {
      CoffeeScript.emit('failure', err, task);
      if (CoffeeScript.listeners('failure').length) {
        return;
      }
      if (o.watch) {
        return printLine(err.message + '\x07');
      }
      printWarn(err instanceof Error && err.stack || ("ERROR: " + err));
      return process.exit(1);
    }
  };
  compileStdio = function() {
    var code, stdin;
    code = '';
    stdin = process.openStdin();
    stdin.on('data', function(buffer) {
      if (buffer) {
        return code += buffer.toString();
      }
    });
    return stdin.on('end', function() {
      return compileScript(null, code);
    });
  };
  joinTimeout = null;
  compileJoin = function() {
    if (!opts.join) {
      return;
    }
    if (!sourceCode.some(function(code) {
      return code === null;
    })) {
      clearTimeout(joinTimeout);
      return joinTimeout = wait(100, function() {
        return compileScript(opts.join, sourceCode.join('\n'), opts.join);
      });
    }
  };
  loadRequires = function() {
    var realFilename, req, _i, _len, _ref1;
    realFilename = module.filename;
    module.filename = '.';
    _ref1 = opts.require;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      req = _ref1[_i];
      require(req);
    }
    return module.filename = realFilename;
  };
  watch = function(source, base) {
    var compile, compileTimeout, prevStats, rewatch, watchErr, watcher;
    prevStats = null;
    compileTimeout = null;
    watchErr = function(e) {
      if (e.code === 'ENOENT') {
        if (sources.indexOf(source) === -1) {
          return;
        }
        try {
          rewatch();
          return compile();
        } catch (e) {
          removeSource(source, base, true);
          return compileJoin();
        }
      } else {
        throw e;
      }
    };
    compile = function() {
      clearTimeout(compileTimeout);
      return compileTimeout = wait(25, function() {
        return fs.stat(source, function(err, stats) {
          if (err) {
            return watchErr(err);
          }
          if (prevStats && stats.size === prevStats.size && stats.mtime.getTime() === prevStats.mtime.getTime()) {
            return rewatch();
          }
          prevStats = stats;
          return fs.readFile(source, function(err, code) {
            if (err) {
              return watchErr(err);
            }
            compileScript(source, code.toString(), base);
            return rewatch();
          });
        });
      });
    };
    try {
      watcher = fs.watch(source, compile);
    } catch (e) {
      watchErr(e);
    }
    return rewatch = function() {
      if (watcher != null) {
        watcher.close();
      }
      return watcher = fs.watch(source, compile);
    };
  };
  watchDir = function(source, base) {
    var readdirTimeout, watcher;
    readdirTimeout = null;
    try {
      return watcher = fs.watch(source, function() {
        clearTimeout(readdirTimeout);
        return readdirTimeout = wait(25, function() {
          return fs.readdir(source, function(err, files) {
            var file, _i, _len, _results;
            if (err) {
              if (err.code !== 'ENOENT') {
                throw err;
              }
              watcher.close();
              return unwatchDir(source, base);
            }
            _results = [];
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              if (!(!hidden(file) && !notSources[file])) {
                continue;
              }
              file = path.join(source, file);
              if (sources.some(function(s) {
                return s.indexOf(file) >= 0;
              })) {
                continue;
              }
              sources.push(file);
              sourceCode.push(null);
              _results.push(compilePath(file, false, base));
            }
            return _results;
          });
        });
      });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  };
  unwatchDir = function(source, base) {
    var file, prevSources, toRemove, _i, _len;
    prevSources = sources.slice(0);
    toRemove = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        file = sources[_i];
        if (file.indexOf(source) >= 0) {
          _results.push(file);
        }
      }
      return _results;
    })();
    for (_i = 0, _len = toRemove.length; _i < _len; _i++) {
      file = toRemove[_i];
      removeSource(file, base, true);
    }
    if (!sources.some(function(s, i) {
      return prevSources[i] !== s;
    })) {
      return;
    }
    return compileJoin();
  };
  removeSource = function(source, base, removeJs) {
    var index, jsPath;
    index = sources.indexOf(source);
    sources.splice(index, 1);
    sourceCode.splice(index, 1);
    if (removeJs && !opts.join) {
      jsPath = outputPath(source, base);
      return exists(jsPath, function(itExists) {
        if (itExists) {
          return fs.unlink(jsPath, function(err) {
            if (err && err.code !== 'ENOENT') {
              throw err;
            }
            return timeLog("removed " + source);
          });
        }
      });
    }
  };
  outputPath = function(source, base) {
    var baseDir, dir, filename, srcDir;
    filename = path.basename(source, path.extname(source)) + '.js';
    srcDir = path.dirname(source);
    baseDir = base === '.' ? srcDir : srcDir.substring(base.length);
    dir = opts.output ? path.join(opts.output, baseDir) : srcDir;
    return path.join(dir, filename);
  };
  writeJs = function(source, js, base) {
    var compile, jsDir, jsPath;
    jsPath = outputPath(source, base);
    jsDir = path.dirname(jsPath);
    compile = function() {
      if (js.length <= 0) {
        js = ' ';
      }
      return fs.writeFile(jsPath, js, function(err) {
        if (err) {
          return printLine(err.message);
        } else if (opts.compile && opts.watch) {
          return timeLog("compiled " + source);
        }
      });
    };
    return exists(jsDir, function(itExists) {
      if (itExists) {
        return compile();
      } else {
        return exec("mkdir -p " + jsDir, compile);
      }
    });
  };
  wait = function(milliseconds, func) {
    return setTimeout(func, milliseconds);
  };
  timeLog = function(message) {
    return console.log("" + ((new Date).toLocaleTimeString()) + " - " + message);
  };
  lint = function(file, js) {
    var conf, jsl, printIt;
    printIt = function(buffer) {
      return printLine(file + ':\t' + buffer.toString().trim());
    };
    conf = __dirname + '/../../extras/jsl.conf';
    jsl = spawn('jsl', ['-nologo', '-stdin', '-conf', conf]);
    jsl.stdout.on('data', printIt);
    jsl.stderr.on('data', printIt);
    jsl.stdin.write(js);
    return jsl.stdin.end();
  };
  printTokens = function(tokens) {
    var strings, tag, token, value;
    strings = (function() {
      var _i, _len, _ref1, _results;
      _results = [];
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        _ref1 = [token[0], token[1].toString().replace(/\n/, '\\n')], tag = _ref1[0], value = _ref1[1];
        _results.push("[" + tag + " " + value + "]");
      }
      return _results;
    })();
    return printLine(strings.join(' '));
  };
  parseOptions = function() {
    var i, o, source, _i, _len;
    optionParser = new optparse.OptionParser(SWITCHES, BANNER);
    o = opts = optionParser.parse(process.argv.slice(2));
    o.compile || (o.compile = !!o.output);
    o.run = !(o.compile || o.print || o.lint);
    o.print = !!(o.print || (o["eval"] || o.stdio && o.compile));
    sources = o["arguments"];
    for (i = _i = 0, _len = sources.length; _i < _len; i = ++_i) {
      source = sources[i];
      sourceCode[i] = null;
    }
  };
  compileOptions = function(filename) {
    return {
      filename: filename,
      bare: opts.bare,
      header: opts.compile
    };
  };
  forkNode = function() {
    var args, nodeArgs;
    nodeArgs = opts.nodejs.split(/\s+/);
    args = process.argv.slice(1);
    args.splice(args.indexOf('--nodejs'), 2);
    return spawn(process.execPath, nodeArgs.concat(args), {
      cwd: process.cwd(),
      env: process.env,
      customFds: [0, 1, 2]
    });
  };
  usage = function() {
    return printLine((new optparse.OptionParser(SWITCHES, BANNER)).help());
  };
  version = function() {
    return printLine("CoffeeScript version " + CoffeeScript.VERSION);
  };
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'grammar',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Parser, alt, alternatives, grammar, name, o, operators, token, tokens, unwrap;
  Parser = require('jison').Parser;
  unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;
  o = function(patternString, action, options) {
    var match;
    patternString = patternString.replace(/\s{2,}/g, ' ');
    if (!action) {
      return [patternString, '$$ = $1;', options];
    }
    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
    return [patternString, "$$ = " + action + ";", options];
  };
  grammar = {
    Root: [
      o('', function() {
        return new Block;
      }), o('Body'), o('Block TERMINATOR')
    ],
    Body: [
      o('Line', function() {
        return Block.wrap([$1]);
      }), o('Body TERMINATOR Line', function() {
        return $1.push($3);
      }), o('Body TERMINATOR')
    ],
    Line: [o('Expression'), o('Statement')],
    Statement: [
      o('Return'), o('Comment'), o('STATEMENT', function() {
        return new Literal($1);
      })
    ],
    Expression: [o('Value'), o('Invocation'), o('Code'), o('Operation'), o('Assign'), o('If'), o('Try'), o('While'), o('For'), o('Switch'), o('Class'), o('Throw')],
    Block: [
      o('INDENT OUTDENT', function() {
        return new Block;
      }), o('INDENT Body OUTDENT', function() {
        return $2;
      })
    ],
    Identifier: [
      o('IDENTIFIER', function() {
        return new Literal($1);
      })
    ],
    AlphaNumeric: [
      o('NUMBER', function() {
        return new Literal($1);
      }), o('STRING', function() {
        return new Literal($1);
      })
    ],
    Literal: [
      o('AlphaNumeric'), o('JS', function() {
        return new Literal($1);
      }), o('REGEX', function() {
        return new Literal($1);
      }), o('DEBUGGER', function() {
        return new Literal($1);
      }), o('UNDEFINED', function() {
        return new Undefined;
      }), o('NULL', function() {
        return new Null;
      }), o('BOOL', function() {
        return new Bool($1);
      })
    ],
    Assign: [
      o('Assignable = Expression', function() {
        return new Assign($1, $3);
      }), o('Assignable = TERMINATOR Expression', function() {
        return new Assign($1, $4);
      }), o('Assignable = INDENT Expression OUTDENT', function() {
        return new Assign($1, $4);
      })
    ],
    AssignObj: [
      o('ObjAssignable', function() {
        return new Value($1);
      }), o('ObjAssignable : Expression', function() {
        return new Assign(new Value($1), $3, 'object');
      }), o('ObjAssignable :\
       INDENT Expression OUTDENT', function() {
        return new Assign(new Value($1), $4, 'object');
      }), o('Comment')
    ],
    ObjAssignable: [o('Identifier'), o('AlphaNumeric'), o('ThisProperty')],
    Return: [
      o('RETURN Expression', function() {
        return new Return($2);
      }), o('RETURN', function() {
        return new Return;
      })
    ],
    Comment: [
      o('HERECOMMENT', function() {
        return new Comment($1);
      })
    ],
    Code: [
      o('PARAM_START ParamList PARAM_END FuncGlyph Block', function() {
        return new Code($2, $5, $4);
      }), o('FuncGlyph Block', function() {
        return new Code([], $2, $1);
      })
    ],
    FuncGlyph: [
      o('->', function() {
        return 'func';
      }), o('=>', function() {
        return 'boundfunc';
      })
    ],
    OptComma: [o(''), o(',')],
    ParamList: [
      o('', function() {
        return [];
      }), o('Param', function() {
        return [$1];
      }), o('ParamList , Param', function() {
        return $1.concat($3);
      }), o('ParamList OptComma TERMINATOR Param', function() {
        return $1.concat($4);
      }), o('ParamList OptComma INDENT ParamList OptComma OUTDENT', function() {
        return $1.concat($4);
      })
    ],
    Param: [
      o('ParamVar', function() {
        return new Param($1);
      }), o('ParamVar ...', function() {
        return new Param($1, null, true);
      }), o('ParamVar = Expression', function() {
        return new Param($1, $3);
      })
    ],
    ParamVar: [o('Identifier'), o('ThisProperty'), o('Array'), o('Object')],
    Splat: [
      o('Expression ...', function() {
        return new Splat($1);
      })
    ],
    SimpleAssignable: [
      o('Identifier', function() {
        return new Value($1);
      }), o('Value Accessor', function() {
        return $1.add($2);
      }), o('Invocation Accessor', function() {
        return new Value($1, [].concat($2));
      }), o('ThisProperty')
    ],
    Assignable: [
      o('SimpleAssignable'), o('Array', function() {
        return new Value($1);
      }), o('Object', function() {
        return new Value($1);
      })
    ],
    Value: [
      o('Assignable'), o('Literal', function() {
        return new Value($1);
      }), o('Parenthetical', function() {
        return new Value($1);
      }), o('Range', function() {
        return new Value($1);
      }), o('This')
    ],
    Accessor: [
      o('.  Identifier', function() {
        return new Access($2);
      }), o('?. Identifier', function() {
        return new Access($2, 'soak');
      }), o(':: Identifier', function() {
        return [new Access(new Literal('prototype')), new Access($2)];
      }), o('::', function() {
        return new Access(new Literal('prototype'));
      }), o('Index')
    ],
    Index: [
      o('INDEX_START IndexValue INDEX_END', function() {
        return $2;
      }), o('INDEX_SOAK  Index', function() {
        return extend($2, {
          soak: true
        });
      })
    ],
    IndexValue: [
      o('Expression', function() {
        return new Index($1);
      }), o('Slice', function() {
        return new Slice($1);
      })
    ],
    Object: [
      o('{ AssignList OptComma }', function() {
        return new Obj($2, $1.generated);
      })
    ],
    AssignList: [
      o('', function() {
        return [];
      }), o('AssignObj', function() {
        return [$1];
      }), o('AssignList , AssignObj', function() {
        return $1.concat($3);
      }), o('AssignList OptComma TERMINATOR AssignObj', function() {
        return $1.concat($4);
      }), o('AssignList OptComma INDENT AssignList OptComma OUTDENT', function() {
        return $1.concat($4);
      })
    ],
    Class: [
      o('CLASS', function() {
        return new Class;
      }), o('CLASS Block', function() {
        return new Class(null, null, $2);
      }), o('CLASS EXTENDS Expression', function() {
        return new Class(null, $3);
      }), o('CLASS EXTENDS Expression Block', function() {
        return new Class(null, $3, $4);
      }), o('CLASS SimpleAssignable', function() {
        return new Class($2);
      }), o('CLASS SimpleAssignable Block', function() {
        return new Class($2, null, $3);
      }), o('CLASS SimpleAssignable EXTENDS Expression', function() {
        return new Class($2, $4);
      }), o('CLASS SimpleAssignable EXTENDS Expression Block', function() {
        return new Class($2, $4, $5);
      })
    ],
    Invocation: [
      o('Value OptFuncExist Arguments', function() {
        return new Call($1, $3, $2);
      }), o('Invocation OptFuncExist Arguments', function() {
        return new Call($1, $3, $2);
      }), o('SUPER', function() {
        return new Call('super', [new Splat(new Literal('arguments'))]);
      }), o('SUPER Arguments', function() {
        return new Call('super', $2);
      })
    ],
    OptFuncExist: [
      o('', function() {
        return false;
      }), o('FUNC_EXIST', function() {
        return true;
      })
    ],
    Arguments: [
      o('CALL_START CALL_END', function() {
        return [];
      }), o('CALL_START ArgList OptComma CALL_END', function() {
        return $2;
      })
    ],
    This: [
      o('THIS', function() {
        return new Value(new Literal('this'));
      }), o('@', function() {
        return new Value(new Literal('this'));
      })
    ],
    ThisProperty: [
      o('@ Identifier', function() {
        return new Value(new Literal('this'), [new Access($2)], 'this');
      })
    ],
    Array: [
      o('[ ]', function() {
        return new Arr([]);
      }), o('[ ArgList OptComma ]', function() {
        return new Arr($2);
      })
    ],
    RangeDots: [
      o('..', function() {
        return 'inclusive';
      }), o('...', function() {
        return 'exclusive';
      })
    ],
    Range: [
      o('[ Expression RangeDots Expression ]', function() {
        return new Range($2, $4, $3);
      })
    ],
    Slice: [
      o('Expression RangeDots Expression', function() {
        return new Range($1, $3, $2);
      }), o('Expression RangeDots', function() {
        return new Range($1, null, $2);
      }), o('RangeDots Expression', function() {
        return new Range(null, $2, $1);
      }), o('RangeDots', function() {
        return new Range(null, null, $1);
      })
    ],
    ArgList: [
      o('Arg', function() {
        return [$1];
      }), o('ArgList , Arg', function() {
        return $1.concat($3);
      }), o('ArgList OptComma TERMINATOR Arg', function() {
        return $1.concat($4);
      }), o('INDENT ArgList OptComma OUTDENT', function() {
        return $2;
      }), o('ArgList OptComma INDENT ArgList OptComma OUTDENT', function() {
        return $1.concat($4);
      })
    ],
    Arg: [o('Expression'), o('Splat')],
    SimpleArgs: [
      o('Expression'), o('SimpleArgs , Expression', function() {
        return [].concat($1, $3);
      })
    ],
    Try: [
      o('TRY Block', function() {
        return new Try($2);
      }), o('TRY Block Catch', function() {
        return new Try($2, $3[0], $3[1]);
      }), o('TRY Block FINALLY Block', function() {
        return new Try($2, null, null, $4);
      }), o('TRY Block Catch FINALLY Block', function() {
        return new Try($2, $3[0], $3[1], $5);
      })
    ],
    Catch: [
      o('CATCH Identifier Block', function() {
        return [$2, $3];
      })
    ],
    Throw: [
      o('THROW Expression', function() {
        return new Throw($2);
      })
    ],
    Parenthetical: [
      o('( Body )', function() {
        return new Parens($2);
      }), o('( INDENT Body OUTDENT )', function() {
        return new Parens($3);
      })
    ],
    WhileSource: [
      o('WHILE Expression', function() {
        return new While($2);
      }), o('WHILE Expression WHEN Expression', function() {
        return new While($2, {
          guard: $4
        });
      }), o('UNTIL Expression', function() {
        return new While($2, {
          invert: true
        });
      }), o('UNTIL Expression WHEN Expression', function() {
        return new While($2, {
          invert: true,
          guard: $4
        });
      })
    ],
    While: [
      o('WhileSource Block', function() {
        return $1.addBody($2);
      }), o('Statement  WhileSource', function() {
        return $2.addBody(Block.wrap([$1]));
      }), o('Expression WhileSource', function() {
        return $2.addBody(Block.wrap([$1]));
      }), o('Loop', function() {
        return $1;
      })
    ],
    Loop: [
      o('LOOP Block', function() {
        return new While(new Literal('true')).addBody($2);
      }), o('LOOP Expression', function() {
        return new While(new Literal('true')).addBody(Block.wrap([$2]));
      })
    ],
    For: [
      o('Statement  ForBody', function() {
        return new For($1, $2);
      }), o('Expression ForBody', function() {
        return new For($1, $2);
      }), o('ForBody    Block', function() {
        return new For($2, $1);
      })
    ],
    ForBody: [
      o('FOR Range', function() {
        return {
          source: new Value($2)
        };
      }), o('ForStart ForSource', function() {
        $2.own = $1.own;
        $2.name = $1[0];
        $2.index = $1[1];
        return $2;
      })
    ],
    ForStart: [
      o('FOR ForVariables', function() {
        return $2;
      }), o('FOR OWN ForVariables', function() {
        $3.own = true;
        return $3;
      })
    ],
    ForValue: [
      o('Identifier'), o('ThisProperty'), o('Array', function() {
        return new Value($1);
      }), o('Object', function() {
        return new Value($1);
      })
    ],
    ForVariables: [
      o('ForValue', function() {
        return [$1];
      }), o('ForValue , ForValue', function() {
        return [$1, $3];
      })
    ],
    ForSource: [
      o('FORIN Expression', function() {
        return {
          source: $2
        };
      }), o('FOROF Expression', function() {
        return {
          source: $2,
          object: true
        };
      }), o('FORIN Expression WHEN Expression', function() {
        return {
          source: $2,
          guard: $4
        };
      }), o('FOROF Expression WHEN Expression', function() {
        return {
          source: $2,
          guard: $4,
          object: true
        };
      }), o('FORIN Expression BY Expression', function() {
        return {
          source: $2,
          step: $4
        };
      }), o('FORIN Expression WHEN Expression BY Expression', function() {
        return {
          source: $2,
          guard: $4,
          step: $6
        };
      }), o('FORIN Expression BY Expression WHEN Expression', function() {
        return {
          source: $2,
          step: $4,
          guard: $6
        };
      })
    ],
    Switch: [
      o('SWITCH Expression INDENT Whens OUTDENT', function() {
        return new Switch($2, $4);
      }), o('SWITCH Expression INDENT Whens ELSE Block OUTDENT', function() {
        return new Switch($2, $4, $6);
      }), o('SWITCH INDENT Whens OUTDENT', function() {
        return new Switch(null, $3);
      }), o('SWITCH INDENT Whens ELSE Block OUTDENT', function() {
        return new Switch(null, $3, $5);
      })
    ],
    Whens: [
      o('When'), o('Whens When', function() {
        return $1.concat($2);
      })
    ],
    When: [
      o('LEADING_WHEN SimpleArgs Block', function() {
        return [[$2, $3]];
      }), o('LEADING_WHEN SimpleArgs Block TERMINATOR', function() {
        return [[$2, $3]];
      })
    ],
    IfBlock: [
      o('IF Expression Block', function() {
        return new If($2, $3, {
          type: $1
        });
      }), o('IfBlock ELSE IF Expression Block', function() {
        return $1.addElse(new If($4, $5, {
          type: $3
        }));
      })
    ],
    If: [
      o('IfBlock'), o('IfBlock ELSE Block', function() {
        return $1.addElse($3);
      }), o('Statement  POST_IF Expression', function() {
        return new If($3, Block.wrap([$1]), {
          type: $2,
          statement: true
        });
      }), o('Expression POST_IF Expression', function() {
        return new If($3, Block.wrap([$1]), {
          type: $2,
          statement: true
        });
      })
    ],
    Operation: [
      o('UNARY Expression', function() {
        return new Op($1, $2);
      }), o('-     Expression', (function() {
        return new Op('-', $2);
      }), {
        prec: 'UNARY'
      }), o('+     Expression', (function() {
        return new Op('+', $2);
      }), {
        prec: 'UNARY'
      }), o('-- SimpleAssignable', function() {
        return new Op('--', $2);
      }), o('++ SimpleAssignable', function() {
        return new Op('++', $2);
      }), o('SimpleAssignable --', function() {
        return new Op('--', $1, null, true);
      }), o('SimpleAssignable ++', function() {
        return new Op('++', $1, null, true);
      }), o('Expression ?', function() {
        return new Existence($1);
      }), o('Expression +  Expression', function() {
        return new Op('+', $1, $3);
      }), o('Expression -  Expression', function() {
        return new Op('-', $1, $3);
      }), o('Expression MATH     Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression SHIFT    Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression COMPARE  Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression LOGIC    Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression RELATION Expression', function() {
        if ($2.charAt(0) === '!') {
          return new Op($2.slice(1), $1, $3).invert();
        } else {
          return new Op($2, $1, $3);
        }
      }), o('SimpleAssignable COMPOUND_ASSIGN\
       Expression', function() {
        return new Assign($1, $3, $2);
      }), o('SimpleAssignable COMPOUND_ASSIGN\
       INDENT Expression OUTDENT', function() {
        return new Assign($1, $4, $2);
      }), o('SimpleAssignable EXTENDS Expression', function() {
        return new Extends($1, $3);
      })
    ]
  };
  operators = [['left', '.', '?.', '::'], ['left', 'CALL_START', 'CALL_END'], ['nonassoc', '++', '--'], ['left', '?'], ['right', 'UNARY'], ['left', 'MATH'], ['left', '+', '-'], ['left', 'SHIFT'], ['left', 'RELATION'], ['left', 'COMPARE'], ['left', 'LOGIC'], ['nonassoc', 'INDENT', 'OUTDENT'], ['right', '=', ':', 'COMPOUND_ASSIGN', 'RETURN', 'THROW', 'EXTENDS'], ['right', 'FORIN', 'FOROF', 'BY', 'WHEN'], ['right', 'IF', 'ELSE', 'FOR', 'WHILE', 'UNTIL', 'LOOP', 'SUPER', 'CLASS'], ['right', 'POST_IF']];
  tokens = [];
  for (name in grammar) {
    alternatives = grammar[name];
    grammar[name] = (function() {
      var _i, _j, _len, _len1, _ref, _results;
      _results = [];
      for (_i = 0, _len = alternatives.length; _i < _len; _i++) {
        alt = alternatives[_i];
        _ref = alt[0].split(' ');
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          token = _ref[_j];
          if (!grammar[token]) {
            tokens.push(token);
          }
        }
        if (name === 'Root') {
          alt[1] = "return " + alt[1];
        }
        _results.push(alt);
      }
      return _results;
    })();
  }
  exports.parser = new Parser({
    tokens: tokens.join(' '),
    bnf: grammar,
    operators: operators.reverse(),
    startSymbol: 'Root'
  });
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'helpers',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var extend, flatten, _ref;
  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };
  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };
  exports.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };
  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };
  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  exports.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };
  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };
  exports.last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };
  exports.some = (_ref = Array.prototype.some) != null ? _ref : function(fn) {
    var e, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      e = this[_i];
      if (fn(e)) {
        return true;
      }
    }
    return false;
  };
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var key, val, _ref;
  _ref = require('./coffee-script');
  for (key in _ref) {
    val = _ref[key];
    exports[key] = val;
  }
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'lexer',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDEXABLE, INVERSES, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, STRICT_PROSCRIBED, TRAILING_SPACES, UNARY, WHITESPACE, compact, count, key, last, starts, _ref, _ref1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  _ref = require('./rewriter'), Rewriter = _ref.Rewriter, INVERSES = _ref.INVERSES;
  _ref1 = require('./helpers'), count = _ref1.count, starts = _ref1.starts, compact = _ref1.compact, last = _ref1.last;
  exports.Lexer = Lexer = (function() {
    function Lexer() {}
    Lexer.prototype.tokenize = function(code, opts) {
      var i, tag;
      if (opts == null) {
        opts = {};
      }
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      this.code = code;
      this.line = opts.line || 0;
      this.indent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.ends = [];
      this.tokens = [];
      i = 0;
      while (this.chunk = code.slice(i)) {
        i += this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
      }
      this.closeIndentation();
      if (tag = this.ends.pop()) {
        this.error("missing " + tag);
      }
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    };
    Lexer.prototype.identifierToken = function() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _ref2, _ref3;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.error("reserved word \"" + id + "\"");
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
              return 'BOOL';
            case 'break':
            case 'continue':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      this.token(tag, id);
      if (colon) {
        this.token(':', ':');
      }
      return input.length;
    };
    Lexer.prototype.numberToken = function() {
      var binaryLiteral, lexedLength, match, number, octalLiteral;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      if (/^0[BOX]/.test(number)) {
        this.error("radix prefix '" + number + "' must be lowercase");
      } else if (/E/.test(number) && !/^0x/.test(number)) {
        this.error("exponential notation '" + number + "' must be indicated with a lowercase 'e'");
      } else if (/^0\d*[89]/.test(number)) {
        this.error("decimal literal '" + number + "' must not be prefixed with '0'");
      } else if (/^0\d+/.test(number)) {
        this.error("octal literal '" + number + "' must be prefixed with '0o'");
      }
      lexedLength = number.length;
      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
        number = '0x' + (parseInt(octalLiteral[1], 8)).toString(16);
      }
      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
        number = '0x' + (parseInt(binaryLiteral[1], 2)).toString(16);
      }
      this.token('NUMBER', number);
      return lexedLength;
    };
    Lexer.prototype.stringToken = function() {
      var match, octalEsc, string;
      switch (this.chunk.charAt(0)) {
        case "'":
          if (!(match = SIMPLESTR.exec(this.chunk))) {
            return 0;
          }
          this.token('STRING', (string = match[0]).replace(MULTILINER, '\\\n'));
          break;
        case '"':
          if (!(string = this.balancedString(this.chunk, '"'))) {
            return 0;
          }
          if (0 < string.indexOf('#{', 1)) {
            this.interpolateString(string.slice(1, -1));
          } else {
            this.token('STRING', this.escapeLines(string));
          }
          break;
        default:
          return 0;
      }
      if (octalEsc = /^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(string)) {
        this.error("octal escape sequences " + string + " are not allowed");
      }
      this.line += count(string, '\n');
      return string.length;
    };
    Lexer.prototype.heredocToken = function() {
      var doc, heredoc, match, quote;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true));
      }
      this.line += count(heredoc, '\n');
      return heredoc.length;
    };
    Lexer.prototype.commentToken = function() {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: Array(this.indent + 1).join(' ')
        }));
      }
      this.line += count(comment, '\n');
      return comment.length;
    };
    Lexer.prototype.jsToken = function() {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1));
      this.line += count(script, '\n');
      return script.length;
    };
    Lexer.prototype.regexToken = function() {
      var flags, length, match, prev, regex, _ref2, _ref3;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (match = HEREGEX.exec(this.chunk)) {
        length = this.heregexToken(match);
        this.line += count(match[0], '\n');
        return length;
      }
      prev = last(this.tokens);
      if (prev && (_ref2 = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref2) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      _ref3 = match, match = _ref3[0], regex = _ref3[1], flags = _ref3[2];
      if (regex.slice(0, 2) === '/*') {
        this.error('regular expressions cannot begin with `*`');
      }
      if (regex === '//') {
        regex = '/(?:)/';
      }
      this.token('REGEX', "" + regex + flags);
      return match.length;
    };
    Lexer.prototype.heregexToken = function(match) {
      var body, flags, heregex, re, tag, tokens, value, _i, _len, _ref2, _ref3, _ref4, _ref5;
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = body.replace(HEREGEX_OMIT, '').replace(/\//g, '\\/');
        if (re.match(/^\*/)) {
          this.error('regular expressions cannot begin with `*`');
        }
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp');
      this.tokens.push(['CALL_START', '(']);
      tokens = [];
      _ref2 = this.interpolateString(body, {
        regex: true
      });
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], tag = _ref3[0], value = _ref3[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else {
          if (!(value = value.replace(HEREGEX_OMIT, ''))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          tokens.push(['STRING', this.makeString(value, '"', true)]);
        }
        tokens.push(['+', '+']);
      }
      tokens.pop();
      if (((_ref4 = tokens[0]) != null ? _ref4[0] : void 0) !== 'STRING') {
        this.tokens.push(['STRING', '""'], ['+', '+']);
      }
      (_ref5 = this.tokens).push.apply(_ref5, tokens);
      if (flags) {
        this.tokens.push([',', ','], ['STRING', '"' + flags + '"']);
      }
      this.token(')', ')');
      return heregex.length;
    };
    Lexer.prototype.lineToken = function() {
      var diff, indent, match, noNewlines, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.line += count(indent, '\n');
      this.seenFor = false;
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken();
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff);
        this.indents.push(diff);
        this.ends.push('OUTDENT');
        this.outdebt = this.indebt = 0;
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines);
      }
      this.indent = size;
      return indent.length;
    };
    Lexer.prototype.outdentToken = function(moveOut, noNewlines) {
      var dent, len;
      while (moveOut > 0) {
        len = this.indents.length - 1;
        if (this.indents[len] === void 0) {
          moveOut = 0;
        } else if (this.indents[len] === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (this.indents[len] < this.outdebt) {
          this.outdebt -= this.indents[len];
          moveOut -= this.indents[len];
        } else {
          dent = this.indents.pop() - this.outdebt;
          moveOut -= dent;
          this.outdebt = 0;
          this.pair('OUTDENT');
          this.token('OUTDENT', dent);
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };
    Lexer.prototype.newlineToken = function() {
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };
    Lexer.prototype.literalToken = function() {
      var match, prev, tag, value, _ref2, _ref3, _ref4, _ref5;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.error("reserved word \"" + (this.value()) + "\" can't be assigned");
        }
        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        this.seenFor = false;
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
          }
        }
      }
      switch (value) {
        case '(':
        case '{':
        case '[':
          this.ends.push(INVERSES[value]);
          break;
        case ')':
        case '}':
        case ']':
          this.pair(value);
      }
      this.token(tag, value);
      return value.length;
    };
    Lexer.prototype.sanitizeHeredoc = function(doc, options) {
      var attempt, herecomment, indent, match, _ref2;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment) {
        if (HEREDOC_ILLEGAL.test(doc)) {
          this.error("block comment cannot contain \"*/\", starting");
        }
        if (doc.indexOf('\n') <= 0) {
          return doc;
        }
      } else {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (_ref2 = attempt.length) && _ref2 < indent.length)) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    };
    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    };
    Lexer.prototype.closeIndentation = function() {
      return this.outdentToken(this.indent);
    };
    Lexer.prototype.balancedString = function(str, end) {
      var continueCount, i, letter, match, prev, stack, _i, _ref2;
      continueCount = 0;
      stack = [end];
      for (i = _i = 1, _ref2 = str.length; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
        if (continueCount) {
          --continueCount;
          continue;
        }
        switch (letter = str.charAt(i)) {
          case '\\':
            ++continueCount;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, +i + 1 || 9e9);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
          continueCount += match[0].length - 1;
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      return this.error("missing " + (stack.pop()) + ", starting");
    };
    Lexer.prototype.interpolateString = function(str, options) {
      var expr, heredoc, i, inner, interpolated, len, letter, nested, pi, regex, tag, tokens, value, _i, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(['NEOSTRING', str.slice(pi, i)]);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          nested = new Lexer().tokenize(inner, {
            line: this.line,
            rewrite: false
          });
          nested.pop();
          if (((_ref2 = nested[0]) != null ? _ref2[0] : void 0) === 'TERMINATOR') {
            nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(['(', '(', this.line]);
              nested.push([')', ')', this.line]);
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(['NEOSTRING', str.slice(pi)]);
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""');
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(['', '']);
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(');
      }
      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
        _ref3 = tokens[i], tag = _ref3[0], value = _ref3[1];
        if (i) {
          this.token('+', '+');
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else {
          this.token('STRING', this.makeString(value, '"', heredoc));
        }
      }
      if (interpolated) {
        this.token(')', ')');
      }
      return tokens;
    };
    Lexer.prototype.pair = function(tag) {
      var size, wanted;
      if (tag !== (wanted = last(this.ends))) {
        if ('OUTDENT' !== wanted) {
          this.error("unmatched " + tag);
        }
        this.indent -= size = last(this.indents);
        this.outdentToken(size, true);
        return this.pair(tag);
      }
      return this.ends.pop();
    };
    Lexer.prototype.token = function(tag, value) {
      return this.tokens.push([tag, value, this.line]);
    };
    Lexer.prototype.tag = function(index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };
    Lexer.prototype.value = function(index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };
    Lexer.prototype.unfinished = function() {
      var _ref2;
      return LINE_CONTINUER.test(this.chunk) || ((_ref2 = this.tag()) === '\\' || _ref2 === '.' || _ref2 === '?.' || _ref2 === 'UNARY' || _ref2 === 'MATH' || _ref2 === '+' || _ref2 === '-' || _ref2 === 'SHIFT' || _ref2 === 'RELATION' || _ref2 === 'COMPARE' || _ref2 === 'LOGIC' || _ref2 === 'THROW' || _ref2 === 'EXTENDS');
    };
    Lexer.prototype.escapeLines = function(str, heredoc) {
      return str.replace(MULTILINER, heredoc ? '\\n' : '');
    };
    Lexer.prototype.makeString = function(body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(/\\([\s\S])/g, function(match, contents) {
        if (contents === '\n' || contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };
    Lexer.prototype.error = function(message) {
      throw SyntaxError("" + message + " on line " + (this.line + 1));
    };
    return Lexer;
  })();
  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];
  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];
  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };
  COFFEE_ALIASES = (function() {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  })();
  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);
  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];
  STRICT_PROSCRIBED = ['arguments', 'eval'];
  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);
  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);
  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;
  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;
  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
  HEREDOC = /^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/;
  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/;
  WHITESPACE = /^[^\n\S]+/;
  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/;
  CODE = /^[-=]>/;
  MULTI_DENT = /^(?:\n[^\n\S]*)+/;
  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;
  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;
  REGEX = /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/;
  HEREGEX = /^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/;
  HEREGEX_OMIT = /\s+(?:#.*)?/g;
  MULTILINER = /\n/g;
  HEREDOC_INDENT = /\n+([^\n\S]*)/g;
  HEREDOC_ILLEGAL = /\*\//;
  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;
  TRAILING_SPACES = /\s+$/;
  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];
  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];
  LOGIC = ['&&', '||', '&', '|', '^'];
  SHIFT = ['<<', '>>', '>>>'];
  COMPARE = ['==', '!=', '<', '>', '<=', '>='];
  MATH = ['*', '/', '%'];
  RELATION = ['IN', 'OF', 'INSTANCEOF'];
  BOOL = ['TRUE', 'FALSE'];
  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', 'NULL', 'UNDEFINED', '++', '--', ']'];
  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING');
  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];
  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL', 'NULL', 'UNDEFINED');
  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'nodes',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Access, Arr, Assign, Base, Block, Call, Class, Closure, Code, Comment, Existence, Extends, For, IDENTIFIER, IDENTIFIER_STR, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, METHOD_DEF, NEGATE, NO, Obj, Op, Param, Parens, RESERVED, Range, Return, SIMPLENUM, STRICT_PROSCRIBED, Scope, Slice, Splat, Switch, TAB, THIS, Throw, Try, UTILITIES, Value, While, YES, compact, del, ends, extend, flatten, last, merge, multident, some, starts, unfoldSoak, utility, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  Scope = require('./scope').Scope;
  _ref = require('./lexer'), RESERVED = _ref.RESERVED, STRICT_PROSCRIBED = _ref.STRICT_PROSCRIBED;
  _ref1 = require('./helpers'), compact = _ref1.compact, flatten = _ref1.flatten, extend = _ref1.extend, merge = _ref1.merge, del = _ref1.del, starts = _ref1.starts, ends = _ref1.ends, last = _ref1.last, some = _ref1.some;
  exports.extend = extend;
  YES = function() {
    return true;
  };
  NO = function() {
    return false;
  };
  THIS = function() {
    return this;
  };
  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };
  exports.Base = Base = (function() {
    function Base() {}
    Base.prototype.compile = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };
    Base.prototype.compileClosure = function(o) {
      if (this.jumps()) {
        throw SyntaxError('cannot use a pure statement in an expression.');
      }
      o.sharedScope = true;
      return Closure.wrap(this).compileNode(o);
    };
    Base.prototype.cache = function(o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compile(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compile(o, level), ref.value];
        } else {
          return [sub, ref];
        }
      }
    };
    Base.prototype.compileLoopReference = function(o, name) {
      var src, tmp;
      src = tmp = this.compile(o, LEVEL_LIST);
      if (!((-Infinity < +src && +src < Infinity) || IDENTIFIER.test(src) && o.scope.check(src, true))) {
        src = "" + (tmp = o.scope.freeVariable(name)) + " = " + src;
      }
      return [src, tmp];
    };
    Base.prototype.makeReturn = function(res) {
      var me;
      me = this.unwrapAll();
      if (res) {
        return new Call(new Literal("" + res + ".push"), [me]);
      } else {
        return new Return(me);
      }
    };
    Base.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(false, function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    Base.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };
    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len1, _ref2, _ref3;
      if (!this.children) {
        return this;
      }
      _ref2 = this.children;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        attr = _ref2[_i];
        if (this[attr]) {
          _ref3 = flatten([this[attr]]);
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            child = _ref3[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(crossScope, func);
      });
    };
    Base.prototype.invert = function() {
      return new Op('!', this);
    };
    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    Base.prototype.children = [];
    Base.prototype.isStatement = NO;
    Base.prototype.jumps = NO;
    Base.prototype.isComplex = YES;
    Base.prototype.isChainable = NO;
    Base.prototype.isAssignable = NO;
    Base.prototype.unwrap = THIS;
    Base.prototype.unfoldSoak = NO;
    Base.prototype.assigns = NO;
    return Base;
  })();
  exports.Block = Block = (function(_super) {
    __extends(Block, _super);
    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }
    Block.prototype.children = ['expressions'];
    Block.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };
    Block.prototype.pop = function() {
      return this.expressions.pop();
    };
    Block.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };
    Block.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };
    Block.prototype.isEmpty = function() {
      return !this.expressions.length;
    };
    Block.prototype.isStatement = function(o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };
    Block.prototype.jumps = function(o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.jumps(o)) {
          return exp;
        }
      }
    };
    Block.prototype.makeReturn = function(res) {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn(res);
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };
    Block.prototype.compile = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compile.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };
    Block.prototype.compileNode = function(o) {
      var code, codes, node, top, _i, _len, _ref2;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      codes = [];
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          codes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          code = node.compile(o);
          if (!node.isStatement(o)) {
            code = "" + this.tab + code + ";";
            if (node instanceof Literal) {
              code = "" + code + "\n";
            }
          }
          codes.push(code);
        } else {
          codes.push(node.compile(o, LEVEL_LIST));
        }
      }
      if (top) {
        if (this.spaced) {
          return "\n" + (codes.join('\n\n')) + "\n";
        } else {
          return codes.join('\n');
        }
      }
      code = codes.join(', ') || 'void 0';
      if (codes.length > 1 && o.level >= LEVEL_LIST) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Block.prototype.compileRoot = function(o) {
      var code, exp, i, prelude, preludeExps, rest;
      o.indent = o.bare ? '' : TAB;
      o.scope = new Scope(null, this, null);
      o.level = LEVEL_TOP;
      this.spaced = true;
      prelude = "";
      if (!o.bare) {
        preludeExps = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.expressions;
          _results = [];
          for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
            exp = _ref2[i];
            if (!(exp.unwrap() instanceof Comment)) {
              break;
            }
            _results.push(exp);
          }
          return _results;
        }).call(this);
        rest = this.expressions.slice(preludeExps.length);
        this.expressions = preludeExps;
        if (preludeExps.length) {
          prelude = "" + (this.compileNode(merge(o, {
            indent: ''
          }))) + "\n";
        }
        this.expressions = rest;
      }
      code = this.compileWithDeclarations(o);
      if (o.bare) {
        return code;
      }
      return "" + prelude + "(function() {\n" + code + "\n}).call(this);\n";
    };
    Block.prototype.compileWithDeclarations = function(o) {
      var assigns, code, declars, exp, i, post, rest, scope, spaced, _i, _len, _ref2, _ref3, _ref4;
      code = post = '';
      _ref2 = this.expressions;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        exp = _ref2[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, 9e9);
        _ref3 = [this.spaced, false], spaced = _ref3[0], this.spaced = _ref3[1];
        _ref4 = [this.compileNode(o), spaced], code = _ref4[0], this.spaced = _ref4[1];
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if (declars || assigns) {
          if (i) {
            code += '\n';
          }
          code += "" + this.tab + "var ";
          if (declars) {
            code += scope.declaredVariables().join(', ');
          }
          if (assigns) {
            if (declars) {
              code += ",\n" + (this.tab + TAB);
            }
            code += scope.assignedVariables().join(",\n" + (this.tab + TAB));
          }
          code += ';\n';
        }
      }
      return code + post;
    };
    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };
    return Block;
  })(Base);
  exports.Literal = Literal = (function(_super) {
    __extends(Literal, _super);
    function Literal(value) {
      this.value = value;
    }
    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return Literal.__super__.makeReturn.apply(this, arguments);
      }
    };
    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    Literal.prototype.isStatement = function() {
      var _ref2;
      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
    };
    Literal.prototype.isComplex = NO;
    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };
    Literal.prototype.jumps = function(o) {
      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
        return this;
      }
      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
        return this;
      }
    };
    Literal.prototype.compileNode = function(o) {
      var code, _ref2;
      code = this.value === 'this' ? ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0) ? o.scope.method.context : this.value : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      if (this.isStatement()) {
        return "" + this.tab + code + ";";
      } else {
        return code;
      }
    };
    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };
    return Literal;
  })(Base);
  exports.Undefined = (function(_super) {
    __extends(Undefined, _super);
    function Undefined() {
      return Undefined.__super__.constructor.apply(this, arguments);
    }
    Undefined.prototype.isAssignable = NO;
    Undefined.prototype.isComplex = NO;
    Undefined.prototype.compileNode = function(o) {
      if (o.level >= LEVEL_ACCESS) {
        return '(void 0)';
      } else {
        return 'void 0';
      }
    };
    return Undefined;
  })(Base);
  exports.Null = (function(_super) {
    __extends(Null, _super);
    function Null() {
      return Null.__super__.constructor.apply(this, arguments);
    }
    Null.prototype.isAssignable = NO;
    Null.prototype.isComplex = NO;
    Null.prototype.compileNode = function() {
      return "null";
    };
    return Null;
  })(Base);
  exports.Bool = (function(_super) {
    __extends(Bool, _super);
    Bool.prototype.isAssignable = NO;
    Bool.prototype.isComplex = NO;
    Bool.prototype.compileNode = function() {
      return this.val;
    };
    function Bool(val) {
      this.val = val;
    }
    return Bool;
  })(Base);
  exports.Return = Return = (function(_super) {
    __extends(Return, _super);
    function Return(expr) {
      if (expr && !expr.unwrap().isUndefined) {
        this.expression = expr;
      }
    }
    Return.prototype.children = ['expression'];
    Return.prototype.isStatement = YES;
    Return.prototype.makeReturn = THIS;
    Return.prototype.jumps = THIS;
    Return.prototype.compile = function(o, level) {
      var expr, _ref2;
      expr = (_ref2 = this.expression) != null ? _ref2.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compile(o, level);
      } else {
        return Return.__super__.compile.call(this, o, level);
      }
    };
    Return.prototype.compileNode = function(o) {
      return this.tab + ("return" + [this.expression ? " " + (this.expression.compile(o, LEVEL_PAREN)) : void 0] + ";");
    };
    return Return;
  })(Base);
  exports.Value = Value = (function(_super) {
    __extends(Value, _super);
    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }
    Value.prototype.children = ['base', 'properties'];
    Value.prototype.add = function(props) {
      this.properties = this.properties.concat(props);
      return this;
    };
    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };
    Value.prototype.isArray = function() {
      return !this.properties.length && this.base instanceof Arr;
    };
    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };
    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };
    Value.prototype.isSimpleNumber = function() {
      return this.base instanceof Literal && SIMPLENUM.test(this.base.value);
    };
    Value.prototype.isString = function() {
      return this.base instanceof Literal && IS_STRING.test(this.base.value);
    };
    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref2;
      _ref2 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };
    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };
    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };
    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };
    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };
    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.add(name), new Value(bref || base.base, [nref || name])];
    };
    Value.prototype.compileNode = function(o) {
      var code, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      code = this.base.compile(o, props.length ? LEVEL_ACCESS : null);
      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(code)) {
        code = "" + code + ".";
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        code += prop.compile(o);
      }
      return code;
    };
    Value.prototype.unfoldSoak = function(o) {
      var result,
        _this = this;
      if (this.unfoldedSoak != null) {
        return this.unfoldedSoak;
      }
      result = (function() {
        var fst, i, ifn, prop, ref, snd, _i, _len, _ref2;
        if (ifn = _this.base.unfoldSoak(o)) {
          Array.prototype.push.apply(ifn.body.properties, _this.properties);
          return ifn;
        }
        _ref2 = _this.properties;
        for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
          prop = _ref2[i];
          if (!prop.soak) {
            continue;
          }
          prop.soak = false;
          fst = new Value(_this.base, _this.properties.slice(0, i));
          snd = new Value(_this.base, _this.properties.slice(i));
          if (fst.isComplex()) {
            ref = new Literal(o.scope.freeVariable('ref'));
            fst = new Parens(new Assign(ref, fst));
            snd.base = ref;
          }
          return new If(new Existence(fst), snd, {
            soak: true
          });
        }
        return null;
      })();
      return this.unfoldedSoak = result || false;
    };
    return Value;
  })(Base);
  exports.Comment = Comment = (function(_super) {
    __extends(Comment, _super);
    function Comment(comment) {
      this.comment = comment;
    }
    Comment.prototype.isStatement = YES;
    Comment.prototype.makeReturn = THIS;
    Comment.prototype.compileNode = function(o, level) {
      var code;
      code = '/*' + multident(this.comment, this.tab) + ("\n" + this.tab + "*/\n");
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return code;
    };
    return Comment;
  })(Base);
  exports.Call = Call = (function(_super) {
    __extends(Call, _super);
    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
    }
    Call.prototype.children = ['variable', 'args'];
    Call.prototype.newInstance = function() {
      var base, _ref2;
      base = ((_ref2 = this.variable) != null ? _ref2.base : void 0) || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };
    Call.prototype.superReference = function(o) {
      var accesses, method, name;
      method = o.scope.namedMethod();
      if (!method) {
        throw SyntaxError('cannot call super outside of a function.');
      }
      name = method.name;
      if (name == null) {
        throw SyntaxError('cannot call super on an anonymous function.');
      }
      if (method.klass) {
        accesses = [new Access(new Literal('__super__'))];
        if (method["static"]) {
          accesses.push(new Access(new Literal('constructor')));
        }
        accesses.push(new Access(new Literal(name)));
        return (new Value(new Literal(method.klass), accesses)).compile(o);
      } else {
        return "" + name + ".__super__.constructor";
      }
    };
    Call.prototype.superThis = function(o) {
      var method;
      method = o.scope.method;
      return (method && !method.klass && method.context) || "this";
    };
    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, left, list, rite, _i, _len, _ref2, _ref3;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref2 = new Value(this.variable).cacheReference(o), left = _ref2[0], rite = _ref2[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref3 = list.reverse();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        call = _ref3[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };
    Call.prototype.filterImplicitObjects = function(list) {
      var node, nodes, obj, prop, properties, _i, _j, _len, _len1, _ref2;
      nodes = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        node = list[_i];
        if (!((typeof node.isObject === "function" ? node.isObject() : void 0) && node.base.generated)) {
          nodes.push(node);
          continue;
        }
        obj = null;
        _ref2 = node.base.properties;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          prop = _ref2[_j];
          if (prop instanceof Assign || prop instanceof Comment) {
            if (!obj) {
              nodes.push(obj = new Obj(properties = [], true));
            }
            properties.push(prop);
          } else {
            nodes.push(prop);
            obj = null;
          }
        }
      }
      return nodes;
    };
    Call.prototype.compileNode = function(o) {
      var arg, args, code, _ref2;
      if ((_ref2 = this.variable) != null) {
        _ref2.front = this.front;
      }
      if (code = Splat.compileSplattedArray(o, this.args, true)) {
        return this.compileSplat(o, code);
      }
      args = this.filterImplicitObjects(this.args);
      args = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          arg = args[_i];
          _results.push(arg.compile(o, LEVEL_LIST));
        }
        return _results;
      })()).join(', ');
      if (this.isSuper) {
        return this.superReference(o) + (".call(" + (this.superThis(o)) + (args && ', ' + args) + ")");
      } else {
        return (this.isNew ? 'new ' : '') + this.variable.compile(o, LEVEL_ACCESS) + ("(" + args + ")");
      }
    };
    Call.prototype.compileSuper = function(args, o) {
      return "" + (this.superReference(o)) + ".call(" + (this.superThis(o)) + (args.length ? ', ' : '') + args + ")";
    };
    Call.prototype.compileSplat = function(o, splatArgs) {
      var base, fun, idt, name, ref;
      if (this.isSuper) {
        return "" + (this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", " + splatArgs + ")";
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return "(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})(" + (this.variable.compile(o, LEVEL_LIST)) + ", " + splatArgs + ", function(){})";
      }
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        fun = "(" + ref + " = " + (base.compile(o, LEVEL_LIST)) + ")" + (name.compile(o));
      } else {
        fun = base.compile(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fun)) {
          fun = "(" + fun + ")";
        }
        if (name) {
          ref = fun;
          fun += name.compile(o);
        } else {
          ref = 'null';
        }
      }
      return "" + fun + ".apply(" + ref + ", " + splatArgs + ")";
    };
    return Call;
  })(Base);
  exports.Extends = Extends = (function(_super) {
    __extends(Extends, _super);
    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }
    Extends.prototype.children = ['child', 'parent'];
    Extends.prototype.compile = function(o) {
      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compile(o);
    };
    return Extends;
  })(Base);
  exports.Access = Access = (function(_super) {
    __extends(Access, _super);
    function Access(name, tag) {
      this.name = name;
      this.name.asKey = true;
      this.soak = tag === 'soak';
    }
    Access.prototype.children = ['name'];
    Access.prototype.compile = function(o) {
      var name;
      name = this.name.compile(o);
      if (IDENTIFIER.test(name)) {
        return "." + name;
      } else {
        return "[" + name + "]";
      }
    };
    Access.prototype.isComplex = NO;
    return Access;
  })(Base);
  exports.Index = Index = (function(_super) {
    __extends(Index, _super);
    function Index(index) {
      this.index = index;
    }
    Index.prototype.children = ['index'];
    Index.prototype.compile = function(o) {
      return "[" + (this.index.compile(o, LEVEL_PAREN)) + "]";
    };
    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };
    return Index;
  })(Base);
  exports.Range = Range = (function(_super) {
    __extends(Range, _super);
    Range.prototype.children = ['from', 'to'];
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    Range.prototype.compileVariables = function(o) {
      var step, _ref2, _ref3, _ref4, _ref5;
      o = merge(o, {
        top: true
      });
      _ref2 = this.from.cache(o, LEVEL_LIST), this.fromC = _ref2[0], this.fromVar = _ref2[1];
      _ref3 = this.to.cache(o, LEVEL_LIST), this.toC = _ref3[0], this.toVar = _ref3[1];
      if (step = del(o, 'step')) {
        _ref4 = step.cache(o, LEVEL_LIST), this.step = _ref4[0], this.stepVar = _ref4[1];
      }
      _ref5 = [this.fromVar.match(SIMPLENUM), this.toVar.match(SIMPLENUM)], this.fromNum = _ref5[0], this.toNum = _ref5[1];
      if (this.stepVar) {
        return this.stepNum = this.stepVar.match(SIMPLENUM);
      }
    };
    Range.prototype.compileNode = function(o) {
      var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, stepPart, to, varPart, _ref2, _ref3;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      known = this.fromNum && this.toNum;
      idx = del(o, 'index');
      idxName = del(o, 'name');
      namedIndex = idxName && idxName !== idx;
      varPart = "" + idx + " = " + this.fromC;
      if (this.toC !== this.toVar) {
        varPart += ", " + this.toC;
      }
      if (this.step !== this.stepVar) {
        varPart += ", " + this.step;
      }
      _ref2 = ["" + idx + " <" + this.equals, "" + idx + " >" + this.equals], lt = _ref2[0], gt = _ref2[1];
      condPart = this.stepNum ? +this.stepNum > 0 ? "" + lt + " " + this.toVar : "" + gt + " " + this.toVar : known ? ((_ref3 = [+this.fromNum, +this.toNum], from = _ref3[0], to = _ref3[1], _ref3), from <= to ? "" + lt + " " + to : "" + gt + " " + to) : (cond = "" + this.fromVar + " <= " + this.toVar, "" + cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
      stepPart = this.stepVar ? "" + idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? "" + idx + "++" : "" + idx + "--" : namedIndex ? "" + cond + " ? ++" + idx + " : --" + idx : "" + cond + " ? " + idx + "++ : " + idx + "--";
      if (namedIndex) {
        varPart = "" + idxName + " = " + varPart;
      }
      if (namedIndex) {
        stepPart = "" + idxName + " = " + stepPart;
      }
      return "" + varPart + "; " + condPart + "; " + stepPart;
    };
    Range.prototype.compileArray = function(o) {
      var args, body, cond, hasArgs, i, idt, post, pre, range, result, vars, _i, _ref2, _ref3, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          _results = [];
          for (var _i = _ref2 = +this.fromNum, _ref3 = +this.toNum; _ref2 <= _ref3 ? _i <= _ref3 : _i >= _ref3; _ref2 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return "[" + (range.join(', ')) + "]";
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = this.compileNode(o);
      } else {
        vars = ("" + i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
        cond = "" + this.fromVar + " <= " + this.toVar;
        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      hasArgs = function(node) {
        return node != null ? node.contains(function(n) {
          return n instanceof Literal && n.value === 'arguments' && !n.asKey;
        }) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return "(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")";
    };
    return Range;
  })(Base);
  exports.Slice = Slice = (function(_super) {
    __extends(Slice, _super);
    Slice.prototype.children = ['range'];
    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }
    Slice.prototype.compileNode = function(o) {
      var compiled, from, fromStr, to, toStr, _ref2;
      _ref2 = this.range, to = _ref2.to, from = _ref2.from;
      fromStr = from && from.compile(o, LEVEL_PAREN) || '0';
      compiled = to && to.compile(o, LEVEL_PAREN);
      if (to && !(!this.range.exclusive && +compiled === -1)) {
        toStr = ', ' + (this.range.exclusive ? compiled : SIMPLENUM.test(compiled) ? "" + (+compiled + 1) : (compiled = to.compile(o, LEVEL_ACCESS), "+" + compiled + " + 1 || 9e9"));
      }
      return ".slice(" + fromStr + (toStr || '') + ")";
    };
    return Slice;
  })(Base);
  exports.Obj = Obj = (function(_super) {
    __extends(Obj, _super);
    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }
    Obj.prototype.children = ['properties'];
    Obj.prototype.compileNode = function(o) {
      var i, idt, indent, join, lastNoncom, node, obj, prop, props, _i, _len;
      props = this.properties;
      if (!props.length) {
        return (this.front ? '({})' : '{}');
      }
      if (this.generated) {
        for (_i = 0, _len = props.length; _i < _len; _i++) {
          node = props[_i];
          if (node instanceof Value) {
            throw new Error('cannot have an implicit value in an implicit object');
          }
        }
      }
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      props = (function() {
        var _j, _len1, _results;
        _results = [];
        for (i = _j = 0, _len1 = props.length; _j < _len1; i = ++_j) {
          prop = props[i];
          join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
          indent = prop instanceof Comment ? '' : idt;
          if (prop instanceof Value && prop["this"]) {
            prop = new Assign(prop.properties[0].name, prop, 'object');
          }
          if (!(prop instanceof Comment)) {
            if (!(prop instanceof Assign)) {
              prop = new Assign(prop, prop, 'object');
            }
            (prop.variable.base || prop.variable).asKey = true;
          }
          _results.push(indent + prop.compile(o, LEVEL_TOP) + join);
        }
        return _results;
      })();
      props = props.join('');
      obj = "{" + (props && '\n' + props + '\n' + this.tab) + "}";
      if (this.front) {
        return "(" + obj + ")";
      } else {
        return obj;
      }
    };
    Obj.prototype.assigns = function(name) {
      var prop, _i, _len, _ref2;
      _ref2 = this.properties;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        prop = _ref2[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Obj;
  })(Base);
  exports.Arr = Arr = (function(_super) {
    __extends(Arr, _super);
    function Arr(objs) {
      this.objects = objs || [];
    }
    Arr.prototype.children = ['objects'];
    Arr.prototype.filterImplicitObjects = Call.prototype.filterImplicitObjects;
    Arr.prototype.compileNode = function(o) {
      var code, obj, objs;
      if (!this.objects.length) {
        return '[]';
      }
      o.indent += TAB;
      objs = this.filterImplicitObjects(this.objects);
      if (code = Splat.compileSplattedArray(o, objs)) {
        return code;
      }
      code = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objs.length; _i < _len; _i++) {
          obj = objs[_i];
          _results.push(obj.compile(o, LEVEL_LIST));
        }
        return _results;
      })()).join(', ');
      if (code.indexOf('\n') >= 0) {
        return "[\n" + o.indent + code + "\n" + this.tab + "]";
      } else {
        return "[" + code + "]";
      }
    };
    Arr.prototype.assigns = function(name) {
      var obj, _i, _len, _ref2;
      _ref2 = this.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Arr;
  })(Base);
  exports.Class = Class = (function(_super) {
    __extends(Class, _super);
    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Block;
      this.boundFuncs = [];
      this.body.classBody = true;
    }
    Class.prototype.children = ['variable', 'parent', 'body'];
    Class.prototype.determineName = function() {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      if (__indexOf.call(STRICT_PROSCRIBED, decl) >= 0) {
        throw SyntaxError("variable name may not be " + decl);
      }
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };
    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };
    Class.prototype.addBoundFunctions = function(o) {
      var bvar, lhs, _i, _len, _ref2, _results;
      if (this.boundFuncs.length) {
        _ref2 = this.boundFuncs;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          bvar = _ref2[_i];
          lhs = (new Value(new Literal("this"), [new Access(bvar)])).compile(o);
          _results.push(this.ctor.body.unshift(new Literal("" + lhs + " = " + (utility('bind')) + "(" + lhs + ", this)")));
        }
        return _results;
      }
    };
    Class.prototype.addProperties = function(node, name, o) {
      var assign, base, exprs, func, props;
      props = node.base.properties.slice(0);
      exprs = (function() {
        var _results;
        _results = [];
        while (assign = props.shift()) {
          if (assign instanceof Assign) {
            base = assign.variable.base;
            delete assign.context;
            func = assign.value;
            if (base.value === 'constructor') {
              if (this.ctor) {
                throw new Error('cannot define more than one constructor in a class');
              }
              if (func.bound) {
                throw new Error('cannot define a constructor as a bound function');
              }
              if (func instanceof Code) {
                assign = this.ctor = func;
              } else {
                this.externalCtor = o.scope.freeVariable('class');
                assign = new Assign(new Literal(this.externalCtor), func);
              }
            } else {
              if (assign.variable["this"]) {
                func["static"] = true;
                if (func.bound) {
                  func.context = name;
                }
              } else {
                assign.variable = new Value(new Literal(name), [new Access(new Literal('prototype')), new Access(base)]);
                if (func instanceof Code && func.bound) {
                  this.boundFuncs.push(base);
                  func.bound = false;
                }
              }
            }
          }
          _results.push(assign);
        }
        return _results;
      }).call(this);
      return compact(exprs);
    };
    Class.prototype.walkBody = function(name, o) {
      var _this = this;
      return this.traverseChildren(false, function(child) {
        var exps, i, node, _i, _len, _ref2;
        if (child instanceof Class) {
          return false;
        }
        if (child instanceof Block) {
          _ref2 = exps = child.expressions;
          for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
            node = _ref2[i];
            if (node instanceof Value && node.isObject(true)) {
              exps[i] = _this.addProperties(node, name, o);
            }
          }
          return child.expressions = exps = flatten(exps);
        }
      });
    };
    Class.prototype.hoistDirectivePrologue = function() {
      var expressions, index, node;
      index = 0;
      expressions = this.body.expressions;
      while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
        ++index;
      }
      return this.directives = expressions.splice(0, index);
    };
    Class.prototype.ensureConstructor = function(name) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (this.parent) {
          this.ctor.body.push(new Literal("" + name + ".__super__.constructor.apply(this, arguments)"));
        }
        if (this.externalCtor) {
          this.ctor.body.push(new Literal("" + this.externalCtor + ".apply(this, arguments)"));
        }
        this.ctor.body.makeReturn();
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };
    Class.prototype.compileNode = function(o) {
      var call, decl, klass, lname, name, params, _ref2;
      decl = this.determineName();
      name = decl || '_Class';
      if (name.reserved) {
        name = "_" + name;
      }
      lname = new Literal(name);
      this.hoistDirectivePrologue();
      this.setContext(name);
      this.walkBody(name, o);
      this.ensureConstructor(name);
      this.body.spaced = true;
      if (!(this.ctor instanceof Code)) {
        this.body.expressions.unshift(this.ctor);
      }
      this.body.expressions.push(lname);
      (_ref2 = this.body.expressions).unshift.apply(_ref2, this.directives);
      this.addBoundFunctions(o);
      call = Closure.wrap(this.body);
      if (this.parent) {
        this.superClass = new Literal(o.scope.freeVariable('super', false));
        this.body.expressions.unshift(new Extends(lname, this.superClass));
        call.args.push(this.parent);
        params = call.variable.params || call.variable.base.params;
        params.push(new Param(this.superClass));
      }
      klass = new Parens(call, true);
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compile(o);
    };
    return Class;
  })(Base);
  exports.Assign = Assign = (function(_super) {
    __extends(Assign, _super);
    function Assign(variable, value, context, options) {
      var forbidden, name, _ref2;
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
      this.subpattern = options && options.subpattern;
      forbidden = (_ref2 = (name = this.variable.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0);
      if (forbidden && this.context !== 'object') {
        throw SyntaxError("variable name may not be \"" + name + "\"");
      }
    }
    Assign.prototype.children = ['variable', 'value'];
    Assign.prototype.isStatement = function(o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && __indexOf.call(this.context, "?") >= 0;
    };
    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };
    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };
    Assign.prototype.compileNode = function(o) {
      var isValue, match, name, val, varBase, _ref2, _ref3, _ref4, _ref5;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref2 = this.context) === '||=' || _ref2 === '&&=' || _ref2 === '?=') {
          return this.compileConditional(o);
        }
      }
      name = this.variable.compile(o, LEVEL_LIST);
      if (!this.context) {
        if (!(varBase = this.variable.unwrapAll()).isAssignable()) {
          throw SyntaxError("\"" + (this.variable.compile(o)) + "\" cannot be assigned.");
        }
        if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
          if (this.param) {
            o.scope.add(name, 'var');
          } else {
            o.scope.find(name);
          }
        }
      }
      if (this.value instanceof Code && (match = METHOD_DEF.exec(name))) {
        if (match[1]) {
          this.value.klass = match[1];
        }
        this.value.name = (_ref3 = (_ref4 = (_ref5 = match[2]) != null ? _ref5 : match[3]) != null ? _ref4 : match[4]) != null ? _ref3 : match[5];
      }
      val = this.value.compile(o, LEVEL_LIST);
      if (this.context === 'object') {
        return "" + name + ": " + val;
      }
      val = name + (" " + (this.context || '=') + " ") + val;
      if (o.level <= LEVEL_LIST) {
        return val;
      } else {
        return "(" + val + ")";
      }
    };
    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, i, idx, isObject, ivar, name, obj, objects, olen, ref, rest, splat, top, val, value, vvar, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        code = value.compile(o);
        if (o.level >= LEVEL_OP) {
          return "(" + code + ")";
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref2 = obj, (_ref3 = _ref2.variable, idx = _ref3.base), obj = _ref2.value;
        } else {
          if (obj.base instanceof Parens) {
            _ref4 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref4[0], idx = _ref4[1];
          } else {
            idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
          }
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        if (_ref5 = obj.unwrap().value, __indexOf.call(RESERVED, _ref5) >= 0) {
          throw new SyntaxError("assignment to a reserved word: " + (obj.compile(o)) + " = " + (value.compile(o)));
        }
        return new Assign(obj, value, null, {
          param: this.param
        }).compile(o, LEVEL_TOP);
      }
      vvar = value.compile(o, LEVEL_LIST);
      assigns = [];
      splat = false;
      if (!IDENTIFIER.test(vvar) || this.variable.assigns(vvar)) {
        assigns.push("" + (ref = o.scope.freeVariable('ref')) + " = " + vvar);
        vvar = ref;
      }
      for (i = _i = 0, _len = objects.length; _i < _len; i = ++_i) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref6 = obj, (_ref7 = _ref6.variable, idx = _ref7.base), obj = _ref6.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref8 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref8[0], idx = _ref8[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!splat && obj instanceof Splat) {
          name = obj.name.unwrap().value;
          obj = obj.unwrap();
          val = "" + olen + " <= " + vvar + ".length ? " + (utility('slice')) + ".call(" + vvar + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvar + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          splat = "" + ivar + "++";
        } else {
          name = obj.unwrap().value;
          if (obj instanceof Splat) {
            obj = obj.name.compile(o);
            throw new SyntaxError("multiple splats are disallowed in an assignment: " + obj + "...");
          }
          if (typeof idx === 'number') {
            idx = new Literal(splat || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvar), [new (acc ? Access : Index)(idx)]);
        }
        if ((name != null) && __indexOf.call(RESERVED, name) >= 0) {
          throw new SyntaxError("assignment to a reserved word: " + (obj.compile(o)) + " = " + (val.compile(o)));
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param,
          subpattern: true
        }).compile(o, LEVEL_LIST));
      }
      if (!(top || this.subpattern)) {
        assigns.push(vvar);
      }
      code = assigns.join(', ');
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Assign.prototype.compileConditional = function(o) {
      var left, right, _ref2;
      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
      if (!left.properties.length && left.base instanceof Literal && left.base.value !== "this" && !o.scope.check(left.base.value)) {
        throw new Error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been defined.");
      }
      if (__indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
      }
      return new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compile(o);
    };
    Assign.prototype.compileSplice = function(o) {
      var code, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref2, _ref3, _ref4;
      _ref2 = this.variable.properties.pop().range, from = _ref2.from, to = _ref2.to, exclusive = _ref2.exclusive;
      name = this.variable.compile(o);
      _ref3 = (from != null ? from.cache(o, LEVEL_OP) : void 0) || ['0', '0'], fromDecl = _ref3[0], fromRef = _ref3[1];
      if (to) {
        if ((from != null ? from.isSimpleNumber() : void 0) && to.isSimpleNumber()) {
          to = +to.compile(o) - +fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      _ref4 = this.value.cache(o, LEVEL_LIST), valDef = _ref4[0], valRef = _ref4[1];
      code = "[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat(" + valDef + ")), " + valRef;
      if (o.level > LEVEL_TOP) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    return Assign;
  })(Base);
  exports.Code = Code = (function(_super) {
    __extends(Code, _super);
    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block;
      this.bound = tag === 'boundfunc';
      if (this.bound) {
        this.context = '_this';
      }
    }
    Code.prototype.children = ['params', 'body'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.jumps = NO;
    Code.prototype.compileNode = function(o) {
      var code, exprs, i, idt, lit, name, p, param, params, ref, splats, uniqs, val, wasEmpty, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      o.scope = new Scope(o.scope, this.body, this);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      delete o.isExistentialEquals;
      params = [];
      exprs = [];
      _ref2 = this.paramNames();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        name = _ref2[_i];
        if (!o.scope.check(name)) {
          o.scope.parameter(name);
        }
      }
      _ref3 = this.params;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        param = _ref3[_j];
        if (!param.splat) {
          continue;
        }
        _ref4 = this.params;
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          p = _ref4[_k].name;
          if (p["this"]) {
            p = p.properties[0].name;
          }
          if (p.value) {
            o.scope.add(p.value, 'var', true);
          }
        }
        splats = new Assign(new Value(new Arr((function() {
          var _l, _len3, _ref5, _results;
          _ref5 = this.params;
          _results = [];
          for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
            p = _ref5[_l];
            _results.push(p.asReference(o));
          }
          return _results;
        }).call(this))), new Value(new Literal('arguments')));
        break;
      }
      _ref5 = this.params;
      for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
        param = _ref5[_l];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          params.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_ref6 = this.body.expressions).unshift.apply(_ref6, exprs);
      }
      for (i = _m = 0, _len4 = params.length; _m < _len4; i = ++_m) {
        p = params[i];
        o.scope.parameter(params[i] = p.compile(o));
      }
      uniqs = [];
      _ref7 = this.paramNames();
      for (_n = 0, _len5 = _ref7.length; _n < _len5; _n++) {
        name = _ref7[_n];
        if (__indexOf.call(uniqs, name) >= 0) {
          throw SyntaxError("multiple parameters named '" + name + "'");
        }
        uniqs.push(name);
      }
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      if (this.bound) {
        if ((_ref8 = o.scope.parent.method) != null ? _ref8.bound : void 0) {
          this.bound = this.context = o.scope.parent.method.context;
        } else if (!this["static"]) {
          o.scope.parent.assign('_this', 'this');
        }
      }
      idt = o.indent;
      code = 'function';
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(' + params.join(', ') + ') {';
      if (!this.body.isEmpty()) {
        code += "\n" + (this.body.compileWithDeclarations(o)) + "\n" + this.tab;
      }
      code += '}';
      if (this.ctor) {
        return this.tab + code;
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Code.prototype.paramNames = function() {
      var names, param, _i, _len, _ref2;
      names = [];
      _ref2 = this.params;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        names.push.apply(names, param.names());
      }
      return names;
    };
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    return Code;
  })(Base);
  exports.Param = Param = (function(_super) {
    __extends(Param, _super);
    function Param(name, value, splat) {
      var _ref2;
      this.name = name;
      this.value = value;
      this.splat = splat;
      if (_ref2 = (name = this.name.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0) {
        throw SyntaxError("parameter name \"" + name + "\" is not allowed");
      }
    }
    Param.prototype.children = ['name', 'value'];
    Param.prototype.compile = function(o) {
      return this.name.compile(o, LEVEL_LIST);
    };
    Param.prototype.asReference = function(o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal(o.scope.freeVariable(node.value));
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      return this.reference = node;
    };
    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };
    Param.prototype.names = function(name) {
      var atParam, names, obj, _i, _len, _ref2;
      if (name == null) {
        name = this.name;
      }
      atParam = function(obj) {
        var value;
        value = obj.properties[0].name.value;
        if (value.reserved) {
          return [];
        } else {
          return [value];
        }
      };
      if (name instanceof Literal) {
        return [name.value];
      }
      if (name instanceof Value) {
        return atParam(name);
      }
      names = [];
      _ref2 = name.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj instanceof Assign) {
          names.push(obj.value.unwrap().value);
        } else if (obj instanceof Splat) {
          names.push(obj.name.unwrap().value);
        } else if (obj instanceof Value) {
          if (obj.isArray() || obj.isObject()) {
            names.push.apply(names, this.names(obj.base));
          } else if (obj["this"]) {
            names.push.apply(names, atParam(obj));
          } else {
            names.push(obj.base.value);
          }
        } else {
          throw SyntaxError("illegal parameter " + (obj.compile()));
        }
      }
      return names;
    };
    return Param;
  })(Base);
  exports.Splat = Splat = (function(_super) {
    __extends(Splat, _super);
    Splat.prototype.children = ['name'];
    Splat.prototype.isAssignable = YES;
    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }
    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };
    Splat.prototype.compile = function(o) {
      if (this.index != null) {
        return this.compileParam(o);
      } else {
        return this.name.compile(o);
      }
    };
    Splat.prototype.unwrap = function() {
      return this.name;
    };
    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, code, i, index, node, _i, _len;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return '';
      }
      if (list.length === 1) {
        code = list[0].compile(o, LEVEL_LIST);
        if (apply) {
          return code;
        }
        return "" + (utility('slice')) + ".call(" + code + ")";
      }
      args = list.slice(index);
      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
        node = args[i];
        code = node.compile(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? "" + (utility('slice')) + ".call(" + code + ")" : "[" + code + "]";
      }
      if (index === 0) {
        return args[0] + (".concat(" + (args.slice(1).join(', ')) + ")");
      }
      base = (function() {
        var _j, _len1, _ref2, _results;
        _ref2 = list.slice(0, index);
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          node = _ref2[_j];
          _results.push(node.compile(o, LEVEL_LIST));
        }
        return _results;
      })();
      return "[" + (base.join(', ')) + "].concat(" + (args.join(', ')) + ")";
    };
    return Splat;
  })(Base);
  exports.While = While = (function(_super) {
    __extends(While, _super);
    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }
    While.prototype.children = ['condition', 'guard', 'body'];
    While.prototype.isStatement = YES;
    While.prototype.makeReturn = function(res) {
      if (res) {
        return While.__super__.makeReturn.apply(this, arguments);
      } else {
        this.returns = !this.jumps({
          loop: true
        });
        return this;
      }
    };
    While.prototype.addBody = function(body) {
      this.body = body;
      return this;
    };
    While.prototype.jumps = function() {
      var expressions, node, _i, _len;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
        node = expressions[_i];
        if (node.jumps({
          loop: true
        })) {
          return node;
        }
      }
      return false;
    };
    While.prototype.compileNode = function(o) {
      var body, code, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = '';
      } else {
        if (this.returns) {
          body.makeReturn(rvar = o.scope.freeVariable('results'));
          set = "" + this.tab + rvar + " = [];\n";
        }
        if (this.guard) {
          if (body.expressions.length > 1) {
            body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
          } else {
            if (this.guard) {
              body = Block.wrap([new If(this.guard, body)]);
            }
          }
        }
        body = "\n" + (body.compile(o, LEVEL_TOP)) + "\n" + this.tab;
      }
      code = set + this.tab + ("while (" + (this.condition.compile(o, LEVEL_PAREN)) + ") {" + body + "}");
      if (this.returns) {
        code += "\n" + this.tab + "return " + rvar + ";";
      }
      return code;
    };
    return While;
  })(Base);
  exports.Op = Op = (function(_super) {
    var CONVERSIONS, INVERSIONS;
    __extends(Op, _super);
    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        return this.generateDo(first);
      }
      if (op === 'new') {
        if (first instanceof Call && !first["do"] && !first.isNew) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound || first["do"]) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }
    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };
    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };
    Op.prototype.children = ['first', 'second'];
    Op.prototype.isSimpleNumber = NO;
    Op.prototype.isUnary = function() {
      return !this.second;
    };
    Op.prototype.isComplex = function() {
      var _ref2;
      return !(this.isUnary() && ((_ref2 = this.operator) === '+' || _ref2 === '-')) || this.first.isComplex();
    };
    Op.prototype.isChainable = function() {
      var _ref2;
      return (_ref2 = this.operator) === '<' || _ref2 === '>' || _ref2 === '>=' || _ref2 === '<=' || _ref2 === '===' || _ref2 === '!==';
    };
    Op.prototype.invert = function() {
      var allInvertable, curr, fst, op, _ref2;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref2 = fst.operator) === '!' || _ref2 === 'in' || _ref2 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };
    Op.prototype.unfoldSoak = function(o) {
      var _ref2;
      return ((_ref2 = this.operator) === '++' || _ref2 === '--' || _ref2 === 'delete') && unfoldSoak(o, this, 'first');
    };
    Op.prototype.generateDo = function(exp) {
      var call, func, param, passedParams, ref, _i, _len, _ref2;
      passedParams = [];
      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
      _ref2 = func.params || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        if (param.value) {
          passedParams.push(param.value);
          delete param.value;
        } else {
          passedParams.push(param);
        }
      }
      call = new Call(exp, passedParams);
      call["do"] = true;
      return call;
    };
    Op.prototype.compileNode = function(o) {
      var code, isChain, _ref2, _ref3;
      isChain = this.isChainable() && this.first.isChainable();
      if (!isChain) {
        this.first.front = this.front;
      }
      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
        throw SyntaxError('delete operand may not be argument or var');
      }
      if (((_ref2 = this.operator) === '--' || _ref2 === '++') && (_ref3 = this.first.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref3) >= 0)) {
        throw SyntaxError('prefix increment/decrement may not have eval or arguments operand');
      }
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (isChain) {
        return this.compileChain(o);
      }
      if (this.operator === '?') {
        return this.compileExistence(o);
      }
      code = this.first.compile(o, LEVEL_OP) + ' ' + this.operator + ' ' + this.second.compile(o, LEVEL_OP);
      if (o.level <= LEVEL_OP) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Op.prototype.compileChain = function(o) {
      var code, fst, shared, _ref2;
      _ref2 = this.first.second.cache(o), this.first.second = _ref2[0], shared = _ref2[1];
      fst = this.first.compile(o, LEVEL_OP);
      code = "" + fst + " " + (this.invert ? '&&' : '||') + " " + (shared.compile(o)) + " " + this.operator + " " + (this.second.compile(o, LEVEL_OP));
      return "(" + code + ")";
    };
    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = new Literal(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst), ref, {
        type: 'if'
      }).addElse(this.second).compile(o);
    };
    Op.prototype.compileUnary = function(o) {
      var op, parts, plusMinus;
      if (o.level >= LEVEL_ACCESS) {
        return (new Parens(this)).compile(o);
      }
      parts = [op = this.operator];
      plusMinus = op === '+' || op === '-';
      if ((op === 'new' || op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
        parts.push(' ');
      }
      if ((plusMinus && this.first instanceof Op) || (op === 'new' && this.first.isStatement(o))) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compile(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return parts.join('');
    };
    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };
    return Op;
  })(Base);
  exports.In = In = (function(_super) {
    __extends(In, _super);
    function In(object, array) {
      this.object = object;
      this.array = array;
    }
    In.prototype.children = ['object', 'array'];
    In.prototype.invert = NEGATE;
    In.prototype.compileNode = function(o) {
      var hasSplat, obj, _i, _len, _ref2;
      if (this.array instanceof Value && this.array.isArray()) {
        _ref2 = this.array.base.objects;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          if (!(obj instanceof Splat)) {
            continue;
          }
          hasSplat = true;
          break;
        }
        if (!hasSplat) {
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    };
    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, ref, sub, tests, _ref2, _ref3;
      if (this.array.base.objects.length === 0) {
        return "" + (!!this.negated);
      }
      _ref2 = this.object.cache(o, LEVEL_OP), sub = _ref2[0], ref = _ref2[1];
      _ref3 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref3[0], cnj = _ref3[1];
      tests = (function() {
        var _i, _len, _ref4, _results;
        _ref4 = this.array.base.objects;
        _results = [];
        for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
          item = _ref4[i];
          _results.push((i ? ref : sub) + cmp + item.compile(o, LEVEL_ACCESS));
        }
        return _results;
      }).call(this);
      tests = tests.join(cnj);
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return "(" + tests + ")";
      }
    };
    In.prototype.compileLoopTest = function(o) {
      var code, ref, sub, _ref2;
      _ref2 = this.object.cache(o, LEVEL_LIST), sub = _ref2[0], ref = _ref2[1];
      code = utility('indexOf') + (".call(" + (this.array.compile(o, LEVEL_LIST)) + ", " + ref + ") ") + (this.negated ? '< 0' : '>= 0');
      if (sub === ref) {
        return code;
      }
      code = sub + ', ' + code;
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };
    return In;
  })(Base);
  exports.Try = Try = (function(_super) {
    __extends(Try, _super);
    function Try(attempt, error, recovery, ensure) {
      this.attempt = attempt;
      this.error = error;
      this.recovery = recovery;
      this.ensure = ensure;
    }
    Try.prototype.children = ['attempt', 'recovery', 'ensure'];
    Try.prototype.isStatement = YES;
    Try.prototype.jumps = function(o) {
      var _ref2;
      return this.attempt.jumps(o) || ((_ref2 = this.recovery) != null ? _ref2.jumps(o) : void 0);
    };
    Try.prototype.makeReturn = function(res) {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn(res);
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn(res);
      }
      return this;
    };
    Try.prototype.compileNode = function(o) {
      var catchPart, ensurePart, errorPart, tryPart;
      o.indent += TAB;
      errorPart = this.error ? " (" + (this.error.compile(o)) + ") " : ' ';
      tryPart = this.attempt.compile(o, LEVEL_TOP);
      catchPart = (function() {
        var _ref2;
        if (this.recovery) {
          if (_ref2 = this.error.value, __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0) {
            throw SyntaxError("catch variable may not be \"" + this.error.value + "\"");
          }
          if (!o.scope.check(this.error.value)) {
            o.scope.add(this.error.value, 'param');
          }
          return " catch" + errorPart + "{\n" + (this.recovery.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}";
        } else if (!(this.ensure || this.recovery)) {
          return ' catch (_error) {}';
        }
      }).call(this);
      ensurePart = this.ensure ? " finally {\n" + (this.ensure.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : '';
      return "" + this.tab + "try {\n" + tryPart + "\n" + this.tab + "}" + (catchPart || '') + ensurePart;
    };
    return Try;
  })(Base);
  exports.Throw = Throw = (function(_super) {
    __extends(Throw, _super);
    function Throw(expression) {
      this.expression = expression;
    }
    Throw.prototype.children = ['expression'];
    Throw.prototype.isStatement = YES;
    Throw.prototype.jumps = NO;
    Throw.prototype.makeReturn = THIS;
    Throw.prototype.compileNode = function(o) {
      return this.tab + ("throw " + (this.expression.compile(o)) + ";");
    };
    return Throw;
  })(Base);
  exports.Existence = Existence = (function(_super) {
    __extends(Existence, _super);
    function Existence(expression) {
      this.expression = expression;
    }
    Existence.prototype.children = ['expression'];
    Existence.prototype.invert = NEGATE;
    Existence.prototype.compileNode = function(o) {
      var cmp, cnj, code, _ref2;
      this.expression.front = this.front;
      code = this.expression.compile(o, LEVEL_OP);
      if (IDENTIFIER.test(code) && !o.scope.check(code)) {
        _ref2 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = _ref2[0], cnj = _ref2[1];
        code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
      } else {
        code = "" + code + " " + (this.negated ? '==' : '!=') + " null";
      }
      if (o.level <= LEVEL_COND) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Existence;
  })(Base);
  exports.Parens = Parens = (function(_super) {
    __extends(Parens, _super);
    function Parens(body) {
      this.body = body;
    }
    Parens.prototype.children = ['body'];
    Parens.prototype.unwrap = function() {
      return this.body;
    };
    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };
    Parens.prototype.compileNode = function(o) {
      var bare, code, expr;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compile(o);
      }
      code = expr.compile(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
      if (bare) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Parens;
  })(Base);
  exports.For = For = (function(_super) {
    __extends(For, _super);
    function For(body, source) {
      var _ref2;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        _ref2 = [this.index, this.name], this.name = _ref2[0], this.index = _ref2[1];
      }
      if (this.index instanceof Value) {
        throw SyntaxError('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        throw SyntaxError('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        throw SyntaxError('cannot pattern match over range loops');
      }
      this.returns = false;
    }
    For.prototype.children = ['body', 'source', 'guard', 'step'];
    For.prototype.compileNode = function(o) {
      var body, defPart, forPart, forVarPart, guardPart, idt1, index, ivar, kvar, kvarAssign, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, stepPart, stepvar, svar, varPart, _ref2;
      body = Block.wrap([this.body]);
      lastJumps = (_ref2 = last(body.expressions)) != null ? _ref2.jumps() : void 0;
      if (lastJumps && lastJumps instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      name = this.name && this.name.compile(o, LEVEL_LIST);
      index = this.index && this.index.compile(o, LEVEL_LIST);
      if (name && !this.pattern) {
        scope.find(name);
      }
      if (index) {
        scope.find(index);
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.object && index) || scope.freeVariable('i');
      kvar = (this.range && name) || index || ivar;
      kvarAssign = kvar !== ivar ? "" + kvar + " = " : "";
      if (this.step && !this.range) {
        stepvar = scope.freeVariable("step");
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPart = source.compile(merge(o, {
          index: ivar,
          name: name,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart = "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = "" + name + " = " + svar + "[" + kvar + "]";
        }
        if (!this.object) {
          lvar = scope.freeVariable('len');
          forVarPart = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
          if (this.step) {
            forVarPart += ", " + stepvar + " = " + (this.step.compile(o, LEVEL_OP));
          }
          stepPart = "" + kvarAssign + (this.step ? "" + ivar + " += " + stepvar : (kvar !== ivar ? "++" + ivar : "" + ivar + "++"));
          forPart = "" + forVarPart + "; " + ivar + " < " + lvar + "; " + stepPart;
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body.makeReturn(rvar);
      }
      if (this.guard) {
        if (body.expressions.length > 1) {
          body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
        } else {
          if (this.guard) {
            body = Block.wrap([new If(this.guard, body)]);
          }
        }
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + kvar + "]")));
      }
      defPart += this.pluckDirectCall(o, body);
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPart = "" + kvar + " in " + svar;
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp')) + ".call(" + svar + ", " + kvar + ")) continue;";
        }
      }
      body = body.compile(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (body) {
        body = '\n' + body + '\n';
      }
      return "" + defPart + (resultPart || '') + this.tab + "for (" + forPart + ") {" + guardPart + varPart + body + this.tab + "}" + (returnResult || '');
    };
    For.prototype.pluckDirectCall = function(o, body) {
      var base, defs, expr, fn, idx, ref, val, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      defs = '';
      _ref2 = body.expressions;
      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
        expr = _ref2[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = expr.variable.unwrapAll();
        if (!((val instanceof Code) || (val instanceof Value && ((_ref3 = val.base) != null ? _ref3.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref4 = (_ref5 = val.properties[0].name) != null ? _ref5.value : void 0) === 'call' || _ref4 === 'apply')))) {
          continue;
        }
        fn = ((_ref6 = val.base) != null ? _ref6.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          _ref7 = [base, val], val.base = _ref7[0], base = _ref7[1];
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs += this.tab + new Assign(ref, fn).compile(o, LEVEL_TOP) + ';\n';
      }
      return defs;
    };
    return For;
  })(While);
  exports.Switch = Switch = (function(_super) {
    __extends(Switch, _super);
    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }
    Switch.prototype.children = ['subject', 'cases', 'otherwise'];
    Switch.prototype.isStatement = YES;
    Switch.prototype.jumps = function(o) {
      var block, conds, _i, _len, _ref2, _ref3, _ref4;
      if (o == null) {
        o = {
          block: true
        };
      }
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], conds = _ref3[0], block = _ref3[1];
        if (block.jumps(o)) {
          return block;
        }
      }
      return (_ref4 = this.otherwise) != null ? _ref4.jumps(o) : void 0;
    };
    Switch.prototype.makeReturn = function(res) {
      var pair, _i, _len, _ref2, _ref3;
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pair = _ref2[_i];
        pair[1].makeReturn(res);
      }
      if (res) {
        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
      }
      if ((_ref3 = this.otherwise) != null) {
        _ref3.makeReturn(res);
      }
      return this;
    };
    Switch.prototype.compileNode = function(o) {
      var block, body, code, cond, conditions, expr, i, idt1, idt2, _i, _j, _len, _len1, _ref2, _ref3, _ref4, _ref5;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      code = this.tab + ("switch (" + (((_ref2 = this.subject) != null ? _ref2.compile(o, LEVEL_PAREN) : void 0) || false) + ") {\n");
      _ref3 = this.cases;
      for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
        _ref4 = _ref3[i], conditions = _ref4[0], block = _ref4[1];
        _ref5 = flatten([conditions]);
        for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
          cond = _ref5[_j];
          if (!this.subject) {
            cond = cond.invert();
          }
          code += idt1 + ("case " + (cond.compile(o, LEVEL_PAREN)) + ":\n");
        }
        if (body = block.compile(o, LEVEL_TOP)) {
          code += body + '\n';
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        code += idt2 + 'break;\n';
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        code += idt1 + ("default:\n" + (this.otherwise.compile(o, LEVEL_TOP)) + "\n");
      }
      return code + this.tab + '}';
    };
    return Switch;
  })(Base);
  exports.If = If = (function(_super) {
    __extends(If, _super);
    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }
    If.prototype.children = ['condition', 'body', 'elseBody'];
    If.prototype.bodyNode = function() {
      var _ref2;
      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.elseBodyNode = function() {
      var _ref2;
      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
      }
      return this;
    };
    If.prototype.isStatement = function(o) {
      var _ref2;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
    };
    If.prototype.jumps = function(o) {
      var _ref2;
      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
    };
    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };
    If.prototype.makeReturn = function(res) {
      if (res) {
        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
      }
      this.body && (this.body = new Block([this.body.makeReturn(res)]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
      return this;
    };
    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };
    If.prototype.compileStatement = function(o) {
      var body, child, cond, exeq, ifPart;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.condition.invert(), this.elseBodyNode(), {
          type: 'if'
        }).compile(o);
      }
      cond = this.condition.compile(o, LEVEL_PAREN);
      o.indent += TAB;
      body = this.ensureBlock(this.body);
      ifPart = "if (" + cond + ") {\n" + (body.compile(o)) + "\n" + this.tab + "}";
      if (!child) {
        ifPart = this.tab + ifPart;
      }
      if (!this.elseBody) {
        return ifPart;
      }
      return ifPart + ' else ' + (this.isChain ? (o.indent = this.tab, o.chainChild = true, this.elseBody.unwrap().compile(o, LEVEL_TOP)) : "{\n" + (this.elseBody.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}");
    };
    If.prototype.compileExpression = function(o) {
      var alt, body, code, cond;
      cond = this.condition.compile(o, LEVEL_COND);
      body = this.bodyNode().compile(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compile(o, LEVEL_LIST) : 'void 0';
      code = "" + cond + " ? " + body + " : " + alt;
      if (o.level >= LEVEL_COND) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };
    return If;
  })(Base);
  Closure = {
    wrap: function(expressions, statement, noReturn) {
      var args, call, func, mentionsArgs, meth;
      if (expressions.jumps()) {
        return expressions;
      }
      func = new Code([], Block.wrap([expressions]));
      args = [];
      if ((mentionsArgs = expressions.contains(this.literalArgs)) || expressions.contains(this.literalThis)) {
        meth = new Literal(mentionsArgs ? 'apply' : 'call');
        args = [new Literal('this')];
        if (mentionsArgs) {
          args.push(new Literal('arguments'));
        }
        func = new Value(func, [new Access(meth)]);
      }
      func.noReturn = noReturn;
      call = new Call(func, args);
      if (statement) {
        return Block.wrap([call]);
      } else {
        return call;
      }
    },
    literalArgs: function(node) {
      return node instanceof Literal && node.value === 'arguments' && !node.asKey;
    },
    literalThis: function(node) {
      return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound) || (node instanceof Call && node.isSuper);
    }
  };
  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };
  UTILITIES = {
    "extends": function() {
      return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp')) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function() {
      return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function() {
      return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
    },
    hasProp: function() {
      return '{}.hasOwnProperty';
    },
    slice: function() {
      return '[].slice';
    }
  };
  LEVEL_TOP = 1;
  LEVEL_PAREN = 2;
  LEVEL_LIST = 3;
  LEVEL_COND = 4;
  LEVEL_OP = 5;
  LEVEL_ACCESS = 6;
  TAB = '  ';
  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";
  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");
  SIMPLENUM = /^[+-]?\d+$/;
  METHOD_DEF = RegExp("^(?:(" + IDENTIFIER_STR + ")\\.prototype(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|(" + IDENTIFIER_STR + ")$");
  IS_STRING = /^['"]/;
  utility = function(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]());
    return ref;
  };
  multident = function(code, tab) {
    code = code.replace(/\n/g, '$&' + tab);
    return code.replace(/\s+$/, '');
  };
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'optparse',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var LONG_FLAG, MULTI_FLAG, OPTIONAL, OptionParser, SHORT_FLAG, buildRule, buildRules, normalizeArguments;
  exports.OptionParser = OptionParser = (function() {
    function OptionParser(rules, banner) {
      this.banner = banner;
      this.rules = buildRules(rules);
    }
    OptionParser.prototype.parse = function(args) {
      var arg, i, isOption, matchedRule, options, originalArgs, pos, rule, seenNonOptionArg, skippingArgument, value, _i, _j, _len, _len1, _ref;
      options = {
        "arguments": []
      };
      skippingArgument = false;
      originalArgs = args;
      args = normalizeArguments(args);
      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
        arg = args[i];
        if (skippingArgument) {
          skippingArgument = false;
          continue;
        }
        if (arg === '--') {
          pos = originalArgs.indexOf('--');
          options["arguments"] = options["arguments"].concat(originalArgs.slice(pos + 1));
          break;
        }
        isOption = !!(arg.match(LONG_FLAG) || arg.match(SHORT_FLAG));
        seenNonOptionArg = options["arguments"].length > 0;
        if (!seenNonOptionArg) {
          matchedRule = false;
          _ref = this.rules;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            rule = _ref[_j];
            if (rule.shortFlag === arg || rule.longFlag === arg) {
              value = true;
              if (rule.hasArgument) {
                skippingArgument = true;
                value = args[i + 1];
              }
              options[rule.name] = rule.isList ? (options[rule.name] || []).concat(value) : value;
              matchedRule = true;
              break;
            }
          }
          if (isOption && !matchedRule) {
            throw new Error("unrecognized option: " + arg);
          }
        }
        if (seenNonOptionArg || !isOption) {
          options["arguments"].push(arg);
        }
      }
      return options;
    };
    OptionParser.prototype.help = function() {
      var letPart, lines, rule, spaces, _i, _len, _ref;
      lines = [];
      if (this.banner) {
        lines.unshift("" + this.banner + "\n");
      }
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        spaces = 15 - rule.longFlag.length;
        spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
        letPart = rule.shortFlag ? rule.shortFlag + ', ' : '    ';
        lines.push('  ' + letPart + rule.longFlag + spaces + rule.description);
      }
      return "\n" + (lines.join('\n')) + "\n";
    };
    return OptionParser;
  })();
  LONG_FLAG = /^(--\w[\w\-]*)/;
  SHORT_FLAG = /^(-\w)$/;
  MULTI_FLAG = /^-(\w{2,})/;
  OPTIONAL = /\[(\w+(\*?))\]/;
  buildRules = function(rules) {
    var tuple, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      tuple = rules[_i];
      if (tuple.length < 3) {
        tuple.unshift(null);
      }
      _results.push(buildRule.apply(null, tuple));
    }
    return _results;
  };
  buildRule = function(shortFlag, longFlag, description, options) {
    var match;
    if (options == null) {
      options = {};
    }
    match = longFlag.match(OPTIONAL);
    longFlag = longFlag.match(LONG_FLAG)[1];
    return {
      name: longFlag.substr(2),
      shortFlag: shortFlag,
      longFlag: longFlag,
      description: description,
      hasArgument: !!(match && match[1]),
      isList: !!(match && match[2])
    };
  };
  normalizeArguments = function(args) {
    var arg, l, match, result, _i, _j, _len, _len1, _ref;
    args = args.slice(0);
    result = [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (match = arg.match(MULTI_FLAG)) {
        _ref = match[1].split('');
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          l = _ref[_j];
          result.push('-' + l);
        }
      } else {
        result.push(arg);
      }
    }
    return result;
  };
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'parser',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Block":5,"TERMINATOR":6,"Line":7,"Expression":8,"Statement":9,"Return":10,"Comment":11,"STATEMENT":12,"Value":13,"Invocation":14,"Code":15,"Operation":16,"Assign":17,"If":18,"Try":19,"While":20,"For":21,"Switch":22,"Class":23,"Throw":24,"INDENT":25,"OUTDENT":26,"Identifier":27,"IDENTIFIER":28,"AlphaNumeric":29,"NUMBER":30,"STRING":31,"Literal":32,"JS":33,"REGEX":34,"DEBUGGER":35,"UNDEFINED":36,"NULL":37,"BOOL":38,"Assignable":39,"=":40,"AssignObj":41,"ObjAssignable":42,":":43,"ThisProperty":44,"RETURN":45,"HERECOMMENT":46,"PARAM_START":47,"ParamList":48,"PARAM_END":49,"FuncGlyph":50,"->":51,"=>":52,"OptComma":53,",":54,"Param":55,"ParamVar":56,"...":57,"Array":58,"Object":59,"Splat":60,"SimpleAssignable":61,"Accessor":62,"Parenthetical":63,"Range":64,"This":65,".":66,"?.":67,"::":68,"Index":69,"INDEX_START":70,"IndexValue":71,"INDEX_END":72,"INDEX_SOAK":73,"Slice":74,"{":75,"AssignList":76,"}":77,"CLASS":78,"EXTENDS":79,"OptFuncExist":80,"Arguments":81,"SUPER":82,"FUNC_EXIST":83,"CALL_START":84,"CALL_END":85,"ArgList":86,"THIS":87,"@":88,"[":89,"]":90,"RangeDots":91,"..":92,"Arg":93,"SimpleArgs":94,"TRY":95,"Catch":96,"FINALLY":97,"CATCH":98,"THROW":99,"(":100,")":101,"WhileSource":102,"WHILE":103,"WHEN":104,"UNTIL":105,"Loop":106,"LOOP":107,"ForBody":108,"FOR":109,"ForStart":110,"ForSource":111,"ForVariables":112,"OWN":113,"ForValue":114,"FORIN":115,"FOROF":116,"BY":117,"SWITCH":118,"Whens":119,"ELSE":120,"When":121,"LEADING_WHEN":122,"IfBlock":123,"IF":124,"POST_IF":125,"UNARY":126,"-":127,"+":128,"--":129,"++":130,"?":131,"MATH":132,"SHIFT":133,"COMPARE":134,"LOGIC":135,"RELATION":136,"COMPOUND_ASSIGN":137,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",12:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"DEBUGGER",36:"UNDEFINED",37:"NULL",38:"BOOL",40:"=",43:":",45:"RETURN",46:"HERECOMMENT",47:"PARAM_START",49:"PARAM_END",51:"->",52:"=>",54:",",57:"...",66:".",67:"?.",68:"::",70:"INDEX_START",72:"INDEX_END",73:"INDEX_SOAK",75:"{",77:"}",78:"CLASS",79:"EXTENDS",82:"SUPER",83:"FUNC_EXIST",84:"CALL_START",85:"CALL_END",87:"THIS",88:"@",89:"[",90:"]",92:"..",95:"TRY",97:"FINALLY",98:"CATCH",99:"THROW",100:"(",101:")",103:"WHILE",104:"WHEN",105:"UNTIL",107:"LOOP",109:"FOR",113:"OWN",115:"FORIN",116:"FOROF",117:"BY",118:"SWITCH",120:"ELSE",122:"LEADING_WHEN",124:"IF",125:"POST_IF",126:"UNARY",127:"-",128:"+",129:"--",130:"++",131:"?",132:"MATH",133:"SHIFT",134:"COMPARE",135:"LOGIC",136:"RELATION",137:"COMPOUND_ASSIGN"},
productions_: [0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[17,3],[17,4],[17,5],[41,1],[41,3],[41,5],[41,1],[42,1],[42,1],[42,1],[10,2],[10,1],[11,1],[15,5],[15,2],[50,1],[50,1],[53,0],[53,1],[48,0],[48,1],[48,3],[48,4],[48,6],[55,1],[55,2],[55,3],[56,1],[56,1],[56,1],[56,1],[60,2],[61,1],[61,2],[61,2],[61,1],[39,1],[39,1],[39,1],[13,1],[13,1],[13,1],[13,1],[13,1],[62,2],[62,2],[62,2],[62,1],[62,1],[69,3],[69,2],[71,1],[71,1],[59,4],[76,0],[76,1],[76,3],[76,4],[76,6],[23,1],[23,2],[23,3],[23,4],[23,2],[23,3],[23,4],[23,5],[14,3],[14,3],[14,1],[14,2],[80,0],[80,1],[81,2],[81,4],[65,1],[65,1],[44,2],[58,2],[58,4],[91,1],[91,1],[64,5],[74,3],[74,2],[74,2],[74,1],[86,1],[86,3],[86,4],[86,4],[86,6],[93,1],[93,1],[94,1],[94,3],[19,2],[19,3],[19,4],[19,5],[96,3],[24,2],[63,3],[63,5],[102,2],[102,4],[102,2],[102,4],[20,2],[20,2],[20,2],[20,1],[106,2],[106,2],[21,2],[21,2],[21,2],[108,2],[108,2],[110,2],[110,3],[114,1],[114,1],[114,1],[114,1],[112,1],[112,3],[111,2],[111,2],[111,4],[111,4],[111,4],[111,6],[111,6],[22,5],[22,7],[22,4],[22,6],[119,1],[119,2],[121,3],[121,4],[123,3],[123,5],[18,1],[18,3],[18,3],[18,3],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,5],[16,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {
var $0 = $$.length - 1;
switch (yystate) {
case 1:return this.$ = new yy.Block;
break;
case 2:return this.$ = $$[$0];
break;
case 3:return this.$ = $$[$0-1];
break;
case 4:this.$ = yy.Block.wrap([$$[$0]]);
break;
case 5:this.$ = $$[$0-2].push($$[$0]);
break;
case 6:this.$ = $$[$0-1];
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = $$[$0];
break;
case 9:this.$ = $$[$0];
break;
case 10:this.$ = $$[$0];
break;
case 11:this.$ = new yy.Literal($$[$0]);
break;
case 12:this.$ = $$[$0];
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:this.$ = $$[$0];
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = $$[$0];
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = $$[$0];
break;
case 22:this.$ = $$[$0];
break;
case 23:this.$ = $$[$0];
break;
case 24:this.$ = new yy.Block;
break;
case 25:this.$ = $$[$0-1];
break;
case 26:this.$ = new yy.Literal($$[$0]);
break;
case 27:this.$ = new yy.Literal($$[$0]);
break;
case 28:this.$ = new yy.Literal($$[$0]);
break;
case 29:this.$ = $$[$0];
break;
case 30:this.$ = new yy.Literal($$[$0]);
break;
case 31:this.$ = new yy.Literal($$[$0]);
break;
case 32:this.$ = new yy.Literal($$[$0]);
break;
case 33:this.$ = new yy.Undefined;
break;
case 34:this.$ = new yy.Null;
break;
case 35:this.$ = new yy.Bool($$[$0]);
break;
case 36:this.$ = new yy.Assign($$[$0-2], $$[$0]);
break;
case 37:this.$ = new yy.Assign($$[$0-3], $$[$0]);
break;
case 38:this.$ = new yy.Assign($$[$0-4], $$[$0-1]);
break;
case 39:this.$ = new yy.Value($$[$0]);
break;
case 40:this.$ = new yy.Assign(new yy.Value($$[$0-2]), $$[$0], 'object');
break;
case 41:this.$ = new yy.Assign(new yy.Value($$[$0-4]), $$[$0-1], 'object');
break;
case 42:this.$ = $$[$0];
break;
case 43:this.$ = $$[$0];
break;
case 44:this.$ = $$[$0];
break;
case 45:this.$ = $$[$0];
break;
case 46:this.$ = new yy.Return($$[$0]);
break;
case 47:this.$ = new yy.Return;
break;
case 48:this.$ = new yy.Comment($$[$0]);
break;
case 49:this.$ = new yy.Code($$[$0-3], $$[$0], $$[$0-1]);
break;
case 50:this.$ = new yy.Code([], $$[$0], $$[$0-1]);
break;
case 51:this.$ = 'func';
break;
case 52:this.$ = 'boundfunc';
break;
case 53:this.$ = $$[$0];
break;
case 54:this.$ = $$[$0];
break;
case 55:this.$ = [];
break;
case 56:this.$ = [$$[$0]];
break;
case 57:this.$ = $$[$0-2].concat($$[$0]);
break;
case 58:this.$ = $$[$0-3].concat($$[$0]);
break;
case 59:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 60:this.$ = new yy.Param($$[$0]);
break;
case 61:this.$ = new yy.Param($$[$0-1], null, true);
break;
case 62:this.$ = new yy.Param($$[$0-2], $$[$0]);
break;
case 63:this.$ = $$[$0];
break;
case 64:this.$ = $$[$0];
break;
case 65:this.$ = $$[$0];
break;
case 66:this.$ = $$[$0];
break;
case 67:this.$ = new yy.Splat($$[$0-1]);
break;
case 68:this.$ = new yy.Value($$[$0]);
break;
case 69:this.$ = $$[$0-1].add($$[$0]);
break;
case 70:this.$ = new yy.Value($$[$0-1], [].concat($$[$0]));
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = $$[$0];
break;
case 73:this.$ = new yy.Value($$[$0]);
break;
case 74:this.$ = new yy.Value($$[$0]);
break;
case 75:this.$ = $$[$0];
break;
case 76:this.$ = new yy.Value($$[$0]);
break;
case 77:this.$ = new yy.Value($$[$0]);
break;
case 78:this.$ = new yy.Value($$[$0]);
break;
case 79:this.$ = $$[$0];
break;
case 80:this.$ = new yy.Access($$[$0]);
break;
case 81:this.$ = new yy.Access($$[$0], 'soak');
break;
case 82:this.$ = [new yy.Access(new yy.Literal('prototype')), new yy.Access($$[$0])];
break;
case 83:this.$ = new yy.Access(new yy.Literal('prototype'));
break;
case 84:this.$ = $$[$0];
break;
case 85:this.$ = $$[$0-1];
break;
case 86:this.$ = yy.extend($$[$0], {
          soak: true
        });
break;
case 87:this.$ = new yy.Index($$[$0]);
break;
case 88:this.$ = new yy.Slice($$[$0]);
break;
case 89:this.$ = new yy.Obj($$[$0-2], $$[$0-3].generated);
break;
case 90:this.$ = [];
break;
case 91:this.$ = [$$[$0]];
break;
case 92:this.$ = $$[$0-2].concat($$[$0]);
break;
case 93:this.$ = $$[$0-3].concat($$[$0]);
break;
case 94:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 95:this.$ = new yy.Class;
break;
case 96:this.$ = new yy.Class(null, null, $$[$0]);
break;
case 97:this.$ = new yy.Class(null, $$[$0]);
break;
case 98:this.$ = new yy.Class(null, $$[$0-1], $$[$0]);
break;
case 99:this.$ = new yy.Class($$[$0]);
break;
case 100:this.$ = new yy.Class($$[$0-1], null, $$[$0]);
break;
case 101:this.$ = new yy.Class($$[$0-2], $$[$0]);
break;
case 102:this.$ = new yy.Class($$[$0-3], $$[$0-1], $$[$0]);
break;
case 103:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 104:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 105:this.$ = new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]);
break;
case 106:this.$ = new yy.Call('super', $$[$0]);
break;
case 107:this.$ = false;
break;
case 108:this.$ = true;
break;
case 109:this.$ = [];
break;
case 110:this.$ = $$[$0-2];
break;
case 111:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 112:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 113:this.$ = new yy.Value(new yy.Literal('this'), [new yy.Access($$[$0])], 'this');
break;
case 114:this.$ = new yy.Arr([]);
break;
case 115:this.$ = new yy.Arr($$[$0-2]);
break;
case 116:this.$ = 'inclusive';
break;
case 117:this.$ = 'exclusive';
break;
case 118:this.$ = new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]);
break;
case 119:this.$ = new yy.Range($$[$0-2], $$[$0], $$[$0-1]);
break;
case 120:this.$ = new yy.Range($$[$0-1], null, $$[$0]);
break;
case 121:this.$ = new yy.Range(null, $$[$0], $$[$0-1]);
break;
case 122:this.$ = new yy.Range(null, null, $$[$0]);
break;
case 123:this.$ = [$$[$0]];
break;
case 124:this.$ = $$[$0-2].concat($$[$0]);
break;
case 125:this.$ = $$[$0-3].concat($$[$0]);
break;
case 126:this.$ = $$[$0-2];
break;
case 127:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 128:this.$ = $$[$0];
break;
case 129:this.$ = $$[$0];
break;
case 130:this.$ = $$[$0];
break;
case 131:this.$ = [].concat($$[$0-2], $$[$0]);
break;
case 132:this.$ = new yy.Try($$[$0]);
break;
case 133:this.$ = new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]);
break;
case 134:this.$ = new yy.Try($$[$0-2], null, null, $$[$0]);
break;
case 135:this.$ = new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]);
break;
case 136:this.$ = [$$[$0-1], $$[$0]];
break;
case 137:this.$ = new yy.Throw($$[$0]);
break;
case 138:this.$ = new yy.Parens($$[$0-1]);
break;
case 139:this.$ = new yy.Parens($$[$0-2]);
break;
case 140:this.$ = new yy.While($$[$0]);
break;
case 141:this.$ = new yy.While($$[$0-2], {
          guard: $$[$0]
        });
break;
case 142:this.$ = new yy.While($$[$0], {
          invert: true
        });
break;
case 143:this.$ = new yy.While($$[$0-2], {
          invert: true,
          guard: $$[$0]
        });
break;
case 144:this.$ = $$[$0-1].addBody($$[$0]);
break;
case 145:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 146:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 147:this.$ = $$[$0];
break;
case 148:this.$ = new yy.While(new yy.Literal('true')).addBody($$[$0]);
break;
case 149:this.$ = new yy.While(new yy.Literal('true')).addBody(yy.Block.wrap([$$[$0]]));
break;
case 150:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 151:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 152:this.$ = new yy.For($$[$0], $$[$0-1]);
break;
case 153:this.$ = {
          source: new yy.Value($$[$0])
        };
break;
case 154:this.$ = (function () {
        $$[$0].own = $$[$0-1].own;
        $$[$0].name = $$[$0-1][0];
        $$[$0].index = $$[$0-1][1];
        return $$[$0];
      }());
break;
case 155:this.$ = $$[$0];
break;
case 156:this.$ = (function () {
        $$[$0].own = true;
        return $$[$0];
      }());
break;
case 157:this.$ = $$[$0];
break;
case 158:this.$ = $$[$0];
break;
case 159:this.$ = new yy.Value($$[$0]);
break;
case 160:this.$ = new yy.Value($$[$0]);
break;
case 161:this.$ = [$$[$0]];
break;
case 162:this.$ = [$$[$0-2], $$[$0]];
break;
case 163:this.$ = {
          source: $$[$0]
        };
break;
case 164:this.$ = {
          source: $$[$0],
          object: true
        };
break;
case 165:this.$ = {
          source: $$[$0-2],
          guard: $$[$0]
        };
break;
case 166:this.$ = {
          source: $$[$0-2],
          guard: $$[$0],
          object: true
        };
break;
case 167:this.$ = {
          source: $$[$0-2],
          step: $$[$0]
        };
break;
case 168:this.$ = {
          source: $$[$0-4],
          guard: $$[$0-2],
          step: $$[$0]
        };
break;
case 169:this.$ = {
          source: $$[$0-4],
          step: $$[$0-2],
          guard: $$[$0]
        };
break;
case 170:this.$ = new yy.Switch($$[$0-3], $$[$0-1]);
break;
case 171:this.$ = new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]);
break;
case 172:this.$ = new yy.Switch(null, $$[$0-1]);
break;
case 173:this.$ = new yy.Switch(null, $$[$0-3], $$[$0-1]);
break;
case 174:this.$ = $$[$0];
break;
case 175:this.$ = $$[$0-1].concat($$[$0]);
break;
case 176:this.$ = [[$$[$0-1], $$[$0]]];
break;
case 177:this.$ = [[$$[$0-2], $$[$0-1]]];
break;
case 178:this.$ = new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        });
break;
case 179:this.$ = $$[$0-4].addElse(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }));
break;
case 180:this.$ = $$[$0];
break;
case 181:this.$ = $$[$0-2].addElse($$[$0]);
break;
case 182:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 183:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 184:this.$ = new yy.Op($$[$0-1], $$[$0]);
break;
case 185:this.$ = new yy.Op('-', $$[$0]);
break;
case 186:this.$ = new yy.Op('+', $$[$0]);
break;
case 187:this.$ = new yy.Op('--', $$[$0]);
break;
case 188:this.$ = new yy.Op('++', $$[$0]);
break;
case 189:this.$ = new yy.Op('--', $$[$0-1], null, true);
break;
case 190:this.$ = new yy.Op('++', $$[$0-1], null, true);
break;
case 191:this.$ = new yy.Existence($$[$0-1]);
break;
case 192:this.$ = new yy.Op('+', $$[$0-2], $$[$0]);
break;
case 193:this.$ = new yy.Op('-', $$[$0-2], $$[$0]);
break;
case 194:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 195:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 196:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 197:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 198:this.$ = (function () {
        if ($$[$0-1].charAt(0) === '!') {
          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
        } else {
          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
        }
      }());
break;
case 199:this.$ = new yy.Assign($$[$0-2], $$[$0], $$[$0-1]);
break;
case 200:this.$ = new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]);
break;
case 201:this.$ = new yy.Extends($$[$0-2], $$[$0]);
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,5],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[3]},{1:[2,2],6:[1,74]},{6:[1,75]},{1:[2,4],6:[2,4],26:[2,4],101:[2,4]},{4:77,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[1,76],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,7],6:[2,7],26:[2,7],101:[2,7],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,8],6:[2,8],26:[2,8],101:[2,8],102:90,103:[1,65],105:[1,66],108:91,109:[1,68],110:69,125:[1,89]},{1:[2,12],6:[2,12],25:[2,12],26:[2,12],49:[2,12],54:[2,12],57:[2,12],62:93,66:[1,95],67:[1,96],68:[1,97],69:98,70:[1,99],72:[2,12],73:[1,100],77:[2,12],80:92,83:[1,94],84:[2,107],85:[2,12],90:[2,12],92:[2,12],101:[2,12],103:[2,12],104:[2,12],105:[2,12],109:[2,12],117:[2,12],125:[2,12],127:[2,12],128:[2,12],131:[2,12],132:[2,12],133:[2,12],134:[2,12],135:[2,12],136:[2,12]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],49:[2,13],54:[2,13],57:[2,13],62:102,66:[1,95],67:[1,96],68:[1,97],69:98,70:[1,99],72:[2,13],73:[1,100],77:[2,13],80:101,83:[1,94],84:[2,107],85:[2,13],90:[2,13],92:[2,13],101:[2,13],103:[2,13],104:[2,13],105:[2,13],109:[2,13],117:[2,13],125:[2,13],127:[2,13],128:[2,13],131:[2,13],132:[2,13],133:[2,13],134:[2,13],135:[2,13],136:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],49:[2,14],54:[2,14],57:[2,14],72:[2,14],77:[2,14],85:[2,14],90:[2,14],92:[2,14],101:[2,14],103:[2,14],104:[2,14],105:[2,14],109:[2,14],117:[2,14],125:[2,14],127:[2,14],128:[2,14],131:[2,14],132:[2,14],133:[2,14],134:[2,14],135:[2,14],136:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],49:[2,15],54:[2,15],57:[2,15],72:[2,15],77:[2,15],85:[2,15],90:[2,15],92:[2,15],101:[2,15],103:[2,15],104:[2,15],105:[2,15],109:[2,15],117:[2,15],125:[2,15],127:[2,15],128:[2,15],131:[2,15],132:[2,15],133:[2,15],134:[2,15],135:[2,15],136:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],49:[2,16],54:[2,16],57:[2,16],72:[2,16],77:[2,16],85:[2,16],90:[2,16],92:[2,16],101:[2,16],103:[2,16],104:[2,16],105:[2,16],109:[2,16],117:[2,16],125:[2,16],127:[2,16],128:[2,16],131:[2,16],132:[2,16],133:[2,16],134:[2,16],135:[2,16],136:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],49:[2,17],54:[2,17],57:[2,17],72:[2,17],77:[2,17],85:[2,17],90:[2,17],92:[2,17],101:[2,17],103:[2,17],104:[2,17],105:[2,17],109:[2,17],117:[2,17],125:[2,17],127:[2,17],128:[2,17],131:[2,17],132:[2,17],133:[2,17],134:[2,17],135:[2,17],136:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],49:[2,18],54:[2,18],57:[2,18],72:[2,18],77:[2,18],85:[2,18],90:[2,18],92:[2,18],101:[2,18],103:[2,18],104:[2,18],105:[2,18],109:[2,18],117:[2,18],125:[2,18],127:[2,18],128:[2,18],131:[2,18],132:[2,18],133:[2,18],134:[2,18],135:[2,18],136:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],49:[2,19],54:[2,19],57:[2,19],72:[2,19],77:[2,19],85:[2,19],90:[2,19],92:[2,19],101:[2,19],103:[2,19],104:[2,19],105:[2,19],109:[2,19],117:[2,19],125:[2,19],127:[2,19],128:[2,19],131:[2,19],132:[2,19],133:[2,19],134:[2,19],135:[2,19],136:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],49:[2,20],54:[2,20],57:[2,20],72:[2,20],77:[2,20],85:[2,20],90:[2,20],92:[2,20],101:[2,20],103:[2,20],104:[2,20],105:[2,20],109:[2,20],117:[2,20],125:[2,20],127:[2,20],128:[2,20],131:[2,20],132:[2,20],133:[2,20],134:[2,20],135:[2,20],136:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],49:[2,21],54:[2,21],57:[2,21],72:[2,21],77:[2,21],85:[2,21],90:[2,21],92:[2,21],101:[2,21],103:[2,21],104:[2,21],105:[2,21],109:[2,21],117:[2,21],125:[2,21],127:[2,21],128:[2,21],131:[2,21],132:[2,21],133:[2,21],134:[2,21],135:[2,21],136:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],49:[2,22],54:[2,22],57:[2,22],72:[2,22],77:[2,22],85:[2,22],90:[2,22],92:[2,22],101:[2,22],103:[2,22],104:[2,22],105:[2,22],109:[2,22],117:[2,22],125:[2,22],127:[2,22],128:[2,22],131:[2,22],132:[2,22],133:[2,22],134:[2,22],135:[2,22],136:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],49:[2,23],54:[2,23],57:[2,23],72:[2,23],77:[2,23],85:[2,23],90:[2,23],92:[2,23],101:[2,23],103:[2,23],104:[2,23],105:[2,23],109:[2,23],117:[2,23],125:[2,23],127:[2,23],128:[2,23],131:[2,23],132:[2,23],133:[2,23],134:[2,23],135:[2,23],136:[2,23]},{1:[2,9],6:[2,9],26:[2,9],101:[2,9],103:[2,9],105:[2,9],109:[2,9],125:[2,9]},{1:[2,10],6:[2,10],26:[2,10],101:[2,10],103:[2,10],105:[2,10],109:[2,10],125:[2,10]},{1:[2,11],6:[2,11],26:[2,11],101:[2,11],103:[2,11],105:[2,11],109:[2,11],125:[2,11]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],40:[1,103],49:[2,75],54:[2,75],57:[2,75],66:[2,75],67:[2,75],68:[2,75],70:[2,75],72:[2,75],73:[2,75],77:[2,75],83:[2,75],84:[2,75],85:[2,75],90:[2,75],92:[2,75],101:[2,75],103:[2,75],104:[2,75],105:[2,75],109:[2,75],117:[2,75],125:[2,75],127:[2,75],128:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75],135:[2,75],136:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],49:[2,76],54:[2,76],57:[2,76],66:[2,76],67:[2,76],68:[2,76],70:[2,76],72:[2,76],73:[2,76],77:[2,76],83:[2,76],84:[2,76],85:[2,76],90:[2,76],92:[2,76],101:[2,76],103:[2,76],104:[2,76],105:[2,76],109:[2,76],117:[2,76],125:[2,76],127:[2,76],128:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76],135:[2,76],136:[2,76]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],49:[2,77],54:[2,77],57:[2,77],66:[2,77],67:[2,77],68:[2,77],70:[2,77],72:[2,77],73:[2,77],77:[2,77],83:[2,77],84:[2,77],85:[2,77],90:[2,77],92:[2,77],101:[2,77],103:[2,77],104:[2,77],105:[2,77],109:[2,77],117:[2,77],125:[2,77],127:[2,77],128:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77],135:[2,77],136:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],49:[2,78],54:[2,78],57:[2,78],66:[2,78],67:[2,78],68:[2,78],70:[2,78],72:[2,78],73:[2,78],77:[2,78],83:[2,78],84:[2,78],85:[2,78],90:[2,78],92:[2,78],101:[2,78],103:[2,78],104:[2,78],105:[2,78],109:[2,78],117:[2,78],125:[2,78],127:[2,78],128:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78],135:[2,78],136:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],49:[2,79],54:[2,79],57:[2,79],66:[2,79],67:[2,79],68:[2,79],70:[2,79],72:[2,79],73:[2,79],77:[2,79],83:[2,79],84:[2,79],85:[2,79],90:[2,79],92:[2,79],101:[2,79],103:[2,79],104:[2,79],105:[2,79],109:[2,79],117:[2,79],125:[2,79],127:[2,79],128:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79],135:[2,79],136:[2,79]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],49:[2,105],54:[2,105],57:[2,105],66:[2,105],67:[2,105],68:[2,105],70:[2,105],72:[2,105],73:[2,105],77:[2,105],81:104,83:[2,105],84:[1,105],85:[2,105],90:[2,105],92:[2,105],101:[2,105],103:[2,105],104:[2,105],105:[2,105],109:[2,105],117:[2,105],125:[2,105],127:[2,105],128:[2,105],131:[2,105],132:[2,105],133:[2,105],134:[2,105],135:[2,105],136:[2,105]},{6:[2,55],25:[2,55],27:109,28:[1,73],44:110,48:106,49:[2,55],54:[2,55],55:107,56:108,58:111,59:112,75:[1,70],88:[1,113],89:[1,114]},{5:115,25:[1,5]},{8:116,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:118,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:119,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{13:121,14:122,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:123,44:63,58:47,59:48,61:120,63:25,64:26,65:27,75:[1,70],82:[1,28],87:[1,58],88:[1,59],89:[1,57],100:[1,56]},{13:121,14:122,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:123,44:63,58:47,59:48,61:124,63:25,64:26,65:27,75:[1,70],82:[1,28],87:[1,58],88:[1,59],89:[1,57],100:[1,56]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],40:[2,72],49:[2,72],54:[2,72],57:[2,72],66:[2,72],67:[2,72],68:[2,72],70:[2,72],72:[2,72],73:[2,72],77:[2,72],79:[1,128],83:[2,72],84:[2,72],85:[2,72],90:[2,72],92:[2,72],101:[2,72],103:[2,72],104:[2,72],105:[2,72],109:[2,72],117:[2,72],125:[2,72],127:[2,72],128:[2,72],129:[1,125],130:[1,126],131:[2,72],132:[2,72],133:[2,72],134:[2,72],135:[2,72],136:[2,72],137:[1,127]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],49:[2,180],54:[2,180],57:[2,180],72:[2,180],77:[2,180],85:[2,180],90:[2,180],92:[2,180],101:[2,180],103:[2,180],104:[2,180],105:[2,180],109:[2,180],117:[2,180],120:[1,129],125:[2,180],127:[2,180],128:[2,180],131:[2,180],132:[2,180],133:[2,180],134:[2,180],135:[2,180],136:[2,180]},{5:130,25:[1,5]},{5:131,25:[1,5]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],49:[2,147],54:[2,147],57:[2,147],72:[2,147],77:[2,147],85:[2,147],90:[2,147],92:[2,147],101:[2,147],103:[2,147],104:[2,147],105:[2,147],109:[2,147],117:[2,147],125:[2,147],127:[2,147],128:[2,147],131:[2,147],132:[2,147],133:[2,147],134:[2,147],135:[2,147],136:[2,147]},{5:132,25:[1,5]},{8:133,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,134],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,95],5:135,6:[2,95],13:121,14:122,25:[1,5],26:[2,95],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:123,44:63,49:[2,95],54:[2,95],57:[2,95],58:47,59:48,61:137,63:25,64:26,65:27,72:[2,95],75:[1,70],77:[2,95],79:[1,136],82:[1,28],85:[2,95],87:[1,58],88:[1,59],89:[1,57],90:[2,95],92:[2,95],100:[1,56],101:[2,95],103:[2,95],104:[2,95],105:[2,95],109:[2,95],117:[2,95],125:[2,95],127:[2,95],128:[2,95],131:[2,95],132:[2,95],133:[2,95],134:[2,95],135:[2,95],136:[2,95]},{8:138,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,47],6:[2,47],8:139,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[2,47],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],101:[2,47],102:39,103:[2,47],105:[2,47],106:40,107:[1,67],108:41,109:[2,47],110:69,118:[1,42],123:37,124:[1,64],125:[2,47],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,48],6:[2,48],25:[2,48],26:[2,48],54:[2,48],77:[2,48],101:[2,48],103:[2,48],105:[2,48],109:[2,48],125:[2,48]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],40:[2,73],49:[2,73],54:[2,73],57:[2,73],66:[2,73],67:[2,73],68:[2,73],70:[2,73],72:[2,73],73:[2,73],77:[2,73],83:[2,73],84:[2,73],85:[2,73],90:[2,73],92:[2,73],101:[2,73],103:[2,73],104:[2,73],105:[2,73],109:[2,73],117:[2,73],125:[2,73],127:[2,73],128:[2,73],131:[2,73],132:[2,73],133:[2,73],134:[2,73],135:[2,73],136:[2,73]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],40:[2,74],49:[2,74],54:[2,74],57:[2,74],66:[2,74],67:[2,74],68:[2,74],70:[2,74],72:[2,74],73:[2,74],77:[2,74],83:[2,74],84:[2,74],85:[2,74],90:[2,74],92:[2,74],101:[2,74],103:[2,74],104:[2,74],105:[2,74],109:[2,74],117:[2,74],125:[2,74],127:[2,74],128:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74],135:[2,74],136:[2,74]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],49:[2,29],54:[2,29],57:[2,29],66:[2,29],67:[2,29],68:[2,29],70:[2,29],72:[2,29],73:[2,29],77:[2,29],83:[2,29],84:[2,29],85:[2,29],90:[2,29],92:[2,29],101:[2,29],103:[2,29],104:[2,29],105:[2,29],109:[2,29],117:[2,29],125:[2,29],127:[2,29],128:[2,29],131:[2,29],132:[2,29],133:[2,29],134:[2,29],135:[2,29],136:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],49:[2,30],54:[2,30],57:[2,30],66:[2,30],67:[2,30],68:[2,30],70:[2,30],72:[2,30],73:[2,30],77:[2,30],83:[2,30],84:[2,30],85:[2,30],90:[2,30],92:[2,30],101:[2,30],103:[2,30],104:[2,30],105:[2,30],109:[2,30],117:[2,30],125:[2,30],127:[2,30],128:[2,30],131:[2,30],132:[2,30],133:[2,30],134:[2,30],135:[2,30],136:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],49:[2,31],54:[2,31],57:[2,31],66:[2,31],67:[2,31],68:[2,31],70:[2,31],72:[2,31],73:[2,31],77:[2,31],83:[2,31],84:[2,31],85:[2,31],90:[2,31],92:[2,31],101:[2,31],103:[2,31],104:[2,31],105:[2,31],109:[2,31],117:[2,31],125:[2,31],127:[2,31],128:[2,31],131:[2,31],132:[2,31],133:[2,31],134:[2,31],135:[2,31],136:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],49:[2,32],54:[2,32],57:[2,32],66:[2,32],67:[2,32],68:[2,32],70:[2,32],72:[2,32],73:[2,32],77:[2,32],83:[2,32],84:[2,32],85:[2,32],90:[2,32],92:[2,32],101:[2,32],103:[2,32],104:[2,32],105:[2,32],109:[2,32],117:[2,32],125:[2,32],127:[2,32],128:[2,32],131:[2,32],132:[2,32],133:[2,32],134:[2,32],135:[2,32],136:[2,32]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],49:[2,33],54:[2,33],57:[2,33],66:[2,33],67:[2,33],68:[2,33],70:[2,33],72:[2,33],73:[2,33],77:[2,33],83:[2,33],84:[2,33],85:[2,33],90:[2,33],92:[2,33],101:[2,33],103:[2,33],104:[2,33],105:[2,33],109:[2,33],117:[2,33],125:[2,33],127:[2,33],128:[2,33],131:[2,33],132:[2,33],133:[2,33],134:[2,33],135:[2,33],136:[2,33]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],49:[2,34],54:[2,34],57:[2,34],66:[2,34],67:[2,34],68:[2,34],70:[2,34],72:[2,34],73:[2,34],77:[2,34],83:[2,34],84:[2,34],85:[2,34],90:[2,34],92:[2,34],101:[2,34],103:[2,34],104:[2,34],105:[2,34],109:[2,34],117:[2,34],125:[2,34],127:[2,34],128:[2,34],131:[2,34],132:[2,34],133:[2,34],134:[2,34],135:[2,34],136:[2,34]},{1:[2,35],6:[2,35],25:[2,35],26:[2,35],49:[2,35],54:[2,35],57:[2,35],66:[2,35],67:[2,35],68:[2,35],70:[2,35],72:[2,35],73:[2,35],77:[2,35],83:[2,35],84:[2,35],85:[2,35],90:[2,35],92:[2,35],101:[2,35],103:[2,35],104:[2,35],105:[2,35],109:[2,35],117:[2,35],125:[2,35],127:[2,35],128:[2,35],131:[2,35],132:[2,35],133:[2,35],134:[2,35],135:[2,35],136:[2,35]},{4:140,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,141],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:142,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,146],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],86:144,87:[1,58],88:[1,59],89:[1,57],90:[1,143],93:145,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,111],6:[2,111],25:[2,111],26:[2,111],49:[2,111],54:[2,111],57:[2,111],66:[2,111],67:[2,111],68:[2,111],70:[2,111],72:[2,111],73:[2,111],77:[2,111],83:[2,111],84:[2,111],85:[2,111],90:[2,111],92:[2,111],101:[2,111],103:[2,111],104:[2,111],105:[2,111],109:[2,111],117:[2,111],125:[2,111],127:[2,111],128:[2,111],131:[2,111],132:[2,111],133:[2,111],134:[2,111],135:[2,111],136:[2,111]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],27:148,28:[1,73],49:[2,112],54:[2,112],57:[2,112],66:[2,112],67:[2,112],68:[2,112],70:[2,112],72:[2,112],73:[2,112],77:[2,112],83:[2,112],84:[2,112],85:[2,112],90:[2,112],92:[2,112],101:[2,112],103:[2,112],104:[2,112],105:[2,112],109:[2,112],117:[2,112],125:[2,112],127:[2,112],128:[2,112],131:[2,112],132:[2,112],133:[2,112],134:[2,112],135:[2,112],136:[2,112]},{25:[2,51]},{25:[2,52]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],40:[2,68],49:[2,68],54:[2,68],57:[2,68],66:[2,68],67:[2,68],68:[2,68],70:[2,68],72:[2,68],73:[2,68],77:[2,68],79:[2,68],83:[2,68],84:[2,68],85:[2,68],90:[2,68],92:[2,68],101:[2,68],103:[2,68],104:[2,68],105:[2,68],109:[2,68],117:[2,68],125:[2,68],127:[2,68],128:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68],135:[2,68],136:[2,68],137:[2,68]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],40:[2,71],49:[2,71],54:[2,71],57:[2,71],66:[2,71],67:[2,71],68:[2,71],70:[2,71],72:[2,71],73:[2,71],77:[2,71],79:[2,71],83:[2,71],84:[2,71],85:[2,71],90:[2,71],92:[2,71],101:[2,71],103:[2,71],104:[2,71],105:[2,71],109:[2,71],117:[2,71],125:[2,71],127:[2,71],128:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71]},{8:149,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:150,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:151,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{5:152,8:153,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,5],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{27:158,28:[1,73],44:159,58:160,59:161,64:154,75:[1,70],88:[1,113],89:[1,57],112:155,113:[1,156],114:157},{111:162,115:[1,163],116:[1,164]},{6:[2,90],11:168,25:[2,90],27:169,28:[1,73],29:170,30:[1,71],31:[1,72],41:166,42:167,44:171,46:[1,46],54:[2,90],76:165,77:[2,90],88:[1,113]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],43:[2,27],49:[2,27],54:[2,27],57:[2,27],66:[2,27],67:[2,27],68:[2,27],70:[2,27],72:[2,27],73:[2,27],77:[2,27],83:[2,27],84:[2,27],85:[2,27],90:[2,27],92:[2,27],101:[2,27],103:[2,27],104:[2,27],105:[2,27],109:[2,27],117:[2,27],125:[2,27],127:[2,27],128:[2,27],131:[2,27],132:[2,27],133:[2,27],134:[2,27],135:[2,27],136:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],43:[2,28],49:[2,28],54:[2,28],57:[2,28],66:[2,28],67:[2,28],68:[2,28],70:[2,28],72:[2,28],73:[2,28],77:[2,28],83:[2,28],84:[2,28],85:[2,28],90:[2,28],92:[2,28],101:[2,28],103:[2,28],104:[2,28],105:[2,28],109:[2,28],117:[2,28],125:[2,28],127:[2,28],128:[2,28],131:[2,28],132:[2,28],133:[2,28],134:[2,28],135:[2,28],136:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],40:[2,26],43:[2,26],49:[2,26],54:[2,26],57:[2,26],66:[2,26],67:[2,26],68:[2,26],70:[2,26],72:[2,26],73:[2,26],77:[2,26],79:[2,26],83:[2,26],84:[2,26],85:[2,26],90:[2,26],92:[2,26],101:[2,26],103:[2,26],104:[2,26],105:[2,26],109:[2,26],115:[2,26],116:[2,26],117:[2,26],125:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26],135:[2,26],136:[2,26],137:[2,26]},{1:[2,6],6:[2,6],7:172,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[2,6],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],101:[2,6],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],49:[2,24],54:[2,24],57:[2,24],72:[2,24],77:[2,24],85:[2,24],90:[2,24],92:[2,24],97:[2,24],98:[2,24],101:[2,24],103:[2,24],104:[2,24],105:[2,24],109:[2,24],117:[2,24],120:[2,24],122:[2,24],125:[2,24],127:[2,24],128:[2,24],131:[2,24],132:[2,24],133:[2,24],134:[2,24],135:[2,24],136:[2,24]},{6:[1,74],26:[1,173]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],49:[2,191],54:[2,191],57:[2,191],72:[2,191],77:[2,191],85:[2,191],90:[2,191],92:[2,191],101:[2,191],103:[2,191],104:[2,191],105:[2,191],109:[2,191],117:[2,191],125:[2,191],127:[2,191],128:[2,191],131:[2,191],132:[2,191],133:[2,191],134:[2,191],135:[2,191],136:[2,191]},{8:174,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:175,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:176,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:177,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:178,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:179,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:180,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:181,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],49:[2,146],54:[2,146],57:[2,146],72:[2,146],77:[2,146],85:[2,146],90:[2,146],92:[2,146],101:[2,146],103:[2,146],104:[2,146],105:[2,146],109:[2,146],117:[2,146],125:[2,146],127:[2,146],128:[2,146],131:[2,146],132:[2,146],133:[2,146],134:[2,146],135:[2,146],136:[2,146]},{1:[2,151],6:[2,151],25:[2,151],26:[2,151],49:[2,151],54:[2,151],57:[2,151],72:[2,151],77:[2,151],85:[2,151],90:[2,151],92:[2,151],101:[2,151],103:[2,151],104:[2,151],105:[2,151],109:[2,151],117:[2,151],125:[2,151],127:[2,151],128:[2,151],131:[2,151],132:[2,151],133:[2,151],134:[2,151],135:[2,151],136:[2,151]},{8:182,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],49:[2,145],54:[2,145],57:[2,145],72:[2,145],77:[2,145],85:[2,145],90:[2,145],92:[2,145],101:[2,145],103:[2,145],104:[2,145],105:[2,145],109:[2,145],117:[2,145],125:[2,145],127:[2,145],128:[2,145],131:[2,145],132:[2,145],133:[2,145],134:[2,145],135:[2,145],136:[2,145]},{1:[2,150],6:[2,150],25:[2,150],26:[2,150],49:[2,150],54:[2,150],57:[2,150],72:[2,150],77:[2,150],85:[2,150],90:[2,150],92:[2,150],101:[2,150],103:[2,150],104:[2,150],105:[2,150],109:[2,150],117:[2,150],125:[2,150],127:[2,150],128:[2,150],131:[2,150],132:[2,150],133:[2,150],134:[2,150],135:[2,150],136:[2,150]},{81:183,84:[1,105]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],40:[2,69],49:[2,69],54:[2,69],57:[2,69],66:[2,69],67:[2,69],68:[2,69],70:[2,69],72:[2,69],73:[2,69],77:[2,69],79:[2,69],83:[2,69],84:[2,69],85:[2,69],90:[2,69],92:[2,69],101:[2,69],103:[2,69],104:[2,69],105:[2,69],109:[2,69],117:[2,69],125:[2,69],127:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69],135:[2,69],136:[2,69],137:[2,69]},{84:[2,108]},{27:184,28:[1,73]},{27:185,28:[1,73]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],27:186,28:[1,73],40:[2,83],49:[2,83],54:[2,83],57:[2,83],66:[2,83],67:[2,83],68:[2,83],70:[2,83],72:[2,83],73:[2,83],77:[2,83],79:[2,83],83:[2,83],84:[2,83],85:[2,83],90:[2,83],92:[2,83],101:[2,83],103:[2,83],104:[2,83],105:[2,83],109:[2,83],117:[2,83],125:[2,83],127:[2,83],128:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83],134:[2,83],135:[2,83],136:[2,83],137:[2,83]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],40:[2,84],49:[2,84],54:[2,84],57:[2,84],66:[2,84],67:[2,84],68:[2,84],70:[2,84],72:[2,84],73:[2,84],77:[2,84],79:[2,84],83:[2,84],84:[2,84],85:[2,84],90:[2,84],92:[2,84],101:[2,84],103:[2,84],104:[2,84],105:[2,84],109:[2,84],117:[2,84],125:[2,84],127:[2,84],128:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84],135:[2,84],136:[2,84],137:[2,84]},{8:188,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],57:[1,192],58:47,59:48,61:36,63:25,64:26,65:27,71:187,74:189,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],91:190,92:[1,191],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{69:193,70:[1,99],73:[1,100]},{81:194,84:[1,105]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],40:[2,70],49:[2,70],54:[2,70],57:[2,70],66:[2,70],67:[2,70],68:[2,70],70:[2,70],72:[2,70],73:[2,70],77:[2,70],79:[2,70],83:[2,70],84:[2,70],85:[2,70],90:[2,70],92:[2,70],101:[2,70],103:[2,70],104:[2,70],105:[2,70],109:[2,70],117:[2,70],125:[2,70],127:[2,70],128:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70],135:[2,70],136:[2,70],137:[2,70]},{6:[1,196],8:195,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,197],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],49:[2,106],54:[2,106],57:[2,106],66:[2,106],67:[2,106],68:[2,106],70:[2,106],72:[2,106],73:[2,106],77:[2,106],83:[2,106],84:[2,106],85:[2,106],90:[2,106],92:[2,106],101:[2,106],103:[2,106],104:[2,106],105:[2,106],109:[2,106],117:[2,106],125:[2,106],127:[2,106],128:[2,106],131:[2,106],132:[2,106],133:[2,106],134:[2,106],135:[2,106],136:[2,106]},{8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,146],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],85:[1,198],86:199,87:[1,58],88:[1,59],89:[1,57],93:145,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,53],25:[2,53],49:[1,201],53:203,54:[1,202]},{6:[2,56],25:[2,56],26:[2,56],49:[2,56],54:[2,56]},{6:[2,60],25:[2,60],26:[2,60],40:[1,205],49:[2,60],54:[2,60],57:[1,204]},{6:[2,63],25:[2,63],26:[2,63],40:[2,63],49:[2,63],54:[2,63],57:[2,63]},{6:[2,64],25:[2,64],26:[2,64],40:[2,64],49:[2,64],54:[2,64],57:[2,64]},{6:[2,65],25:[2,65],26:[2,65],40:[2,65],49:[2,65],54:[2,65],57:[2,65]},{6:[2,66],25:[2,66],26:[2,66],40:[2,66],49:[2,66],54:[2,66],57:[2,66]},{27:148,28:[1,73]},{8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,146],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],86:144,87:[1,58],88:[1,59],89:[1,57],90:[1,143],93:145,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,50],6:[2,50],25:[2,50],26:[2,50],49:[2,50],54:[2,50],57:[2,50],72:[2,50],77:[2,50],85:[2,50],90:[2,50],92:[2,50],101:[2,50],103:[2,50],104:[2,50],105:[2,50],109:[2,50],117:[2,50],125:[2,50],127:[2,50],128:[2,50],131:[2,50],132:[2,50],133:[2,50],134:[2,50],135:[2,50],136:[2,50]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],49:[2,184],54:[2,184],57:[2,184],72:[2,184],77:[2,184],85:[2,184],90:[2,184],92:[2,184],101:[2,184],102:87,103:[2,184],104:[2,184],105:[2,184],108:88,109:[2,184],110:69,117:[2,184],125:[2,184],127:[2,184],128:[2,184],131:[1,78],132:[2,184],133:[2,184],134:[2,184],135:[2,184],136:[2,184]},{102:90,103:[1,65],105:[1,66],108:91,109:[1,68],110:69,125:[1,89]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],49:[2,185],54:[2,185],57:[2,185],72:[2,185],77:[2,185],85:[2,185],90:[2,185],92:[2,185],101:[2,185],102:87,103:[2,185],104:[2,185],105:[2,185],108:88,109:[2,185],110:69,117:[2,185],125:[2,185],127:[2,185],128:[2,185],131:[1,78],132:[2,185],133:[2,185],134:[2,185],135:[2,185],136:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],49:[2,186],54:[2,186],57:[2,186],72:[2,186],77:[2,186],85:[2,186],90:[2,186],92:[2,186],101:[2,186],102:87,103:[2,186],104:[2,186],105:[2,186],108:88,109:[2,186],110:69,117:[2,186],125:[2,186],127:[2,186],128:[2,186],131:[1,78],132:[2,186],133:[2,186],134:[2,186],135:[2,186],136:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],49:[2,187],54:[2,187],57:[2,187],66:[2,72],67:[2,72],68:[2,72],70:[2,72],72:[2,187],73:[2,72],77:[2,187],83:[2,72],84:[2,72],85:[2,187],90:[2,187],92:[2,187],101:[2,187],103:[2,187],104:[2,187],105:[2,187],109:[2,187],117:[2,187],125:[2,187],127:[2,187],128:[2,187],131:[2,187],132:[2,187],133:[2,187],134:[2,187],135:[2,187],136:[2,187]},{62:93,66:[1,95],67:[1,96],68:[1,97],69:98,70:[1,99],73:[1,100],80:92,83:[1,94],84:[2,107]},{62:102,66:[1,95],67:[1,96],68:[1,97],69:98,70:[1,99],73:[1,100],80:101,83:[1,94],84:[2,107]},{66:[2,75],67:[2,75],68:[2,75],70:[2,75],73:[2,75],83:[2,75],84:[2,75]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],49:[2,188],54:[2,188],57:[2,188],66:[2,72],67:[2,72],68:[2,72],70:[2,72],72:[2,188],73:[2,72],77:[2,188],83:[2,72],84:[2,72],85:[2,188],90:[2,188],92:[2,188],101:[2,188],103:[2,188],104:[2,188],105:[2,188],109:[2,188],117:[2,188],125:[2,188],127:[2,188],128:[2,188],131:[2,188],132:[2,188],133:[2,188],134:[2,188],135:[2,188],136:[2,188]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],49:[2,189],54:[2,189],57:[2,189],72:[2,189],77:[2,189],85:[2,189],90:[2,189],92:[2,189],101:[2,189],103:[2,189],104:[2,189],105:[2,189],109:[2,189],117:[2,189],125:[2,189],127:[2,189],128:[2,189],131:[2,189],132:[2,189],133:[2,189],134:[2,189],135:[2,189],136:[2,189]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],49:[2,190],54:[2,190],57:[2,190],72:[2,190],77:[2,190],85:[2,190],90:[2,190],92:[2,190],101:[2,190],103:[2,190],104:[2,190],105:[2,190],109:[2,190],117:[2,190],125:[2,190],127:[2,190],128:[2,190],131:[2,190],132:[2,190],133:[2,190],134:[2,190],135:[2,190],136:[2,190]},{8:206,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,207],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:208,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{5:209,25:[1,5],124:[1,210]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],49:[2,132],54:[2,132],57:[2,132],72:[2,132],77:[2,132],85:[2,132],90:[2,132],92:[2,132],96:211,97:[1,212],98:[1,213],101:[2,132],103:[2,132],104:[2,132],105:[2,132],109:[2,132],117:[2,132],125:[2,132],127:[2,132],128:[2,132],131:[2,132],132:[2,132],133:[2,132],134:[2,132],135:[2,132],136:[2,132]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],49:[2,144],54:[2,144],57:[2,144],72:[2,144],77:[2,144],85:[2,144],90:[2,144],92:[2,144],101:[2,144],103:[2,144],104:[2,144],105:[2,144],109:[2,144],117:[2,144],125:[2,144],127:[2,144],128:[2,144],131:[2,144],132:[2,144],133:[2,144],134:[2,144],135:[2,144],136:[2,144]},{1:[2,152],6:[2,152],25:[2,152],26:[2,152],49:[2,152],54:[2,152],57:[2,152],72:[2,152],77:[2,152],85:[2,152],90:[2,152],92:[2,152],101:[2,152],103:[2,152],104:[2,152],105:[2,152],109:[2,152],117:[2,152],125:[2,152],127:[2,152],128:[2,152],131:[2,152],132:[2,152],133:[2,152],134:[2,152],135:[2,152],136:[2,152]},{25:[1,214],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{119:215,121:216,122:[1,217]},{1:[2,96],6:[2,96],25:[2,96],26:[2,96],49:[2,96],54:[2,96],57:[2,96],72:[2,96],77:[2,96],85:[2,96],90:[2,96],92:[2,96],101:[2,96],103:[2,96],104:[2,96],105:[2,96],109:[2,96],117:[2,96],125:[2,96],127:[2,96],128:[2,96],131:[2,96],132:[2,96],133:[2,96],134:[2,96],135:[2,96],136:[2,96]},{8:218,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,99],5:219,6:[2,99],25:[1,5],26:[2,99],49:[2,99],54:[2,99],57:[2,99],66:[2,72],67:[2,72],68:[2,72],70:[2,72],72:[2,99],73:[2,72],77:[2,99],79:[1,220],83:[2,72],84:[2,72],85:[2,99],90:[2,99],92:[2,99],101:[2,99],103:[2,99],104:[2,99],105:[2,99],109:[2,99],117:[2,99],125:[2,99],127:[2,99],128:[2,99],131:[2,99],132:[2,99],133:[2,99],134:[2,99],135:[2,99],136:[2,99]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],49:[2,137],54:[2,137],57:[2,137],72:[2,137],77:[2,137],85:[2,137],90:[2,137],92:[2,137],101:[2,137],102:87,103:[2,137],104:[2,137],105:[2,137],108:88,109:[2,137],110:69,117:[2,137],125:[2,137],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,46],6:[2,46],26:[2,46],101:[2,46],102:87,103:[2,46],105:[2,46],108:88,109:[2,46],110:69,125:[2,46],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[1,74],101:[1,221]},{4:222,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,128],25:[2,128],54:[2,128],57:[1,224],90:[2,128],91:223,92:[1,191],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],40:[2,114],49:[2,114],54:[2,114],57:[2,114],66:[2,114],67:[2,114],68:[2,114],70:[2,114],72:[2,114],73:[2,114],77:[2,114],83:[2,114],84:[2,114],85:[2,114],90:[2,114],92:[2,114],101:[2,114],103:[2,114],104:[2,114],105:[2,114],109:[2,114],115:[2,114],116:[2,114],117:[2,114],125:[2,114],127:[2,114],128:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114],135:[2,114],136:[2,114]},{6:[2,53],25:[2,53],53:225,54:[1,226],90:[2,53]},{6:[2,123],25:[2,123],26:[2,123],54:[2,123],85:[2,123],90:[2,123]},{8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,146],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],86:227,87:[1,58],88:[1,59],89:[1,57],93:145,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,129],25:[2,129],26:[2,129],54:[2,129],85:[2,129],90:[2,129]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],40:[2,113],43:[2,113],49:[2,113],54:[2,113],57:[2,113],66:[2,113],67:[2,113],68:[2,113],70:[2,113],72:[2,113],73:[2,113],77:[2,113],79:[2,113],83:[2,113],84:[2,113],85:[2,113],90:[2,113],92:[2,113],101:[2,113],103:[2,113],104:[2,113],105:[2,113],109:[2,113],115:[2,113],116:[2,113],117:[2,113],125:[2,113],127:[2,113],128:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113],135:[2,113],136:[2,113],137:[2,113]},{5:228,25:[1,5],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],49:[2,140],54:[2,140],57:[2,140],72:[2,140],77:[2,140],85:[2,140],90:[2,140],92:[2,140],101:[2,140],102:87,103:[1,65],104:[1,229],105:[1,66],108:88,109:[1,68],110:69,117:[2,140],125:[2,140],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],49:[2,142],54:[2,142],57:[2,142],72:[2,142],77:[2,142],85:[2,142],90:[2,142],92:[2,142],101:[2,142],102:87,103:[1,65],104:[1,230],105:[1,66],108:88,109:[1,68],110:69,117:[2,142],125:[2,142],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],49:[2,148],54:[2,148],57:[2,148],72:[2,148],77:[2,148],85:[2,148],90:[2,148],92:[2,148],101:[2,148],103:[2,148],104:[2,148],105:[2,148],109:[2,148],117:[2,148],125:[2,148],127:[2,148],128:[2,148],131:[2,148],132:[2,148],133:[2,148],134:[2,148],135:[2,148],136:[2,148]},{1:[2,149],6:[2,149],25:[2,149],26:[2,149],49:[2,149],54:[2,149],57:[2,149],72:[2,149],77:[2,149],85:[2,149],90:[2,149],92:[2,149],101:[2,149],102:87,103:[1,65],104:[2,149],105:[1,66],108:88,109:[1,68],110:69,117:[2,149],125:[2,149],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,153],6:[2,153],25:[2,153],26:[2,153],49:[2,153],54:[2,153],57:[2,153],72:[2,153],77:[2,153],85:[2,153],90:[2,153],92:[2,153],101:[2,153],103:[2,153],104:[2,153],105:[2,153],109:[2,153],117:[2,153],125:[2,153],127:[2,153],128:[2,153],131:[2,153],132:[2,153],133:[2,153],134:[2,153],135:[2,153],136:[2,153]},{115:[2,155],116:[2,155]},{27:158,28:[1,73],44:159,58:160,59:161,75:[1,70],88:[1,113],89:[1,114],112:231,114:157},{54:[1,232],115:[2,161],116:[2,161]},{54:[2,157],115:[2,157],116:[2,157]},{54:[2,158],115:[2,158],116:[2,158]},{54:[2,159],115:[2,159],116:[2,159]},{54:[2,160],115:[2,160],116:[2,160]},{1:[2,154],6:[2,154],25:[2,154],26:[2,154],49:[2,154],54:[2,154],57:[2,154],72:[2,154],77:[2,154],85:[2,154],90:[2,154],92:[2,154],101:[2,154],103:[2,154],104:[2,154],105:[2,154],109:[2,154],117:[2,154],125:[2,154],127:[2,154],128:[2,154],131:[2,154],132:[2,154],133:[2,154],134:[2,154],135:[2,154],136:[2,154]},{8:233,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:234,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,53],25:[2,53],53:235,54:[1,236],77:[2,53]},{6:[2,91],25:[2,91],26:[2,91],54:[2,91],77:[2,91]},{6:[2,39],25:[2,39],26:[2,39],43:[1,237],54:[2,39],77:[2,39]},{6:[2,42],25:[2,42],26:[2,42],54:[2,42],77:[2,42]},{6:[2,43],25:[2,43],26:[2,43],43:[2,43],54:[2,43],77:[2,43]},{6:[2,44],25:[2,44],26:[2,44],43:[2,44],54:[2,44],77:[2,44]},{6:[2,45],25:[2,45],26:[2,45],43:[2,45],54:[2,45],77:[2,45]},{1:[2,5],6:[2,5],26:[2,5],101:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],49:[2,25],54:[2,25],57:[2,25],72:[2,25],77:[2,25],85:[2,25],90:[2,25],92:[2,25],97:[2,25],98:[2,25],101:[2,25],103:[2,25],104:[2,25],105:[2,25],109:[2,25],117:[2,25],120:[2,25],122:[2,25],125:[2,25],127:[2,25],128:[2,25],131:[2,25],132:[2,25],133:[2,25],134:[2,25],135:[2,25],136:[2,25]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],49:[2,192],54:[2,192],57:[2,192],72:[2,192],77:[2,192],85:[2,192],90:[2,192],92:[2,192],101:[2,192],102:87,103:[2,192],104:[2,192],105:[2,192],108:88,109:[2,192],110:69,117:[2,192],125:[2,192],127:[2,192],128:[2,192],131:[1,78],132:[1,81],133:[2,192],134:[2,192],135:[2,192],136:[2,192]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],49:[2,193],54:[2,193],57:[2,193],72:[2,193],77:[2,193],85:[2,193],90:[2,193],92:[2,193],101:[2,193],102:87,103:[2,193],104:[2,193],105:[2,193],108:88,109:[2,193],110:69,117:[2,193],125:[2,193],127:[2,193],128:[2,193],131:[1,78],132:[1,81],133:[2,193],134:[2,193],135:[2,193],136:[2,193]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],49:[2,194],54:[2,194],57:[2,194],72:[2,194],77:[2,194],85:[2,194],90:[2,194],92:[2,194],101:[2,194],102:87,103:[2,194],104:[2,194],105:[2,194],108:88,109:[2,194],110:69,117:[2,194],125:[2,194],127:[2,194],128:[2,194],131:[1,78],132:[2,194],133:[2,194],134:[2,194],135:[2,194],136:[2,194]},{1:[2,195],6:[2,195],25:[2,195],26:[2,195],49:[2,195],54:[2,195],57:[2,195],72:[2,195],77:[2,195],85:[2,195],90:[2,195],92:[2,195],101:[2,195],102:87,103:[2,195],104:[2,195],105:[2,195],108:88,109:[2,195],110:69,117:[2,195],125:[2,195],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[2,195],134:[2,195],135:[2,195],136:[2,195]},{1:[2,196],6:[2,196],25:[2,196],26:[2,196],49:[2,196],54:[2,196],57:[2,196],72:[2,196],77:[2,196],85:[2,196],90:[2,196],92:[2,196],101:[2,196],102:87,103:[2,196],104:[2,196],105:[2,196],108:88,109:[2,196],110:69,117:[2,196],125:[2,196],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[2,196],135:[2,196],136:[1,85]},{1:[2,197],6:[2,197],25:[2,197],26:[2,197],49:[2,197],54:[2,197],57:[2,197],72:[2,197],77:[2,197],85:[2,197],90:[2,197],92:[2,197],101:[2,197],102:87,103:[2,197],104:[2,197],105:[2,197],108:88,109:[2,197],110:69,117:[2,197],125:[2,197],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[2,197],136:[1,85]},{1:[2,198],6:[2,198],25:[2,198],26:[2,198],49:[2,198],54:[2,198],57:[2,198],72:[2,198],77:[2,198],85:[2,198],90:[2,198],92:[2,198],101:[2,198],102:87,103:[2,198],104:[2,198],105:[2,198],108:88,109:[2,198],110:69,117:[2,198],125:[2,198],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[2,198],135:[2,198],136:[2,198]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],49:[2,183],54:[2,183],57:[2,183],72:[2,183],77:[2,183],85:[2,183],90:[2,183],92:[2,183],101:[2,183],102:87,103:[1,65],104:[2,183],105:[1,66],108:88,109:[1,68],110:69,117:[2,183],125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],49:[2,182],54:[2,182],57:[2,182],72:[2,182],77:[2,182],85:[2,182],90:[2,182],92:[2,182],101:[2,182],102:87,103:[1,65],104:[2,182],105:[1,66],108:88,109:[1,68],110:69,117:[2,182],125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],49:[2,103],54:[2,103],57:[2,103],66:[2,103],67:[2,103],68:[2,103],70:[2,103],72:[2,103],73:[2,103],77:[2,103],83:[2,103],84:[2,103],85:[2,103],90:[2,103],92:[2,103],101:[2,103],103:[2,103],104:[2,103],105:[2,103],109:[2,103],117:[2,103],125:[2,103],127:[2,103],128:[2,103],131:[2,103],132:[2,103],133:[2,103],134:[2,103],135:[2,103],136:[2,103]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],40:[2,80],49:[2,80],54:[2,80],57:[2,80],66:[2,80],67:[2,80],68:[2,80],70:[2,80],72:[2,80],73:[2,80],77:[2,80],79:[2,80],83:[2,80],84:[2,80],85:[2,80],90:[2,80],92:[2,80],101:[2,80],103:[2,80],104:[2,80],105:[2,80],109:[2,80],117:[2,80],125:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80],136:[2,80],137:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],40:[2,81],49:[2,81],54:[2,81],57:[2,81],66:[2,81],67:[2,81],68:[2,81],70:[2,81],72:[2,81],73:[2,81],77:[2,81],79:[2,81],83:[2,81],84:[2,81],85:[2,81],90:[2,81],92:[2,81],101:[2,81],103:[2,81],104:[2,81],105:[2,81],109:[2,81],117:[2,81],125:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81],136:[2,81],137:[2,81]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],40:[2,82],49:[2,82],54:[2,82],57:[2,82],66:[2,82],67:[2,82],68:[2,82],70:[2,82],72:[2,82],73:[2,82],77:[2,82],79:[2,82],83:[2,82],84:[2,82],85:[2,82],90:[2,82],92:[2,82],101:[2,82],103:[2,82],104:[2,82],105:[2,82],109:[2,82],117:[2,82],125:[2,82],127:[2,82],128:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82],135:[2,82],136:[2,82],137:[2,82]},{72:[1,238]},{57:[1,192],72:[2,87],91:239,92:[1,191],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{72:[2,88]},{8:240,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,72:[2,122],75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{12:[2,116],28:[2,116],30:[2,116],31:[2,116],33:[2,116],34:[2,116],35:[2,116],36:[2,116],37:[2,116],38:[2,116],45:[2,116],46:[2,116],47:[2,116],51:[2,116],52:[2,116],72:[2,116],75:[2,116],78:[2,116],82:[2,116],87:[2,116],88:[2,116],89:[2,116],95:[2,116],99:[2,116],100:[2,116],103:[2,116],105:[2,116],107:[2,116],109:[2,116],118:[2,116],124:[2,116],126:[2,116],127:[2,116],128:[2,116],129:[2,116],130:[2,116]},{12:[2,117],28:[2,117],30:[2,117],31:[2,117],33:[2,117],34:[2,117],35:[2,117],36:[2,117],37:[2,117],38:[2,117],45:[2,117],46:[2,117],47:[2,117],51:[2,117],52:[2,117],72:[2,117],75:[2,117],78:[2,117],82:[2,117],87:[2,117],88:[2,117],89:[2,117],95:[2,117],99:[2,117],100:[2,117],103:[2,117],105:[2,117],107:[2,117],109:[2,117],118:[2,117],124:[2,117],126:[2,117],127:[2,117],128:[2,117],129:[2,117],130:[2,117]},{1:[2,86],6:[2,86],25:[2,86],26:[2,86],40:[2,86],49:[2,86],54:[2,86],57:[2,86],66:[2,86],67:[2,86],68:[2,86],70:[2,86],72:[2,86],73:[2,86],77:[2,86],79:[2,86],83:[2,86],84:[2,86],85:[2,86],90:[2,86],92:[2,86],101:[2,86],103:[2,86],104:[2,86],105:[2,86],109:[2,86],117:[2,86],125:[2,86],127:[2,86],128:[2,86],129:[2,86],130:[2,86],131:[2,86],132:[2,86],133:[2,86],134:[2,86],135:[2,86],136:[2,86],137:[2,86]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],49:[2,104],54:[2,104],57:[2,104],66:[2,104],67:[2,104],68:[2,104],70:[2,104],72:[2,104],73:[2,104],77:[2,104],83:[2,104],84:[2,104],85:[2,104],90:[2,104],92:[2,104],101:[2,104],103:[2,104],104:[2,104],105:[2,104],109:[2,104],117:[2,104],125:[2,104],127:[2,104],128:[2,104],131:[2,104],132:[2,104],133:[2,104],134:[2,104],135:[2,104],136:[2,104]},{1:[2,36],6:[2,36],25:[2,36],26:[2,36],49:[2,36],54:[2,36],57:[2,36],72:[2,36],77:[2,36],85:[2,36],90:[2,36],92:[2,36],101:[2,36],102:87,103:[2,36],104:[2,36],105:[2,36],108:88,109:[2,36],110:69,117:[2,36],125:[2,36],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{8:241,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:242,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],49:[2,109],54:[2,109],57:[2,109],66:[2,109],67:[2,109],68:[2,109],70:[2,109],72:[2,109],73:[2,109],77:[2,109],83:[2,109],84:[2,109],85:[2,109],90:[2,109],92:[2,109],101:[2,109],103:[2,109],104:[2,109],105:[2,109],109:[2,109],117:[2,109],125:[2,109],127:[2,109],128:[2,109],131:[2,109],132:[2,109],133:[2,109],134:[2,109],135:[2,109],136:[2,109]},{6:[2,53],25:[2,53],53:243,54:[1,226],85:[2,53]},{6:[2,128],25:[2,128],26:[2,128],54:[2,128],57:[1,244],85:[2,128],90:[2,128],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{50:245,51:[1,60],52:[1,61]},{6:[2,54],25:[2,54],26:[2,54],27:109,28:[1,73],44:110,55:246,56:108,58:111,59:112,75:[1,70],88:[1,113],89:[1,114]},{6:[1,247],25:[1,248]},{6:[2,61],25:[2,61],26:[2,61],49:[2,61],54:[2,61]},{8:249,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,199],6:[2,199],25:[2,199],26:[2,199],49:[2,199],54:[2,199],57:[2,199],72:[2,199],77:[2,199],85:[2,199],90:[2,199],92:[2,199],101:[2,199],102:87,103:[2,199],104:[2,199],105:[2,199],108:88,109:[2,199],110:69,117:[2,199],125:[2,199],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{8:250,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,201],6:[2,201],25:[2,201],26:[2,201],49:[2,201],54:[2,201],57:[2,201],72:[2,201],77:[2,201],85:[2,201],90:[2,201],92:[2,201],101:[2,201],102:87,103:[2,201],104:[2,201],105:[2,201],108:88,109:[2,201],110:69,117:[2,201],125:[2,201],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],49:[2,181],54:[2,181],57:[2,181],72:[2,181],77:[2,181],85:[2,181],90:[2,181],92:[2,181],101:[2,181],103:[2,181],104:[2,181],105:[2,181],109:[2,181],117:[2,181],125:[2,181],127:[2,181],128:[2,181],131:[2,181],132:[2,181],133:[2,181],134:[2,181],135:[2,181],136:[2,181]},{8:251,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],49:[2,133],54:[2,133],57:[2,133],72:[2,133],77:[2,133],85:[2,133],90:[2,133],92:[2,133],97:[1,252],101:[2,133],103:[2,133],104:[2,133],105:[2,133],109:[2,133],117:[2,133],125:[2,133],127:[2,133],128:[2,133],131:[2,133],132:[2,133],133:[2,133],134:[2,133],135:[2,133],136:[2,133]},{5:253,25:[1,5]},{27:254,28:[1,73]},{119:255,121:216,122:[1,217]},{26:[1,256],120:[1,257],121:258,122:[1,217]},{26:[2,174],120:[2,174],122:[2,174]},{8:260,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],94:259,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,97],5:261,6:[2,97],25:[1,5],26:[2,97],49:[2,97],54:[2,97],57:[2,97],72:[2,97],77:[2,97],85:[2,97],90:[2,97],92:[2,97],101:[2,97],102:87,103:[1,65],104:[2,97],105:[1,66],108:88,109:[1,68],110:69,117:[2,97],125:[2,97],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],49:[2,100],54:[2,100],57:[2,100],72:[2,100],77:[2,100],85:[2,100],90:[2,100],92:[2,100],101:[2,100],103:[2,100],104:[2,100],105:[2,100],109:[2,100],117:[2,100],125:[2,100],127:[2,100],128:[2,100],131:[2,100],132:[2,100],133:[2,100],134:[2,100],135:[2,100],136:[2,100]},{8:262,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],49:[2,138],54:[2,138],57:[2,138],66:[2,138],67:[2,138],68:[2,138],70:[2,138],72:[2,138],73:[2,138],77:[2,138],83:[2,138],84:[2,138],85:[2,138],90:[2,138],92:[2,138],101:[2,138],103:[2,138],104:[2,138],105:[2,138],109:[2,138],117:[2,138],125:[2,138],127:[2,138],128:[2,138],131:[2,138],132:[2,138],133:[2,138],134:[2,138],135:[2,138],136:[2,138]},{6:[1,74],26:[1,263]},{8:264,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,67],12:[2,117],25:[2,67],28:[2,117],30:[2,117],31:[2,117],33:[2,117],34:[2,117],35:[2,117],36:[2,117],37:[2,117],38:[2,117],45:[2,117],46:[2,117],47:[2,117],51:[2,117],52:[2,117],54:[2,67],75:[2,117],78:[2,117],82:[2,117],87:[2,117],88:[2,117],89:[2,117],90:[2,67],95:[2,117],99:[2,117],100:[2,117],103:[2,117],105:[2,117],107:[2,117],109:[2,117],118:[2,117],124:[2,117],126:[2,117],127:[2,117],128:[2,117],129:[2,117],130:[2,117]},{6:[1,266],25:[1,267],90:[1,265]},{6:[2,54],8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[2,54],26:[2,54],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],85:[2,54],87:[1,58],88:[1,59],89:[1,57],90:[2,54],93:268,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,53],25:[2,53],26:[2,53],53:269,54:[1,226]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],49:[2,178],54:[2,178],57:[2,178],72:[2,178],77:[2,178],85:[2,178],90:[2,178],92:[2,178],101:[2,178],103:[2,178],104:[2,178],105:[2,178],109:[2,178],117:[2,178],120:[2,178],125:[2,178],127:[2,178],128:[2,178],131:[2,178],132:[2,178],133:[2,178],134:[2,178],135:[2,178],136:[2,178]},{8:270,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:271,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{115:[2,156],116:[2,156]},{27:158,28:[1,73],44:159,58:160,59:161,75:[1,70],88:[1,113],89:[1,114],114:272},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],49:[2,163],54:[2,163],57:[2,163],72:[2,163],77:[2,163],85:[2,163],90:[2,163],92:[2,163],101:[2,163],102:87,103:[2,163],104:[1,273],105:[2,163],108:88,109:[2,163],110:69,117:[1,274],125:[2,163],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],49:[2,164],54:[2,164],57:[2,164],72:[2,164],77:[2,164],85:[2,164],90:[2,164],92:[2,164],101:[2,164],102:87,103:[2,164],104:[1,275],105:[2,164],108:88,109:[2,164],110:69,117:[2,164],125:[2,164],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[1,277],25:[1,278],77:[1,276]},{6:[2,54],11:168,25:[2,54],26:[2,54],27:169,28:[1,73],29:170,30:[1,71],31:[1,72],41:279,42:167,44:171,46:[1,46],77:[2,54],88:[1,113]},{8:280,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,281],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,85],6:[2,85],25:[2,85],26:[2,85],40:[2,85],49:[2,85],54:[2,85],57:[2,85],66:[2,85],67:[2,85],68:[2,85],70:[2,85],72:[2,85],73:[2,85],77:[2,85],79:[2,85],83:[2,85],84:[2,85],85:[2,85],90:[2,85],92:[2,85],101:[2,85],103:[2,85],104:[2,85],105:[2,85],109:[2,85],117:[2,85],125:[2,85],127:[2,85],128:[2,85],129:[2,85],130:[2,85],131:[2,85],132:[2,85],133:[2,85],134:[2,85],135:[2,85],136:[2,85],137:[2,85]},{8:282,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,72:[2,120],75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{72:[2,121],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,37],6:[2,37],25:[2,37],26:[2,37],49:[2,37],54:[2,37],57:[2,37],72:[2,37],77:[2,37],85:[2,37],90:[2,37],92:[2,37],101:[2,37],102:87,103:[2,37],104:[2,37],105:[2,37],108:88,109:[2,37],110:69,117:[2,37],125:[2,37],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{26:[1,283],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[1,266],25:[1,267],85:[1,284]},{6:[2,67],25:[2,67],26:[2,67],54:[2,67],85:[2,67],90:[2,67]},{5:285,25:[1,5]},{6:[2,57],25:[2,57],26:[2,57],49:[2,57],54:[2,57]},{27:109,28:[1,73],44:110,55:286,56:108,58:111,59:112,75:[1,70],88:[1,113],89:[1,114]},{6:[2,55],25:[2,55],26:[2,55],27:109,28:[1,73],44:110,48:287,54:[2,55],55:107,56:108,58:111,59:112,75:[1,70],88:[1,113],89:[1,114]},{6:[2,62],25:[2,62],26:[2,62],49:[2,62],54:[2,62],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{26:[1,288],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{5:289,25:[1,5],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{5:290,25:[1,5]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],49:[2,134],54:[2,134],57:[2,134],72:[2,134],77:[2,134],85:[2,134],90:[2,134],92:[2,134],101:[2,134],103:[2,134],104:[2,134],105:[2,134],109:[2,134],117:[2,134],125:[2,134],127:[2,134],128:[2,134],131:[2,134],132:[2,134],133:[2,134],134:[2,134],135:[2,134],136:[2,134]},{5:291,25:[1,5]},{26:[1,292],120:[1,293],121:258,122:[1,217]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],49:[2,172],54:[2,172],57:[2,172],72:[2,172],77:[2,172],85:[2,172],90:[2,172],92:[2,172],101:[2,172],103:[2,172],104:[2,172],105:[2,172],109:[2,172],117:[2,172],125:[2,172],127:[2,172],128:[2,172],131:[2,172],132:[2,172],133:[2,172],134:[2,172],135:[2,172],136:[2,172]},{5:294,25:[1,5]},{26:[2,175],120:[2,175],122:[2,175]},{5:295,25:[1,5],54:[1,296]},{25:[2,130],54:[2,130],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],49:[2,98],54:[2,98],57:[2,98],72:[2,98],77:[2,98],85:[2,98],90:[2,98],92:[2,98],101:[2,98],103:[2,98],104:[2,98],105:[2,98],109:[2,98],117:[2,98],125:[2,98],127:[2,98],128:[2,98],131:[2,98],132:[2,98],133:[2,98],134:[2,98],135:[2,98],136:[2,98]},{1:[2,101],5:297,6:[2,101],25:[1,5],26:[2,101],49:[2,101],54:[2,101],57:[2,101],72:[2,101],77:[2,101],85:[2,101],90:[2,101],92:[2,101],101:[2,101],102:87,103:[1,65],104:[2,101],105:[1,66],108:88,109:[1,68],110:69,117:[2,101],125:[2,101],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{101:[1,298]},{90:[1,299],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],40:[2,115],49:[2,115],54:[2,115],57:[2,115],66:[2,115],67:[2,115],68:[2,115],70:[2,115],72:[2,115],73:[2,115],77:[2,115],83:[2,115],84:[2,115],85:[2,115],90:[2,115],92:[2,115],101:[2,115],103:[2,115],104:[2,115],105:[2,115],109:[2,115],115:[2,115],116:[2,115],117:[2,115],125:[2,115],127:[2,115],128:[2,115],131:[2,115],132:[2,115],133:[2,115],134:[2,115],135:[2,115],136:[2,115]},{8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],93:300,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:200,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,146],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:147,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],86:301,87:[1,58],88:[1,59],89:[1,57],93:145,95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[2,124],25:[2,124],26:[2,124],54:[2,124],85:[2,124],90:[2,124]},{6:[1,266],25:[1,267],26:[1,302]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],49:[2,141],54:[2,141],57:[2,141],72:[2,141],77:[2,141],85:[2,141],90:[2,141],92:[2,141],101:[2,141],102:87,103:[1,65],104:[2,141],105:[1,66],108:88,109:[1,68],110:69,117:[2,141],125:[2,141],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],49:[2,143],54:[2,143],57:[2,143],72:[2,143],77:[2,143],85:[2,143],90:[2,143],92:[2,143],101:[2,143],102:87,103:[1,65],104:[2,143],105:[1,66],108:88,109:[1,68],110:69,117:[2,143],125:[2,143],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{115:[2,162],116:[2,162]},{8:303,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:304,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:305,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,89],6:[2,89],25:[2,89],26:[2,89],40:[2,89],49:[2,89],54:[2,89],57:[2,89],66:[2,89],67:[2,89],68:[2,89],70:[2,89],72:[2,89],73:[2,89],77:[2,89],83:[2,89],84:[2,89],85:[2,89],90:[2,89],92:[2,89],101:[2,89],103:[2,89],104:[2,89],105:[2,89],109:[2,89],115:[2,89],116:[2,89],117:[2,89],125:[2,89],127:[2,89],128:[2,89],131:[2,89],132:[2,89],133:[2,89],134:[2,89],135:[2,89],136:[2,89]},{11:168,27:169,28:[1,73],29:170,30:[1,71],31:[1,72],41:306,42:167,44:171,46:[1,46],88:[1,113]},{6:[2,90],11:168,25:[2,90],26:[2,90],27:169,28:[1,73],29:170,30:[1,71],31:[1,72],41:166,42:167,44:171,46:[1,46],54:[2,90],76:307,88:[1,113]},{6:[2,92],25:[2,92],26:[2,92],54:[2,92],77:[2,92]},{6:[2,40],25:[2,40],26:[2,40],54:[2,40],77:[2,40],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{8:308,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{72:[2,119],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,38],6:[2,38],25:[2,38],26:[2,38],49:[2,38],54:[2,38],57:[2,38],72:[2,38],77:[2,38],85:[2,38],90:[2,38],92:[2,38],101:[2,38],103:[2,38],104:[2,38],105:[2,38],109:[2,38],117:[2,38],125:[2,38],127:[2,38],128:[2,38],131:[2,38],132:[2,38],133:[2,38],134:[2,38],135:[2,38],136:[2,38]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],49:[2,110],54:[2,110],57:[2,110],66:[2,110],67:[2,110],68:[2,110],70:[2,110],72:[2,110],73:[2,110],77:[2,110],83:[2,110],84:[2,110],85:[2,110],90:[2,110],92:[2,110],101:[2,110],103:[2,110],104:[2,110],105:[2,110],109:[2,110],117:[2,110],125:[2,110],127:[2,110],128:[2,110],131:[2,110],132:[2,110],133:[2,110],134:[2,110],135:[2,110],136:[2,110]},{1:[2,49],6:[2,49],25:[2,49],26:[2,49],49:[2,49],54:[2,49],57:[2,49],72:[2,49],77:[2,49],85:[2,49],90:[2,49],92:[2,49],101:[2,49],103:[2,49],104:[2,49],105:[2,49],109:[2,49],117:[2,49],125:[2,49],127:[2,49],128:[2,49],131:[2,49],132:[2,49],133:[2,49],134:[2,49],135:[2,49],136:[2,49]},{6:[2,58],25:[2,58],26:[2,58],49:[2,58],54:[2,58]},{6:[2,53],25:[2,53],26:[2,53],53:309,54:[1,202]},{1:[2,200],6:[2,200],25:[2,200],26:[2,200],49:[2,200],54:[2,200],57:[2,200],72:[2,200],77:[2,200],85:[2,200],90:[2,200],92:[2,200],101:[2,200],103:[2,200],104:[2,200],105:[2,200],109:[2,200],117:[2,200],125:[2,200],127:[2,200],128:[2,200],131:[2,200],132:[2,200],133:[2,200],134:[2,200],135:[2,200],136:[2,200]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],49:[2,179],54:[2,179],57:[2,179],72:[2,179],77:[2,179],85:[2,179],90:[2,179],92:[2,179],101:[2,179],103:[2,179],104:[2,179],105:[2,179],109:[2,179],117:[2,179],120:[2,179],125:[2,179],127:[2,179],128:[2,179],131:[2,179],132:[2,179],133:[2,179],134:[2,179],135:[2,179],136:[2,179]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],49:[2,135],54:[2,135],57:[2,135],72:[2,135],77:[2,135],85:[2,135],90:[2,135],92:[2,135],101:[2,135],103:[2,135],104:[2,135],105:[2,135],109:[2,135],117:[2,135],125:[2,135],127:[2,135],128:[2,135],131:[2,135],132:[2,135],133:[2,135],134:[2,135],135:[2,135],136:[2,135]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],49:[2,136],54:[2,136],57:[2,136],72:[2,136],77:[2,136],85:[2,136],90:[2,136],92:[2,136],97:[2,136],101:[2,136],103:[2,136],104:[2,136],105:[2,136],109:[2,136],117:[2,136],125:[2,136],127:[2,136],128:[2,136],131:[2,136],132:[2,136],133:[2,136],134:[2,136],135:[2,136],136:[2,136]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],49:[2,170],54:[2,170],57:[2,170],72:[2,170],77:[2,170],85:[2,170],90:[2,170],92:[2,170],101:[2,170],103:[2,170],104:[2,170],105:[2,170],109:[2,170],117:[2,170],125:[2,170],127:[2,170],128:[2,170],131:[2,170],132:[2,170],133:[2,170],134:[2,170],135:[2,170],136:[2,170]},{5:310,25:[1,5]},{26:[1,311]},{6:[1,312],26:[2,176],120:[2,176],122:[2,176]},{8:313,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{1:[2,102],6:[2,102],25:[2,102],26:[2,102],49:[2,102],54:[2,102],57:[2,102],72:[2,102],77:[2,102],85:[2,102],90:[2,102],92:[2,102],101:[2,102],103:[2,102],104:[2,102],105:[2,102],109:[2,102],117:[2,102],125:[2,102],127:[2,102],128:[2,102],131:[2,102],132:[2,102],133:[2,102],134:[2,102],135:[2,102],136:[2,102]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],49:[2,139],54:[2,139],57:[2,139],66:[2,139],67:[2,139],68:[2,139],70:[2,139],72:[2,139],73:[2,139],77:[2,139],83:[2,139],84:[2,139],85:[2,139],90:[2,139],92:[2,139],101:[2,139],103:[2,139],104:[2,139],105:[2,139],109:[2,139],117:[2,139],125:[2,139],127:[2,139],128:[2,139],131:[2,139],132:[2,139],133:[2,139],134:[2,139],135:[2,139],136:[2,139]},{1:[2,118],6:[2,118],25:[2,118],26:[2,118],49:[2,118],54:[2,118],57:[2,118],66:[2,118],67:[2,118],68:[2,118],70:[2,118],72:[2,118],73:[2,118],77:[2,118],83:[2,118],84:[2,118],85:[2,118],90:[2,118],92:[2,118],101:[2,118],103:[2,118],104:[2,118],105:[2,118],109:[2,118],117:[2,118],125:[2,118],127:[2,118],128:[2,118],131:[2,118],132:[2,118],133:[2,118],134:[2,118],135:[2,118],136:[2,118]},{6:[2,125],25:[2,125],26:[2,125],54:[2,125],85:[2,125],90:[2,125]},{6:[2,53],25:[2,53],26:[2,53],53:314,54:[1,226]},{6:[2,126],25:[2,126],26:[2,126],54:[2,126],85:[2,126],90:[2,126]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],49:[2,165],54:[2,165],57:[2,165],72:[2,165],77:[2,165],85:[2,165],90:[2,165],92:[2,165],101:[2,165],102:87,103:[2,165],104:[2,165],105:[2,165],108:88,109:[2,165],110:69,117:[1,315],125:[2,165],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,167],6:[2,167],25:[2,167],26:[2,167],49:[2,167],54:[2,167],57:[2,167],72:[2,167],77:[2,167],85:[2,167],90:[2,167],92:[2,167],101:[2,167],102:87,103:[2,167],104:[1,316],105:[2,167],108:88,109:[2,167],110:69,117:[2,167],125:[2,167],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,166],6:[2,166],25:[2,166],26:[2,166],49:[2,166],54:[2,166],57:[2,166],72:[2,166],77:[2,166],85:[2,166],90:[2,166],92:[2,166],101:[2,166],102:87,103:[2,166],104:[2,166],105:[2,166],108:88,109:[2,166],110:69,117:[2,166],125:[2,166],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[2,93],25:[2,93],26:[2,93],54:[2,93],77:[2,93]},{6:[2,53],25:[2,53],26:[2,53],53:317,54:[1,236]},{26:[1,318],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[1,247],25:[1,248],26:[1,319]},{26:[1,320]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],49:[2,173],54:[2,173],57:[2,173],72:[2,173],77:[2,173],85:[2,173],90:[2,173],92:[2,173],101:[2,173],103:[2,173],104:[2,173],105:[2,173],109:[2,173],117:[2,173],125:[2,173],127:[2,173],128:[2,173],131:[2,173],132:[2,173],133:[2,173],134:[2,173],135:[2,173],136:[2,173]},{26:[2,177],120:[2,177],122:[2,177]},{25:[2,131],54:[2,131],102:87,103:[1,65],105:[1,66],108:88,109:[1,68],110:69,125:[1,86],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[1,266],25:[1,267],26:[1,321]},{8:322,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{8:323,9:117,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,75:[1,70],78:[1,43],82:[1,28],87:[1,58],88:[1,59],89:[1,57],95:[1,38],99:[1,44],100:[1,56],102:39,103:[1,65],105:[1,66],106:40,107:[1,67],108:41,109:[1,68],110:69,118:[1,42],123:37,124:[1,64],126:[1,31],127:[1,32],128:[1,33],129:[1,34],130:[1,35]},{6:[1,277],25:[1,278],26:[1,324]},{6:[2,41],25:[2,41],26:[2,41],54:[2,41],77:[2,41]},{6:[2,59],25:[2,59],26:[2,59],49:[2,59],54:[2,59]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],49:[2,171],54:[2,171],57:[2,171],72:[2,171],77:[2,171],85:[2,171],90:[2,171],92:[2,171],101:[2,171],103:[2,171],104:[2,171],105:[2,171],109:[2,171],117:[2,171],125:[2,171],127:[2,171],128:[2,171],131:[2,171],132:[2,171],133:[2,171],134:[2,171],135:[2,171],136:[2,171]},{6:[2,127],25:[2,127],26:[2,127],54:[2,127],85:[2,127],90:[2,127]},{1:[2,168],6:[2,168],25:[2,168],26:[2,168],49:[2,168],54:[2,168],57:[2,168],72:[2,168],77:[2,168],85:[2,168],90:[2,168],92:[2,168],101:[2,168],102:87,103:[2,168],104:[2,168],105:[2,168],108:88,109:[2,168],110:69,117:[2,168],125:[2,168],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{1:[2,169],6:[2,169],25:[2,169],26:[2,169],49:[2,169],54:[2,169],57:[2,169],72:[2,169],77:[2,169],85:[2,169],90:[2,169],92:[2,169],101:[2,169],102:87,103:[2,169],104:[2,169],105:[2,169],108:88,109:[2,169],110:69,117:[2,169],125:[2,169],127:[1,80],128:[1,79],131:[1,78],132:[1,81],133:[1,82],134:[1,83],135:[1,84],136:[1,85]},{6:[2,94],25:[2,94],26:[2,94],54:[2,94],77:[2,94]}],
defaultActions: {60:[2,51],61:[2,52],75:[2,3],94:[2,108],189:[2,88]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;
    //this.reductionCount = this.shiftCount = 0;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;
    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];
        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }
        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }
            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }
            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }
        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }
        switch (action[0]) {
            case 1: // shift
                //this.shiftCount++;
                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;
            case 2: // reduce
                //this.reductionCount++;
                len = this.productions_[action[1]][1];
                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                if (typeof r !== 'undefined') {
                    return r;
                }
                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }
                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;
            case 3: // accept
                return true;
        }
    }
    return true;
}};
undefined
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'repl',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var ACCESSOR, CoffeeScript, Module, REPL_PROMPT, REPL_PROMPT_CONTINUATION, REPL_PROMPT_MULTILINE, SIMPLEVAR, Script, autocomplete, backlog, completeAttribute, completeVariable, enableColours, error, getCompletions, inspect, multilineMode, pipedInput, readline, repl, run, stdin, stdout,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  stdin = process.openStdin();
  stdout = process.stdout;
  CoffeeScript = require('./coffee-script');
  readline = require('readline');
  inspect = require('util').inspect;
  Script = require('vm').Script;
  Module = require('module');
  REPL_PROMPT = 'coffee> ';
  REPL_PROMPT_MULTILINE = '------> ';
  REPL_PROMPT_CONTINUATION = '......> ';
  enableColours = false;
  if (process.platform !== 'win32') {
    enableColours = !process.env.NODE_DISABLE_COLORS;
  }
  error = function(err) {
    return stdout.write((err.stack || err.toString()) + '\n');
  };
  ACCESSOR = /\s*([\w\.]+)(?:\.(\w*))$/;
  SIMPLEVAR = /(\w+)$/i;
  autocomplete = function(text) {
    return completeAttribute(text) || completeVariable(text) || [[], text];
  };
  completeAttribute = function(text) {
    var all, candidates, completions, key, match, obj, prefix, _i, _len, _ref;
    if (match = text.match(ACCESSOR)) {
      all = match[0], obj = match[1], prefix = match[2];
      try {
        obj = Script.runInThisContext(obj);
      } catch (e) {
        return;
      }
      if (obj == null) {
        return;
      }
      obj = Object(obj);
      candidates = Object.getOwnPropertyNames(obj);
      while (obj = Object.getPrototypeOf(obj)) {
        _ref = Object.getOwnPropertyNames(obj);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          if (__indexOf.call(candidates, key) < 0) {
            candidates.push(key);
          }
        }
      }
      completions = getCompletions(prefix, candidates);
      return [completions, prefix];
    }
  };
  completeVariable = function(text) {
    var candidates, completions, free, key, keywords, r, vars, _i, _len, _ref;
    free = (_ref = text.match(SIMPLEVAR)) != null ? _ref[1] : void 0;
    if (text === "") {
      free = "";
    }
    if (free != null) {
      vars = Script.runInThisContext('Object.getOwnPropertyNames(Object(this))');
      keywords = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = CoffeeScript.RESERVED;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          if (r.slice(0, 2) !== '__') {
            _results.push(r);
          }
        }
        return _results;
      })();
      candidates = vars;
      for (_i = 0, _len = keywords.length; _i < _len; _i++) {
        key = keywords[_i];
        if (__indexOf.call(candidates, key) < 0) {
          candidates.push(key);
        }
      }
      completions = getCompletions(free, candidates);
      return [completions, free];
    }
  };
  getCompletions = function(prefix, candidates) {
    var el, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = candidates.length; _i < _len; _i++) {
      el = candidates[_i];
      if (0 === el.indexOf(prefix)) {
        _results.push(el);
      }
    }
    return _results;
  };
  process.on('uncaughtException', error);
  backlog = '';
  run = function(buffer) {
    var code, returnValue, _;
    buffer = buffer.replace(/(^|[\r\n]+)(\s*)##?(?:[^#\r\n][^\r\n]*|)($|[\r\n])/, "$1$2$3");
    buffer = buffer.replace(/[\r\n]+$/, "");
    if (multilineMode) {
      backlog += "" + buffer + "\n";
      repl.setPrompt(REPL_PROMPT_CONTINUATION);
      repl.prompt();
      return;
    }
    if (!buffer.toString().trim() && !backlog) {
      repl.prompt();
      return;
    }
    code = backlog += buffer;
    if (code[code.length - 1] === '\\') {
      backlog = "" + backlog.slice(0, -1) + "\n";
      repl.setPrompt(REPL_PROMPT_CONTINUATION);
      repl.prompt();
      return;
    }
    repl.setPrompt(REPL_PROMPT);
    backlog = '';
    try {
      _ = global._;
      returnValue = CoffeeScript["eval"]("_=(" + code + "\n)", {
        filename: 'repl',
        modulename: 'repl'
      });
      if (returnValue === void 0) {
        global._ = _;
      }
      repl.output.write("" + (inspect(returnValue, false, 2, enableColours)) + "\n");
    } catch (err) {
      error(err);
    }
    return repl.prompt();
  };
  if (stdin.readable && stdin.isRaw) {
    pipedInput = '';
    repl = {
      prompt: function() {
        return stdout.write(this._prompt);
      },
      setPrompt: function(p) {
        return this._prompt = p;
      },
      input: stdin,
      output: stdout,
      on: function() {}
    };
    stdin.on('data', function(chunk) {
      var line, lines, _i, _len, _ref;
      pipedInput += chunk;
      if (!/\n/.test(pipedInput)) {
        return;
      }
      lines = pipedInput.split("\n");
      pipedInput = lines[lines.length - 1];
      _ref = lines.slice(0, -1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (!(line)) {
          continue;
        }
        stdout.write("" + line + "\n");
        run(line);
      }
    });
    stdin.on('end', function() {
      var line, _i, _len, _ref;
      _ref = pipedInput.trim().split("\n");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (!(line)) {
          continue;
        }
        stdout.write("" + line + "\n");
        run(line);
      }
      stdout.write('\n');
      return process.exit(0);
    });
  } else {
    if (readline.createInterface.length < 3) {
      repl = readline.createInterface(stdin, autocomplete);
      stdin.on('data', function(buffer) {
        return repl.write(buffer);
      });
    } else {
      repl = readline.createInterface(stdin, stdout, autocomplete);
    }
  }
  multilineMode = false;
  repl.input.on('keypress', function(char, key) {
    var cursorPos, newPrompt;
    if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
      return;
    }
    cursorPos = repl.cursor;
    repl.output.cursorTo(0);
    repl.output.clearLine(1);
    multilineMode = !multilineMode;
    if (!multilineMode && backlog) {
      repl._line();
    }
    backlog = '';
    repl.setPrompt((newPrompt = multilineMode ? REPL_PROMPT_MULTILINE : REPL_PROMPT));
    repl.prompt();
    return repl.output.cursorTo(newPrompt.length + (repl.cursor = cursorPos));
  });
  repl.input.on('keypress', function(char, key) {
    if (!(multilineMode && repl.line)) {
      return;
    }
    if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'd')) {
      return;
    }
    multilineMode = false;
    return repl._line();
  });
  repl.on('attemptClose', function() {
    if (multilineMode) {
      multilineMode = false;
      repl.output.cursorTo(0);
      repl.output.clearLine(1);
      repl._onLine(repl.line);
      return;
    }
    if (backlog || repl.line) {
      backlog = '';
      repl.historyIndex = -1;
      repl.setPrompt(REPL_PROMPT);
      repl.output.write('\n(^C again to quit)');
      return repl._line((repl.line = ''));
    } else {
      return repl.close();
    }
  });
  repl.on('close', function() {
    repl.output.write('\n');
    return repl.input.destroy();
  });
  repl.on('line', run);
  repl.setPrompt(REPL_PROMPT);
  repl.prompt();
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'rewriter',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var BALANCED_PAIRS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_BLOCK, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, left, rite, _i, _len, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;
  exports.Rewriter = (function() {
    function Rewriter() {}
    Rewriter.prototype.rewrite = function(tokens) {
      this.tokens = tokens;
      this.removeLeadingNewlines();
      this.removeMidExpressionNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.addImplicitIndentation();
      this.tagPostfixConditionals();
      this.addImplicitBraces();
      this.addImplicitParentheses();
      return this.tokens;
    };
    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };
    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, token, tokens, _ref, _ref1;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref1 = token[0], __indexOf.call(EXPRESSION_END, _ref1) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };
    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, tag, _i, _len, _ref;
      _ref = this.tokens;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };
    Rewriter.prototype.removeMidExpressionNewlines = function() {
      return this.scanTokens(function(token, i, tokens) {
        var _ref;
        if (!(token[0] === 'TERMINATOR' && (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0))) {
          return 1;
        }
        tokens.splice(i, 1);
        return 0;
      });
    };
    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.addImplicitBraces = function() {
      var action, condition, sameLine, stack, start, startIndent, startIndex, startsLine;
      stack = [];
      start = null;
      startsLine = null;
      sameLine = true;
      startIndent = 0;
      startIndex = 0;
      condition = function(token, i) {
        var one, tag, three, two, _ref, _ref1;
        _ref = this.tokens.slice(i + 1, +(i + 3) + 1 || 9e9), one = _ref[0], two = _ref[1], three = _ref[2];
        if ('HERECOMMENT' === (one != null ? one[0] : void 0)) {
          return false;
        }
        tag = token[0];
        if (__indexOf.call(LINEBREAKS, tag) >= 0) {
          sameLine = false;
        }
        return (((tag === 'TERMINATOR' || tag === 'OUTDENT') || (__indexOf.call(IMPLICIT_END, tag) >= 0 && sameLine && !(i - startIndex === 1))) && ((!startsLine && this.tag(i - 1) !== ',') || !((two != null ? two[0] : void 0) === ':' || (one != null ? one[0] : void 0) === '@' && (three != null ? three[0] : void 0) === ':'))) || (tag === ',' && one && ((_ref1 = one[0]) !== 'IDENTIFIER' && _ref1 !== 'NUMBER' && _ref1 !== 'STRING' && _ref1 !== '@' && _ref1 !== 'TERMINATOR' && _ref1 !== 'OUTDENT'));
      };
      action = function(token, i) {
        var tok;
        tok = this.generate('}', '}', token[2]);
        return this.tokens.splice(i, 0, tok);
      };
      return this.scanTokens(function(token, i, tokens) {
        var ago, idx, prevTag, tag, tok, value, _ref, _ref1;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push([(tag === 'INDENT' && this.tag(i - 1) === '{' ? '{' : tag), i]);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          start = stack.pop();
          return 1;
        }
        if (!(tag === ':' && ((ago = this.tag(i - 2)) === ':' || ((_ref1 = stack[stack.length - 1]) != null ? _ref1[0] : void 0) !== '{'))) {
          return 1;
        }
        sameLine = true;
        startIndex = i + 1;
        stack.push(['{']);
        idx = ago === '@' ? i - 2 : i - 1;
        while (this.tag(idx - 2) === 'HERECOMMENT') {
          idx -= 2;
        }
        prevTag = this.tag(idx - 1);
        startsLine = !prevTag || (__indexOf.call(LINEBREAKS, prevTag) >= 0);
        value = new String('{');
        value.generated = true;
        tok = this.generate('{', value, token[2]);
        tokens.splice(idx, 0, tok);
        this.detectEnd(i + 2, condition, action);
        return 2;
      });
    };
    Rewriter.prototype.addImplicitParentheses = function() {
      var action, condition, noCall, seenControl, seenSingle;
      noCall = seenSingle = seenControl = false;
      condition = function(token, i) {
        var post, tag, _ref, _ref1;
        tag = token[0];
        if (!seenSingle && token.fromThen) {
          return true;
        }
        if (tag === 'IF' || tag === 'ELSE' || tag === 'CATCH' || tag === '->' || tag === '=>' || tag === 'CLASS') {
          seenSingle = true;
        }
        if (tag === 'IF' || tag === 'ELSE' || tag === 'SWITCH' || tag === 'TRY' || tag === '=') {
          seenControl = true;
        }
        if ((tag === '.' || tag === '?.' || tag === '::') && this.tag(i - 1) === 'OUTDENT') {
          return true;
        }
        return !token.generated && this.tag(i - 1) !== ',' && (__indexOf.call(IMPLICIT_END, tag) >= 0 || (tag === 'INDENT' && !seenControl)) && (tag !== 'INDENT' || (((_ref = this.tag(i - 2)) !== 'CLASS' && _ref !== 'EXTENDS') && (_ref1 = this.tag(i - 1), __indexOf.call(IMPLICIT_BLOCK, _ref1) < 0) && !((post = this.tokens[i + 1]) && post.generated && post[0] === '{')));
      };
      action = function(token, i) {
        return this.tokens.splice(i, 0, this.generate('CALL_END', ')', token[2]));
      };
      return this.scanTokens(function(token, i, tokens) {
        var callObject, current, next, prev, tag, _ref, _ref1, _ref2;
        tag = token[0];
        if (tag === 'CLASS' || tag === 'IF' || tag === 'FOR' || tag === 'WHILE') {
          noCall = true;
        }
        _ref = tokens.slice(i - 1, +(i + 1) + 1 || 9e9), prev = _ref[0], current = _ref[1], next = _ref[2];
        callObject = !noCall && tag === 'INDENT' && next && next.generated && next[0] === '{' && prev && (_ref1 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref1) >= 0);
        seenSingle = false;
        seenControl = false;
        if (__indexOf.call(LINEBREAKS, tag) >= 0) {
          noCall = false;
        }
        if (prev && !prev.spaced && tag === '?') {
          token.call = true;
        }
        if (token.fromThen) {
          return 1;
        }
        if (!(callObject || (prev != null ? prev.spaced : void 0) && (prev.call || (_ref2 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref2) >= 0)) && (__indexOf.call(IMPLICIT_CALL, tag) >= 0 || !(token.spaced || token.newLine) && __indexOf.call(IMPLICIT_UNSPACED_CALL, tag) >= 0))) {
          return 1;
        }
        tokens.splice(i, 0, this.generate('CALL_START', '(', token[2]));
        this.detectEnd(i + 1, condition, action);
        if (prev[0] === '?') {
          prev[0] = 'FUNC_EXIST';
        }
        return 2;
      });
    };
    Rewriter.prototype.addImplicitIndentation = function() {
      var action, condition, indent, outdent, starter;
      starter = indent = outdent = null;
      condition = function(token, i) {
        var _ref;
        return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'ELSE' && (starter !== 'IF' && starter !== 'THEN'));
      };
      action = function(token, i) {
        return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
      };
      return this.scanTokens(function(token, i, tokens) {
        var tag, _ref, _ref1;
        tag = token[0];
        if (tag === 'TERMINATOR' && this.tag(i + 1) === 'THEN') {
          tokens.splice(i, 1);
          return 0;
        }
        if (tag === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
          tokens.splice.apply(tokens, [i, 0].concat(__slice.call(this.indentation(token))));
          return 2;
        }
        if (tag === 'CATCH' && ((_ref = this.tag(i + 2)) === 'OUTDENT' || _ref === 'TERMINATOR' || _ref === 'FINALLY')) {
          tokens.splice.apply(tokens, [i + 2, 0].concat(__slice.call(this.indentation(token))));
          return 4;
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref1 = this.indentation(token, true), indent = _ref1[0], outdent = _ref1[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          tokens.splice(i + 1, 0, indent);
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };
    Rewriter.prototype.tagPostfixConditionals = function() {
      var action, condition, original;
      original = null;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === 'TERMINATOR' || _ref === 'INDENT';
      };
      action = function(token, i) {
        if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
          return original[0] = 'POST_' + original[0];
        }
      };
      return this.scanTokens(function(token, i) {
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };
    Rewriter.prototype.indentation = function(token, implicit) {
      var indent, outdent;
      if (implicit == null) {
        implicit = false;
      }
      indent = ['INDENT', 2, token[2]];
      outdent = ['OUTDENT', 2, token[2]];
      if (implicit) {
        indent.generated = outdent.generated = true;
      }
      return [indent, outdent];
    };
    Rewriter.prototype.generate = function(tag, value, line) {
      var tok;
      tok = [tag, value, line];
      tok.generated = true;
      return tok;
    };
    Rewriter.prototype.tag = function(i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };
    return Rewriter;
  })();
  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];
  exports.INVERSES = INVERSES = {};
  EXPRESSION_START = [];
  EXPRESSION_END = [];
  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }
  EXPRESSION_CLOSE = ['CATCH', 'WHEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);
  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];
  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'NULL', 'UNDEFINED', 'UNARY', 'SUPER', '@', '->', '=>', '[', '(', '{', '--', '++'];
  IMPLICIT_UNSPACED_CALL = ['+', '-'];
  IMPLICIT_BLOCK = ['->', '=>', '{', '[', ','];
  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];
  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];
  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];
  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];
}).call(this);
    }
  };
});
asyncmachineTest.module(18, function(/* parent */){
  return {
    'id': 'scope',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Scope, extend, last, _ref;
  _ref = require('./helpers'), extend = _ref.extend, last = _ref.last;
  exports.Scope = Scope = (function() {
    Scope.root = null;
    function Scope(parent, expressions, method) {
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.variables = [
        {
          name: 'arguments',
          type: 'arguments'
        }
      ];
      this.positions = {};
      if (!this.parent) {
        Scope.root = this;
      }
    }
    Scope.prototype.add = function(name, type, immediate) {
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
        return this.variables[this.positions[name]].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };
    Scope.prototype.namedMethod = function() {
      if (this.method.name || !this.parent) {
        return this.method;
      }
      return this.parent.namedMethod();
    };
    Scope.prototype.find = function(name) {
      if (this.check(name)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };
    Scope.prototype.parameter = function(name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };
    Scope.prototype.check = function(name) {
      var _ref1;
      return !!(this.type(name) || ((_ref1 = this.parent) != null ? _ref1.check(name) : void 0));
    };
    Scope.prototype.temporary = function(name, index) {
      if (name.length > 1) {
        return '_' + name + (index > 1 ? index - 1 : '');
      } else {
        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      }
    };
    Scope.prototype.type = function(name) {
      var v, _i, _len, _ref1;
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };
    Scope.prototype.freeVariable = function(name, reserve) {
      var index, temp;
      if (reserve == null) {
        reserve = true;
      }
      index = 0;
      while (this.check((temp = this.temporary(name, index)))) {
        index++;
      }
      if (reserve) {
        this.add(temp, 'var', true);
      }
      return temp;
    };
    Scope.prototype.assign = function(name, value) {
      this.add(name, {
        value: value,
        assigned: true
      }, true);
      return this.hasAssignments = true;
    };
    Scope.prototype.hasDeclarations = function() {
      return !!this.declaredVariables().length;
    };
    Scope.prototype.declaredVariables = function() {
      var realVars, tempVars, v, _i, _len, _ref1;
      realVars = [];
      tempVars = [];
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type === 'var') {
          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
        }
      }
      return realVars.sort().concat(tempVars.sort());
    };
    Scope.prototype.assignedVariables = function() {
      var v, _i, _len, _ref1, _results;
      _ref1 = this.variables;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type.assigned) {
          _results.push("" + v.name + " = " + v.type.value);
        }
      }
      return _results;
    };
    return Scope;
  })();
}).call(this);
    }
  };
});
asyncmachineTest.pkg(10, 13, function(parents){
  return {
    'id':11,
    'name':'commander',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(11, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
module.exports = require('./lib/commander');
    }
  };
});
asyncmachineTest.module(11, function(/* parent */){
  return {
    'id': 'lib/commander',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * commander
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , tty = require('tty')
  , basename = path.basename;
/**
 * Expose the root command.
 */
exports = module.exports = new Command;
/**
 * Expose `Command`.
 */
exports.Command = Command;
/**
 * Expose `Option`.
 */
exports.Option = Option;
/**
 * Initialize a new `Option` with the given `flags` and `description`.
 *
 * @param {String} flags
 * @param {String} description
 * @api public
 */
function Option(flags, description) {
  this.flags = flags;
  this.required = ~flags.indexOf('<');
  this.optional = ~flags.indexOf('[');
  this.bool = !~flags.indexOf('-no-');
  flags = flags.split(/[ ,|]+/);
  if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
  this.long = flags.shift();
  this.description = description;
}
/**
 * Return option name.
 *
 * @return {String}
 * @api private
 */
Option.prototype.name = function(){
  return this.long
    .replace('--', '')
    .replace('no-', '');
};
/**
 * Check if `arg` matches the short or long flag.
 *
 * @param {String} arg
 * @return {Boolean}
 * @api private
 */
Option.prototype.is = function(arg){
  return arg == this.short
    || arg == this.long;
};
/**
 * Initialize a new `Command`.
 *
 * @param {String} name
 * @api public
 */
function Command(name) {
  this.commands = [];
  this.options = [];
  this.args = [];
  this.name = name;
}
/**
 * Inherit from `EventEmitter.prototype`.
 */
Command.prototype.__proto__ = EventEmitter.prototype;
/**
 * Add command `name`.
 *
 * The `.action()` callback is invoked when the
 * command `name` is specified via __ARGV__,
 * and the remaining arguments are applied to the
 * function for access.
 *
 * When the `name` is "*" an un-matched command
 * will be passed as the first arg, followed by
 * the rest of __ARGV__ remaining.
 *
 * Examples:
 *
 *      program
 *        .version('0.0.1')
 *        .option('-C, --chdir <path>', 'change the working directory')
 *        .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
 *        .option('-T, --no-tests', 'ignore test hook')
 *     
 *      program
 *        .command('setup')
 *        .description('run remote setup commands')
 *        .action(function(){
 *          console.log('setup');
 *        });
 *     
 *      program
 *        .command('exec <cmd>')
 *        .description('run the given remote command')
 *        .action(function(cmd){
 *          console.log('exec "%s"', cmd);
 *        });
 *     
 *      program
 *        .command('*')
 *        .description('deploy the given env')
 *        .action(function(env){
 *          console.log('deploying "%s"', env);
 *        });
 *     
 *      program.parse(process.argv);
  *
 * @param {String} name
 * @return {Command} the new command
 * @api public
 */
Command.prototype.command = function(name){
  var args = name.split(/ +/);
  var cmd = new Command(args.shift());
  this.commands.push(cmd);
  cmd.parseExpectedArgs(args);
  cmd.parent = this;
  return cmd;
};
/**
 * Parse expected `args`.
 *
 * For example `["[type]"]` becomes `[{ required: false, name: 'type' }]`.
 *
 * @param {Array} args
 * @return {Command} for chaining
 * @api public
 */
Command.prototype.parseExpectedArgs = function(args){
  if (!args.length) return;
  var self = this;
  args.forEach(function(arg){
    switch (arg[0]) {
      case '<':
        self.args.push({ required: true, name: arg.slice(1, -1) });
        break;
      case '[':
        self.args.push({ required: false, name: arg.slice(1, -1) });
        break;
    }
  });
  return this;
};
/**
 * Register callback `fn` for the command.
 *
 * Examples:
 *
 *      program
 *        .command('help')
 *        .description('display verbose help')
 *        .action(function(){
 *           // output help here
 *        });
 *
 * @param {Function} fn
 * @return {Command} for chaining
 * @api public
 */
Command.prototype.action = function(fn){
  var self = this;
  this.parent.on(this.name, function(args, unknown){    
    // Parse any so-far unknown options
    unknown = unknown || [];
    var parsed = self.parseOptions(unknown);
    
    // Output help if necessary
    outputHelpIfNecessary(self, parsed.unknown);
    
    // If there are still any unknown options, then we simply 
    // die, unless someone asked for help, in which case we give it
    // to them, and then we die.
    if (parsed.unknown.length > 0) {      
      self.unknownOption(parsed.unknown[0]);
    }
    
    self.args.forEach(function(arg, i){
      if (arg.required && null == args[i]) {
        self.missingArgument(arg.name);
      }
    });
    
    // Always append ourselves to the end of the arguments,
    // to make sure we match the number of arguments the user
    // expects
    if (self.args.length) {
      args[self.args.length] = self;
    } else {
      args.push(self);
    }
    
    fn.apply(this, args);
  });
  return this;
};
/**
 * Define option with `flags`, `description` and optional
 * coercion `fn`. 
 *
 * The `flags` string should contain both the short and long flags,
 * separated by comma, a pipe or space. The following are all valid
 * all will output this way when `--help` is used.
 *
 *    "-p, --pepper"
 *    "-p|--pepper"
 *    "-p --pepper"
 *
 * Examples:
 *
 *     // simple boolean defaulting to false
 *     program.option('-p, --pepper', 'add pepper');
 *
 *     --pepper
 *     program.pepper
 *     // => Boolean
 *
 *     // simple boolean defaulting to false
 *     program.option('-C, --no-cheese', 'remove cheese');
 *
 *     program.cheese
 *     // => true
 *
 *     --no-cheese
 *     program.cheese
 *     // => true
 *
 *     // required argument
 *     program.option('-C, --chdir <path>', 'change the working directory');
 *
 *     --chdir /tmp
 *     program.chdir
 *     // => "/tmp"
 *
 *     // optional argument
 *     program.option('-c, --cheese [type]', 'add cheese [marble]');
 *
 * @param {String} flags
 * @param {String} description
 * @param {Function|Mixed} fn or default
 * @param {Mixed} defaultValue
 * @return {Command} for chaining
 * @api public
 */
Command.prototype.option = function(flags, description, fn, defaultValue){
  var self = this
    , option = new Option(flags, description)
    , oname = option.name()
    , name = camelcase(oname);
  // default as 3rd arg
  if ('function' != typeof fn) defaultValue = fn, fn = null;
  // preassign default value only for --no-*, [optional], or <required>
  if (false == option.bool || option.optional || option.required) {
    // when --no-* we make sure default is true
    if (false == option.bool) defaultValue = true;
    // preassign only if we have a default
    if (undefined !== defaultValue) self[name] = defaultValue;
  }
  // register the option
  this.options.push(option);
  // when it's passed assign the value
  // and conditionally invoke the callback
  this.on(oname, function(val){
    // coercion
    if (null != val && fn) val = fn(val);
    // unassigned or bool
    if ('boolean' == typeof self[name] || 'undefined' == typeof self[name]) {
      // if no value, bool true, and we have a default, then use it!
      if (null == val) {
        self[name] = option.bool
          ? defaultValue || true
          : false;
      } else {
        self[name] = val;
      }
    } else if (null !== val) {
      // reassign
      self[name] = val;
    }
  });
  return this;
};
/**
 * Parse `argv`, settings options and invoking commands when defined.
 *
 * @param {Array} argv
 * @return {Command} for chaining
 * @api public
 */
Command.prototype.parse = function(argv){
  // store raw args
  this.rawArgs = argv;
  // guess name
  if (!this.name) this.name = basename(argv[1]);
  // process argv
  var parsed = this.parseOptions(this.normalize(argv.slice(2)));
  this.args = parsed.args;
  return this.parseArgs(this.args, parsed.unknown);
};
/**
 * Normalize `args`, splitting joined short flags. For example
 * the arg "-abc" is equivalent to "-a -b -c".
 *
 * @param {Array} args
 * @return {Array}
 * @api private
 */
Command.prototype.normalize = function(args){
  var ret = []
    , arg;
  for (var i = 0, len = args.length; i < len; ++i) {
    arg = args[i];
    if (arg.length > 1 && '-' == arg[0] && '-' != arg[1]) {
      arg.slice(1).split('').forEach(function(c){
        ret.push('-' + c);
      });
    } else {
      ret.push(arg);
    }
  }
  return ret;
};
/**
 * Parse command `args`.
 *
 * When listener(s) are available those
 * callbacks are invoked, otherwise the "*"
 * event is emitted and those actions are invoked.
 *
 * @param {Array} args
 * @return {Command} for chaining
 * @api private
 */
Command.prototype.parseArgs = function(args, unknown){
  var cmds = this.commands
    , len = cmds.length
    , name;
  if (args.length) {
    name = args[0];
    if (this.listeners(name).length) {
      this.emit(args.shift(), args, unknown);
    } else {
      this.emit('*', args);
    }
  } else {
    outputHelpIfNecessary(this, unknown);
    
    // If there were no args and we have unknown options,
    // then they are extraneous and we need to error.
    if (unknown.length > 0) {      
      this.unknownOption(unknown[0]);
    }
  }
  return this;
};
/**
 * Return an option matching `arg` if any.
 *
 * @param {String} arg
 * @return {Option}
 * @api private
 */
Command.prototype.optionFor = function(arg){
  for (var i = 0, len = this.options.length; i < len; ++i) {
    if (this.options[i].is(arg)) {
      return this.options[i];
    }
  }
};
/**
 * Parse options from `argv` returning `argv`
 * void of these options.
 *
 * @param {Array} argv
 * @return {Array}
 * @api public
 */
Command.prototype.parseOptions = function(argv){
  var args = []
    , len = argv.length
    , literal
    , option
    , arg;
  var unknownOptions = [];
  // parse options
  for (var i = 0; i < len; ++i) {
    arg = argv[i];
    // literal args after --
    if ('--' == arg) {
      literal = true;
      continue;
    }
    if (literal) {
      args.push(arg);
      continue;
    }
    // find matching Option
    option = this.optionFor(arg);
    // option is defined
    if (option) {
      // requires arg
      if (option.required) {
        arg = argv[++i];
        if (null == arg) return this.optionMissingArgument(option);
        if ('-' == arg[0]) return this.optionMissingArgument(option, arg);
        this.emit(option.name(), arg);
      // optional arg
      } else if (option.optional) {
        arg = argv[i+1];
        if (null == arg || '-' == arg[0]) {
          arg = null;
        } else {
          ++i;
        }
        this.emit(option.name(), arg);
      // bool
      } else {
        this.emit(option.name());
      }
      continue;
    }
    
    // looks like an option
    if (arg.length > 1 && '-' == arg[0]) {
      unknownOptions.push(arg);
      
      // If the next argument looks like it might be
      // an argument for this option, we pass it on.
      // If it isn't, then it'll simply be ignored
      if (argv[i+1] && '-' != argv[i+1][0]) {
        unknownOptions.push(argv[++i]);
      }
      continue;
    }
    
    // arg
    args.push(arg);
  }
  
  return { args: args, unknown: unknownOptions };
};
/**
 * Argument `name` is missing.
 *
 * @param {String} name
 * @api private
 */
Command.prototype.missingArgument = function(name){
  console.error();
  console.error("  error: missing required argument `%s'", name);
  console.error();
  process.exit(1);
};
/**
 * `Option` is missing an argument, but received `flag` or nothing.
 *
 * @param {String} option
 * @param {String} flag
 * @api private
 */
Command.prototype.optionMissingArgument = function(option, flag){
  console.error();
  if (flag) {
    console.error("  error: option `%s' argument missing, got `%s'", option.flags, flag);
  } else {
    console.error("  error: option `%s' argument missing", option.flags);
  }
  console.error();
  process.exit(1);
};
/**
 * Unknown option `flag`.
 *
 * @param {String} flag
 * @api private
 */
Command.prototype.unknownOption = function(flag){
  console.error();
  console.error("  error: unknown option `%s'", flag);
  console.error();
  process.exit(1);
};
/**
 * Set the program version to `str`.
 *
 * This method auto-registers the "-V, --version" flag
 * which will print the version number when passed.
 *
 * @param {String} str
 * @param {String} flags
 * @return {Command} for chaining
 * @api public
 */
Command.prototype.version = function(str, flags){
  if (0 == arguments.length) return this._version;
  this._version = str;
  flags = flags || '-V, --version';
  this.option(flags, 'output the version number');
  this.on('version', function(){
    console.log(str);
    process.exit(0);
  });
  return this;
};
/**
 * Set the description `str`.
 *
 * @param {String} str
 * @return {String|Command}
 * @api public
 */
Command.prototype.description = function(str){
  if (0 == arguments.length) return this._description;
  this._description = str;
  return this;
};
/**
 * Set / get the command usage `str`.
 *
 * @param {String} str
 * @return {String|Command}
 * @api public
 */
Command.prototype.usage = function(str){
  var args = this.args.map(function(arg){
    return arg.required
      ? '<' + arg.name + '>'
      : '[' + arg.name + ']';
  });
  var usage = '[options'
    + (this.commands.length ? '] [command' : '')
    + ']'
    + (this.args.length ? ' ' + args : '');
  if (0 == arguments.length) return this._usage || usage;
  this._usage = str;
  return this;
};
/**
 * Return the largest option length.
 *
 * @return {Number}
 * @api private
 */
Command.prototype.largestOptionLength = function(){
  return this.options.reduce(function(max, option){
    return Math.max(max, option.flags.length);
  }, 0);
};
/**
 * Return help for options.
 *
 * @return {String}
 * @api private
 */
Command.prototype.optionHelp = function(){
  var width = this.largestOptionLength();
  
  // Prepend the help information
  return [pad('-h, --help', width) + '  ' + 'output usage information']
    .concat(this.options.map(function(option){
      return pad(option.flags, width)
        + '  ' + option.description;
      }))
    .join('\n');
};
/**
 * Return command help documentation.
 *
 * @return {String}
 * @api private
 */
Command.prototype.commandHelp = function(){
  if (!this.commands.length) return '';
  return [
      ''
    , '  Commands:'
    , ''
    , this.commands.map(function(cmd){
      var args = cmd.args.map(function(arg){
        return arg.required
          ? '<' + arg.name + '>'
          : '[' + arg.name + ']';
      }).join(' ');
      return cmd.name 
        + (cmd.options.length 
          ? ' [options]'
          : '') + ' ' + args
        + (cmd.description()
          ? '\n' + cmd.description()
          : '');
    }).join('\n\n').replace(/^/gm, '    ')
    , ''
  ].join('\n');
};
/**
 * Return program help documentation.
 *
 * @return {String}
 * @api private
 */
Command.prototype.helpInformation = function(){
  return [
      ''
    , '  Usage: ' + this.name + ' ' + this.usage()
    , '' + this.commandHelp()
    , '  Options:'
    , ''
    , '' + this.optionHelp().replace(/^/gm, '    ')
    , ''
    , ''
  ].join('\n');
};
/**
 * Prompt for a `Number`.
 *
 * @param {String} str
 * @param {Function} fn
 * @api private
 */
Command.prototype.promptForNumber = function(str, fn){
  var self = this;
  this.promptSingleLine(str, function parseNumber(val){
    val = Number(val);
    if (isNaN(val)) return self.promptSingleLine(str + '(must be a number) ', parseNumber);
    fn(val);
  });
};
/**
 * Prompt for a `Date`.
 *
 * @param {String} str
 * @param {Function} fn
 * @api private
 */
Command.prototype.promptForDate = function(str, fn){
  var self = this;
  this.promptSingleLine(str, function parseDate(val){
    val = new Date(val);
    if (isNaN(val.getTime())) return self.promptSingleLine(str + '(must be a date) ', parseDate);
    fn(val);
  });
};
/**
 * Single-line prompt.
 *
 * @param {String} str
 * @param {Function} fn
 * @api private
 */
Command.prototype.promptSingleLine = function(str, fn){
  if ('function' == typeof arguments[2]) {
    return this['promptFor' + (fn.name || fn)](str, arguments[2]);
  }
  process.stdout.write(str);
  process.stdin.setEncoding('utf8');
  process.stdin.once('data', function(val){
    fn(val.trim());
  }).resume();
};
/**
 * Multi-line prompt.
 *
 * @param {String} str
 * @param {Function} fn
 * @api private
 */
Command.prototype.promptMultiLine = function(str, fn){
  var buf = [];
  console.log(str);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(val){
    if ('\n' == val || '\r\n' == val) {
      process.stdin.removeAllListeners('data');
      fn(buf.join('\n'));
    } else {
      buf.push(val.trimRight());
    }
  }).resume();
};
/**
 * Prompt `str` and callback `fn(val)`
 *
 * Commander supports single-line and multi-line prompts.
 * To issue a single-line prompt simply add white-space
 * to the end of `str`, something like "name: ", whereas
 * for a multi-line prompt omit this "description:".
 *
 *
 * Examples:
 *
 *     program.prompt('Username: ', function(name){
 *       console.log('hi %s', name);
 *     });
 *     
 *     program.prompt('Description:', function(desc){
 *       console.log('description was "%s"', desc.trim());
 *     });
 *
 * @param {String|Object} str
 * @param {Function} fn
 * @api public
 */
Command.prototype.prompt = function(str, fn){
  var self = this;
  if ('string' == typeof str) {
    if (/ $/.test(str)) return this.promptSingleLine.apply(this, arguments);
    this.promptMultiLine(str, fn);
  } else {
    var keys = Object.keys(str)
      , obj = {};
    function next() {
      var key = keys.shift()
        , label = str[key];
      if (!key) return fn(obj);
      self.prompt(label, function(val){
        obj[key] = val;
        next();
      });
    }
    next();
  }
};
/**
 * Prompt for password with `str`, `mask` char and callback `fn(val)`.
 *
 * The mask string defaults to '', aka no output is
 * written while typing, you may want to use "*" etc.
 *
 * Examples:
 *
 *     program.password('Password: ', function(pass){
 *       console.log('got "%s"', pass);
 *       process.stdin.destroy();
 *     });
 *
 *     program.password('Password: ', '*', function(pass){
 *       console.log('got "%s"', pass);
 *       process.stdin.destroy();
 *     });
 *
 * @param {String} str
 * @param {String} mask
 * @param {Function} fn
 * @api public
 */
Command.prototype.password = function(str, mask, fn){
  var self = this
    , buf = '';
  // default mask
  if ('function' == typeof mask) {
    fn = mask;
    mask = '';
  }
  process.stdin.resume();
  tty.setRawMode(true);
  process.stdout.write(str);
  // keypress
  process.stdin.on('keypress', function(c, key){
    if (key && 'enter' == key.name) {
      console.log();
      process.stdin.removeAllListeners('keypress');
      tty.setRawMode(false);
      if (!buf.trim().length) return self.password(str, mask, fn);
      fn(buf);
      return;
    }
    if (key && key.ctrl && 'c' == key.name) {
      console.log('%s', buf);
      process.exit();
    }
    process.stdout.write(mask);
    buf += c;
  }).resume();
};
/**
 * Confirmation prompt with `str` and callback `fn(bool)`
 *
 * Examples:
 *
 *      program.confirm('continue? ', function(ok){
 *        console.log(' got %j', ok);
 *        process.stdin.destroy();
 *      });
 *
 * @param {String} str
 * @param {Function} fn
 * @api public
 */
Command.prototype.confirm = function(str, fn, verbose){
  var self = this;
  this.prompt(str, function(ok){
    if (!ok.trim()) {
      if (!verbose) str += '(yes or no) ';
      return self.confirm(str, fn, true);
    }
    fn(parseBool(ok));
  });
};
/**
 * Choice prompt with `list` of items and callback `fn(index, item)`
 *
 * Examples:
 *
 *      var list = ['tobi', 'loki', 'jane', 'manny', 'luna'];
 *      
 *      console.log('Choose the coolest pet:');
 *      program.choose(list, function(i){
 *        console.log('you chose %d "%s"', i, list[i]);
 *        process.stdin.destroy();
 *      });
 *
 * @param {Array} list
 * @param {Number|Function} index or fn
 * @param {Function} fn
 * @api public
 */
Command.prototype.choose = function(list, index, fn){
  var self = this
    , hasDefault = 'number' == typeof index;
  if (!hasDefault) {
    fn = index;
    index = null;
  }
  list.forEach(function(item, i){
    if (hasDefault && i == index) {
      console.log('* %d) %s', i + 1, item);
    } else {
      console.log('  %d) %s', i + 1, item);
    }
  });
  function again() {
    self.prompt('  : ', function(val){
      val = parseInt(val, 10) - 1;
      if (hasDefault && isNaN(val)) val = index;
      if (null == list[val]) {
        again();
      } else {
        fn(val, list[val]);
      }
    });
  }
  again();
};
/**
 * Camel-case the given `flag`
 *
 * @param {String} flag
 * @return {String}
 * @api private
 */
function camelcase(flag) {
  return flag.split('-').reduce(function(str, word){
    return str + word[0].toUpperCase() + word.slice(1);
  });
}
/**
 * Parse a boolean `str`.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */
function parseBool(str) {
  return /^y|yes|ok|true$/i.test(str);
}
/**
 * Pad `str` to `width`.
 *
 * @param {String} str
 * @param {Number} width
 * @return {String}
 * @api private
 */
function pad(str, width) {
  var len = Math.max(0, width - str.length);
  return str + Array(len + 1).join(' ');
}
/**
 * Output help information if necessary
 *
 * @param {Command} command to output help for
 * @param {Array} array of options to search for -h or --help
 * @api private
 */
function outputHelpIfNecessary(cmd, options) {
  options = options || [];
  for (var i = 0; i < options.length; i++) {
    if (options[i] == '--help' || options[i] == '-h') {
      process.stdout.write(cmd.helpInformation());
      cmd.emit('--help');
      process.exit(0);
    }
  }
}
    }
  };
});
asyncmachineTest.pkg(10, function(parents){
  return {
    'id':16,
    'name':'debug',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(16, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
module.exports = require('./lib/debug');
    }
  };
});
asyncmachineTest.module(16, function(/* parent */){
  return {
    'id': 'lib/debug',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var tty = require('tty');
/**
 * Expose `debug()` as the module.
 */
module.exports = debug;
/**
 * Enabled debuggers.
 */
var names = []
  , skips = [];
(process.env.DEBUG || '')
  .split(/[\s,]+/)
  .forEach(function(name){
    name = name.replace('*', '.*?');
    if (name[0] === '-') {
      skips.push(new RegExp('^' + name.substr(1) + '$'));
    } else {
      names.push(new RegExp('^' + name + '$'));
    }
  });
/**
 * Colors.
 */
var colors = [6, 2, 3, 4, 5, 1];
/**
 * Previous debug() call.
 */
var prev = {};
/**
 * Previously assigned color.
 */
var prevColor = 0;
/**
 * Is stdout a TTY? Colored output is disabled when `true`.
 */
var isatty = tty.isatty(2);
/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */
function color() {
  return colors[prevColor++ % colors.length];
}
/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */
function humanize(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;
  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
}
/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */
function debug(name) {
  function disabled(){}
  disabled.enabled = false;
  var match = skips.some(function(re){
    return re.test(name);
  });
  if (match) return disabled;
  match = names.some(function(re){
    return re.test(name);
  });
  if (!match) return disabled;
  var c = color();
  function colored(fmt) {
    var curr = new Date;
    var ms = curr - (prev[name] || curr);
    prev[name] = curr;
    fmt = '  \033[9' + c + 'm' + name + ' '
      + '\033[3' + c + 'm\033[90m'
      + fmt + '\033[3' + c + 'm'
      + ' +' + humanize(ms) + '\033[0m';
    console.error.apply(this, arguments);
  }
  function plain(fmt) {
    fmt = new Date().toUTCString()
      + ' ' + name + ' ' + fmt;
    console.error.apply(this, arguments);
  }
  colored.enabled = plain.enabled = true;
  return isatty
    ? colored
    : plain;
}
    }
  };
});
asyncmachineTest.pkg(10, function(parents){
  return {
    'id':15,
    'name':'diff',
    'main':undefined,
    'mainModuleId':'diff',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(15, function(/* parent */){
  return {
    'id': 'diff',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /* See license.txt for terms of usage */
/*
 * Text diff implementation.
 * 
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 * 
 * JsDiff.diffCss: Diff targeted at CSS content
 * 
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
var JsDiff = (function() {
  function clonePath(path) {
    return { newPos: path.newPos, components: path.components.slice(0) };
  }
  function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  function escapeHTML(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");
    return n;
  }
  var fbDiff = function(ignoreWhitespace) {
    this.ignoreWhitespace = ignoreWhitespace;
  };
  fbDiff.prototype = {
      diff: function(oldString, newString) {
        // Handle the identity case (this is due to unrolling editLength == 0
        if (newString == oldString) {
          return [{ value: newString }];
        }
        if (!newString) {
          return [{ value: oldString, removed: true }];
        }
        if (!oldString) {
          return [{ value: newString, added: true }];
        }
        newString = this.tokenize(newString);
        oldString = this.tokenize(oldString);
        var newLen = newString.length, oldLen = oldString.length;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{ newPos: -1, components: [] }];
        // Seed editLength = 0
        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
        if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
          return bestPath[0].components;
        }
        for (var editLength = 1; editLength <= maxEditLength; editLength++) {
          for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
            var basePath;
            var addPath = bestPath[diagonalPath-1],
                removePath = bestPath[diagonalPath+1];
            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
            if (addPath) {
              // No one else is going to attempt to use this value, clear it
              bestPath[diagonalPath-1] = undefined;
            }
            var canAdd = addPath && addPath.newPos+1 < newLen;
            var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = undefined;
              continue;
            }
            // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph
            if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
              basePath = clonePath(removePath);
              this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
            } else {
              basePath = clonePath(addPath);
              basePath.newPos++;
              this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
            }
            var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);
            if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
              return basePath.components;
            } else {
              bestPath[diagonalPath] = basePath;
            }
          }
        }
      },
      pushComponent: function(components, value, added, removed) {
        var last = components[components.length-1];
        if (last && last.added === added && last.removed === removed) {
          // We need to clone here as the component clone operation is just
          // as shallow array clone
          components[components.length-1] =
            {value: this.join(last.value, value), added: added, removed: removed };
        } else {
          components.push({value: value, added: added, removed: removed });
        }
      },
      extractCommon: function(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath;
        while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
          newPos++;
          oldPos++;
          
          this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
        }
        basePath.newPos = newPos;
        return oldPos;
      },
      equals: function(left, right) {
        var reWhitespace = /\S/;
        if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
          return true;
        } else {
          return left == right;
        }
      },
      join: function(left, right) {
        return left + right;
      },
      tokenize: function(value) {
        return value;
      }
  };
  
  var CharDiff = new fbDiff();
  
  var WordDiff = new fbDiff(true);
  WordDiff.tokenize = function(value) {
    return removeEmpty(value.split(/(\s+|\b)/));
  };
  
  var CssDiff = new fbDiff(true);
  CssDiff.tokenize = function(value) {
    return removeEmpty(value.split(/([{}:;,]|\s+)/));
  };
  
  var LineDiff = new fbDiff();
  LineDiff.tokenize = function(value) {
    return value.split(/^/m);
  };
  
  return {
    diffChars: function(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },
    diffWords: function(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },
    diffLines: function(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },
    diffCss: function(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },
    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
      var ret = [];
      ret.push("Index: " + fileName);
      ret.push("===================================================================");
      ret.push("--- " + fileName + (typeof oldHeader === "undefined" ? "" : "\t" + oldHeader));
      ret.push("+++ " + fileName + (typeof newHeader === "undefined" ? "" : "\t" + newHeader));
      var diff = LineDiff.diff(oldStr, newStr);
      if (!diff[diff.length-1].value) {
        diff.pop();   // Remove trailing newline add
      }
      diff.push({value: "", lines: []});   // Append an empty value to make cleanup easier
      function contextLines(lines) {
        return lines.map(function(entry) { return ' ' + entry; });
      }
      function eofNL(curRange, i, current) {
        var last = diff[diff.length-2],
            isLast = i === diff.length-2,
            isLastOfType = i === diff.length-3 && (current.added === !last.added || current.removed === !last.removed);
        // Figure out if this is the last line for the given file and missing NL
        if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
          curRange.push('\\ No newline at end of file');
        }
      }
      var oldRangeStart = 0, newRangeStart = 0, curRange = [],
          oldLine = 1, newLine = 1;
      for (var i = 0; i < diff.length; i++) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, "").split("\n");
        current.lines = lines;
        if (current.added || current.removed) {
          if (!oldRangeStart) {
            var prev = diff[i-1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;
            
            if (prev) {
              curRange = contextLines(prev.lines.slice(-4));
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          }
          curRange.push.apply(curRange, lines.map(function(entry) { return (current.added?"+":"-") + entry; }));
          eofNL(curRange, i, current);
          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= 8 && i < diff.length-2) {
              // Overlapping
              curRange.push.apply(curRange, contextLines(lines));
            } else {
              // end the range and output
              var contextSize = Math.min(lines.length, 4);
              ret.push(
                  "@@ -" + oldRangeStart + "," + (oldLine-oldRangeStart+contextSize)
                  + " +" + newRangeStart + "," + (newLine-newRangeStart+contextSize)
                  + " @@");
              ret.push.apply(ret, curRange);
              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
              if (lines.length <= 4) {
                eofNL(ret, i, current);
              }
              oldRangeStart = 0;  newRangeStart = 0; curRange = [];
            }
          }
          oldLine += lines.length;
          newLine += lines.length;
        }
      }
      return ret.join('\n') + '\n';
    },
    convertChangesToXML: function(changes){
      var ret = [];
      for ( var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push("<ins>");
        } else if (change.removed) {
          ret.push("<del>");
        }
        ret.push(escapeHTML(change.value));
        if (change.added) {
          ret.push("</ins>");
        } else if (change.removed) {
          ret.push("</del>");
        }
      }
      return ret.join("");
    }
  };
})();
if (typeof module !== "undefined") {
    module.exports = JsDiff;
}
    }
  };
});
asyncmachineTest.pkg(3, function(parents){
  return {
    'id':4,
    'name':'es5-shim',
    'main':undefined,
    'mainModuleId':'es5-shim',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(4, function(/* parent */){
  return {
    'id': 'es5-shim',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Copyright 2009-2012 by contributors, MIT License
// vim: ts=4 sts=4 sw=4 expandtab
// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // YUI3
    } else if (typeof YUI == "function") {
        YUI.add("es5", definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {
/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */
//
// Function
// ========
//
// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5
if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound = function () {
            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.
                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;
            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.
                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );
            }
        };
        if(target.prototype) {
            bound.prototype = Object.create(target.prototype);
        }
        // XXX bound.length is never writable, so don't even try
        //
        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.
        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.
        // 22. Return F.
        return bound;
    };
}
// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
//
// Array
// =====
//
// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
// Default value for second param
// [bugfix, ielt9, old browsers]
// IE < 9 bug: [1,2].splice(0).join("") == "" but should be "12"
if ([1,2].splice(0).length != 2) {
    var array_splice = Array.prototype.splice;
    Array.prototype.splice = function(start, deleteCount) {
        if (!arguments.length) {
            return [];
        } else {
            return array_splice.apply(this, [
                start === void 0 ? 0 : start,
                deleteCount === void 0 ? (this.length - start) : deleteCount
            ].concat(slice.call(arguments, 2)))
        }
    };
}
// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.
// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach
// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }
        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                // context
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }
        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }
        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }
        return result;
    };
}
// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }
        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }
        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);
        return result;
    };
}
// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;
        if (!length) {
            return -1;
        }
        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;
        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
//
// Object
// ======
//
// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "AsyncMachine"
        ],
        dontEnumsLength = dontEnums.length;
    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }
    Object.keys = function keys(object) {
        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }
        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }
        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };
}
//
// Date
// ====
//
// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000,
    negativeYearString = "-000001";
if (
    !Date.prototype.toISOString ||
    (new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1)
) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError("Date.prototype.toISOString called on non-finite value.");
        }
        year = this.getUTCFullYear();
        month = this.getUTCMonth();
        // see https://github.com/kriskowal/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;
        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? "-" : (year > 9999 ? "+" : "")) +
            ("00000" + Math.abs(year))
            .slice(0 <= year && year <= 9999 ? -4 : -6)
        );
        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = "0" + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + "-" + result.slice(0, 2).join("-") +
            "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z"
        );
    };
}
// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = false;
try {
    dateToJSONIsSupported = (
        Date.prototype.toJSON &&
        new Date(NaN).toJSON() === null &&
        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
        Date.prototype.toJSON.call({ // generic
            toISOString: function () {
                return true;
            }
        })
    );
} catch (e) {
}
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:
        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be toPrimitive(O, hint Number).
        var o = Object(this),
            tv = toPrimitive(o),
            toISO;
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === "number" && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        toISO = o.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof toISO != "function") {
            throw new TypeError("toISOString property is not callable");
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(o);
        // NOTE 1 The argument is ignored.
        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}
// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (!Date.parse || "Date.parse is buggy") {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {
        // Date.length === 7
        var newDate = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(newDate.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = newDate;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };
        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign +
                                      // 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");
        var months = [
            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365
        ];
        function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        }
        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            newDate[key] = NativeDate[key];
        }
        // Copy "native" methods explicitly; they may be non-enumerable
        newDate.now = NativeDate.now;
        newDate.UTC = NativeDate.UTC;
        newDate.prototype = NativeDate.prototype;
        newDate.prototype.constructor = Date;
        // Upgrade Date.parse to handle simplified ISO 8601 strings
        newDate.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Number(match[7] || 0),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    offset = !match[4] || match[8] ?
                        0 : Number(new Date(1970, 0)),
                    signOffset = match[9] === "-" ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond + offset;
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };
        return newDate;
    })(Date);
}
// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
//
// String
// ======
//
// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14
// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
if("0".split(void 0, 0).length) {
    var string_split = String.prototype.split;
    String.prototype.split = function(separator, limit) {
        if(separator === void 0 && limit === 0)return [];
        return string_split.apply(this, arguments);
    }
}
// ECMA-262, 3rd B.2.3
// Note an ECMAScript standart, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
if("".substr && "0b".substr(-1) !== "b") {
    var string_substr = String.prototype.substr;
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function(start, length) {
        return string_substr.call(
            this,
            start < 0 ? (start = this.length + start) < 0 ? 0 : start : start,
            length
        );
    }
}
// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        if (this === undefined || this === null) {
            throw new TypeError("can't convert "+this+" to object");
        }
        return String(this)
            .replace(trimBeginRegexp, "")
            .replace(trimEndRegexp, "");
    };
}
//
// Util
// ======
//
// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer
function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}
function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}
function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
// ES5 9.9
// http://es5.github.com/#x9.9
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};
});
    }
  };
});
asyncmachineTest.pkg(10, function(parents){
  return {
    'id':12,
    'name':'growl',
    'main':undefined,
    'mainModuleId':'lib/growl',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(12, function(/* parent */){
  return {
    'id': 'lib/growl',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Growl - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)
/**
 * Module dependencies.
 */
var exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , exists = fs.existsSync || path.existsSync
  , os = require('os')
  , quote = JSON.stringify
  , cmd;
function which(name) {
  var paths = process.env.PATH.split(':');
  var loc;
  
  for (var i = 0, len = paths.length; i < len; ++i) {
    loc = path.join(paths[i], name);
    if (exists(loc)) return loc;
  }
}
switch(os.type()) {
  case 'Darwin':
    if (which('terminal-notifier')) {
      cmd = {
          type: "Darwin-NotificationCenter"
        , pkg: "terminal-notifier"
        , msg: '-message'
        , title: '-title'
        , subtitle: '-subtitle'
        , priority: {
              cmd: '-execute'
            , range: []
          }
      };
    } else {
      cmd = {
          type: "Darwin-Growl"
        , pkg: "growlnotify"
        , msg: '-m'
        , sticky: '--sticky'
        , priority: {
              cmd: '--priority'
            , range: [
                -2
              , -1
              , 0
              , 1
              , 2
              , "Very Low"
              , "Moderate"
              , "Normal"
              , "High"
              , "Emergency"
            ]
          }
      };
    }
    break;
  case 'Linux':
    cmd = {
        type: "Linux"
      , pkg: "notify-send"
      , msg: ''
      , sticky: '-t 0'
      , icon: '-i'
      , priority: {
          cmd: '-u'
        , range: [
            "low"
          , "normal"
          , "critical"
        ]
      }
    };
    break;
  case 'Windows_NT':
    cmd = {
        type: "Windows"
      , pkg: "growlnotify"
      , msg: ''
      , sticky: '/s:true'
      , title: '/t:'
      , icon: '/i:'
      , priority: {
            cmd: '/p:'
          , range: [
              -2
            , -1
            , 0
            , 1
            , 2
          ]
        }
    };
    break;
}
/**
 * Expose `growl`.
 */
exports = module.exports = growl;
/**
 * Node-growl version.
 */
exports.version = '1.4.1'
/**
 * Send growl notification _msg_ with _options_.
 *
 * Options:
 *
 *  - title   Notification title
 *  - sticky  Make the notification stick (defaults to false)
 *  - priority  Specify an int or named key (default is 0)
 *  - name    Application name (defaults to growlnotify)
 *  - image
 *    - path to an icon sets --iconpath
 *    - path to an image sets --image
 *    - capitalized word sets --appIcon
 *    - filename uses extname as --icon
 *    - otherwise treated as --icon
 *
 * Examples:
 *
 *   growl('New email')
 *   growl('5 new emails', { title: 'Thunderbird' })
 *   growl('Email sent', function(){
 *     // ... notification sent
 *   })
 *
 * @param {string} msg
 * @param {object} options
 * @param {function} fn
 * @api public
 */
function growl(msg, options, fn) {
  var image
    , args
    , options = options || {}
    , fn = fn || function(){};
  // noop
  if (!cmd) return fn(new Error('growl not supported on this platform'));
  args = [cmd.pkg];
  // image
  if (image = options.image) {
    switch(cmd.type) {
      case 'Darwin-Growl':
        var flag, ext = path.extname(image).substr(1)
        flag = flag || ext == 'icns' && 'iconpath'
        flag = flag || /^[A-Z]/.test(image) && 'appIcon'
        flag = flag || /^png|gif|jpe?g$/.test(ext) && 'image'
        flag = flag || ext && (image = ext) && 'icon'
        flag = flag || 'icon'
        args.push('--' + flag, image)
        break;
      case 'Linux':
        args.push(cmd.icon + " " + image);
        break;
      case 'Windows':
        args.push(cmd.icon + quote(image));
        break;
    }
  }
  // sticky
  if (options.sticky) args.push(cmd.sticky);
  // priority
  if (options.priority) {
    var priority = options.priority + '';
    var checkindexOf = cmd.priority.range.indexOf(priority);
    if (~cmd.priority.range.indexOf(priority)) {
      args.push(cmd.priority, options.priority);
    }
  }
  // name
  if (options.name && cmd.type === "Darwin-Growl") {
    args.push('--name', options.name);
  }
  switch(cmd.type) {
    case 'Darwin-Growl':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) args.push(quote(options.title));
      break;
    case 'Darwin-NotificationCenter':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) {
        args.push(cmd.title);
        args.push(quote(options.title));
      }
      if (options.subtitle) {
        args.push(cmd.subtitle);
        args.push(quote(options.title));
      }
      break;
    case 'Darwin-Growl':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) args.push(quote(options.title));
      break;
    case 'Linux':
      if (options.title) {
        args.push(quote(options.title));
        args.push(cmd.msg);
        args.push(quote(msg));
      } else {
        args.push(quote(msg));
      }
      break;
    case 'Windows':
      args.push(quote(msg));
      if (options.title) args.push(cmd.title + quote(options.title));
      break;
  }
  // execute
  exec(args.join(' '), fn);
};
    }
  };
});
asyncmachineTest.module(12, function(/* parent */){
  return {
    'id': 'lib/growl',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Growl - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)
/**
 * Module dependencies.
 */
var exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , exists = fs.existsSync || path.existsSync
  , os = require('os')
  , quote = JSON.stringify
  , cmd;
function which(name) {
  var paths = process.env.PATH.split(':');
  var loc;
  
  for (var i = 0, len = paths.length; i < len; ++i) {
    loc = path.join(paths[i], name);
    if (exists(loc)) return loc;
  }
}
switch(os.type()) {
  case 'Darwin':
    if (which('terminal-notifier')) {
      cmd = {
          type: "Darwin-NotificationCenter"
        , pkg: "terminal-notifier"
        , msg: '-message'
        , title: '-title'
        , subtitle: '-subtitle'
        , priority: {
              cmd: '-execute'
            , range: []
          }
      };
    } else {
      cmd = {
          type: "Darwin-Growl"
        , pkg: "growlnotify"
        , msg: '-m'
        , sticky: '--sticky'
        , priority: {
              cmd: '--priority'
            , range: [
                -2
              , -1
              , 0
              , 1
              , 2
              , "Very Low"
              , "Moderate"
              , "Normal"
              , "High"
              , "Emergency"
            ]
          }
      };
    }
    break;
  case 'Linux':
    cmd = {
        type: "Linux"
      , pkg: "notify-send"
      , msg: ''
      , sticky: '-t 0'
      , icon: '-i'
      , priority: {
          cmd: '-u'
        , range: [
            "low"
          , "normal"
          , "critical"
        ]
      }
    };
    break;
  case 'Windows_NT':
    cmd = {
        type: "Windows"
      , pkg: "growlnotify"
      , msg: ''
      , sticky: '/s:true'
      , title: '/t:'
      , icon: '/i:'
      , priority: {
            cmd: '/p:'
          , range: [
              -2
            , -1
            , 0
            , 1
            , 2
          ]
        }
    };
    break;
}
/**
 * Expose `growl`.
 */
exports = module.exports = growl;
/**
 * Node-growl version.
 */
exports.version = '1.4.1'
/**
 * Send growl notification _msg_ with _options_.
 *
 * Options:
 *
 *  - title   Notification title
 *  - sticky  Make the notification stick (defaults to false)
 *  - priority  Specify an int or named key (default is 0)
 *  - name    Application name (defaults to growlnotify)
 *  - image
 *    - path to an icon sets --iconpath
 *    - path to an image sets --image
 *    - capitalized word sets --appIcon
 *    - filename uses extname as --icon
 *    - otherwise treated as --icon
 *
 * Examples:
 *
 *   growl('New email')
 *   growl('5 new emails', { title: 'Thunderbird' })
 *   growl('Email sent', function(){
 *     // ... notification sent
 *   })
 *
 * @param {string} msg
 * @param {object} options
 * @param {function} fn
 * @api public
 */
function growl(msg, options, fn) {
  var image
    , args
    , options = options || {}
    , fn = fn || function(){};
  // noop
  if (!cmd) return fn(new Error('growl not supported on this platform'));
  args = [cmd.pkg];
  // image
  if (image = options.image) {
    switch(cmd.type) {
      case 'Darwin-Growl':
        var flag, ext = path.extname(image).substr(1)
        flag = flag || ext == 'icns' && 'iconpath'
        flag = flag || /^[A-Z]/.test(image) && 'appIcon'
        flag = flag || /^png|gif|jpe?g$/.test(ext) && 'image'
        flag = flag || ext && (image = ext) && 'icon'
        flag = flag || 'icon'
        args.push('--' + flag, image)
        break;
      case 'Linux':
        args.push(cmd.icon + " " + image);
        break;
      case 'Windows':
        args.push(cmd.icon + quote(image));
        break;
    }
  }
  // sticky
  if (options.sticky) args.push(cmd.sticky);
  // priority
  if (options.priority) {
    var priority = options.priority + '';
    var checkindexOf = cmd.priority.range.indexOf(priority);
    if (~cmd.priority.range.indexOf(priority)) {
      args.push(cmd.priority, options.priority);
    }
  }
  // name
  if (options.name && cmd.type === "Darwin-Growl") {
    args.push('--name', options.name);
  }
  switch(cmd.type) {
    case 'Darwin-Growl':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) args.push(quote(options.title));
      break;
    case 'Darwin-NotificationCenter':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) {
        args.push(cmd.title);
        args.push(quote(options.title));
      }
      if (options.subtitle) {
        args.push(cmd.subtitle);
        args.push(quote(options.title));
      }
      break;
    case 'Darwin-Growl':
      args.push(cmd.msg);
      args.push(quote(msg));
      if (options.title) args.push(quote(options.title));
      break;
    case 'Linux':
      if (options.title) {
        args.push(quote(options.title));
        args.push(cmd.msg);
        args.push(quote(msg));
      } else {
        args.push(quote(msg));
      }
      break;
    case 'Windows':
      args.push(quote(msg));
      if (options.title) args.push(cmd.title + quote(options.title));
      break;
  }
  // execute
  exec(args.join(' '), fn);
};
    }
  };
});
asyncmachineTest.pkg(10, function(parents){
  return {
    'id':13,
    'name':'jade',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
module.exports = process.env.JADE_COV
  ? require('./lib-cov/jade')
  : require('./lib/jade');
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/compiler',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - Compiler
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var nodes = require('./nodes')
  , filters = require('./filters')
  , doctypes = require('./doctypes')
  , selfClosing = require('./self-closing')
  , runtime = require('./runtime')
  , utils = require('./utils');
// if browser
//
// if (!Object.keys) {
//   Object.keys = function(obj){
//     var arr = [];
//     for (var key in obj) {
//       if (obj.hasOwnProperty(key)) {
//         arr.push(key);
//       }
//     }
//     return arr;
//   }
// }
//
// if (!String.prototype.trimLeft) {
//   String.prototype.trimLeft = function(){
//     return this.replace(/^\s+/, '');
//   }
// }
//
// end
/**
 * Initialize `Compiler` with the given `node`.
 *
 * @param {Node} node
 * @param {Object} options
 * @api public
 */
var Compiler = module.exports = function Compiler(node, options) {
  this.options = options = options || {};
  this.node = node;
  this.hasCompiledDoctype = false;
  this.hasCompiledTag = false;
  this.pp = options.pretty || false;
  this.debug = false !== options.compileDebug;
  this.indents = 0;
  this.parentIndents = 0;
  if (options.doctype) this.setDoctype(options.doctype);
};
/**
 * Compiler prototype.
 */
Compiler.prototype = {
  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */
  compile: function(){
    this.buf = ['var interp;'];
    if (this.pp) this.buf.push("var __indent = [];");
    this.lastBufferedIdx = -1;
    this.visit(this.node);
    return this.buf.join('\n');
  },
  /**
   * Sets the default doctype `name`. Sets terse mode to `true` when
   * html 5 is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {string} name
   * @api public
   */
  setDoctype: function(name){
    var doctype = doctypes[(name || 'default').toLowerCase()];
    doctype = doctype || '<!DOCTYPE ' + name + '>';
    this.doctype = doctype;
    this.terse = '5' == name || 'html' == name;
    this.xml = 0 == this.doctype.indexOf('<?xml');
  },
  /**
   * Buffer the given `str` optionally escaped.
   *
   * @param {String} str
   * @param {Boolean} esc
   * @api public
   */
  buffer: function(str, esc){
    if (esc) str = utils.escape(str);
    if (this.lastBufferedIdx == this.buf.length) {
      this.lastBuffered += str;
      this.buf[this.lastBufferedIdx - 1] = "buf.push('" + this.lastBuffered + "');"
    } else {
      this.buf.push("buf.push('" + str + "');");
      this.lastBuffered = str;
      this.lastBufferedIdx = this.buf.length;
    }
  },
  /**
   * Buffer an indent based on the current `indent`
   * property and an additional `offset`.
   *
   * @param {Number} offset
   * @param {Boolean} newline
   * @api public
   */
  
  prettyIndent: function(offset, newline){
    offset = offset || 0;
    newline = newline ? '\\n' : '';
    this.buffer(newline + Array(this.indents + offset).join('  '));
    if (this.parentIndents)
      this.buf.push("buf.push.apply(buf, __indent);");
  },
  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */
  visit: function(node){
    var debug = this.debug;
    if (debug) {
      this.buf.push('__jade.unshift({ lineno: ' + node.line
        + ', filename: ' + (node.filename
          ? JSON.stringify(node.filename)
          : '__jade[0].filename')
        + ' });');
    }
    // Massive hack to fix our context
    // stack for - else[ if] etc
    if (false === node.debug && this.debug) {
      this.buf.pop();
      this.buf.pop();
    }
    this.visitNode(node);
    if (debug) this.buf.push('__jade.shift();');
  },
  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */
  visitNode: function(node){
    var name = node.constructor.name
      || node.constructor.toString().match(/function ([^(\s]+)()/)[1];
    return this['visit' + name](node);
  },
  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */
  visitCase: function(node){
    var _ = this.withinCase;
    this.withinCase = true;
    this.buf.push('switch (' + node.expr + '){');
    this.visit(node.block);
    this.buf.push('}');
    this.withinCase = _;
  },
  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */
  visitWhen: function(node){
    if ('default' == node.expr) {
      this.buf.push('default:');
    } else {
      this.buf.push('case ' + node.expr + ':');
    }
    this.visit(node.block);
    this.buf.push('  break;');
  },
  /**
   * Visit literal `node`.
   *
   * @param {Literal} node
   * @api public
   */
  visitLiteral: function(node){
    var str = node.str.replace(/\n/g, '\\\\n');
    this.buffer(str);
  },
  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */
  visitBlock: function(block){
    var len = block.nodes.length
      , escape = this.escape
      , pp = this.pp
    
    // Block keyword has a special meaning in mixins
    if (this.parentIndents && block.mode) {
      if (pp) this.buf.push("__indent.push('" + Array(this.indents + 1).join('  ') + "');")
      this.buf.push('block && block();');
      if (pp) this.buf.push("__indent.pop();")
      return;
    }
    
    // Pretty print multi-line text
    if (pp && len > 1 && !escape && block.nodes[0].isText && block.nodes[1].isText)
      this.prettyIndent(1, true);
    
    for (var i = 0; i < len; ++i) {
      // Pretty print text
      if (pp && i > 0 && !escape && block.nodes[i].isText && block.nodes[i-1].isText)
        this.prettyIndent(1, false);
      
      this.visit(block.nodes[i]);
      // Multiple text nodes are separated by newlines
      if (block.nodes[i+1] && block.nodes[i].isText && block.nodes[i+1].isText)
        this.buffer('\\n');
    }
  },
  /**
   * Visit `doctype`. Sets terse mode to `true` when html 5
   * is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {Doctype} doctype
   * @api public
   */
  visitDoctype: function(doctype){
    if (doctype && (doctype.val || !this.doctype)) {
      this.setDoctype(doctype.val || 'default');
    }
    if (this.doctype) this.buffer(this.doctype);
    this.hasCompiledDoctype = true;
  },
  /**
   * Visit `mixin`, generating a function that
   * may be called within the template.
   *
   * @param {Mixin} mixin
   * @api public
   */
  visitMixin: function(mixin){
    var name = mixin.name.replace(/-/g, '_') + '_mixin'
      , args = mixin.args || ''
      , block = mixin.block
      , attrs = mixin.attrs
      , pp = this.pp;
    if (mixin.call) {
      if (pp) this.buf.push("__indent.push('" + Array(this.indents + 1).join('  ') + "');")
      if (block || attrs.length) {
        
        this.buf.push(name + '.call({');
        
        if (block) {
          this.buf.push('block: function(){');
          
          // Render block with no indents, dynamically added when rendered
          this.parentIndents++;
          var _indents = this.indents;
          this.indents = 0;
          this.visit(mixin.block);
          this.indents = _indents;
          this.parentIndents--;
          
          if (attrs.length) {
            this.buf.push('},');
          } else {
            this.buf.push('}');
          }
        }
        
        if (attrs.length) {
          var val = this.attrs(attrs);
          if (val.inherits) {
            this.buf.push('attributes: merge({' + val.buf
                + '}, attributes), escaped: merge(' + val.escaped + ', escaped, true)');
          } else {
            this.buf.push('attributes: {' + val.buf + '}, escaped: ' + val.escaped);
          }
        }
        
        if (args) {
          this.buf.push('}, ' + args + ');');
        } else {
          this.buf.push('});');
        }
        
      } else {
        this.buf.push(name + '(' + args + ');');
      }
      if (pp) this.buf.push("__indent.pop();")
    } else {
      this.buf.push('var ' + name + ' = function(' + args + '){');
      this.buf.push('var block = this.block, attributes = this.attributes || {}, escaped = this.escaped || {};');
      this.parentIndents++;
      this.visit(block);
      this.parentIndents--;
      this.buf.push('};');
    }
  },
  /**
   * Visit `tag` buffering tag markup, generating
   * attributes, visiting the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @api public
   */
  visitTag: function(tag){
    this.indents++;
    var name = tag.name
      , pp = this.pp;
    if (tag.buffer) name = "' + (" + name + ") + '";
    if (!this.hasCompiledTag) {
      if (!this.hasCompiledDoctype && 'html' == name) {
        this.visitDoctype();
      }
      this.hasCompiledTag = true;
    }
    // pretty print
    if (pp && !tag.isInline())
      this.prettyIndent(0, true);
    if ((~selfClosing.indexOf(name) || tag.selfClosing) && !this.xml) {
      this.buffer('<' + name);
      this.visitAttributes(tag.attrs);
      this.terse
        ? this.buffer('>')
        : this.buffer('/>');
    } else {
      // Optimize attributes buffering
      if (tag.attrs.length) {
        this.buffer('<' + name);
        if (tag.attrs.length) this.visitAttributes(tag.attrs);
        this.buffer('>');
      } else {
        this.buffer('<' + name + '>');
      }
      if (tag.code) this.visitCode(tag.code);
      this.escape = 'pre' == tag.name;
      this.visit(tag.block);
      // pretty print
      if (pp && !tag.isInline() && 'pre' != tag.name && !tag.canInline())
        this.prettyIndent(0, true);
      this.buffer('</' + name + '>');
    }
    this.indents--;
  },
  /**
   * Visit `filter`, throwing when the filter does not exist.
   *
   * @param {Filter} filter
   * @api public
   */
  visitFilter: function(filter){
    var fn = filters[filter.name];
    // unknown filter
    if (!fn) {
      if (filter.isASTFilter) {
        throw new Error('unknown ast filter "' + filter.name + ':"');
      } else {
        throw new Error('unknown filter ":' + filter.name + '"');
      }
    }
    if (filter.isASTFilter) {
      this.buf.push(fn(filter.block, this, filter.attrs));
    } else {
      var text = filter.block.nodes.map(function(node){ return node.val }).join('\n');
      filter.attrs = filter.attrs || {};
      filter.attrs.filename = this.options.filename;
      this.buffer(utils.text(fn(text, filter.attrs)));
    }
  },
  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */
  visitText: function(text){
    text = utils.text(text.val.replace(/\\/g, '\\\\'));
    if (this.escape) text = escape(text);
    this.buffer(text);
  },
  /**
   * Visit a `comment`, only buffering when the buffer flag is set.
   *
   * @param {Comment} comment
   * @api public
   */
  visitComment: function(comment){
    if (!comment.buffer) return;
    if (this.pp) this.prettyIndent(1, true);
    this.buffer('<!--' + utils.escape(comment.val) + '-->');
  },
  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */
  visitBlockComment: function(comment){
    if (!comment.buffer) return;
    if (0 == comment.val.trim().indexOf('if')) {
      this.buffer('<!--[' + comment.val.trim() + ']>');
      this.visit(comment.block);
      this.buffer('<![endif]-->');
    } else {
      this.buffer('<!--' + comment.val);
      this.visit(comment.block);
      this.buffer('-->');
    }
  },
  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */
  visitCode: function(code){
    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control
    // Buffer code
    if (code.buffer) {
      var val = code.val.trimLeft();
      this.buf.push('var __val__ = ' + val);
      val = 'null == __val__ ? "" : __val__';
      if (code.escape) val = 'escape(' + val + ')';
      this.buf.push("buf.push(" + val + ");");
    } else {
      this.buf.push(code.val);
    }
    // Block support
    if (code.block) {
      if (!code.buffer) this.buf.push('{');
      this.visit(code.block);
      if (!code.buffer) this.buf.push('}');
    }
  },
  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */
  visitEach: function(each){
    this.buf.push(''
      + '// iterate ' + each.obj + '\n'
      + ';(function(){\n'
      + '  if (\'number\' == typeof ' + each.obj + '.length) {\n'
      + '    for (var ' + each.key + ' = 0, $$l = ' + each.obj + '.length; ' + each.key + ' < $$l; ' + each.key + '++) {\n'
      + '      var ' + each.val + ' = ' + each.obj + '[' + each.key + '];\n');
    this.visit(each.block);
    this.buf.push(''
      + '    }\n'
      + '  } else {\n'
      + '    for (var ' + each.key + ' in ' + each.obj + ') {\n'
      // if browser
      // + '      if (' + each.obj + '.hasOwnProperty(' + each.key + ')){'
      // end
      + '      var ' + each.val + ' = ' + each.obj + '[' + each.key + '];\n');
    this.visit(each.block);
    // if browser
    // this.buf.push('      }\n');
    // end
    this.buf.push('   }\n  }\n}).call(this);\n');
  },
  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */
  visitAttributes: function(attrs){
    var val = this.attrs(attrs);
    if (val.inherits) {
      this.buf.push("buf.push(attrs(merge({ " + val.buf +
          " }, attributes), merge(" + val.escaped + ", escaped, true)));");
    } else if (val.constant) {
      eval('var buf={' + val.buf + '};');
      this.buffer(runtime.attrs(buf, JSON.parse(val.escaped)), true);
    } else {
      this.buf.push("buf.push(attrs({ " + val.buf + " }, " + val.escaped + "));");
    }
  },
  /**
   * Compile attributes.
   */
  attrs: function(attrs){
    var buf = []
      , classes = []
      , escaped = {}
      , constant = attrs.every(function(attr){ return isConstant(attr.val) })
      , inherits = false;
    if (this.terse) buf.push('terse: true');
    attrs.forEach(function(attr){
      if (attr.name == 'attributes') return inherits = true;
      escaped[attr.name] = attr.escaped;
      if (attr.name == 'class') {
        classes.push('(' + attr.val + ')');
      } else {
        var pair = "'" + attr.name + "':(" + attr.val + ')';
        buf.push(pair);
      }
    });
    if (classes.length) {
      classes = classes.join(" + ' ' + ");
      buf.push("class: " + classes);
    }
    return {
      buf: buf.join(', ').replace('class:', '"class":'),
      escaped: JSON.stringify(escaped),
      inherits: inherits,
      constant: constant
    };
  }
};
/**
 * Check if expression can be evaluated to a constant
 *
 * @param {String} expression
 * @return {Boolean}
 * @api private
 */
function isConstant(val){
  // Check strings/literals
  if (/^ *("([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|true|false|null|undefined) *$/i.test(val))
    return true;
  
  // Check numbers
  if (!isNaN(Number(val)))
    return true;
  
  // Check arrays
  var matches;
  if (matches = /^ *\[(.*)\] *$/.exec(val))
    return matches[1].split(',').every(isConstant);
  
  return false;
}
/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */
function escape(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/doctypes',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - doctypes
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
module.exports = {
    '5': '<!DOCTYPE html>'
  , 'default': '<!DOCTYPE html>'
  , 'xml': '<?xml version="1.0" encoding="utf-8" ?>'
  , 'transitional': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
  , 'strict': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
  , 'frameset': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">'
  , '1.1': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
  , 'basic': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">'
  , 'mobile': '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">'
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/filters',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - filters
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
module.exports = {
  
  /**
   * Wrap text with CDATA block.
   */
  
  cdata: function(str){
    return '<![CDATA[\\n' + str + '\\n]]>';
  },
  
  /**
   * Transform sass to css, wrapped in style tags.
   */
  
  sass: function(str){
    str = str.replace(/\\n/g, '\n');
    var sass = require('sass').render(str).replace(/\n/g, '\\n');
    return '<style type="text/css">' + sass + '</style>'; 
  },
  
  /**
   * Transform stylus to css, wrapped in style tags.
   */
  
  stylus: function(str, options){
    var ret;
    str = str.replace(/\\n/g, '\n');
    var stylus = require('stylus');
    stylus(str, options).render(function(err, css){
      if (err) throw err;
      ret = css.replace(/\n/g, '\\n');
    });
    return '<style type="text/css">' + ret + '</style>'; 
  },
  
  /**
   * Transform less to css, wrapped in style tags.
   */
  
  less: function(str){
    var ret;
    str = str.replace(/\\n/g, '\n');
    require('less').render(str, function(err, css){
      if (err) throw err;
      ret = '<style type="text/css">' + css.replace(/\n/g, '\\n') + '</style>';  
    });
    return ret;
  },
  
  /**
   * Transform markdown to html.
   */
  
  markdown: function(str){
    var md;
    // support markdown / discount
    try {
      md = require('markdown');
    } catch (err){
      try {
        md = require('discount');
      } catch (err) {
        try {
          md = require('markdown-js');
        } catch (err) {
          try {
            md = require('marked');
          } catch (err) {
            throw new
              Error('Cannot find markdown library, install markdown, discount, or marked.');
          }
        }
      }
    }
    str = str.replace(/\\n/g, '\n');
    return md.parse(str).replace(/\n/g, '\\n').replace(/'/g,'&#39;');
  },
  
  /**
   * Transform coffeescript to javascript.
   */
  coffeescript: function(str){
    str = str.replace(/\\n/g, '\n');
    var js = require('coffee-script').compile(str).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
    return '<script type="text/javascript">\\n' + js + '</script>';
  }
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/inline-tags',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - inline tags
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
module.exports = [
    'a'
  , 'abbr'
  , 'acronym'
  , 'b'
  , 'br'
  , 'code'
  , 'em'
  , 'font'
  , 'i'
  , 'img'
  , 'ins'
  , 'kbd'
  , 'map'
  , 'samp'
  , 'small'
  , 'span'
  , 'strong'
  , 'sub'
  , 'sup'
];
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/jade',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * Jade
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Parser = require('./parser')
  , Lexer = require('./lexer')
  , Compiler = require('./compiler')
  , runtime = require('./runtime')
// if node
  , fs = require('fs');
// end
/**
 * Library version.
 */
exports.version = '0.26.3';
/**
 * Expose self closing tags.
 */
exports.selfClosing = require('./self-closing');
/**
 * Default supported doctypes.
 */
exports.doctypes = require('./doctypes');
/**
 * Text filters.
 */
exports.filters = require('./filters');
/**
 * Utilities.
 */
exports.utils = require('./utils');
/**
 * Expose `Compiler`.
 */
exports.Compiler = Compiler;
/**
 * Expose `Parser`.
 */
exports.Parser = Parser;
/**
 * Expose `Lexer`.
 */
exports.Lexer = Lexer;
/**
 * Nodes.
 */
exports.nodes = require('./nodes');
/**
 * Jade runtime helpers.
 */
exports.runtime = runtime;
/**
 * Template function cache.
 */
exports.cache = {};
/**
 * Parse the given `str` of jade and return a function body.
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api private
 */
function parse(str, options){
  try {
    // Parse
    var parser = new Parser(str, options.filename, options);
    // Compile
    var compiler = new (options.compiler || Compiler)(parser.parse(), options)
      , js = compiler.compile();
    // Debug compiler
    if (options.debug) {
      console.error('\nCompiled Function:\n\n\033[90m%s\033[0m', js.replace(/^/gm, '  '));
    }
    return ''
      + 'var buf = [];\n'
      + (options.self
        ? 'var self = locals || {};\n' + js
        : 'with (locals || {}) {\n' + js + '\n}\n')
      + 'return buf.join("");';
  } catch (err) {
    parser = parser.context();
    runtime.rethrow(err, parser.filename, parser.lexer.lineno);
  }
}
/**
 * Compile a `Function` representation of the given jade `str`.
 *
 * Options:
 *
 *   - `compileDebug` when `false` debugging code is stripped from the compiled template
 *   - `client` when `true` the helper functions `escape()` etc will reference `jade.escape()`
 *      for use with the Jade client-side runtime.js
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */
exports.compile = function(str, options){
  var options = options || {}
    , client = options.client
    , filename = options.filename
      ? JSON.stringify(options.filename)
      : 'undefined'
    , fn;
  if (options.compileDebug !== false) {
    fn = [
        'var __jade = [{ lineno: 1, filename: ' + filename + ' }];'
      , 'try {'
      , parse(String(str), options)
      , '} catch (err) {'
      , '  rethrow(err, __jade[0].filename, __jade[0].lineno);'
      , '}'
    ].join('\n');
  } else {
    fn = parse(String(str), options);
  }
  if (client) {
    fn = 'attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;\n' + fn;
  }
  fn = new Function('locals, attrs, escape, rethrow, merge', fn);
  if (client) return fn;
  return function(locals){
    return fn(locals, runtime.attrs, runtime.escape, runtime.rethrow, runtime.merge);
  };
};
/**
 * Render the given `str` of jade and invoke
 * the callback `fn(err, str)`.
 *
 * Options:
 *
 *   - `cache` enable template caching
 *   - `filename` filename required for `include` / `extends` and caching
 *
 * @param {String} str
 * @param {Object|Function} options or fn
 * @param {Function} fn
 * @api public
 */
exports.render = function(str, options, fn){
  // swap args
  if ('function' == typeof options) {
    fn = options, options = {};
  }
  // cache requires .filename
  if (options.cache && !options.filename) {
    return fn(new Error('the "filename" option is required for caching'));
  }
  try {
    var path = options.filename;
    var tmpl = options.cache
      ? exports.cache[path] || (exports.cache[path] = exports.compile(str, options))
      : exports.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};
/**
 * Render a Jade file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */
exports.renderFile = function(path, options, fn){
  var key = path + ':string';
  if ('function' == typeof options) {
    fn = options, options = {};
  }
  try {
    options.filename = path;
    var str = options.cache
      ? exports.cache[key] || (exports.cache[key] = fs.readFileSync(path, 'utf8'))
      : fs.readFileSync(path, 'utf8');
    exports.render(str, options, fn);
  } catch (err) {
    fn(err);
  }
};
/**
 * Express support.
 */
exports.__express = exports.renderFile;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/lexer',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - Lexer
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Initialize `Lexer` with the given `str`.
 *
 * Options:
 *
 *   - `colons` allow colons for attr delimiters
 *
 * @param {String} str
 * @param {Object} options
 * @api private
 */
var Lexer = module.exports = function Lexer(str, options) {
  options = options || {};
  this.input = str.replace(/\r\n|\r/g, '\n');
  this.colons = options.colons;
  this.deferredTokens = [];
  this.lastIndents = 0;
  this.lineno = 1;
  this.stash = [];
  this.indentStack = [];
  this.indentRe = null;
  this.pipeless = false;
};
/**
 * Lexer prototype.
 */
Lexer.prototype = {
  
  /**
   * Construct a token with the given `type` and `val`.
   *
   * @param {String} type
   * @param {String} val
   * @return {Object}
   * @api private
   */
  
  tok: function(type, val){
    return {
        type: type
      , line: this.lineno
      , val: val
    }
  },
  
  /**
   * Consume the given `len` of input.
   *
   * @param {Number} len
   * @api private
   */
  
  consume: function(len){
    this.input = this.input.substr(len);
  },
  
  /**
   * Scan for `type` with the given `regexp`.
   *
   * @param {String} type
   * @param {RegExp} regexp
   * @return {Object}
   * @api private
   */
  
  scan: function(regexp, type){
    var captures;
    if (captures = regexp.exec(this.input)) {
      this.consume(captures[0].length);
      return this.tok(type, captures[1]);
    }
  },
  
  /**
   * Defer the given `tok`.
   *
   * @param {Object} tok
   * @api private
   */
  
  defer: function(tok){
    this.deferredTokens.push(tok);
  },
  
  /**
   * Lookahead `n` tokens.
   *
   * @param {Number} n
   * @return {Object}
   * @api private
   */
  
  lookahead: function(n){
    var fetch = n - this.stash.length;
    while (fetch-- > 0) this.stash.push(this.next());
    return this.stash[--n];
  },
  
  /**
   * Return the indexOf `start` / `end` delimiters.
   *
   * @param {String} start
   * @param {String} end
   * @return {Number}
   * @api private
   */
  
  indexOfDelimiters: function(start, end){
    var str = this.input
      , nstart = 0
      , nend = 0
      , pos = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
      if (start == str.charAt(i)) {
        ++nstart;
      } else if (end == str.charAt(i)) {
        if (++nend == nstart) {
          pos = i;
          break;
        }
      }
    }
    return pos;
  },
  
  /**
   * Stashed token.
   */
  
  stashed: function() {
    return this.stash.length
      && this.stash.shift();
  },
  
  /**
   * Deferred token.
   */
  
  deferred: function() {
    return this.deferredTokens.length 
      && this.deferredTokens.shift();
  },
  
  /**
   * end-of-source.
   */
  
  eos: function() {
    if (this.input.length) return;
    if (this.indentStack.length) {
      this.indentStack.shift();
      return this.tok('outdent');
    } else {
      return this.tok('eos');
    }
  },
  /**
   * Blank line.
   */
  
  blank: function() {
    var captures;
    if (captures = /^\n *\n/.exec(this.input)) {
      this.consume(captures[0].length - 1);
      if (this.pipeless) return this.tok('text', '');
      return this.next();
    }
  },
  /**
   * Comment.
   */
  
  comment: function() {
    var captures;
    if (captures = /^ *\/\/(-)?([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('comment', captures[2]);
      tok.buffer = '-' != captures[1];
      return tok;
    }
  },
  /**
   * Interpolated tag.
   */
  interpolation: function() {
    var captures;
    if (captures = /^#\{(.*?)\}/.exec(this.input)) {
      this.consume(captures[0].length);
      return this.tok('interpolation', captures[1]);
    }
  },
  /**
   * Tag.
   */
  
  tag: function() {
    var captures;
    if (captures = /^(\w[-:\w]*)(\/?)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok, name = captures[1];
      if (':' == name[name.length - 1]) {
        name = name.slice(0, -1);
        tok = this.tok('tag', name);
        this.defer(this.tok(':'));
        while (' ' == this.input[0]) this.input = this.input.substr(1);
      } else {
        tok = this.tok('tag', name);
      }
      tok.selfClosing = !! captures[2];
      return tok;
    }
  },
  
  /**
   * Filter.
   */
  
  filter: function() {
    return this.scan(/^:(\w+)/, 'filter');
  },
  
  /**
   * Doctype.
   */
  
  doctype: function() {
    return this.scan(/^(?:!!!|doctype) *([^\n]+)?/, 'doctype');
  },
  /**
   * Id.
   */
  
  id: function() {
    return this.scan(/^#([\w-]+)/, 'id');
  },
  
  /**
   * Class.
   */
  
  className: function() {
    return this.scan(/^\.([\w-]+)/, 'class');
  },
  
  /**
   * Text.
   */
  
  text: function() {
    return this.scan(/^(?:\| ?| ?)?([^\n]+)/, 'text');
  },
  /**
   * Extends.
   */
  
  "extends": function() {
    return this.scan(/^extends? +([^\n]+)/, 'extends');
  },
  /**
   * Block prepend.
   */
  
  prepend: function() {
    var captures;
    if (captures = /^prepend +([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var mode = 'prepend'
        , name = captures[1]
        , tok = this.tok('block', name);
      tok.mode = mode;
      return tok;
    }
  },
  
  /**
   * Block append.
   */
  
  append: function() {
    var captures;
    if (captures = /^append +([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var mode = 'append'
        , name = captures[1]
        , tok = this.tok('block', name);
      tok.mode = mode;
      return tok;
    }
  },
  /**
   * Block.
   */
  
  block: function() {
    var captures;
    if (captures = /^block\b *(?:(prepend|append) +)?([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var mode = captures[1] || 'replace'
        , name = captures[2]
        , tok = this.tok('block', name);
      tok.mode = mode;
      return tok;
    }
  },
  /**
   * Yield.
   */
  
  yield: function() {
    return this.scan(/^yield */, 'yield');
  },
  /**
   * Include.
   */
  
  include: function() {
    return this.scan(/^include +([^\n]+)/, 'include');
  },
  /**
   * Case.
   */
  
  "case": function() {
    return this.scan(/^case +([^\n]+)/, 'case');
  },
  /**
   * When.
   */
  
  when: function() {
    return this.scan(/^when +([^:\n]+)/, 'when');
  },
  /**
   * Default.
   */
  
  "default": function() {
    return this.scan(/^default */, 'default');
  },
  /**
   * Assignment.
   */
  
  assignment: function() {
    var captures;
    if (captures = /^(\w+) += *([^;\n]+)( *;? *)/.exec(this.input)) {
      this.consume(captures[0].length);
      var name = captures[1]
        , val = captures[2];
      return this.tok('code', 'var ' + name + ' = (' + val + ');');
    }
  },
  /**
   * Call mixin.
   */
  
  call: function(){
    var captures;
    if (captures = /^\+([-\w]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('call', captures[1]);
      
      // Check for args (not attributes)
      if (captures = /^ *\((.*?)\)/.exec(this.input)) {
        if (!/^ *[-\w]+ *=/.test(captures[1])) {
          this.consume(captures[0].length);
          tok.args = captures[1];
        }
      }
      
      return tok;
    }
  },
  /**
   * Mixin.
   */
  mixin: function(){
    var captures;
    if (captures = /^mixin +([-\w]+)(?: *\((.*)\))?/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('mixin', captures[1]);
      tok.args = captures[2];
      return tok;
    }
  },
  /**
   * Conditional.
   */
  
  conditional: function() {
    var captures;
    if (captures = /^(if|unless|else if|else)\b([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var type = captures[1]
        , js = captures[2];
      switch (type) {
        case 'if': js = 'if (' + js + ')'; break;
        case 'unless': js = 'if (!(' + js + '))'; break;
        case 'else if': js = 'else if (' + js + ')'; break;
        case 'else': js = 'else'; break;
      }
      return this.tok('code', js);
    }
  },
  /**
   * While.
   */
  
  "while": function() {
    var captures;
    if (captures = /^while +([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      return this.tok('code', 'while (' + captures[1] + ')');
    }
  },
  /**
   * Each.
   */
  
  each: function() {
    var captures;
    if (captures = /^(?:- *)?(?:each|for) +(\w+)(?: *, *(\w+))? * in *([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('each', captures[1]);
      tok.key = captures[2] || '$index';
      tok.code = captures[3];
      return tok;
    }
  },
  
  /**
   * Code.
   */
  
  code: function() {
    var captures;
    if (captures = /^(!?=|-)([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var flags = captures[1];
      captures[1] = captures[2];
      var tok = this.tok('code', captures[1]);
      tok.escape = flags[0] === '=';
      tok.buffer = flags[0] === '=' || flags[1] === '=';
      return tok;
    }
  },
  
  /**
   * Attributes.
   */
  
  attrs: function() {
    if ('(' == this.input.charAt(0)) {
      var index = this.indexOfDelimiters('(', ')')
        , str = this.input.substr(1, index-1)
        , tok = this.tok('attrs')
        , len = str.length
        , colons = this.colons
        , states = ['key']
        , escapedAttr
        , key = ''
        , val = ''
        , quote
        , c
        , p;
      function state(){
        return states[states.length - 1];
      }
      function interpolate(attr) {
        return attr.replace(/#\{([^}]+)\}/g, function(_, expr){
          return quote + " + (" + expr + ") + " + quote;
        });
      }
      this.consume(index + 1);
      tok.attrs = {};
      tok.escaped = {};
      function parse(c) {
        var real = c;
        // TODO: remove when people fix ":"
        if (colons && ':' == c) c = '=';
        switch (c) {
          case ',':
          case '\n':
            switch (state()) {
              case 'expr':
              case 'array':
              case 'string':
              case 'object':
                val += c;
                break;
              default:
                states.push('key');
                val = val.trim();
                key = key.trim();
                if ('' == key) return;
                key = key.replace(/^['"]|['"]$/g, '').replace('!', '');
                tok.escaped[key] = escapedAttr;
                tok.attrs[key] = '' == val
                  ? true
                  : interpolate(val);
                key = val = '';
            }
            break;
          case '=':
            switch (state()) {
              case 'key char':
                key += real;
                break;
              case 'val':
              case 'expr':
              case 'array':
              case 'string':
              case 'object':
                val += real;
                break;
              default:
                escapedAttr = '!' != p;
                states.push('val');
            }
            break;
          case '(':
            if ('val' == state()
              || 'expr' == state()) states.push('expr');
            val += c;
            break;
          case ')':
            if ('expr' == state()
              || 'val' == state()) states.pop();
            val += c;
            break;
          case '{':
            if ('val' == state()) states.push('object');
            val += c;
            break;
          case '}':
            if ('object' == state()) states.pop();
            val += c;
            break;
          case '[':
            if ('val' == state()) states.push('array');
            val += c;
            break;
          case ']':
            if ('array' == state()) states.pop();
            val += c;
            break;
          case '"':
          case "'":
            switch (state()) {
              case 'key':
                states.push('key char');
                break;
              case 'key char':
                states.pop();
                break;
              case 'string':
                if (c == quote) states.pop();
                val += c;
                break;
              default:
                states.push('string');
                val += c;
                quote = c;
            }
            break;
          case '':
            break;
          default:
            switch (state()) {
              case 'key':
              case 'key char':
                key += c;
                break;
              default:
                val += c;
            }
        }
        p = c;
      }
      for (var i = 0; i < len; ++i) {
        parse(str.charAt(i));
      }
      parse(',');
      if ('/' == this.input.charAt(0)) {
        this.consume(1);
        tok.selfClosing = true;
      }
      return tok;
    }
  },
  
  /**
   * Indent | Outdent | Newline.
   */
  
  indent: function() {
    var captures, re;
    // established regexp
    if (this.indentRe) {
      captures = this.indentRe.exec(this.input);
    // determine regexp
    } else {
      // tabs
      re = /^\n(\t*) */;
      captures = re.exec(this.input);
      // spaces
      if (captures && !captures[1].length) {
        re = /^\n( *)/;
        captures = re.exec(this.input);
      }
      // established
      if (captures && captures[1].length) this.indentRe = re;
    }
    if (captures) {
      var tok
        , indents = captures[1].length;
      ++this.lineno;
      this.consume(indents + 1);
      if (' ' == this.input[0] || '\t' == this.input[0]) {
        throw new Error('Invalid indentation, you can use tabs or spaces but not both');
      }
      // blank line
      if ('\n' == this.input[0]) return this.tok('newline');
      // outdent
      if (this.indentStack.length && indents < this.indentStack[0]) {
        while (this.indentStack.length && this.indentStack[0] > indents) {
          this.stash.push(this.tok('outdent'));
          this.indentStack.shift();
        }
        tok = this.stash.pop();
      // indent
      } else if (indents && indents != this.indentStack[0]) {
        this.indentStack.unshift(indents);
        tok = this.tok('indent', indents);
      // newline
      } else {
        tok = this.tok('newline');
      }
      return tok;
    }
  },
  /**
   * Pipe-less text consumed only when 
   * pipeless is true;
   */
  pipelessText: function() {
    if (this.pipeless) {
      if ('\n' == this.input[0]) return;
      var i = this.input.indexOf('\n');
      if (-1 == i) i = this.input.length;
      var str = this.input.substr(0, i);
      this.consume(str.length);
      return this.tok('text', str);
    }
  },
  /**
   * ':'
   */
  colon: function() {
    return this.scan(/^: */, ':');
  },
  /**
   * Return the next token object, or those
   * previously stashed by lookahead.
   *
   * @return {Object}
   * @api private
   */
  
  advance: function(){
    return this.stashed()
      || this.next();
  },
  
  /**
   * Return the next token object.
   *
   * @return {Object}
   * @api private
   */
  
  next: function() {
    return this.deferred()
      || this.blank()
      || this.eos()
      || this.pipelessText()
      || this.yield()
      || this.doctype()
      || this.interpolation()
      || this["case"]()
      || this.when()
      || this["default"]()
      || this["extends"]()
      || this.append()
      || this.prepend()
      || this.block()
      || this.include()
      || this.mixin()
      || this.call()
      || this.conditional()
      || this.each()
      || this["while"]()
      || this.assignment()
      || this.tag()
      || this.filter()
      || this.code()
      || this.id()
      || this.className()
      || this.attrs()
      || this.indent()
      || this.comment()
      || this.colon()
      || this.text();
  }
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/attrs',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Attrs
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node'),
    Block = require('./block');
/**
 * Initialize a `Attrs` node.
 *
 * @api public
 */
var Attrs = module.exports = function Attrs() {
  this.attrs = [];
};
/**
 * Inherit from `Node`.
 */
Attrs.prototype.__proto__ = Node.prototype;
/**
 * Set attribute `name` to `val`, keep in mind these become
 * part of a raw js object literal, so to quote a value you must
 * '"quote me"', otherwise or example 'user.name' is literal JavaScript.
 *
 * @param {String} name
 * @param {String} val
 * @param {Boolean} escaped
 * @return {Tag} for chaining
 * @api public
 */
Attrs.prototype.setAttribute = function(name, val, escaped){
  this.attrs.push({ name: name, val: val, escaped: escaped });
  return this;
};
/**
 * Remove attribute `name` when present.
 *
 * @param {String} name
 * @api public
 */
Attrs.prototype.removeAttribute = function(name){
  for (var i = 0, len = this.attrs.length; i < len; ++i) {
    if (this.attrs[i] && this.attrs[i].name == name) {
      delete this.attrs[i];
    }
  }
};
/**
 * Get attribute value by `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */
Attrs.prototype.getAttribute = function(name){
  for (var i = 0, len = this.attrs.length; i < len; ++i) {
    if (this.attrs[i] && this.attrs[i].name == name) {
      return this.attrs[i].val;
    }
  }
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/block-comment',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - BlockComment
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `BlockComment` with the given `block`.
 *
 * @param {String} val
 * @param {Block} block
 * @param {Boolean} buffer
 * @api public
 */
var BlockComment = module.exports = function BlockComment(val, block, buffer) {
  this.block = block;
  this.val = val;
  this.buffer = buffer;
};
/**
 * Inherit from `Node`.
 */
BlockComment.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/block',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Block
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a new `Block` with an optional `node`.
 *
 * @param {Node} node
 * @api public
 */
var Block = module.exports = function Block(node){
  this.nodes = [];
  if (node) this.push(node);
};
/**
 * Inherit from `Node`.
 */
Block.prototype.__proto__ = Node.prototype;
/**
 * Block flag.
 */
Block.prototype.isBlock = true;
/**
 * Replace the nodes in `other` with the nodes
 * in `this` block.
 *
 * @param {Block} other
 * @api private
 */
Block.prototype.replace = function(other){
  other.nodes = this.nodes;
};
/**
 * Pust the given `node`.
 *
 * @param {Node} node
 * @return {Number}
 * @api public
 */
Block.prototype.push = function(node){
  return this.nodes.push(node);
};
/**
 * Check if this block is empty.
 *
 * @return {Boolean}
 * @api public
 */
Block.prototype.isEmpty = function(){
  return 0 == this.nodes.length;
};
/**
 * Unshift the given `node`.
 *
 * @param {Node} node
 * @return {Number}
 * @api public
 */
Block.prototype.unshift = function(node){
  return this.nodes.unshift(node);
};
/**
 * Return the "last" block, or the first `yield` node.
 *
 * @return {Block}
 * @api private
 */
Block.prototype.includeBlock = function(){
  var ret = this
    , node;
  for (var i = 0, len = this.nodes.length; i < len; ++i) {
    node = this.nodes[i];
    if (node.yield) return node;
    else if (node.textOnly) continue;
    else if (node.includeBlock) ret = node.includeBlock();
    else if (node.block && !node.block.isEmpty()) ret = node.block.includeBlock();
  }
  return ret;
};
/**
 * Return a clone of this block.
 *
 * @return {Block}
 * @api private
 */
Block.prototype.clone = function(){
  var clone = new Block;
  for (var i = 0, len = this.nodes.length; i < len; ++i) {
    clone.push(this.nodes[i].clone());
  }
  return clone;
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/case',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Case
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a new `Case` with `expr`.
 *
 * @param {String} expr
 * @api public
 */
var Case = exports = module.exports = function Case(expr, block){
  this.expr = expr;
  this.block = block;
};
/**
 * Inherit from `Node`.
 */
Case.prototype.__proto__ = Node.prototype;
var When = exports.When = function When(expr, block){
  this.expr = expr;
  this.block = block;
  this.debug = false;
};
/**
 * Inherit from `Node`.
 */
When.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/code',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Code
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `Code` node with the given code `val`.
 * Code may also be optionally buffered and escaped.
 *
 * @param {String} val
 * @param {Boolean} buffer
 * @param {Boolean} escape
 * @api public
 */
var Code = module.exports = function Code(val, buffer, escape) {
  this.val = val;
  this.buffer = buffer;
  this.escape = escape;
  if (val.match(/^ *else/)) this.debug = false;
};
/**
 * Inherit from `Node`.
 */
Code.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/comment',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Comment
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `Comment` with the given `val`, optionally `buffer`,
 * otherwise the comment may render in the output.
 *
 * @param {String} val
 * @param {Boolean} buffer
 * @api public
 */
var Comment = module.exports = function Comment(val, buffer) {
  this.val = val;
  this.buffer = buffer;
};
/**
 * Inherit from `Node`.
 */
Comment.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/doctype',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Doctype
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `Doctype` with the given `val`. 
 *
 * @param {String} val
 * @api public
 */
var Doctype = module.exports = function Doctype(val) {
  this.val = val;
};
/**
 * Inherit from `Node`.
 */
Doctype.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/each',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Each
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize an `Each` node, representing iteration
 *
 * @param {String} obj
 * @param {String} val
 * @param {String} key
 * @param {Block} block
 * @api public
 */
var Each = module.exports = function Each(obj, val, key, block) {
  this.obj = obj;
  this.val = val;
  this.key = key;
  this.block = block;
};
/**
 * Inherit from `Node`.
 */
Each.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/filter',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Filter
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node')
  , Block = require('./block');
/**
 * Initialize a `Filter` node with the given 
 * filter `name` and `block`.
 *
 * @param {String} name
 * @param {Block|Node} block
 * @api public
 */
var Filter = module.exports = function Filter(name, block, attrs) {
  this.name = name;
  this.block = block;
  this.attrs = attrs;
  this.isASTFilter = !block.nodes.every(function(node){ return node.isText });
};
/**
 * Inherit from `Node`.
 */
Filter.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
exports.Node = require('./node');
exports.Tag = require('./tag');
exports.Code = require('./code');
exports.Each = require('./each');
exports.Case = require('./case');
exports.Text = require('./text');
exports.Block = require('./block');
exports.Mixin = require('./mixin');
exports.Filter = require('./filter');
exports.Comment = require('./comment');
exports.Literal = require('./literal');
exports.BlockComment = require('./block-comment');
exports.Doctype = require('./doctype');
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/literal',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Literal
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `Literal` node with the given `str.
 *
 * @param {String} str
 * @api public
 */
var Literal = module.exports = function Literal(str) {
  this.str = str
    .replace(/\\/g, "\\\\")
    .replace(/\n|\r\n/g, "\\n")
    .replace(/'/g, "\\'");
};
/**
 * Inherit from `Node`.
 */
Literal.prototype.__proto__ = Node.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/mixin',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Mixin
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Attrs = require('./attrs');
/**
 * Initialize a new `Mixin` with `name` and `block`.
 *
 * @param {String} name
 * @param {String} args
 * @param {Block} block
 * @api public
 */
var Mixin = module.exports = function Mixin(name, args, block, call){
  this.name = name;
  this.args = args;
  this.block = block;
  this.attrs = [];
  this.call = call;
};
/**
 * Inherit from `Attrs`.
 */
Mixin.prototype.__proto__ = Attrs.prototype;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/node',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Node
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Initialize a `Node`.
 *
 * @api public
 */
var Node = module.exports = function Node(){};
/**
 * Clone this node (return itself)
 *
 * @return {Node}
 * @api private
 */
Node.prototype.clone = function(){
  return this;
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/tag',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Tag
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Attrs = require('./attrs'),
    Block = require('./block'),
    inlineTags = require('../inline-tags');
/**
 * Initialize a `Tag` node with the given tag `name` and optional `block`.
 *
 * @param {String} name
 * @param {Block} block
 * @api public
 */
var Tag = module.exports = function Tag(name, block) {
  this.name = name;
  this.attrs = [];
  this.block = block || new Block;
};
/**
 * Inherit from `Attrs`.
 */
Tag.prototype.__proto__ = Attrs.prototype;
/**
 * Clone this tag.
 *
 * @return {Tag}
 * @api private
 */
Tag.prototype.clone = function(){
  var clone = new Tag(this.name, this.block.clone());
  clone.line = this.line;
  clone.attrs = this.attrs;
  clone.textOnly = this.textOnly;
  return clone;
};
/**
 * Check if this tag is an inline tag.
 *
 * @return {Boolean}
 * @api private
 */
Tag.prototype.isInline = function(){
  return ~inlineTags.indexOf(this.name);
};
/**
 * Check if this tag's contents can be inlined.  Used for pretty printing.
 *
 * @return {Boolean}
 * @api private
 */
Tag.prototype.canInline = function(){
  var nodes = this.block.nodes;
  function isInline(node){
    // Recurse if the node is a block
    if (node.isBlock) return node.nodes.every(isInline);
    return node.isText || (node.isInline && node.isInline());
  }
  
  // Empty tag
  if (!nodes.length) return true;
  
  // Text-only or inline-only tag
  if (1 == nodes.length) return isInline(nodes[0]);
  
  // Multi-line inline-only tag
  if (this.block.nodes.every(isInline)) {
    for (var i = 1, len = nodes.length; i < len; ++i) {
      if (nodes[i-1].isText && nodes[i].isText)
        return false;
    }
    return true;
  }
  
  // Mixed tag
  return false;
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/nodes/text',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - nodes - Text
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Node = require('./node');
/**
 * Initialize a `Text` node with optional `line`.
 *
 * @param {String} line
 * @api public
 */
var Text = module.exports = function Text(line) {
  this.val = '';
  if ('string' == typeof line) this.val = line;
};
/**
 * Inherit from `Node`.
 */
Text.prototype.__proto__ = Node.prototype;
/**
 * Flag as text.
 */
Text.prototype.isText = true;
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/parser',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - Parser
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var Lexer = require('./lexer')
  , nodes = require('./nodes');
/**
 * Initialize `Parser` with the given input `str` and `filename`.
 *
 * @param {String} str
 * @param {String} filename
 * @param {Object} options
 * @api public
 */
var Parser = exports = module.exports = function Parser(str, filename, options){
  this.input = str;
  this.lexer = new Lexer(str, options);
  this.filename = filename;
  this.blocks = {};
  this.mixins = {};
  this.options = options;
  this.contexts = [this];
};
/**
 * Tags that may not contain tags.
 */
var textOnly = exports.textOnly = ['script', 'style'];
/**
 * Parser prototype.
 */
Parser.prototype = {
  /**
   * Push `parser` onto the context stack,
   * or pop and return a `Parser`.
   */
  context: function(parser){
    if (parser) {
      this.contexts.push(parser);
    } else {
      return this.contexts.pop();
    }
  },
  /**
   * Return the next token object.
   *
   * @return {Object}
   * @api private
   */
  advance: function(){
    return this.lexer.advance();
  },
  /**
   * Skip `n` tokens.
   *
   * @param {Number} n
   * @api private
   */
  skip: function(n){
    while (n--) this.advance();
  },
  
  /**
   * Single token lookahead.
   *
   * @return {Object}
   * @api private
   */
  
  peek: function() {
    return this.lookahead(1);
  },
  
  /**
   * Return lexer lineno.
   *
   * @return {Number}
   * @api private
   */
  
  line: function() {
    return this.lexer.lineno;
  },
  
  /**
   * `n` token lookahead.
   *
   * @param {Number} n
   * @return {Object}
   * @api private
   */
  
  lookahead: function(n){
    return this.lexer.lookahead(n);
  },
  
  /**
   * Parse input returning a string of js for evaluation.
   *
   * @return {String}
   * @api public
   */
  
  parse: function(){
    var block = new nodes.Block, parser;
    block.line = this.line();
    while ('eos' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else {
        block.push(this.parseExpr());
      }
    }
    if (parser = this.extending) {
      this.context(parser);
      var ast = parser.parse();
      this.context();
      // hoist mixins
      for (var name in this.mixins)
        ast.unshift(this.mixins[name]);
      return ast;
    }
    return block;
  },
  
  /**
   * Expect the given type, or throw an exception.
   *
   * @param {String} type
   * @api private
   */
  
  expect: function(type){
    if (this.peek().type === type) {
      return this.advance();
    } else {
      throw new Error('expected "' + type + '", but got "' + this.peek().type + '"');
    }
  },
  
  /**
   * Accept the given `type`.
   *
   * @param {String} type
   * @api private
   */
  
  accept: function(type){
    if (this.peek().type === type) {
      return this.advance();
    }
  },
  
  /**
   *   tag
   * | doctype
   * | mixin
   * | include
   * | filter
   * | comment
   * | text
   * | each
   * | code
   * | yield
   * | id
   * | class
   * | interpolation
   */
  
  parseExpr: function(){
    switch (this.peek().type) {
      case 'tag':
        return this.parseTag();
      case 'mixin':
        return this.parseMixin();
      case 'block':
        return this.parseBlock();
      case 'case':
        return this.parseCase();
      case 'when':
        return this.parseWhen();
      case 'default':
        return this.parseDefault();
      case 'extends':
        return this.parseExtends();
      case 'include':
        return this.parseInclude();
      case 'doctype':
        return this.parseDoctype();
      case 'filter':
        return this.parseFilter();
      case 'comment':
        return this.parseComment();
      case 'text':
        return this.parseText();
      case 'each':
        return this.parseEach();
      case 'code':
        return this.parseCode();
      case 'call':
        return this.parseCall();
      case 'interpolation':
        return this.parseInterpolation();
      case 'yield':
        this.advance();
        var block = new nodes.Block;
        block.yield = true;
        return block;
      case 'id':
      case 'class':
        var tok = this.advance();
        this.lexer.defer(this.lexer.tok('tag', 'div'));
        this.lexer.defer(tok);
        return this.parseExpr();
      default:
        throw new Error('unexpected token "' + this.peek().type + '"');
    }
  },
  
  /**
   * Text
   */
  
  parseText: function(){
    var tok = this.expect('text')
      , node = new nodes.Text(tok.val);
    node.line = this.line();
    return node;
  },
  /**
   *   ':' expr
   * | block
   */
  parseBlockExpansion: function(){
    if (':' == this.peek().type) {
      this.advance();
      return new nodes.Block(this.parseExpr());
    } else {
      return this.block();
    }
  },
  /**
   * case
   */
  parseCase: function(){
    var val = this.expect('case').val
      , node = new nodes.Case(val);
    node.line = this.line();
    node.block = this.block();
    return node;
  },
  /**
   * when
   */
  parseWhen: function(){
    var val = this.expect('when').val
    return new nodes.Case.When(val, this.parseBlockExpansion());
  },
  
  /**
   * default
   */
  parseDefault: function(){
    this.expect('default');
    return new nodes.Case.When('default', this.parseBlockExpansion());
  },
  /**
   * code
   */
  
  parseCode: function(){
    var tok = this.expect('code')
      , node = new nodes.Code(tok.val, tok.buffer, tok.escape)
      , block
      , i = 1;
    node.line = this.line();
    while (this.lookahead(i) && 'newline' == this.lookahead(i).type) ++i;
    block = 'indent' == this.lookahead(i).type;
    if (block) {
      this.skip(i-1);
      node.block = this.block();
    }
    return node;
  },
  
  /**
   * comment
   */
  
  parseComment: function(){
    var tok = this.expect('comment')
      , node;
    if ('indent' == this.peek().type) {
      node = new nodes.BlockComment(tok.val, this.block(), tok.buffer);
    } else {
      node = new nodes.Comment(tok.val, tok.buffer);
    }
    node.line = this.line();
    return node;
  },
  
  /**
   * doctype
   */
  
  parseDoctype: function(){
    var tok = this.expect('doctype')
      , node = new nodes.Doctype(tok.val);
    node.line = this.line();
    return node;
  },
  
  /**
   * filter attrs? text-block
   */
  
  parseFilter: function(){
    var block
      , tok = this.expect('filter')
      , attrs = this.accept('attrs');
    this.lexer.pipeless = true;
    block = this.parseTextBlock();
    this.lexer.pipeless = false;
    var node = new nodes.Filter(tok.val, block, attrs && attrs.attrs);
    node.line = this.line();
    return node;
  },
  
  /**
   * tag ':' attrs? block
   */
  
  parseASTFilter: function(){
    var block
      , tok = this.expect('tag')
      , attrs = this.accept('attrs');
    this.expect(':');
    block = this.block();
    var node = new nodes.Filter(tok.val, block, attrs && attrs.attrs);
    node.line = this.line();
    return node;
  },
  
  /**
   * each block
   */
  
  parseEach: function(){
    var tok = this.expect('each')
      , node = new nodes.Each(tok.code, tok.val, tok.key);
    node.line = this.line();
    node.block = this.block();
    return node;
  },
  /**
   * 'extends' name
   */
  parseExtends: function(){
    var path = require('path')
      , fs = require('fs')
      , dirname = path.dirname
      , basename = path.basename
      , join = path.join;
    if (!this.filename)
      throw new Error('the "filename" option is required to extend templates');
    var path = this.expect('extends').val.trim()
      , dir = dirname(this.filename);
    var path = join(dir, path + '.jade')
      , str = fs.readFileSync(path, 'utf8')
      , parser = new Parser(str, path, this.options);
    parser.blocks = this.blocks;
    parser.contexts = this.contexts;
    this.extending = parser;
    // TODO: null node
    return new nodes.Literal('');
  },
  /**
   * 'block' name block
   */
  parseBlock: function(){
    var block = this.expect('block')
      , mode = block.mode
      , name = block.val.trim();
    block = 'indent' == this.peek().type
      ? this.block()
      : new nodes.Block(new nodes.Literal(''));
    var prev = this.blocks[name];
    if (prev) {
      switch (prev.mode) {
        case 'append':
          block.nodes = block.nodes.concat(prev.nodes);
          prev = block;
          break;
        case 'prepend':
          block.nodes = prev.nodes.concat(block.nodes);
          prev = block;
          break;
      }
    }
    block.mode = mode;
    return this.blocks[name] = prev || block;
  },
  /**
   * include block?
   */
  parseInclude: function(){
    var path = require('path')
      , fs = require('fs')
      , dirname = path.dirname
      , basename = path.basename
      , join = path.join;
    var path = this.expect('include').val.trim()
      , dir = dirname(this.filename);
    if (!this.filename)
      throw new Error('the "filename" option is required to use includes');
    // no extension
    if (!~basename(path).indexOf('.')) {
      path += '.jade';
    }
    // non-jade
    if ('.jade' != path.substr(-5)) {
      var path = join(dir, path)
        , str = fs.readFileSync(path, 'utf8');
      return new nodes.Literal(str);
    }
    var path = join(dir, path)
      , str = fs.readFileSync(path, 'utf8')
     , parser = new Parser(str, path, this.options);
    parser.blocks = this.blocks;
    parser.mixins = this.mixins;
    this.context(parser);
    var ast = parser.parse();
    this.context();
    ast.filename = path;
    if ('indent' == this.peek().type) {
      ast.includeBlock().push(this.block());
    }
    return ast;
  },
  /**
   * call ident block
   */
  parseCall: function(){
    var tok = this.expect('call')
      , name = tok.val
      , args = tok.args
      , mixin = new nodes.Mixin(name, args, new nodes.Block, true);
    this.tag(mixin);
    if (mixin.block.isEmpty()) mixin.block = null;
    return mixin;
  },
  /**
   * mixin block
   */
  parseMixin: function(){
    var tok = this.expect('mixin')
      , name = tok.val
      , args = tok.args
      , mixin;
    // definition
    if ('indent' == this.peek().type) {
      mixin = new nodes.Mixin(name, args, this.block(), false);
      this.mixins[name] = mixin;
      return mixin;
    // call
    } else {
      return new nodes.Mixin(name, args, null, true);
    }
  },
  /**
   * indent (text | newline)* outdent
   */
  parseTextBlock: function(){
    var block = new nodes.Block;
    block.line = this.line();
    var spaces = this.expect('indent').val;
    if (null == this._spaces) this._spaces = spaces;
    var indent = Array(spaces - this._spaces + 1).join(' ');
    while ('outdent' != this.peek().type) {
      switch (this.peek().type) {
        case 'newline':
          this.advance();
          break;
        case 'indent':
          this.parseTextBlock().nodes.forEach(function(node){
            block.push(node);
          });
          break;
        default:
          var text = new nodes.Text(indent + this.advance().val);
          text.line = this.line();
          block.push(text);
      }
    }
    if (spaces == this._spaces) this._spaces = null;
    this.expect('outdent');
    return block;
  },
  /**
   * indent expr* outdent
   */
  
  block: function(){
    var block = new nodes.Block;
    block.line = this.line();
    this.expect('indent');
    while ('outdent' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else {
        block.push(this.parseExpr());
      }
    }
    this.expect('outdent');
    return block;
  },
  /**
   * interpolation (attrs | class | id)* (text | code | ':')? newline* block?
   */
  
  parseInterpolation: function(){
    var tok = this.advance();
    var tag = new nodes.Tag(tok.val);
    tag.buffer = true;
    return this.tag(tag);
  },
  /**
   * tag (attrs | class | id)* (text | code | ':')? newline* block?
   */
  
  parseTag: function(){
    // ast-filter look-ahead
    var i = 2;
    if ('attrs' == this.lookahead(i).type) ++i;
    if (':' == this.lookahead(i).type) {
      if ('indent' == this.lookahead(++i).type) {
        return this.parseASTFilter();
      }
    }
    var tok = this.advance()
      , tag = new nodes.Tag(tok.val);
    tag.selfClosing = tok.selfClosing;
    return this.tag(tag);
  },
  /**
   * Parse tag.
   */
  tag: function(tag){
    var dot;
    tag.line = this.line();
    // (attrs | class | id)*
    out:
      while (true) {
        switch (this.peek().type) {
          case 'id':
          case 'class':
            var tok = this.advance();
            tag.setAttribute(tok.type, "'" + tok.val + "'");
            continue;
          case 'attrs':
            var tok = this.advance()
              , obj = tok.attrs
              , escaped = tok.escaped
              , names = Object.keys(obj);
            if (tok.selfClosing) tag.selfClosing = true;
            for (var i = 0, len = names.length; i < len; ++i) {
              var name = names[i]
                , val = obj[name];
              tag.setAttribute(name, val, escaped[name]);
            }
            continue;
          default:
            break out;
        }
      }
    // check immediate '.'
    if ('.' == this.peek().val) {
      dot = tag.textOnly = true;
      this.advance();
    }
    // (text | code | ':')?
    switch (this.peek().type) {
      case 'text':
        tag.block.push(this.parseText());
        break;
      case 'code':
        tag.code = this.parseCode();
        break;
      case ':':
        this.advance();
        tag.block = new nodes.Block;
        tag.block.push(this.parseExpr());
        break;
    }
    // newline*
    while ('newline' == this.peek().type) this.advance();
    tag.textOnly = tag.textOnly || ~textOnly.indexOf(tag.name);
    // script special-case
    if ('script' == tag.name) {
      var type = tag.getAttribute('type');
      if (!dot && type && 'text/javascript' != type.replace(/^['"]|['"]$/g, '')) {
        tag.textOnly = false;
      }
    }
    // block?
    if ('indent' == this.peek().type) {
      if (tag.textOnly) {
        this.lexer.pipeless = true;
        tag.block = this.parseTextBlock();
        this.lexer.pipeless = false;
      } else {
        var block = this.block();
        if (tag.block) {
          for (var i = 0, len = block.nodes.length; i < len; ++i) {
            tag.block.push(block.nodes[i]);
          }
        } else {
          tag.block = block;
        }
      }
    }
    
    return tag;
  }
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/runtime',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Lame Array.isArray() polyfill for now.
 */
if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}
/**
 * Lame Object.keys() polyfill for now.
 */
if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}
/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */
exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];
  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }
  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }
  return a;
};
/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */
function nulls(val) {
  return val != null;
}
/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */
exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;
  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;
  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];
      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }
  return buf.join(' ');
};
/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */
exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */
exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;
  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);
  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');
  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/self-closing',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - self closing tags
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
module.exports = [
    'meta'
  , 'img'
  , 'link'
  , 'input'
  , 'source'
  , 'area'
  , 'base'
  , 'col'
  , 'br'
  , 'hr'
];
    }
  };
});
asyncmachineTest.module(13, function(/* parent */){
  return {
    'id': 'lib/utils',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/*!
 * Jade - utils
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Convert interpolation in the given string to JavaScript.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
var interpolate = exports.interpolate = function(str){
  return str.replace(/(\\)?([#!]){(.*?)}/g, function(str, escape, flag, code){
    return escape
      ? str
      : "' + "
        + ('!' == flag ? '' : 'escape')
        + "((interp = " + code.replace(/\\'/g, "'")
        + ") == null ? '' : interp) + '";
  });
};
/**
 * Escape single quotes in `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
var escape = exports.escape = function(str) {
  return str.replace(/'/g, "\\'");
};
/**
 * Interpolate, and escape the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.text = function(str){
  return interpolate(escape(str));
};
    }
  };
});
asyncmachineTest.pkg(3, function(parents){
  return {
    'id':6,
    'name':'lucidjs',
    'main':undefined,
    'mainModuleId':'lucid',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(6, function(/* parent */){
  return {
    'id': 'lucid',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * LucidJS
 *
 * Lucid is an easy to use event emitter library. LucidJS allows you to create your own event system and even pipe in
 * events from one emitter to another.
 *
 * Copyright 2012, Robert William Hurst
 * Licenced under the BSD License.
 * See https://raw.github.com/RobertWHurst/LucidJS/master/license.txt
 */
(function(factory) {
	//AMD
	if(typeof define === 'function' && define.amd) {
		define(factory);
	//NODE
	} else if(typeof module === 'object' && module.exports) {
		module.exports = factory();
	//GLOBAL
	} else {
		window.LucidJS = factory();
	}
})(function() {
	var api;
	//return the api
	api = {
		"emitter": EventEmitter
	};
	//indexOf pollyfill
	[].indexOf||(Array.prototype.indexOf=function(a,b,c){for(c=this.length,b=(c+~~b)%c;b<c&&(!(b in this)||this[b]!==a);b++);return b^c?b:-1;});
	return api;
	/**
	 * Creates a event emitter.
	 */
	function EventEmitter(object) {
		var emitter = object || {}, listeners = {}, setEvents = {}, pipes = {};
		//augment an object if it isn't already an emitter
		if(
			!emitter.on &&
			!emitter.once &&
			!emitter.trigger &&
			!emitter.set &&
			!emitter.pipe &&
			!emitter.pipe &&
			!emitter.listeners
		) {
			emitter.on = on;
			emitter.once = once;
			emitter.trigger = trigger;
			emitter.set = set;
			emitter.set.clear = clearSet;
			emitter.pipe = pipe;
			emitter.pipe.clear = clearPipes;
			emitter.listeners = getListeners;
			emitter.listeners.clear = clearListeners;
		} else {
			return emitter;
		}
		if(emitter.addEventListener || emitter.attachEvent) {
			handleNode(emitter);
		}
		return emitter;
		/**
		 * Binds listeners to events.
		 * @param event
		 * @return {Object}
		 */
		function on(event     ) {
			var args = Array.prototype.slice.apply(arguments, [1]), binding = {}, aI, sI;
			//recurse over a batch of events
			if(typeof event === 'object' && typeof event.push === 'function') { return batchOn(event, args); }
			//trigger the listener event
			if(event.slice(0, 7) !== 'emitter') {
				trigger('emitter.listener', event, args);
			}
			//check for a set event
			if(setEvents[event]) {
				for(aI = 0; aI < args.length; aI += 1) {
					if(typeof args[aI] !== 'function') { throw new Error('Cannot bind event. All callbacks must be functions.'); }
					for(sI = 0; sI < setEvents[event].length; sI += 1) {
						args[aI].apply(this, setEvents[event][sI]);
					}
				}
				binding.clear = function() {};
				return binding;
			}
			//create the event
			if(!listeners[event]) { listeners[event] = []; }
			//add each callback
			for(aI = 0; aI < args.length; aI += 1) {
				if(typeof args[aI] !== 'function') { throw new Error('Cannot bind event. All callbacks must be functions.'); }
				listeners[event].push(args[aI]);
			}
			binding.clear = clear;
			return binding;
			function clear() {
				if(!listeners[event]) { return; }
				for(aI = 0; aI < args.length; aI += 1) {
					listeners[event].splice(listeners[event].indexOf(args[aI]), 1);
				}
				if(listeners[event].length < 1) { delete listeners[event]; }
			}
			function batchOn(events, args) {
				var eI, binding = {}, bindings = [];
				for(eI = 0; eI < events.length; eI += 1) {
					args.unshift(events[eI]);
					bindings.push(on.apply(this, args));
					args.shift();
				}
				binding.clear = clear;
				return binding;
				function clear() {
					var bI;
					for(bI = 0; bI < bindings.length; bI += 1) {
						bindings[bI].clear();
					}
				}
			}
		}
		/**
		 * Binds listeners to events. Once an event is fired the binding is cleared automatically.
		 * @param event
		 * @return {Object}
		 */
		function once(event     ) {
			var binding, args = Array.prototype.slice.apply(arguments, [1]), result = true;
			binding = on(event, function(    ) {
				var aI, eventArgs = Array.prototype.slice.apply(arguments);
				binding.clear();
				for(aI = 0; aI < args.length; aI += 1) {
					if(args[aI].apply(this, eventArgs) === false) {
						result = true;
					}
				}
			});
			return binding;
		}
		/**
		 * Triggers events. Passes listeners any additional arguments.
		 * @param event
		 * @return {Boolean}
		 */
		function trigger(event     ) {
			var args = Array.prototype.slice.apply(arguments, [1]), lI, eventListeners, result = true;
			if(typeof event === 'object' && typeof event.push === 'function') { return batchTrigger(event, args); }
			event = event.split('.');
			while(event.length) {
				eventListeners = listeners[event.join('.')];
				if(eventListeners) {
					for(lI = 0; lI < eventListeners.length; lI += 1) {
						if(eventListeners[lI].apply(this, args) === false) {
							result = false;
						}
					}
				}
				event.pop();
			}
			return result;
			function batchTrigger(events, args) {
				var eI, result = true;
				for(eI = 0; eI < events.length; eI += 1) {
					args.unshift(events[eI]);
					if(trigger.apply(this, args) === false) { result = false; }
					args.shift();
				}
				return result;
			}
		}
		/**
		 * Sets events. Passes listeners any additional arguments.
		 * @param event
		 * @return {*}
		 */
		function set(event     ) {
			var args = Array.prototype.slice.apply(arguments), setEvent = {};
			if(typeof event === 'object' && typeof event.push === 'function') { return batchSet(event, args); }
			//execute all of the existing binds for the event
			trigger.apply(this, args);
			clearListeners(event);
			if(!setEvents[event]) { setEvents[event] = []; }
			setEvents[event].push(args.slice(1));
			setEvent.clear = clear;
			return setEvent;
			function batchSet(events, args) {
				var eI, result = true;
				for(eI = 0; eI < events.length; eI += 1) {
					args.unshift(events[eI]);
					if(trigger.apply(this, args) === false) { result = false; }
					args.shift();
				}
				return result;
			}
			function clear() {
				if(setEvents[event]) {
					setEvents[event].splice(setEvents[event].indexOf(args), 1);
					if(setEvents[event].length < 1) {
						delete setEvents[event];
					}
				}
			}
		}
		/**
		 * Clears a set event, or all set events.
		 * @param event
		 */
		function clearSet(event) {
			if(event) {
				delete setEvents[event];
			} else {
				setEvents = {};
			}
		}
		/**
		 * Pipes events from another emitter.
		 * @param event
		 * @return {Object}
		 */
		function pipe(event     ) {
			var args = Array.prototype.slice.apply(arguments);
			if(typeof event === 'object' && typeof event.on === 'function') { return pipeAll(args); }
			if(typeof event !== 'string' && (typeof event !== 'object' || typeof event.push !== 'function')) { throw new Error('Cannot create pipe. The first argument must be an event string.'); }
			return pipeEvent(event, args.slice(1));
			function pipeEvent(event, args) {
				var aI, pipeBindings = [], pipe = {};
				if(typeof event === 'object' && typeof event.push === 'function') {
					return (function(events) {
						var pipe = {}, eI, eventPipes = [];
						for(eI = 0; eI < events.length; eI += 1) {
							eventPipes.push(pipeEvent(events[eI], args));
						}
						pipe.clear = clear;
						return pipe;
						function clear() {
							while(eventPipes.length) {
								eventPipes[0].clear();
								eventPipes.splice(0, 1);
							}
						}
					})(event);
				}
				if(event.slice(0, 7) === 'emitter') { throw new Error('Cannot pipe event "' + event + '". Events beginning with "emitter" cannot be piped.'); }
				for(aI = 0; aI < args.length; aI += 1) {
					pipeBindings.push(args[aI].on(event, function(    ) {
						var args = Array.prototype.slice.apply(arguments);
						args.unshift(event);
						return trigger.apply(this, args);
					}));
				}
				if(!pipes[event]) { pipes[event] = []; }
				pipes[event].push(pipeBindings);
				pipe.clear = clear;
				return pipe;
				function clear() {
					if(pipes[event]) {
						pipes[event].splice(pipes[event].indexOf(pipeBindings), 1);
					}
				}
			}
			function pipeAll(args) {
				var pipe = {}, binding, eventPipes = [];
				binding = on('emitter.listener', function(event) {
					eventPipes.push(pipeEvent(event, args));
				});
				pipe.clear = clear;
				return pipe;
				function clear() {
					binding.clear();
					while(eventPipes.length) {
						eventPipes[0].clear();
						eventPipes.splice(0, 1);
					}
				}
			}
		}
		/**
		 * Clears pipes based on the events they transport.
		 * @param event
		 */
		function clearPipes(event) {
			if(event) {
				delete pipes[event];
			} else {
				pipes = {};
			}
		}
		/**
		 * Gets listeners for events.
		 * @param event
		 * @return {*}
		 */
		function getListeners(event) {
			if(event) {
				return listeners[event];
			} else {
				return listeners;
			}
		}
		/**
		 * Clears listeners by events.
		 * @param event
		 */
		function clearListeners(event) {
			if(event) {
				delete listeners[event];
			} else {
				listeners = {};
			}
		}
		/**
		 * Clears the emitter
		 */
		function clear() {
			trigger('emitter.clear');
			listeners = {};
			setEvents = {};
			pipes = {};
			delete emitter.on;
			delete emitter.once;
			delete emitter.trigger;
			delete emitter.set;
			delete emitter.pipe;
			delete emitter.listeners;
			delete emitter.clear;
		}
		/**
		 * Binds the emitter's event system to the DOM event system
		 * @param node
		 */
		function handleNode(node) {
			var handledEvents = [], listenerBinding, DOMEventListeners = [];
			listenerBinding = on('emitter.listener', function(event) {
				if(handledEvents.indexOf(event) > -1) { return; }
				handledEvents.push(event);
				try {
					//W3C
					if(node.addEventListener) {
						node.addEventListener(event, nodeListener, false);
						DOMEventListeners.push({
							"event": event,
							"listener": nodeListener
						});
					}
					//MICROSOFT
					else if(node.attachEvent) {
						node.attachEvent('on' + event, nodeListener);
						DOMEventListeners.push({
							"event": event,
							"listener": nodeListener
						});
					}
				} catch(e) {
					console.error(e);
				}
				function nodeListener(eventObj    ) {
					var args = Array.prototype.slice.apply(arguments);
					args.unshift([event, 'dom.' + event]);
					if(trigger.apply(this, args) === false) {
						eventObj.preventDefault();
						eventObj.stopPropagation();
					}
				}
			});
			emitter.clearNodeEmitter = clearNodeEmitter;
			function clearNodeEmitter() {
				var DI;
				for(DI = 0; DI < DOMEventListeners.length; DI += 1) {
					try {
						//W3C
						if(node.removeEventListener) {
							node.removeEventListener(DOMEventListeners[DI].event, DOMEventListeners[DI].listener, false);
						}
						//MICROSOFT
						else if(node.detachEvent) {
							node.detachEvent('on' + DOMEventListeners[DI].event, DOMEventListeners[DI].listener);
						}
					} catch(e) {
						console.error(e);
					}
				}
				handledEvents = [];
				listenerBinding.clear();
			}
		}
	}
});
    }
  };
});
asyncmachineTest.pkg(13, 10, function(parents){
  return {
    'id':14,
    'name':'mkdirp',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(14, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      var path = require('path');
var fs = require('fs');
module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;
function mkdirP (p, mode, f) {
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0777 & (~process.umask());
    }
    
    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);
    fs.mkdir(p, mode, function (er) {
        if (!er) return cb();
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er) {
                    if (er) cb(er);
                    else mkdirP(p, mode, cb);
                });
                break;
            case 'EEXIST':
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original EEXIST be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er)
                    else cb();
                });
                break;
            default:
                cb(er);
                break;
        }
    });
}
mkdirP.sync = function sync (p, mode) {
    if (mode === undefined) {
        mode = 0777 & (~process.umask());
    }
    
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);
    
    try {
        fs.mkdirSync(p, mode)
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                var err1 = sync(path.dirname(p), mode)
                if (err1) throw err1;
                else return sync(p, mode);
                break;
            
            case 'EEXIST' :
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0
                }
                if (!stat.isDirectory()) throw err0;
                else return null;
                break;
            default :
                throw err0
                break;
        }
    }
    
    return null;
};
    }
  };
});
asyncmachineTest.pkg(1, function(parents){
  return {
    'id':10,
    'name':'mocha',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
module.exports = process.env.COV
  ? require('./lib-cov/mocha')
  : require('./lib/mocha');
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/debug',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
module.exports = function(type){
  return function(){
    
  }
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/diff',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/events',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module exports.
 */
exports.EventEmitter = EventEmitter;
/**
 * Check if `obj` is an array.
 */
function isArray(obj) {
  return '[object Array]' == {}.toString.call(obj);
}
/**
 * Event emitter constructor.
 *
 * @api public
 */
function EventEmitter(){};
/**
 * Adds a listener.
 *
 * @api public
 */
EventEmitter.prototype.on = function (name, fn) {
  if (!this.$events) {
    this.$events = {};
  }
  if (!this.$events[name]) {
    this.$events[name] = fn;
  } else if (isArray(this.$events[name])) {
    this.$events[name].push(fn);
  } else {
    this.$events[name] = [this.$events[name], fn];
  }
  return this;
};
EventEmitter.prototype.addListener = EventEmitter.prototype.on;
/**
 * Adds a volatile listener.
 *
 * @api public
 */
EventEmitter.prototype.once = function (name, fn) {
  var self = this;
  function on () {
    self.removeListener(name, on);
    fn.apply(this, arguments);
  };
  on.listener = fn;
  this.on(name, on);
  return this;
};
/**
 * Removes a listener.
 *
 * @api public
 */
EventEmitter.prototype.removeListener = function (name, fn) {
  if (this.$events && this.$events[name]) {
    var list = this.$events[name];
    if (isArray(list)) {
      var pos = -1;
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
          pos = i;
          break;
        }
      }
      if (pos < 0) {
        return this;
      }
      list.splice(pos, 1);
      if (!list.length) {
        delete this.$events[name];
      }
    } else if (list === fn || (list.listener && list.listener === fn)) {
      delete this.$events[name];
    }
  }
  return this;
};
/**
 * Removes all listeners for an event.
 *
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function (name) {
  if (name === undefined) {
    this.$events = {};
    return this;
  }
  if (this.$events && this.$events[name]) {
    this.$events[name] = null;
  }
  return this;
};
/**
 * Gets all listeners for a certain event.
 *
 * @api public
 */
EventEmitter.prototype.listeners = function (name) {
  if (!this.$events) {
    this.$events = {};
  }
  if (!this.$events[name]) {
    this.$events[name] = [];
  }
  if (!isArray(this.$events[name])) {
    this.$events[name] = [this.$events[name]];
  }
  return this.$events[name];
};
/**
 * Emits an event.
 *
 * @api public
 */
EventEmitter.prototype.emit = function (name) {
  if (!this.$events) {
    return false;
  }
  var handler = this.$events[name];
  if (!handler) {
    return false;
  }
  var args = [].slice.call(arguments, 1);
  if ('function' == typeof handler) {
    handler.apply(this, args);
  } else if (isArray(handler)) {
    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
  } else {
    return false;
  }
  return true;
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/fs',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/path',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/progress',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Expose `Progress`.
 */
module.exports = Progress;
/**
 * Initialize a new `Progress` indicator.
 */
function Progress() {
  this.percent = 0;
  this.size(0);
  this.fontSize(11);
  this.font('helvetica, arial, sans-serif');
}
/**
 * Set progress size to `n`.
 *
 * @param {Number} n
 * @return {Progress} for chaining
 * @api public
 */
Progress.prototype.size = function(n){
  this._size = n;
  return this;
};
/**
 * Set text to `str`.
 *
 * @param {String} str
 * @return {Progress} for chaining
 * @api public
 */
Progress.prototype.text = function(str){
  this._text = str;
  return this;
};
/**
 * Set font size to `n`.
 *
 * @param {Number} n
 * @return {Progress} for chaining
 * @api public
 */
Progress.prototype.fontSize = function(n){
  this._fontSize = n;
  return this;
};
/**
 * Set font `family`.
 *
 * @param {String} family
 * @return {Progress} for chaining
 */
Progress.prototype.font = function(family){
  this._font = family;
  return this;
};
/**
 * Update percentage to `n`.
 *
 * @param {Number} n
 * @return {Progress} for chaining
 */
Progress.prototype.update = function(n){
  this.percent = n;
  return this;
};
/**
 * Draw on `ctx`.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @return {Progress} for chaining
 */
Progress.prototype.draw = function(ctx){
  var percent = Math.min(this.percent, 100)
    , size = this._size
    , half = size / 2
    , x = half
    , y = half
    , rad = half - 1
    , fontSize = this._fontSize;
  ctx.font = fontSize + 'px ' + this._font;
  var angle = Math.PI * 2 * (percent / 100);
  ctx.clearRect(0, 0, size, size);
  // outer circle
  ctx.strokeStyle = '#9f9f9f';
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, angle, false);
  ctx.stroke();
  // inner circle
  ctx.strokeStyle = '#eee';
  ctx.beginPath();
  ctx.arc(x, y, rad - 1, 0, angle, true);
  ctx.stroke();
  // text
  var text = this._text || (percent | 0) + '%'
    , w = ctx.measureText(text).width;
  ctx.fillText(
      text
    , x - w / 2 + 1
    , y + fontSize / 2 - 1);
  return this;
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/browser/tty',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
exports.isatty = function(){
  return true;
};
exports.getWindowSize = function(){
  return [window.innerHeight, window.innerWidth];
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/context',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Expose `Context`.
 */
module.exports = Context;
/**
 * Initialize a new `Context`.
 *
 * @api private
 */
function Context(){}
/**
 * Set or get the context `Runnable` to `runnable`.
 *
 * @param {Runnable} runnable
 * @return {Context}
 * @api private
 */
Context.prototype.runnable = function(runnable){
  if (0 == arguments.length) return this._runnable;
  this.test = this._runnable = runnable;
  return this;
};
/**
 * Set test timeout `ms`.
 *
 * @param {Number} ms
 * @return {Context} self
 * @api private
 */
Context.prototype.timeout = function(ms){
  this.runnable().timeout(ms);
  return this;
};
/**
 * Set test slowness threshold `ms`.
 *
 * @param {Number} ms
 * @return {Context} self
 * @api private
 */
Context.prototype.slow = function(ms){
  this.runnable().slow(ms);
  return this;
};
/**
 * Inspect the context void of `._runnable`.
 *
 * @return {String}
 * @api private
 */
Context.prototype.inspect = function(){
  return JSON.stringify(this, function(key, val){
    if ('_runnable' == key) return;
    if ('test' == key) return;
    return val;
  }, 2);
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/hook',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Runnable = require('./runnable');
/**
 * Expose `Hook`.
 */
module.exports = Hook;
/**
 * Initialize a new `Hook` with the given `title` and callback `fn`.
 *
 * @param {String} title
 * @param {Function} fn
 * @api private
 */
function Hook(title, fn) {
  Runnable.call(this, title, fn);
  this.type = 'hook';
}
/**
 * Inherit from `Runnable.prototype`.
 */
Hook.prototype.__proto__ = Runnable.prototype;
/**
 * Get or set the test `err`.
 *
 * @param {Error} err
 * @return {Error}
 * @api public
 */
Hook.prototype.error = function(err){
  if (0 == arguments.length) {
    var err = this._error;
    this._error = null;
    return err;
  }
  this._error = err;
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/interfaces/bdd',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Suite = require('../suite')
  , Test = require('../test');
/**
 * BDD-style interface:
 * 
 *      describe('Array', function(){
 *        describe('#indexOf()', function(){
 *          it('should return -1 when not present', function(){
 *
 *          });
 *
 *          it('should return the index when present', function(){
 *
 *          });
 *        });
 *      });
 * 
 */
module.exports = function(suite){
  var suites = [suite];
  suite.on('pre-require', function(context, file, mocha){
    /**
     * Execute before running tests.
     */
    context.before = function(fn){
      suites[0].beforeAll(fn);
    };
    /**
     * Execute after running tests.
     */
    context.after = function(fn){
      suites[0].afterAll(fn);
    };
    /**
     * Execute before each test case.
     */
    context.beforeEach = function(fn){
      suites[0].beforeEach(fn);
    };
    /**
     * Execute after each test case.
     */
    context.afterEach = function(fn){
      suites[0].afterEach(fn);
    };
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
  
    context.describe = context.context = function(title, fn){
      var suite = Suite.create(suites[0], title);
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };
    /**
     * Pending describe.
     */
    context.xdescribe =
    context.xcontext =
    context.describe.skip = function(title, fn){
      var suite = Suite.create(suites[0], title);
      suite.pending = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
    };
    /**
     * Exclusive suite.
     */
    context.describe.only = function(title, fn){
      var suite = context.describe(title, fn);
      mocha.grep(suite.fullTitle());
    };
    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.it = context.specify = function(title, fn){
      var suite = suites[0];
      if (suite.pending) var fn = null;
      var test = new Test(title, fn);
      suite.addTest(test);
      return test;
    };
    /**
     * Exclusive test-case.
     */
    context.it.only = function(title, fn){
      var test = context.it(title, fn);
      mocha.grep(test.fullTitle());
    };
    /**
     * Pending test case.
     */
    context.xit =
    context.xspecify =
    context.it.skip = function(title){
      context.it(title);
    };
  });
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/interfaces/exports',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Suite = require('../suite')
  , Test = require('../test');
/**
 * TDD-style interface:
 * 
 *     exports.Array = {
 *       '#indexOf()': {
 *         'should return -1 when the value is not present': function(){
 *           
 *         },
 *
 *         'should return the correct index when the value is present': function(){
 *           
 *         }
 *       }
 *     };
 * 
 */
module.exports = function(suite){
  var suites = [suite];
  suite.on('require', visit);
  function visit(obj) {
    var suite;
    for (var key in obj) {
      if ('function' == typeof obj[key]) {
        var fn = obj[key];
        switch (key) {
          case 'before':
            suites[0].beforeAll(fn);
            break;
          case 'after':
            suites[0].afterAll(fn);
            break;
          case 'beforeEach':
            suites[0].beforeEach(fn);
            break;
          case 'afterEach':
            suites[0].afterEach(fn);
            break;
          default:
            suites[0].addTest(new Test(key, fn));
        }
      } else {
        var suite = Suite.create(suites[0], key);
        suites.unshift(suite);
        visit(obj[key]);
        suites.shift();
      }
    }
  }
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/interfaces/index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
exports.bdd = require('./bdd');
exports.tdd = require('./tdd');
exports.qunit = require('./qunit');
exports.exports = require('./exports');
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/interfaces/qunit',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Suite = require('../suite')
  , Test = require('../test');
/**
 * QUnit-style interface:
 * 
 *     suite('Array');
 *     
 *     test('#length', function(){
 *       var arr = [1,2,3];
 *       ok(arr.length == 3);
 *     });
 *     
 *     test('#indexOf()', function(){
 *       var arr = [1,2,3];
 *       ok(arr.indexOf(1) == 0);
 *       ok(arr.indexOf(2) == 1);
 *       ok(arr.indexOf(3) == 2);
 *     });
 *     
 *     suite('String');
 *     
 *     test('#length', function(){
 *       ok('foo'.length == 3);
 *     });
 * 
 */
module.exports = function(suite){
  var suites = [suite];
  suite.on('pre-require', function(context){
    /**
     * Execute before running tests.
     */
    context.before = function(fn){
      suites[0].beforeAll(fn);
    };
    /**
     * Execute after running tests.
     */
    context.after = function(fn){
      suites[0].afterAll(fn);
    };
    /**
     * Execute before each test case.
     */
    context.beforeEach = function(fn){
      suites[0].beforeEach(fn);
    };
    /**
     * Execute after each test case.
     */
    context.afterEach = function(fn){
      suites[0].afterEach(fn);
    };
    /**
     * Describe a "suite" with the given `title`.
     */
  
    context.suite = function(title){
      if (suites.length > 1) suites.shift();
      var suite = Suite.create(suites[0], title);
      suites.unshift(suite);
    };
    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.test = function(title, fn){
      suites[0].addTest(new Test(title, fn));
    };
  });
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/interfaces/tdd',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Suite = require('../suite')
  , Test = require('../test');
/**
 * TDD-style interface:
 *
 *      suite('Array', function(){
 *        suite('#indexOf()', function(){
 *          suiteSetup(function(){
 *
 *          });
 *          
 *          test('should return -1 when not present', function(){
 *
 *          });
 *
 *          test('should return the index when present', function(){
 *
 *          });
 *
 *          suiteTeardown(function(){
 *
 *          });
 *        });
 *      });
 *
 */
module.exports = function(suite){
  var suites = [suite];
  suite.on('pre-require', function(context, file, mocha){
    /**
     * Execute before each test case.
     */
    context.setup = function(fn){
      suites[0].beforeEach(fn);
    };
    /**
     * Execute after each test case.
     */
    context.teardown = function(fn){
      suites[0].afterEach(fn);
    };
    /**
     * Execute before the suite.
     */
    context.suiteSetup = function(fn){
      suites[0].beforeAll(fn);
    };
    /**
     * Execute after the suite.
     */
    context.suiteTeardown = function(fn){
      suites[0].afterAll(fn);
    };
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
    context.suite = function(title, fn){
      var suite = Suite.create(suites[0], title);
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };
    /**
     * Exclusive test-case.
     */
    context.suite.only = function(title, fn){
      var suite = context.suite(title, fn);
      mocha.grep(suite.fullTitle());
    };
    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.test = function(title, fn){
      var test = new Test(title, fn);
      suites[0].addTest(test);
      return test;
    };
    /**
     * Exclusive test-case.
     */
    context.test.only = function(title, fn){
      var test = context.test(title, fn);
      mocha.grep(test.fullTitle());
    };
    /**
     * Pending test case.
     */
    context.test.skip = function(title){
      context.test(title);
    };
  });
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/mocha',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*!
 * mocha
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var path = require('path')
  , utils = require('./utils');
/**
 * Expose `Mocha`.
 */
exports = module.exports = Mocha;
/**
 * Expose internals.
 */
exports.utils = utils;
exports.interfaces = require('./interfaces');
exports.reporters = require('./reporters');
exports.Runnable = require('./runnable');
exports.Context = require('./context');
exports.Runner = require('./runner');
exports.Suite = require('./suite');
exports.Hook = require('./hook');
exports.Test = require('./test');
/**
 * Return image `name` path.
 *
 * @param {String} name
 * @return {String}
 * @api private
 */
function image(name) {
  return __dirname + '/../images/' + name + '.png';
}
/**
 * Setup mocha with `options`.
 *
 * Options:
 *
 *   - `ui` name "bdd", "tdd", "exports" etc
 *   - `reporter` reporter instance, defaults to `mocha.reporters.Dot`
 *   - `globals` array of accepted globals
 *   - `timeout` timeout in milliseconds
 *   - `slow` milliseconds to wait before considering a test slow
 *   - `ignoreLeaks` ignore global leaks
 *   - `grep` string or regexp to filter tests with
 *
 * @param {Object} options
 * @api public
 */
function Mocha(options) {
  options = options || {};
  this.files = [];
  this.options = options;
  this.grep(options.grep);
  this.suite = new exports.Suite('', new exports.Context);
  this.ui(options.ui);
  this.reporter(options.reporter);
  if (options.timeout) this.timeout(options.timeout);
  if (options.slow) this.slow(options.slow);
}
/**
 * Add test `file`.
 *
 * @param {String} file
 * @api public
 */
Mocha.prototype.addFile = function(file){
  this.files.push(file);
  return this;
};
/**
 * Set reporter to `reporter`, defaults to "dot".
 *
 * @param {String|Function} reporter name of a reporter or a reporter constructor
 * @api public
 */
Mocha.prototype.reporter = function(reporter){
  if ('function' == typeof reporter) {
    this._reporter = reporter;
  } else {
    reporter = reporter || 'dot';
    try {
      this._reporter = require('./reporters/' + reporter);
    } catch (err) {
      this._reporter = require(reporter);
    }
    if (!this._reporter) throw new Error('invalid reporter "' + reporter + '"');
  }
  return this;
};
/**
 * Set test UI `name`, defaults to "bdd".
 *
 * @param {String} bdd
 * @api public
 */
Mocha.prototype.ui = function(name){
  name = name || 'bdd';
  this._ui = exports.interfaces[name];
  if (!this._ui) throw new Error('invalid interface "' + name + '"');
  this._ui = this._ui(this.suite);
  return this;
};
/**
 * Load registered files.
 *
 * @api private
 */
Mocha.prototype.loadFiles = function(fn){
  var self = this;
  var suite = this.suite;
  var pending = this.files.length;
  this.files.forEach(function(file){
    file = path.resolve(file);
    suite.emit('pre-require', global, file, self);
    suite.emit('require', require(file), file, self);
    suite.emit('post-require', global, file, self);
    --pending || (fn && fn());
  });
};
/**
 * Enable growl support.
 *
 * @api private
 */
Mocha.prototype._growl = function(runner, reporter) {
  var notify = require('growl');
  runner.on('end', function(){
    var stats = reporter.stats;
    if (stats.failures) {
      var msg = stats.failures + ' of ' + runner.total + ' tests failed';
      notify(msg, { name: 'mocha', title: 'Failed', image: image('error') });
    } else {
      notify(stats.passes + ' tests passed in ' + stats.duration + 'ms', {
          name: 'mocha'
        , title: 'Passed'
        , image: image('ok')
      });
    }
  });
};
/**
 * Add regexp to grep, if `re` is a string it is escaped.
 *
 * @param {RegExp|String} re
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.grep = function(re){
  this.options.grep = 'string' == typeof re
    ? new RegExp(utils.escapeRegexp(re))
    : re;
  return this;
};
/**
 * Invert `.grep()` matches.
 *
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.invert = function(){
  this.options.invert = true;
  return this;
};
/**
 * Ignore global leaks.
 *
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.ignoreLeaks = function(){
  this.options.ignoreLeaks = true;
  return this;
};
/**
 * Enable global leak checking.
 *
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.checkLeaks = function(){
  this.options.ignoreLeaks = false;
  return this;
};
/**
 * Enable growl support.
 *
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.growl = function(){
  this.options.growl = true;
  return this;
};
/**
 * Ignore `globals` array or string.
 *
 * @param {Array|String} globals
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.globals = function(globals){
  this.options.globals = (this.options.globals || []).concat(globals);
  return this;
};
/**
 * Set the timeout in milliseconds.
 *
 * @param {Number} timeout
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.timeout = function(timeout){
  this.suite.timeout(timeout);
  return this;
};
/**
 * Set slowness threshold in milliseconds.
 *
 * @param {Number} slow
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.slow = function(slow){
  this.suite.slow(slow);
  return this;
};
/**
 * Makes all tests async (accepting a callback)
 *
 * @return {Mocha}
 * @api public
 */
Mocha.prototype.asyncOnly = function(){
  this.options.asyncOnly = true;
  return this;
};
/**
 * Run tests and invoke `fn()` when complete.
 *
 * @param {Function} fn
 * @return {Runner}
 * @api public
 */
Mocha.prototype.run = function(fn){
  if (this.files.length) this.loadFiles();
  var suite = this.suite;
  var options = this.options;
  var runner = new exports.Runner(suite);
  var reporter = new this._reporter(runner);
  runner.ignoreLeaks = options.ignoreLeaks;
  runner.asyncOnly = options.asyncOnly;
  if (options.grep) runner.grep(options.grep, options.invert);
  if (options.globals) runner.globals(options.globals);
  if (options.growl) this._growl(runner, reporter);
  return runner.run(fn);
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/ms',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Helpers.
 */
var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
/**
 * Parse or format the given `val`.
 *
 * @param {String|Number} val
 * @return {String|Number}
 * @api public
 */
module.exports = function(val){
  if ('string' == typeof val) return parse(val);
  return format(val);
}
/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */
function parse(str) {
  var m = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!m) return;
  var n = parseFloat(m[1]);
  var type = (m[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * 31557600000;
    case 'days':
    case 'day':
    case 'd':
      return n * 86400000;
    case 'hours':
    case 'hour':
    case 'h':
      return n * 3600000;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * 60000;
    case 'seconds':
    case 'second':
    case 's':
      return n * 1000;
    case 'ms':
      return n;
  }
}
/**
 * Format the given `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api public
 */
function format(ms) {
  if (ms == d) return Math.round(ms / d) + ' day';
  if (ms > d) return Math.round(ms / d) + ' days';
  if (ms == h) return Math.round(ms / h) + ' hour';
  if (ms > h) return Math.round(ms / h) + ' hours';
  if (ms == m) return Math.round(ms / m) + ' minute';
  if (ms > m) return Math.round(ms / m) + ' minutes';
  if (ms == s) return Math.round(ms / s) + ' second';
  if (ms > s) return Math.round(ms / s) + ' seconds';
  return ms + ' ms';
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/base',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var tty = require('tty')
  , diff = require('diff')
  , ms = require('../ms');
/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;
/**
 * Check if both stdio streams are associated with a tty.
 */
var isatty = tty.isatty(1) && tty.isatty(2);
/**
 * Expose `Base`.
 */
exports = module.exports = Base;
/**
 * Enable coloring by default.
 */
exports.useColors = isatty;
/**
 * Default color map.
 */
exports.colors = {
    'pass': 90
  , 'fail': 31
  , 'bright pass': 92
  , 'bright fail': 91
  , 'bright yellow': 93
  , 'pending': 36
  , 'suite': 0
  , 'error title': 0
  , 'error message': 31
  , 'error stack': 90
  , 'checkmark': 32
  , 'fast': 90
  , 'medium': 33
  , 'slow': 31
  , 'green': 32
  , 'light': 90
  , 'diff gutter': 90
  , 'diff added': 42
  , 'diff removed': 41
};
/**
 * Default symbol map.
 */
 
exports.symbols = {
  ok: '✓',
  err: '✖',
  dot: '․'
};
// With node.js on Windows: use symbols available in terminal default fonts
if ('win32' == process.platform) {
  exports.symbols.ok = '\u221A';
  exports.symbols.err = '\u00D7';
  exports.symbols.dot = '.';
}
/**
 * Color `str` with the given `type`,
 * allowing colors to be disabled,
 * as well as user-defined color
 * schemes.
 *
 * @param {String} type
 * @param {String} str
 * @return {String}
 * @api private
 */
var color = exports.color = function(type, str) {
  if (!exports.useColors) return str;
  return '\u001b[' + exports.colors[type] + 'm' + str + '\u001b[0m';
};
/**
 * Expose term window size, with some
 * defaults for when stderr is not a tty.
 */
exports.window = {
  width: isatty
    ? process.stdout.getWindowSize
      ? process.stdout.getWindowSize(1)[0]
      : tty.getWindowSize()[1]
    : 75
};
/**
 * Expose some basic cursor interactions
 * that are common among reporters.
 */
exports.cursor = {
  hide: function(){
    process.stdout.write('\u001b[?25l');
  },
  show: function(){
    process.stdout.write('\u001b[?25h');
  },
  deleteLine: function(){
    process.stdout.write('\u001b[2K');
  },
  beginningOfLine: function(){
    process.stdout.write('\u001b[0G');
  },
  CR: function(){
    exports.cursor.deleteLine();
    exports.cursor.beginningOfLine();
  }
};
/**
 * Outut the given `failures` as a list.
 *
 * @param {Array} failures
 * @api public
 */
exports.list = function(failures){
  console.error();
  failures.forEach(function(test, i){
    // format
    var fmt = color('error title', '  %s) %s:\n')
      + color('error message', '     %s')
      + color('error stack', '\n%s\n');
    // msg
    var err = test.err
      , message = err.message || ''
      , stack = err.stack || message
      , index = stack.indexOf(message) + message.length
      , msg = stack.slice(0, index)
      , actual = err.actual
      , expected = err.expected
      , escape = true;
    // explicitly show diff
    if (err.showDiff) {
      escape = false;
      err.actual = actual = JSON.stringify(actual, null, 2);
      err.expected = expected = JSON.stringify(expected, null, 2);
    }
    // actual / expected diff
    if ('string' == typeof actual && 'string' == typeof expected) {
      var len = Math.max(actual.length, expected.length);
      if (len < 20) msg = errorDiff(err, 'Chars', escape);
      else msg = errorDiff(err, 'Words', escape);
      // linenos
      var lines = msg.split('\n');
      if (lines.length > 4) {
        var width = String(lines.length).length;
        msg = lines.map(function(str, i){
          return pad(++i, width) + ' |' + ' ' + str;
        }).join('\n');
      }
      // legend
      msg = '\n'
        + color('diff removed', 'actual')
        + ' '
        + color('diff added', 'expected')
        + '\n\n'
        + msg
        + '\n';
      // indent
      msg = msg.replace(/^/gm, '      ');
      fmt = color('error title', '  %s) %s:\n%s')
        + color('error stack', '\n%s\n');
    }
    // indent stack trace without msg
    stack = stack.slice(index ? index + 1 : index)
      .replace(/^/gm, '  ');
    console.error(fmt, (i + 1), test.fullTitle(), msg, stack);
  });
};
/**
 * Initialize a new `Base` reporter.
 *
 * All other reporters generally
 * inherit from this reporter, providing
 * stats such as test duration, number
 * of tests passed / failed etc.
 *
 * @param {Runner} runner
 * @api public
 */
function Base(runner) {
  var self = this
    , stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 }
    , failures = this.failures = [];
  if (!runner) return;
  this.runner = runner;
  runner.stats = stats;
  runner.on('start', function(){
    stats.start = new Date;
  });
  runner.on('suite', function(suite){
    stats.suites = stats.suites || 0;
    suite.root || stats.suites++;
  });
  runner.on('test end', function(test){
    stats.tests = stats.tests || 0;
    stats.tests++;
  });
  runner.on('pass', function(test){
    stats.passes = stats.passes || 0;
    var medium = test.slow() / 2;
    test.speed = test.duration > test.slow()
      ? 'slow'
      : test.duration > medium
        ? 'medium'
        : 'fast';
    stats.passes++;
  });
  runner.on('fail', function(test, err){
    stats.failures = stats.failures || 0;
    stats.failures++;
    test.err = err;
    failures.push(test);
  });
  runner.on('end', function(){
    stats.end = new Date;
    stats.duration = new Date - stats.start;
  });
  runner.on('pending', function(){
    stats.pending++;
  });
}
/**
 * Output common epilogue used by many of
 * the bundled reporters.
 *
 * @api public
 */
Base.prototype.epilogue = function(){
  var stats = this.stats
    , fmt
    , tests;
  console.log();
  function pluralize(n) {
    return 1 == n ? 'test' : 'tests';
  }
  // failure
  if (stats.failures) {
    fmt = color('bright fail', '  ' + exports.symbols.err)
      + color('fail', ' %d of %d %s failed')
      + color('light', ':')
    console.error(fmt,
      stats.failures,
      this.runner.total,
      pluralize(this.runner.total));
    Base.list(this.failures);
    console.error();
    return;
  }
  // pass
  fmt = color('bright pass', ' ')
    + color('green', ' %d %s complete')
    + color('light', ' (%s)');
  console.log(fmt,
    stats.tests || 0,
    pluralize(stats.tests),
    ms(stats.duration));
  // pending
  if (stats.pending) {
    fmt = color('pending', ' ')
      + color('pending', ' %d %s pending');
    console.log(fmt, stats.pending, pluralize(stats.pending));
  }
  console.log();
};
/**
 * Pad the given `str` to `len`.
 *
 * @param {String} str
 * @param {String} len
 * @return {String}
 * @api private
 */
function pad(str, len) {
  str = String(str);
  return Array(len - str.length + 1).join(' ') + str;
}
/**
 * Return a character diff for `err`.
 *
 * @param {Error} err
 * @return {String}
 * @api private
 */
function errorDiff(err, type, escape) {
  return diff['diff' + type](err.actual, err.expected).map(function(str){
    if (escape) {
      str.value = str.value
        .replace(/\t/g, '<tab>')
        .replace(/\r/g, '<CR>')
        .replace(/\n/g, '<LF>\n');
    }
    if (str.added) return colorLines('diff added', str.value);
    if (str.removed) return colorLines('diff removed', str.value);
    return str.value;
  }).join('');
}
/**
 * Color lines for `str`, using the color `name`.
 *
 * @param {String} name
 * @param {String} str
 * @return {String}
 * @api private
 */
function colorLines(name, str) {
  return str.split('\n').map(function(str){
    return color(name, str);
  }).join('\n');
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/doc',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , utils = require('../utils');
/**
 * Expose `Doc`.
 */
exports = module.exports = Doc;
/**
 * Initialize a new `Doc` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Doc(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , total = runner.total
    , indents = 2;
  function indent() {
    return Array(indents).join('  ');
  }
  runner.on('suite', function(suite){
    if (suite.root) return;
    ++indents;
    console.log('%s<section class="suite">', indent());
    ++indents;
    console.log('%s<h1>%s</h1>', indent(), utils.escape(suite.title));
    console.log('%s<dl>', indent());
  });
  runner.on('suite end', function(suite){
    if (suite.root) return;
    console.log('%s</dl>', indent());
    --indents;
    console.log('%s</section>', indent());
    --indents;
  });
  runner.on('pass', function(test){
    console.log('%s  <dt>%s</dt>', indent(), utils.escape(test.title));
    var code = utils.escape(utils.clean(test.fn.toString()));
    console.log('%s  <dd><pre><code>%s</code></pre></dd>', indent(), code);
  });
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/dot',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , color = Base.color;
/**
 * Expose `Dot`.
 */
exports = module.exports = Dot;
/**
 * Initialize a new `Dot` matrix test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Dot(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , width = Base.window.width * .75 | 0
    , n = 0;
  runner.on('start', function(){
    process.stdout.write('\n  ');
  });
  runner.on('pending', function(test){
    process.stdout.write(color('pending', Base.symbols.dot));
  });
  runner.on('pass', function(test){
    if (++n % width == 0) process.stdout.write('\n  ');
    if ('slow' == test.speed) {
      process.stdout.write(color('bright yellow', Base.symbols.dot));
    } else {
      process.stdout.write(color(test.speed, Base.symbols.dot));
    }
  });
  runner.on('fail', function(test, err){
    if (++n % width == 0) process.stdout.write('\n  ');
    process.stdout.write(color('fail', Base.symbols.dot));
  });
  runner.on('end', function(){
    console.log();
    self.epilogue();
  });
}
/**
 * Inherit from `Base.prototype`.
 */
Dot.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/html-cov',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var JSONCov = require('./json-cov')
  , fs = require('fs');
/**
 * Expose `HTMLCov`.
 */
exports = module.exports = HTMLCov;
/**
 * Initialize a new `JsCoverage` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function HTMLCov(runner) {
  var jade = require('jade')
    , file = __dirname + '/templates/coverage.jade'
    , str = fs.readFileSync(file, 'utf8')
    , fn = jade.compile(str, { filename: file })
    , self = this;
  JSONCov.call(this, runner, false);
  runner.on('end', function(){
    process.stdout.write(fn({
        cov: self.cov
      , coverageClass: coverageClass
    }));
  });
}
/**
 * Return coverage class for `n`.
 *
 * @return {String}
 * @api private
 */
function coverageClass(n) {
  if (n >= 75) return 'high';
  if (n >= 50) return 'medium';
  if (n >= 25) return 'low';
  return 'terrible';
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/html',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , utils = require('../utils')
  , Progress = require('../browser/progress')
  , escape = utils.escape;
/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;
/**
 * Expose `Doc`.
 */
exports = module.exports = HTML;
/**
 * Stats template.
 */
var statsTemplate = '<ul id="mocha-stats">'
  + '<li class="progress"><canvas width="40" height="40"></canvas></li>'
  + '<li class="passes"><a href="#">passes:</a> <em>0</em></li>'
  + '<li class="failures"><a href="#">failures:</a> <em>0</em></li>'
  + '<li class="duration">duration: <em>0</em>s</li>'
  + '</ul>';
/**
 * Initialize a new `Doc` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function HTML(runner, root) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , total = runner.total
    , stat = fragment(statsTemplate)
    , items = stat.getElementsByTagName('li')
    , passes = items[1].getElementsByTagName('em')[0]
    , passesLink = items[1].getElementsByTagName('a')[0]
    , failures = items[2].getElementsByTagName('em')[0]
    , failuresLink = items[2].getElementsByTagName('a')[0]
    , duration = items[3].getElementsByTagName('em')[0]
    , canvas = stat.getElementsByTagName('canvas')[0]
    , report = fragment('<ul id="mocha-report"></ul>')
    , stack = [report]
    , progress
    , ctx
  root = root || document.getElementById('mocha');
  if (canvas.getContext) {
    var ratio = window.devicePixelRatio || 1;
    canvas.style.width = canvas.width;
    canvas.style.height = canvas.height;
    canvas.width *= ratio;
    canvas.height *= ratio;
    ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    progress = new Progress;
  }
  if (!root) return error('#mocha div missing, add it to your document');
  // pass toggle
  on(passesLink, 'click', function(){
    unhide();
    var name = /pass/.test(report.className) ? '' : ' pass';
    report.className = report.className.replace(/fail|pass/g, '') + name;
    if (report.className.trim()) hideSuitesWithout('test pass');
  });
  // failure toggle
  on(failuresLink, 'click', function(){
    unhide();
    var name = /fail/.test(report.className) ? '' : ' fail';
    report.className = report.className.replace(/fail|pass/g, '') + name;
    if (report.className.trim()) hideSuitesWithout('test fail');
  });
  root.appendChild(stat);
  root.appendChild(report);
  if (progress) progress.size(40);
  runner.on('suite', function(suite){
    if (suite.root) return;
    // suite
    var url = '?grep=' + encodeURIComponent(suite.fullTitle());
    var el = fragment('<li class="suite"><h1><a href="%s">%s</a></h1></li>', url, escape(suite.title));
    // container
    stack[0].appendChild(el);
    stack.unshift(document.createElement('ul'));
    el.appendChild(stack[0]);
  });
  runner.on('suite end', function(suite){
    if (suite.root) return;
    stack.shift();
  });
  runner.on('fail', function(test, err){
    if ('hook' == test.type) runner.emit('test end', test);
  });
  runner.on('test end', function(test){
    window.scrollTo(0, document.body.scrollHeight);
    // TODO: add to stats
    var percent = stats.tests / this.total * 100 | 0;
    if (progress) progress.update(percent).draw(ctx);
    // update stats
    var ms = new Date - stats.start;
    text(passes, stats.passes);
    text(failures, stats.failures);
    text(duration, (ms / 1000).toFixed(2));
    // test
    if ('passed' == test.state) {
      var el = fragment('<li class="test pass %e"><h2>%e<span class="duration">%ems</span> <a href="?grep=%e" class="replay">‣</a></h2></li>', test.speed, test.title, test.duration, encodeURIComponent(test.fullTitle()));
    } else if (test.pending) {
      var el = fragment('<li class="test pass pending"><h2>%e</h2></li>', test.title);
    } else {
      var el = fragment('<li class="test fail"><h2>%e <a href="?grep=%e" class="replay">‣</a></h2></li>', test.title, encodeURIComponent(test.fullTitle()));
      var str = test.err.stack || test.err.toString();
      // FF / Opera do not add the message
      if (!~str.indexOf(test.err.message)) {
        str = test.err.message + '\n' + str;
      }
      // <=IE7 stringifies to [Object Error]. Since it can be overloaded, we
      // check for the result of the stringifying.
      if ('[object Error]' == str) str = test.err.message;
      // Safari doesn't give you a stack. Let's at least provide a source line.
      if (!test.err.stack && test.err.sourceURL && test.err.line !== undefined) {
        str += "\n(" + test.err.sourceURL + ":" + test.err.line + ")";
      }
      el.appendChild(fragment('<pre class="error">%e</pre>', str));
    }
    // toggle code
    // TODO: defer
    if (!test.pending) {
      var h2 = el.getElementsByTagName('h2')[0];
      on(h2, 'click', function(){
        pre.style.display = 'none' == pre.style.display
          ? 'inline-block'
          : 'none';
      });
      var pre = fragment('<pre><code>%e</code></pre>', utils.clean(test.fn.toString()));
      el.appendChild(pre);
      pre.style.display = 'none';
    }
    // Don't call .appendChild if #mocha-report was already .shift()'ed off the stack.
    if (stack[0]) stack[0].appendChild(el);
  });
}
/**
 * Display error `msg`.
 */
function error(msg) {
  document.body.appendChild(fragment('<div id="mocha-error">%s</div>', msg));
}
/**
 * Return a DOM fragment from `html`.
 */
function fragment(html) {
  var args = arguments
    , div = document.createElement('div')
    , i = 1;
  div.innerHTML = html.replace(/%([se])/g, function(_, type){
    switch (type) {
      case 's': return String(args[i++]);
      case 'e': return escape(args[i++]);
    }
  });
  return div.firstChild;
}
/**
 * Check for suites that do not have elements
 * with `classname`, and hide them.
 */
function hideSuitesWithout(classname) {
  var suites = document.getElementsByClassName('suite');
  for (var i = 0; i < suites.length; i++) {
    var els = suites[i].getElementsByClassName(classname);
    if (0 == els.length) suites[i].className += ' hidden';
  }
}
/**
 * Unhide .hidden suites.
 */
function unhide() {
  var els = document.getElementsByClassName('suite hidden');
  for (var i = 0; i < els.length; ++i) {
    els[i].className = els[i].className.replace('suite hidden', 'suite');
  }
}
/**
 * Set `el` text to `str`.
 */
function text(el, str) {
  if (el.textContent) {
    el.textContent = str;
  } else {
    el.innerText = str;
  }
}
/**
 * Listen on `event` with callback `fn`.
 */
function on(el, event, fn) {
  if (el.addEventListener) {
    el.addEventListener(event, fn, false);
  } else {
    el.attachEvent('on' + event, fn);
  }
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/index',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
exports.Base = require('./base');
exports.Dot = require('./dot');
exports.Doc = require('./doc');
exports.TAP = require('./tap');
exports.JSON = require('./json');
exports.HTML = require('./html');
exports.List = require('./list');
exports.Min = require('./min');
exports.Spec = require('./spec');
exports.Nyan = require('./nyan');
exports.XUnit = require('./xunit');
exports.Markdown = require('./markdown');
exports.Progress = require('./progress');
exports.Landing = require('./landing');
exports.JSONCov = require('./json-cov');
exports.HTMLCov = require('./html-cov');
exports.JSONStream = require('./json-stream');
exports.Teamcity = require('./teamcity');
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/json-cov',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base');
/**
 * Expose `JSONCov`.
 */
exports = module.exports = JSONCov;
/**
 * Initialize a new `JsCoverage` reporter.
 *
 * @param {Runner} runner
 * @param {Boolean} output
 * @api public
 */
function JSONCov(runner, output) {
  var self = this
    , output = 1 == arguments.length ? true : output;
  Base.call(this, runner);
  var tests = []
    , failures = []
    , passes = [];
  runner.on('test end', function(test){
    tests.push(test);
  });
  runner.on('pass', function(test){
    passes.push(test);
  });
  runner.on('fail', function(test){
    failures.push(test);
  });
  runner.on('end', function(){
    var cov = global._$jscoverage || {};
    var result = self.cov = map(cov);
    result.stats = self.stats;
    result.tests = tests.map(clean);
    result.failures = failures.map(clean);
    result.passes = passes.map(clean);
    if (!output) return;
    process.stdout.write(JSON.stringify(result, null, 2 ));
  });
}
/**
 * Map jscoverage data to a JSON structure
 * suitable for reporting.
 *
 * @param {Object} cov
 * @return {Object}
 * @api private
 */
function map(cov) {
  var ret = {
      instrumentation: 'node-jscoverage'
    , sloc: 0
    , hits: 0
    , misses: 0
    , coverage: 0
    , files: []
  };
  for (var filename in cov) {
    var data = coverage(filename, cov[filename]);
    ret.files.push(data);
    ret.hits += data.hits;
    ret.misses += data.misses;
    ret.sloc += data.sloc;
  }
  ret.files.sort(function(a, b) {
    return a.filename.localeCompare(b.filename);
  });
  if (ret.sloc > 0) {
    ret.coverage = (ret.hits / ret.sloc) * 100;
  }
  return ret;
};
/**
 * Map jscoverage data for a single source file
 * to a JSON structure suitable for reporting.
 *
 * @param {String} filename name of the source file
 * @param {Object} data jscoverage coverage data
 * @return {Object}
 * @api private
 */
function coverage(filename, data) {
  var ret = {
    filename: filename,
    coverage: 0,
    hits: 0,
    misses: 0,
    sloc: 0,
    source: {}
  };
  data.source.forEach(function(line, num){
    num++;
    if (data[num] === 0) {
      ret.misses++;
      ret.sloc++;
    } else if (data[num] !== undefined) {
      ret.hits++;
      ret.sloc++;
    }
    ret.source[num] = {
        source: line
      , coverage: data[num] === undefined
        ? ''
        : data[num]
    };
  });
  ret.coverage = ret.hits / ret.sloc * 100;
  return ret;
}
/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */
function clean(test) {
  return {
      title: test.title
    , fullTitle: test.fullTitle()
    , duration: test.duration
  }
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/json-stream',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , color = Base.color;
/**
 * Expose `List`.
 */
exports = module.exports = List;
/**
 * Initialize a new `List` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function List(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , total = runner.total;
  runner.on('start', function(){
    console.log(JSON.stringify(['start', { total: total }]));
  });
  runner.on('pass', function(test){
    console.log(JSON.stringify(['pass', clean(test)]));
  });
  runner.on('fail', function(test, err){
    console.log(JSON.stringify(['fail', clean(test)]));
  });
  runner.on('end', function(){
    process.stdout.write(JSON.stringify(['end', self.stats]));
  });
}
/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */
function clean(test) {
  return {
      title: test.title
    , fullTitle: test.fullTitle()
    , duration: test.duration
  }
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/json',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `JSON`.
 */
exports = module.exports = JSONReporter;
/**
 * Initialize a new `JSON` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function JSONReporter(runner) {
  var self = this;
  Base.call(this, runner);
  var tests = []
    , failures = []
    , passes = [];
  runner.on('test end', function(test){
    tests.push(test);
  });
  runner.on('pass', function(test){
    passes.push(test);
  });
  runner.on('fail', function(test){
    failures.push(test);
  });
  runner.on('end', function(){
    var obj = {
        stats: self.stats
      , tests: tests.map(clean)
      , failures: failures.map(clean)
      , passes: passes.map(clean)
    };
    process.stdout.write(JSON.stringify(obj, null, 2));
  });
}
/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */
function clean(test) {
  return {
      title: test.title
    , fullTitle: test.fullTitle()
    , duration: test.duration
  }
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/landing',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `Landing`.
 */
exports = module.exports = Landing;
/**
 * Airplane color.
 */
Base.colors.plane = 0;
/**
 * Airplane crash color.
 */
Base.colors['plane crash'] = 31;
/**
 * Runway color.
 */
Base.colors.runway = 90;
/**
 * Initialize a new `Landing` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Landing(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , width = Base.window.width * .75 | 0
    , total = runner.total
    , stream = process.stdout
    , plane = color('plane', '✈')
    , crashed = -1
    , n = 0;
  function runway() {
    var buf = Array(width).join('-');
    return '  ' + color('runway', buf);
  }
  runner.on('start', function(){
    stream.write('\n  ');
    cursor.hide();
  });
  runner.on('test end', function(test){
    // check if the plane crashed
    var col = -1 == crashed
      ? width * ++n / total | 0
      : crashed;
    // show the crash
    if ('failed' == test.state) {
      plane = color('plane crash', '✈');
      crashed = col;
    }
    // render landing strip
    stream.write('\u001b[4F\n\n');
    stream.write(runway());
    stream.write('\n  ');
    stream.write(color('runway', Array(col).join('⋅')));
    stream.write(plane)
    stream.write(color('runway', Array(width - col).join('⋅') + '\n'));
    stream.write(runway());
    stream.write('\u001b[0m');
  });
  runner.on('end', function(){
    cursor.show();
    console.log();
    self.epilogue();
  });
}
/**
 * Inherit from `Base.prototype`.
 */
Landing.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/list',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `List`.
 */
exports = module.exports = List;
/**
 * Initialize a new `List` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function List(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , n = 0;
  runner.on('start', function(){
    console.log();
  });
  runner.on('test', function(test){
    process.stdout.write(color('pass', '    ' + test.fullTitle() + ': '));
  });
  runner.on('pending', function(test){
    var fmt = color('checkmark', '  -')
      + color('pending', ' %s');
    console.log(fmt, test.fullTitle());
  });
  runner.on('pass', function(test){
    var fmt = color('checkmark', '  '+Base.symbols.dot)
      + color('pass', ' %s: ')
      + color(test.speed, '%dms');
    cursor.CR();
    console.log(fmt, test.fullTitle(), test.duration);
  });
  runner.on('fail', function(test, err){
    cursor.CR();
    console.log(color('fail', '  %d) %s'), ++n, test.fullTitle());
  });
  runner.on('end', self.epilogue.bind(self));
}
/**
 * Inherit from `Base.prototype`.
 */
List.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/markdown',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * Module dependencies.
 */
var Base = require('./base')
  , utils = require('../utils');
/**
 * Expose `Markdown`.
 */
exports = module.exports = Markdown;
/**
 * Initialize a new `Markdown` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Markdown(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , total = runner.total
    , level = 0
    , buf = '';
  function title(str) {
    return Array(level).join('#') + ' ' + str;
  }
  function indent() {
    return Array(level).join('  ');
  }
  function mapTOC(suite, obj) {
    var ret = obj;
    obj = obj[suite.title] = obj[suite.title] || { suite: suite };
    suite.suites.forEach(function(suite){
      mapTOC(suite, obj);
    });
    return ret;
  }
  function stringifyTOC(obj, level) {
    ++level;
    var buf = '';
    var link;
    for (var key in obj) {
      if ('suite' == key) continue;
      if (key) link = ' - [' + key + '](#' + utils.slug(obj[key].suite.fullTitle()) + ')\n';
      if (key) buf += Array(level).join('  ') + link;
      buf += stringifyTOC(obj[key], level);
    }
    --level;
    return buf;
  }
  function generateTOC(suite) {
    var obj = mapTOC(suite, {});
    return stringifyTOC(obj, 0);
  }
  generateTOC(runner.suite);
  runner.on('suite', function(suite){
    ++level;
    var slug = utils.slug(suite.fullTitle());
    buf += '<a name="' + slug + '"></a>' + '\n';
    buf += title(suite.title) + '\n';
  });
  runner.on('suite end', function(suite){
    --level;
  });
  runner.on('pass', function(test){
    var code = utils.clean(test.fn.toString());
    buf += test.title + '.\n';
    buf += '\n```js\n';
    buf += code + '\n';
    buf += '```\n\n';
  });
  runner.on('end', function(){
    process.stdout.write('# TOC\n');
    process.stdout.write(generateTOC(runner.suite));
    process.stdout.write(buf);
  });
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/min',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base');
/**
 * Expose `Min`.
 */
exports = module.exports = Min;
/**
 * Initialize a new `Min` minimal test reporter (best used with --watch).
 *
 * @param {Runner} runner
 * @api public
 */
function Min(runner) {
  Base.call(this, runner);
  
  runner.on('start', function(){
    // clear screen
    process.stdout.write('\u001b[2J');
    // set cursor position
    process.stdout.write('\u001b[1;3H');
  });
  runner.on('end', this.epilogue.bind(this));
}
/**
 * Inherit from `Base.prototype`.
 */
Min.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/nyan',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , color = Base.color;
/**
 * Expose `Dot`.
 */
exports = module.exports = NyanCat;
/**
 * Initialize a new `Dot` matrix test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function NyanCat(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , width = Base.window.width * .75 | 0
    , rainbowColors = this.rainbowColors = self.generateColors()
    , colorIndex = this.colorIndex = 0
    , numerOfLines = this.numberOfLines = 4
    , trajectories = this.trajectories = [[], [], [], []]
    , nyanCatWidth = this.nyanCatWidth = 11
    , trajectoryWidthMax = this.trajectoryWidthMax = (width - nyanCatWidth)
    , scoreboardWidth = this.scoreboardWidth = 5
    , tick = this.tick = 0
    , n = 0;
  runner.on('start', function(){
    Base.cursor.hide();
    self.draw('start');
  });
  runner.on('pending', function(test){
    self.draw('pending');
  });
  runner.on('pass', function(test){
    self.draw('pass');
  });
  runner.on('fail', function(test, err){
    self.draw('fail');
  });
  runner.on('end', function(){
    Base.cursor.show();
    for (var i = 0; i < self.numberOfLines; i++) write('\n');
    self.epilogue();
  });
}
/**
 * Draw the nyan cat with runner `status`.
 *
 * @param {String} status
 * @api private
 */
NyanCat.prototype.draw = function(status){
  this.appendRainbow();
  this.drawScoreboard();
  this.drawRainbow();
  this.drawNyanCat(status);
  this.tick = !this.tick;
};
/**
 * Draw the "scoreboard" showing the number
 * of passes, failures and pending tests.
 *
 * @api private
 */
NyanCat.prototype.drawScoreboard = function(){
  var stats = this.stats;
  var colors = Base.colors;
  function draw(color, n) {
    write(' ');
    write('\u001b[' + color + 'm' + n + '\u001b[0m');
    write('\n');
  }
  draw(colors.green, stats.passes);
  draw(colors.fail, stats.failures);
  draw(colors.pending, stats.pending);
  write('\n');
  this.cursorUp(this.numberOfLines);
};
/**
 * Append the rainbow.
 *
 * @api private
 */
NyanCat.prototype.appendRainbow = function(){
  var segment = this.tick ? '_' : '-';
  var rainbowified = this.rainbowify(segment);
  for (var index = 0; index < this.numberOfLines; index++) {
    var trajectory = this.trajectories[index];
    if (trajectory.length >= this.trajectoryWidthMax) trajectory.shift();
    trajectory.push(rainbowified);
  }
};
/**
 * Draw the rainbow.
 *
 * @api private
 */
NyanCat.prototype.drawRainbow = function(){
  var self = this;
  this.trajectories.forEach(function(line, index) {
    write('\u001b[' + self.scoreboardWidth + 'C');
    write(line.join(''));
    write('\n');
  });
  this.cursorUp(this.numberOfLines);
};
/**
 * Draw the nyan cat with `status`.
 *
 * @param {String} status
 * @api private
 */
NyanCat.prototype.drawNyanCat = function(status) {
  var self = this;
  var startWidth = this.scoreboardWidth + this.trajectories[0].length;
  [0, 1, 2, 3].forEach(function(index) {
    write('\u001b[' + startWidth + 'C');
    switch (index) {
      case 0:
        write('_,------,');
        write('\n');
        break;
      case 1:
        var padding = self.tick ? '  ' : '   ';
        write('_|' + padding + '/\\_/\\ ');
        write('\n');
        break;
      case 2:
        var padding = self.tick ? '_' : '__';
        var tail = self.tick ? '~' : '^';
        var face;
        switch (status) {
          case 'pass':
            face = '( ^ .^)';
            break;
          case 'fail':
            face = '( o .o)';
            break;
          default:
            face = '( - .-)';
        }
        write(tail + '|' + padding + face + ' ');
        write('\n');
        break;
      case 3:
        var padding = self.tick ? ' ' : '  ';
        write(padding + '""  "" ');
        write('\n');
        break;
    }
  });
  this.cursorUp(this.numberOfLines);
};
/**
 * Move cursor up `n`.
 *
 * @param {Number} n
 * @api private
 */
NyanCat.prototype.cursorUp = function(n) {
  write('\u001b[' + n + 'A');
};
/**
 * Move cursor down `n`.
 *
 * @param {Number} n
 * @api private
 */
NyanCat.prototype.cursorDown = function(n) {
  write('\u001b[' + n + 'B');
};
/**
 * Generate rainbow colors.
 *
 * @return {Array}
 * @api private
 */
NyanCat.prototype.generateColors = function(){
  var colors = [];
  for (var i = 0; i < (6 * 7); i++) {
    var pi3 = Math.floor(Math.PI / 3);
    var n = (i * (1.0 / 6));
    var r = Math.floor(3 * Math.sin(n) + 3);
    var g = Math.floor(3 * Math.sin(n + 2 * pi3) + 3);
    var b = Math.floor(3 * Math.sin(n + 4 * pi3) + 3);
    colors.push(36 * r + 6 * g + b + 16);
  }
  return colors;
};
/**
 * Apply rainbow to the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
NyanCat.prototype.rainbowify = function(str){
  var color = this.rainbowColors[this.colorIndex % this.rainbowColors.length];
  this.colorIndex += 1;
  return '\u001b[38;5;' + color + 'm' + str + '\u001b[0m';
};
/**
 * Stdout helper.
 */
function write(string) {
  process.stdout.write(string);
}
/**
 * Inherit from `Base.prototype`.
 */
NyanCat.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/progress',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `Progress`.
 */
exports = module.exports = Progress;
/**
 * General progress bar color.
 */
Base.colors.progress = 90;
/**
 * Initialize a new `Progress` bar test reporter.
 *
 * @param {Runner} runner
 * @param {Object} options
 * @api public
 */
function Progress(runner, options) {
  Base.call(this, runner);
  var self = this
    , options = options || {}
    , stats = this.stats
    , width = Base.window.width * .50 | 0
    , total = runner.total
    , complete = 0
    , max = Math.max;
  // default chars
  options.open = options.open || '[';
  options.complete = options.complete || '▬';
  options.incomplete = options.incomplete || Base.symbols.dot;
  options.close = options.close || ']';
  options.verbose = false;
  // tests started
  runner.on('start', function(){
    console.log();
    cursor.hide();
  });
  // tests complete
  runner.on('test end', function(){
    complete++;
    var incomplete = total - complete
      , percent = complete / total
      , n = width * percent | 0
      , i = width - n;
    cursor.CR();
    process.stdout.write('\u001b[J');
    process.stdout.write(color('progress', '  ' + options.open));
    process.stdout.write(Array(n).join(options.complete));
    process.stdout.write(Array(i).join(options.incomplete));
    process.stdout.write(color('progress', options.close));
    if (options.verbose) {
      process.stdout.write(color('progress', ' ' + complete + ' of ' + total));
    }
  });
  // tests are complete, output some stats
  // and the failures if any
  runner.on('end', function(){
    cursor.show();
    console.log();
    self.epilogue();
  });
}
/**
 * Inherit from `Base.prototype`.
 */
Progress.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/spec',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `Spec`.
 */
exports = module.exports = Spec;
/**
 * Initialize a new `Spec` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Spec(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , indents = 0
    , n = 0;
  function indent() {
    return Array(indents).join('  ')
  }
  runner.on('start', function(){
    console.log();
  });
  runner.on('suite', function(suite){
    ++indents;
    console.log(color('suite', '%s%s'), indent(), suite.title);
  });
  runner.on('suite end', function(suite){
    --indents;
    if (1 == indents) console.log();
  });
  runner.on('test', function(test){
    process.stdout.write(indent() + color('pass', '  ◦ ' + test.title + ': '));
  });
  runner.on('pending', function(test){
    var fmt = indent() + color('pending', '  - %s');
    console.log(fmt, test.title);
  });
  runner.on('pass', function(test){
    if ('fast' == test.speed) {
      var fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s ');
      cursor.CR();
      console.log(fmt, test.title);
    } else {
      var fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s ')
        + color(test.speed, '(%dms)');
      cursor.CR();
      console.log(fmt, test.title, test.duration);
    }
  });
  runner.on('fail', function(test, err){
    cursor.CR();
    console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
  });
  runner.on('end', self.epilogue.bind(self));
}
/**
 * Inherit from `Base.prototype`.
 */
Spec.prototype.__proto__ = Base.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/tap',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , cursor = Base.cursor
  , color = Base.color;
/**
 * Expose `TAP`.
 */
exports = module.exports = TAP;
/**
 * Initialize a new `TAP` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function TAP(runner) {
  Base.call(this, runner);
  var self = this
    , stats = this.stats
    , n = 1
    , passes = 0
    , failures = 1;
  runner.on('start', function(){
    var total = runner.grepTotal(runner.suite);
    console.log('%d..%d', 1, total);
  });
  runner.on('test end', function(){
    ++n;
  });
  runner.on('pending', function(test){
    console.log('ok %d %s # SKIP -', n, title(test));
  });
  runner.on('pass', function(test){
    passes++;
    console.log('ok %d %s', n, title(test));
  });
  runner.on('fail', function(test, err){
    failures++;
    console.log('not ok %d %s', n, title(test));
    console.log(err.stack.replace(/^/gm, '  '));
  });
  runner.on('end', function(){
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
  });
}
/**
 * Return a TAP-safe title of `test`
 *
 * @param {Object} test
 * @return {String}
 * @api private
 */
function title(test) {
  return test.fullTitle().replace(/#/g, '');
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/teamcity',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base');
/**
 * Expose `Teamcity`.
 */
exports = module.exports = Teamcity;
/**
 * Initialize a new `Teamcity` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Teamcity(runner) {
  Base.call(this, runner);
  var stats = this.stats;
  runner.on('start', function() {
    console.log("##teamcity[testSuiteStarted name='mocha.suite']");
  });
  runner.on('test', function(test) {
    console.log("##teamcity[testStarted name='" + escape(test.fullTitle()) + "']");
  });
  runner.on('fail', function(test, err) {
    console.log("##teamcity[testFailed name='" + escape(test.fullTitle()) + "' message='" + escape(err.message) + "']");
  });
  runner.on('pending', function(test) {
    console.log("##teamcity[testIgnored name='" + escape(test.fullTitle()) + "' message='pending']");
  });
  runner.on('test end', function(test) {
    console.log("##teamcity[testFinished name='" + escape(test.fullTitle()) + "' duration='" + test.duration + "']");
  });
  runner.on('end', function() {
    console.log("##teamcity[testSuiteFinished name='mocha.suite' duration='" + stats.duration + "']");
  });
}
/**
 * Escape the given `str`.
 */
function escape(str) {
  return str
    .replace(/\|/g, "||")
    .replace(/\n/g, "|n")
    .replace(/\r/g, "|r")
    .replace(/\[/g, "|[")
    .replace(/\]/g, "|]")
    .replace(/\u0085/g, "|x")
    .replace(/\u2028/g, "|l")
    .replace(/\u2029/g, "|p")
    .replace(/'/g, "|'");
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/reporters/xunit',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Base = require('./base')
  , utils = require('../utils')
  , escape = utils.escape;
/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;
/**
 * Expose `XUnit`.
 */
exports = module.exports = XUnit;
/**
 * Initialize a new `XUnit` reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function XUnit(runner) {
  Base.call(this, runner);
  var stats = this.stats
    , tests = []
    , self = this;
  runner.on('pass', function(test){
    tests.push(test);
  });
  
  runner.on('fail', function(test){
    tests.push(test);
  });
  runner.on('end', function(){
    console.log(tag('testsuite', {
        name: 'Mocha Tests'
      , tests: stats.tests
      , failures: stats.failures
      , errors: stats.failures
      , skip: stats.tests - stats.failures - stats.passes
      , timestamp: (new Date).toUTCString()
      , time: stats.duration / 1000
    }, false));
    tests.forEach(test);
    console.log('</testsuite>');    
  });
}
/**
 * Inherit from `Base.prototype`.
 */
XUnit.prototype.__proto__ = Base.prototype;
/**
 * Output tag for the given `test.`
 */
function test(test) {
  var attrs = {
      classname: test.parent.fullTitle()
    , name: test.title
    , time: test.duration / 1000
  };
  if ('failed' == test.state) {
    var err = test.err;
    attrs.message = escape(err.message);
    console.log(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));
  } else if (test.pending) {
    console.log(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    console.log(tag('testcase', attrs, true) );
  }
}
/**
 * HTML tag helper.
 */
function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>'
    , pairs = []
    , tag;
  for (var key in attrs) {
    pairs.push(key + '="' + escape(attrs[key]) + '"');
  }
  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content) tag += content + '</' + name + end;
  return tag;
}
/**
 * Return cdata escaped CDATA `str`.
 */
function cdata(str) {
  return '<![CDATA[' + escape(str) + ']]>';
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/runnable',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('mocha:runnable')
  , milliseconds = require('./ms');
/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;
/**
 * Object#toString().
 */
var toString = Object.prototype.toString;
/**
 * Expose `Runnable`.
 */
module.exports = Runnable;
/**
 * Initialize a new `Runnable` with the given `title` and callback `fn`.
 *
 * @param {String} title
 * @param {Function} fn
 * @api private
 */
function Runnable(title, fn) {
  this.title = title;
  this.fn = fn;
  this.async = fn && fn.length;
  this.sync = ! this.async;
  this._timeout = 2000;
  this._slow = 75;
  this.timedOut = false;
}
/**
 * Inherit from `EventEmitter.prototype`.
 */
Runnable.prototype.__proto__ = EventEmitter.prototype;
/**
 * Set & get timeout `ms`.
 *
 * @param {Number|String} ms
 * @return {Runnable|Number} ms or self
 * @api private
 */
Runnable.prototype.timeout = function(ms){
  if (0 == arguments.length) return this._timeout;
  if ('string' == typeof ms) ms = milliseconds(ms);
  debug('timeout %d', ms);
  this._timeout = ms;
  if (this.timer) this.resetTimeout();
  return this;
};
/**
 * Set & get slow `ms`.
 *
 * @param {Number|String} ms
 * @return {Runnable|Number} ms or self
 * @api private
 */
Runnable.prototype.slow = function(ms){
  if (0 === arguments.length) return this._slow;
  if ('string' == typeof ms) ms = milliseconds(ms);
  debug('timeout %d', ms);
  this._slow = ms;
  return this;
};
/**
 * Return the full title generated by recursively
 * concatenating the parent's full title.
 *
 * @return {String}
 * @api public
 */
Runnable.prototype.fullTitle = function(){
  return this.parent.fullTitle() + ' ' + this.title;
};
/**
 * Clear the timeout.
 *
 * @api private
 */
Runnable.prototype.clearTimeout = function(){
  clearTimeout(this.timer);
};
/**
 * Inspect the runnable void of private properties.
 *
 * @return {String}
 * @api private
 */
Runnable.prototype.inspect = function(){
  return JSON.stringify(this, function(key, val){
    if ('_' == key[0]) return;
    if ('parent' == key) return '#<Suite>';
    if ('ctx' == key) return '#<Context>';
    return val;
  }, 2);
};
/**
 * Reset the timeout.
 *
 * @api private
 */
Runnable.prototype.resetTimeout = function(){
  var self = this
    , ms = this.timeout();
  this.clearTimeout();
  if (ms) {
    this.timer = setTimeout(function(){
      self.callback(new Error('timeout of ' + ms + 'ms exceeded'));
      self.timedOut = true;
    }, ms);
  }
};
/**
 * Run the test and invoke `fn(err)`.
 *
 * @param {Function} fn
 * @api private
 */
Runnable.prototype.run = function(fn){
  var self = this
    , ms = this.timeout()
    , start = new Date
    , ctx = this.ctx
    , finished
    , emitted;
  if (ctx) ctx.runnable(this);
  // timeout
  if (this.async) {
    if (ms) {
      this.timer = setTimeout(function(){
        done(new Error('timeout of ' + ms + 'ms exceeded'));
        self.timedOut = true;
      }, ms);
    }
  }
  // called multiple times
  function multiple(err) {
    if (emitted) return;
    emitted = true;
    self.emit('error', err || new Error('done() called multiple times'));
  }
  // finished
  function done(err) {
    if (self.timedOut) return;
    if (finished) return multiple(err);
    self.clearTimeout();
    self.duration = new Date - start;
    finished = true;
    fn(err);
  }
  // for .resetTimeout()
  this.callback = done;
  // async
  if (this.async) {
    try {
      this.fn.call(ctx, function(err){
        if (toString.call(err) === "[object Error]") return done(err);
        if (null != err) return done(new Error('done() invoked with non-Error: ' + err));
        done();
      });
    } catch (err) {
      done(err);
    }
    return;
  }
  if (this.asyncOnly) {
    return done(new Error('--async-only option in use without declaring `done()`'));
  }
  // sync
  try {
    if (!this.pending) this.fn.call(ctx);
    this.duration = new Date - start;
    fn();
  } catch (err) {
    fn(err);
  }
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/runner',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('mocha:runner')
  , Test = require('./test')
  , utils = require('./utils')
  , filter = utils.filter
  , keys = utils.keys
  , noop = function(){};
/**
 * Non-enumerable globals.
 */
var globals = [
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'XMLHttpRequest',
  'Date'
];
/**
 * Expose `Runner`.
 */
module.exports = Runner;
/**
 * Initialize a `Runner` for the given `suite`.
 *
 * Events:
 *
 *   - `start`  execution started
 *   - `end`  execution complete
 *   - `suite`  (suite) test suite execution started
 *   - `suite end`  (suite) all tests (and sub-suites) have finished
 *   - `test`  (test) test execution started
 *   - `test end`  (test) test completed
 *   - `hook`  (hook) hook execution started
 *   - `hook end`  (hook) hook complete
 *   - `pass`  (test) test passed
 *   - `fail`  (test, err) test failed
 *
 * @api public
 */
function Runner(suite) {
  var self = this;
  this._globals = [];
  this.suite = suite;
  this.total = suite.total();
  this.failures = 0;
  this.on('test end', function(test){ self.checkGlobals(test); });
  this.on('hook end', function(hook){ self.checkGlobals(hook); });
  this.grep(/.*/);
  this.globals(this.globalProps().concat(['errno']));
}
/**
 * Inherit from `EventEmitter.prototype`.
 */
Runner.prototype.__proto__ = EventEmitter.prototype;
/**
 * Run tests with full titles matching `re`. Updates runner.total
 * with number of tests matched.
 *
 * @param {RegExp} re
 * @param {Boolean} invert
 * @return {Runner} for chaining
 * @api public
 */
Runner.prototype.grep = function(re, invert){
  debug('grep %s', re);
  this._grep = re;
  this._invert = invert;
  this.total = this.grepTotal(this.suite);
  return this;
};
/**
 * Returns the number of tests matching the grep search for the
 * given suite.
 *
 * @param {Suite} suite
 * @return {Number}
 * @api public
 */
Runner.prototype.grepTotal = function(suite) {
  var self = this;
  var total = 0;
  suite.eachTest(function(test){
    var match = self._grep.test(test.fullTitle());
    if (self._invert) match = !match;
    if (match) total++;
  });
  return total;
};
/**
 * Return a list of global properties.
 *
 * @return {Array}
 * @api private
 */
Runner.prototype.globalProps = function() {
  var props = utils.keys(global);
  // non-enumerables
  for (var i = 0; i < globals.length; ++i) {
    if (~utils.indexOf(props, globals[i])) continue;
    props.push(globals[i]);
  }
  return props;
};
/**
 * Allow the given `arr` of globals.
 *
 * @param {Array} arr
 * @return {Runner} for chaining
 * @api public
 */
Runner.prototype.globals = function(arr){
  if (0 == arguments.length) return this._globals;
  debug('globals %j', arr);
  utils.forEach(arr, function(arr){
    this._globals.push(arr);
  }, this);
  return this;
};
/**
 * Check for global variable leaks.
 *
 * @api private
 */
Runner.prototype.checkGlobals = function(test){
  if (this.ignoreLeaks) return;
  var ok = this._globals;
  var globals = this.globalProps();
  var isNode = process.kill;
  var leaks;
  // check length - 2 ('errno' and 'location' globals)
  if (isNode && 1 == ok.length - globals.length) return
  else if (2 == ok.length - globals.length) return;
  leaks = filterLeaks(ok, globals);
  this._globals = this._globals.concat(leaks);
  if (leaks.length > 1) {
    this.fail(test, new Error('global leaks detected: ' + leaks.join(', ') + ''));
  } else if (leaks.length) {
    this.fail(test, new Error('global leak detected: ' + leaks[0]));
  }
};
/**
 * Fail the given `test`.
 *
 * @param {Test} test
 * @param {Error} err
 * @api private
 */
Runner.prototype.fail = function(test, err){
  ++this.failures;
  test.state = 'failed';
  if ('string' == typeof err) {
    err = new Error('the string "' + err + '" was thrown, throw an Error :)');
  }
  
  this.emit('fail', test, err);
};
/**
 * Fail the given `hook` with `err`.
 *
 * Hook failures (currently) hard-end due
 * to that fact that a failing hook will
 * surely cause subsequent tests to fail,
 * causing jumbled reporting.
 *
 * @param {Hook} hook
 * @param {Error} err
 * @api private
 */
Runner.prototype.failHook = function(hook, err){
  this.fail(hook, err);
  this.emit('end');
};
/**
 * Run hook `name` callbacks and then invoke `fn()`.
 *
 * @param {String} name
 * @param {Function} function
 * @api private
 */
Runner.prototype.hook = function(name, fn){
  var suite = this.suite
    , hooks = suite['_' + name]
    , self = this
    , timer;
  function next(i) {
    var hook = hooks[i];
    if (!hook) return fn();
    self.currentRunnable = hook;
    self.emit('hook', hook);
    hook.on('error', function(err){
      self.failHook(hook, err);
    });
    hook.run(function(err){
      hook.removeAllListeners('error');
      var testError = hook.error();
      if (testError) self.fail(self.test, testError);
      if (err) return self.failHook(hook, err);
      self.emit('hook end', hook);
      next(++i);
    });
  }
  process.nextTick(function(){
    next(0);
  });
};
/**
 * Run hook `name` for the given array of `suites`
 * in order, and callback `fn(err)`.
 *
 * @param {String} name
 * @param {Array} suites
 * @param {Function} fn
 * @api private
 */
Runner.prototype.hooks = function(name, suites, fn){
  var self = this
    , orig = this.suite;
  function next(suite) {
    self.suite = suite;
    if (!suite) {
      self.suite = orig;
      return fn();
    }
    self.hook(name, function(err){
      if (err) {
        self.suite = orig;
        return fn(err);
      }
      next(suites.pop());
    });
  }
  next(suites.pop());
};
/**
 * Run hooks from the top level down.
 *
 * @param {String} name
 * @param {Function} fn
 * @api private
 */
Runner.prototype.hookUp = function(name, fn){
  var suites = [this.suite].concat(this.parents()).reverse();
  this.hooks(name, suites, fn);
};
/**
 * Run hooks from the bottom up.
 *
 * @param {String} name
 * @param {Function} fn
 * @api private
 */
Runner.prototype.hookDown = function(name, fn){
  var suites = [this.suite].concat(this.parents());
  this.hooks(name, suites, fn);
};
/**
 * Return an array of parent Suites from
 * closest to furthest.
 *
 * @return {Array}
 * @api private
 */
Runner.prototype.parents = function(){
  var suite = this.suite
    , suites = [];
  while (suite = suite.parent) suites.push(suite);
  return suites;
};
/**
 * Run the current test and callback `fn(err)`.
 *
 * @param {Function} fn
 * @api private
 */
Runner.prototype.runTest = function(fn){
  var test = this.test
    , self = this;
  if (this.asyncOnly) test.asyncOnly = true;
  try {
    test.on('error', function(err){
      self.fail(test, err);
    });
    test.run(fn);
  } catch (err) {
    fn(err);
  }
};
/**
 * Run tests in the given `suite` and invoke
 * the callback `fn()` when complete.
 *
 * @param {Suite} suite
 * @param {Function} fn
 * @api private
 */
Runner.prototype.runTests = function(suite, fn){
  var self = this
    , tests = suite.tests.slice()
    , test;
  function next(err) {
    // if we bail after first err
    if (self.failures && suite._bail) return fn();
    // next test
    test = tests.shift();
    // all done
    if (!test) return fn();
    // grep
    var match = self._grep.test(test.fullTitle());
    if (self._invert) match = !match;
    if (!match) return next();
    // pending
    if (test.pending) {
      self.emit('pending', test);
      self.emit('test end', test);
      return next();
    }
    // execute test and hook(s)
    self.emit('test', self.test = test);
    self.hookDown('beforeEach', function(){
      self.currentRunnable = self.test;
      self.runTest(function(err){
        test = self.test;
        if (err) {
          self.fail(test, err);
          self.emit('test end', test);
          return self.hookUp('afterEach', next);
        }
        test.state = 'passed';
        self.emit('pass', test);
        self.emit('test end', test);
        self.hookUp('afterEach', next);
      });
    });
  }
  this.next = next;
  next();
};
/**
 * Run the given `suite` and invoke the
 * callback `fn()` when complete.
 *
 * @param {Suite} suite
 * @param {Function} fn
 * @api private
 */
Runner.prototype.runSuite = function(suite, fn){
  var total = this.grepTotal(suite)
    , self = this
    , i = 0;
  debug('run suite %s', suite.fullTitle());
  if (!total) return fn();
  this.emit('suite', this.suite = suite);
  function next() {
    var curr = suite.suites[i++];
    if (!curr) return done();
    self.runSuite(curr, next);
  }
  function done() {
    self.suite = suite;
    self.hook('afterAll', function(){
      self.emit('suite end', suite);
      fn();
    });
  }
  this.hook('beforeAll', function(){
    self.runTests(suite, next);
  });
};
/**
 * Handle uncaught exceptions.
 *
 * @param {Error} err
 * @api private
 */
Runner.prototype.uncaught = function(err){
  debug('uncaught exception %s', err.message);
  var runnable = this.currentRunnable;
  if (!runnable || 'failed' == runnable.state) return;
  runnable.clearTimeout();
  err.uncaught = true;
  this.fail(runnable, err);
  // recover from test
  if ('test' == runnable.type) {
    this.emit('test end', runnable);
    this.hookUp('afterEach', this.next);
    return;
  }
  // bail on hooks
  this.emit('end');
};
/**
 * Run the root suite and invoke `fn(failures)`
 * on completion.
 *
 * @param {Function} fn
 * @return {Runner} for chaining
 * @api public
 */
Runner.prototype.run = function(fn){
  var self = this
    , fn = fn || function(){};
  debug('start');
  // callback
  this.on('end', function(){
    debug('end');
    process.removeListener('uncaughtException', function(err){
      self.uncaught(err);
    });
    fn(self.failures);
  });
  // run suites
  this.emit('start');
  this.runSuite(this.suite, function(){
    debug('finished running');
    self.emit('end');
  });
  // uncaught exception
  process.on('uncaughtException', function(err){
    self.uncaught(err);
  });
  return this;
};
/**
 * Filter leaks with the given globals flagged as `ok`.
 *
 * @param {Array} ok
 * @param {Array} globals
 * @return {Array}
 * @api private
 */
function filterLeaks(ok, globals) {
  return filter(globals, function(key){
    var matched = filter(ok, function(ok){
      if (~ok.indexOf('*')) return 0 == key.indexOf(ok.split('*')[0]);
      // Opera and IE expose global variables for HTML element IDs (issue #243)
      if (/^mocha-/.test(key)) return true;
      return key == ok;
    });
    return matched.length == 0 && (!global.navigator || 'onerror' !== key);
  });
}
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/suite',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('mocha:suite')
  , milliseconds = require('./ms')
  , utils = require('./utils')
  , Hook = require('./hook');
/**
 * Expose `Suite`.
 */
exports = module.exports = Suite;
/**
 * Create a new `Suite` with the given `title`
 * and parent `Suite`. When a suite with the
 * same title is already present, that suite
 * is returned to provide nicer reporter
 * and more flexible meta-testing.
 *
 * @param {Suite} parent
 * @param {String} title
 * @return {Suite}
 * @api public
 */
exports.create = function(parent, title){
  var suite = new Suite(title, parent.ctx);
  suite.parent = parent;
  if (parent.pending) suite.pending = true;
  title = suite.fullTitle();
  parent.addSuite(suite);
  return suite;
};
/**
 * Initialize a new `Suite` with the given
 * `title` and `ctx`.
 *
 * @param {String} title
 * @param {Context} ctx
 * @api private
 */
function Suite(title, ctx) {
  this.title = title;
  this.ctx = ctx;
  this.suites = [];
  this.tests = [];
  this.pending = false;
  this._beforeEach = [];
  this._beforeAll = [];
  this._afterEach = [];
  this._afterAll = [];
  this.root = !title;
  this._timeout = 2000;
  this._slow = 75;
  this._bail = false;
}
/**
 * Inherit from `EventEmitter.prototype`.
 */
Suite.prototype.__proto__ = EventEmitter.prototype;
/**
 * Return a clone of this `Suite`.
 *
 * @return {Suite}
 * @api private
 */
Suite.prototype.clone = function(){
  var suite = new Suite(this.title);
  debug('clone');
  suite.ctx = this.ctx;
  suite.timeout(this.timeout());
  suite.slow(this.slow());
  suite.bail(this.bail());
  return suite;
};
/**
 * Set timeout `ms` or short-hand such as "2s".
 *
 * @param {Number|String} ms
 * @return {Suite|Number} for chaining
 * @api private
 */
Suite.prototype.timeout = function(ms){
  if (0 == arguments.length) return this._timeout;
  if ('string' == typeof ms) ms = milliseconds(ms);
  debug('timeout %d', ms);
  this._timeout = parseInt(ms, 10);
  return this;
};
/**
 * Set slow `ms` or short-hand such as "2s".
 *
 * @param {Number|String} ms
 * @return {Suite|Number} for chaining
 * @api private
 */
Suite.prototype.slow = function(ms){
  if (0 === arguments.length) return this._slow;
  if ('string' == typeof ms) ms = milliseconds(ms);
  debug('slow %d', ms);
  this._slow = ms;
  return this;
};
/**
 * Sets whether to bail after first error.
 *
 * @parma {Boolean} bail
 * @return {Suite|Number} for chaining
 * @api private
 */
Suite.prototype.bail = function(bail){
  if (0 == arguments.length) return this._bail;
  debug('bail %s', bail);
  this._bail = bail;
  return this;
};
/**
 * Run `fn(test[, done])` before running tests.
 *
 * @param {Function} fn
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.beforeAll = function(fn){
  if (this.pending) return this;
  var hook = new Hook('"before all" hook', fn);
  hook.parent = this;
  hook.timeout(this.timeout());
  hook.slow(this.slow());
  hook.ctx = this.ctx;
  this._beforeAll.push(hook);
  this.emit('beforeAll', hook);
  return this;
};
/**
 * Run `fn(test[, done])` after running tests.
 *
 * @param {Function} fn
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.afterAll = function(fn){
  if (this.pending) return this;
  var hook = new Hook('"after all" hook', fn);
  hook.parent = this;
  hook.timeout(this.timeout());
  hook.slow(this.slow());
  hook.ctx = this.ctx;
  this._afterAll.push(hook);
  this.emit('afterAll', hook);
  return this;
};
/**
 * Run `fn(test[, done])` before each test case.
 *
 * @param {Function} fn
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.beforeEach = function(fn){
  if (this.pending) return this;
  var hook = new Hook('"before each" hook', fn);
  hook.parent = this;
  hook.timeout(this.timeout());
  hook.slow(this.slow());
  hook.ctx = this.ctx;
  this._beforeEach.push(hook);
  this.emit('beforeEach', hook);
  return this;
};
/**
 * Run `fn(test[, done])` after each test case.
 *
 * @param {Function} fn
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.afterEach = function(fn){
  if (this.pending) return this;
  var hook = new Hook('"after each" hook', fn);
  hook.parent = this;
  hook.timeout(this.timeout());
  hook.slow(this.slow());
  hook.ctx = this.ctx;
  this._afterEach.push(hook);
  this.emit('afterEach', hook);
  return this;
};
/**
 * Add a test `suite`.
 *
 * @param {Suite} suite
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.addSuite = function(suite){
  suite.parent = this;
  suite.timeout(this.timeout());
  suite.slow(this.slow());
  suite.bail(this.bail());
  this.suites.push(suite);
  this.emit('suite', suite);
  return this;
};
/**
 * Add a `test` to this suite.
 *
 * @param {Test} test
 * @return {Suite} for chaining
 * @api private
 */
Suite.prototype.addTest = function(test){
  test.parent = this;
  test.timeout(this.timeout());
  test.slow(this.slow());
  test.ctx = this.ctx;
  this.tests.push(test);
  this.emit('test', test);
  return this;
};
/**
 * Return the full title generated by recursively
 * concatenating the parent's full title.
 *
 * @return {String}
 * @api public
 */
Suite.prototype.fullTitle = function(){
  if (this.parent) {
    var full = this.parent.fullTitle();
    if (full) return full + ' ' + this.title;
  }
  return this.title;
};
/**
 * Return the total number of tests.
 *
 * @return {Number}
 * @api public
 */
Suite.prototype.total = function(){
  return utils.reduce(this.suites, function(sum, suite){
    return sum + suite.total();
  }, 0) + this.tests.length;
};
/**
 * Iterates through each suite recursively to find
 * all tests. Applies a function in the format
 * `fn(test)`.
 *
 * @param {Function} fn
 * @return {Suite}
 * @api private
 */
Suite.prototype.eachTest = function(fn){
  utils.forEach(this.tests, fn);
  utils.forEach(this.suites, function(suite){
    suite.eachTest(fn);
  });
  return this;
};
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/test',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var Runnable = require('./runnable');
/**
 * Expose `Test`.
 */
module.exports = Test;
/**
 * Initialize a new `Test` with the given `title` and callback `fn`.
 *
 * @param {String} title
 * @param {Function} fn
 * @api private
 */
function Test(title, fn) {
  Runnable.call(this, title, fn);
  this.pending = !fn;
  this.type = 'test';
}
/**
 * Inherit from `Runnable.prototype`.
 */
Test.prototype.__proto__ = Runnable.prototype;
    }
  };
});
asyncmachineTest.module(10, function(/* parent */){
  return {
    'id': 'lib/utils',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Module dependencies.
 */
var fs = require('fs')
  , path = require('path')
  , join = path.join
  , debug = require('debug')('mocha:watch');
/**
 * Ignored directories.
 */
var ignore = ['node_modules', '.git'];
/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} html
 * @return {String}
 * @api private
 */
exports.escape = function(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};
/**
 * Array#forEach (<=IE8)
 *
 * @param {Array} array
 * @param {Function} fn
 * @param {Object} scope
 * @api private
 */
exports.forEach = function(arr, fn, scope){
  for (var i = 0, l = arr.length; i < l; i++)
    fn.call(scope, arr[i], i);
};
/**
 * Array#indexOf (<=IE8)
 *
 * @parma {Array} arr
 * @param {Object} obj to find index of
 * @param {Number} start
 * @api private
 */
exports.indexOf = function(arr, obj, start){
  for (var i = start || 0, l = arr.length; i < l; i++) {
    if (arr[i] === obj)
      return i;
  }
  return -1;
};
/**
 * Array#reduce (<=IE8)
 * 
 * @param {Array} array
 * @param {Function} fn
 * @param {Object} initial value
 * @api private
 */
exports.reduce = function(arr, fn, val){
  var rval = val;
  for (var i = 0, l = arr.length; i < l; i++) {
    rval = fn(rval, arr[i], i, arr);
  }
  return rval;
};
/**
 * Array#filter (<=IE8)
 *
 * @param {Array} array
 * @param {Function} fn
 * @api private
 */
exports.filter = function(arr, fn){
  var ret = [];
  for (var i = 0, l = arr.length; i < l; i++) {
    var val = arr[i];
    if (fn(val, i, arr)) ret.push(val);
  }
  return ret;
};
/**
 * Object.keys (<=IE8)
 *
 * @param {Object} obj
 * @return {Array} keys
 * @api private
 */
exports.keys = Object.keys || function(obj) {
  var keys = []
    , has = Object.prototype.hasOwnProperty // for `window` on <=IE8
  for (var key in obj) {
    if (has.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};
/**
 * Watch the given `files` for changes
 * and invoke `fn(file)` on modification.
 *
 * @param {Array} files
 * @param {Function} fn
 * @api private
 */
exports.watch = function(files, fn){
  var options = { interval: 100 };
  files.forEach(function(file){
    debug('file %s', file);
    fs.watchFile(file, options, function(curr, prev){
      if (prev.mtime < curr.mtime) fn(file);
    });
  });
};
/**
 * Ignored files.
 */
function ignored(path){
  return !~ignore.indexOf(path);
}
/**
 * Lookup files in the given `dir`.
 *
 * @return {Array}
 * @api private
 */
exports.files = function(dir, ret){
  ret = ret || [];
  fs.readdirSync(dir)
  .filter(ignored)
  .forEach(function(path){
    path = join(dir, path);
    if (fs.statSync(path).isDirectory()) {
      exports.files(path, ret);
    } else if (path.match(/\.(js|coffee)$/)) {
      ret.push(path);
    }
  });
  return ret;
};
/**
 * Compute a slug from the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.slug = function(str){
  return str
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[^-\w]/g, '');
};
/**
 * Strip the function definition from `str`,
 * and re-indent for pre whitespace.
 */
exports.clean = function(str) {
  str = str
    .replace(/^function *\(.*\) *{/, '')
    .replace(/\s+\}$/, '');
  var spaces = str.match(/^\n?( *)/)[1].length
    , re = new RegExp('^ {' + spaces + '}', 'gm');
  str = str.replace(re, '');
  return exports.trim(str);
};
/**
 * Escape regular expression characters in `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.escapeRegexp = function(str){
  return str.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
};
/**
 * Trim the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.trim = function(str){
  return str.replace(/^\s+|\s+$/g, '');
};
/**
 * Parse the given `qs`.
 *
 * @param {String} qs
 * @return {Object}
 * @api private
 */
exports.parseQuery = function(qs){
  return exports.reduce(qs.replace('?', '').split('&'), function(obj, pair){
    var i = pair.indexOf('=')
      , key = pair.slice(0, i)
      , val = pair.slice(++i);
    obj[key] = decodeURIComponent(val);
    return obj;
  }, {});
};
/**
 * Highlight the given string of `js`.
 *
 * @param {String} js
 * @return {String}
 * @api private
 */
function highlight(js) {
  return js
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\/\/(.*)/gm, '<span class="comment">//$1</span>')
    .replace(/('.*?')/gm, '<span class="string">$1</span>')
    .replace(/(\d+\.\d+)/gm, '<span class="number">$1</span>')
    .replace(/(\d+)/gm, '<span class="number">$1</span>')
    .replace(/\bnew *(\w+)/gm, '<span class="keyword">new</span> <span class="init">$1</span>')
    .replace(/\b(function|new|throw|return|var|if|else)\b/gm, '<span class="keyword">$1</span>')
}
/**
 * Highlight the contents of tag `name`.
 *
 * @param {String} name
 * @api private
 */
exports.highlightTags = function(name) {
  var code = document.getElementsByTagName(name);
  for (var i = 0, len = code.length; i < len; ++i) {
    code[i].innerHTML = highlight(code[i].innerHTML);
  }
};
    }
  };
});
asyncmachineTest.pkg(10, function(parents){
  return {
    'id':17,
    'name':'ms',
    'main':undefined,
    'mainModuleId':'ms',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(17, function(/* parent */){
  return {
    'id': 'ms',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      
/**
 * Helpers.
 */
var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
/**
 * Parse or format the given `val`.
 *
 * @param {String|Number} val
 * @return {String|Number}
 * @api public
 */
module.exports = function(val){
  if ('string' == typeof val) return parse(val);
  return format(val);
}
/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */
function parse(str) {
  var m = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!m) return;
  var n = parseFloat(m[1]);
  var type = (m[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * 31557600000;
    case 'days':
    case 'day':
    case 'd':
      return n * 86400000;
    case 'hours':
    case 'hour':
    case 'h':
      return n * 3600000;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * 60000;
    case 'seconds':
    case 'second':
    case 's':
      return n * 1000;
    case 'ms':
      return n;
  }
}
/**
 * Format the given `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api public
 */
function format(ms) {
  if (ms == d) return (ms / d) + ' day';
  if (ms > d) return (ms / d) + ' days';
  if (ms == h) return (ms / h) + ' hour';
  if (ms > h) return (ms / h) + ' hours';
  if (ms == m) return (ms / m) + ' minute';
  if (ms > m) return (ms / m) + ' minutes';
  if (ms == s) return (ms / s) + ' second';
  if (ms > s) return (ms / s) + ' seconds';
  return ms + ' ms';
}
    }
  };
});
asyncmachineTest.pkg(3, function(parents){
  return {
    'id':5,
    'name':'rsvp',
    'main':undefined,
    'mainModuleId':'rsvp',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(5, function(/* parent */){
  return {
    'id': 'rsvp',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      "use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var MutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var async;
if (typeof process !== 'undefined') {
  async = function(callback, binding) {
    process.nextTick(function() {
      callback.call(binding);
    });
  };
} else if (MutationObserver) {
  var queue = [];
  var observer = new MutationObserver(function() {
    var toProcess = queue.slice();
    queue = [];
    toProcess.forEach(function(tuple) {
      var callback = tuple[0], binding = tuple[1];
      callback.call(binding);
    });
  });
  var element = document.createElement('div');
  observer.observe(element, { attributes: true });
  async = function(callback, binding) {
    queue.push([callback, binding]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
} else {
  async = function(callback, binding) {
    setTimeout(function() {
      callback.call(binding);
    }, 1);
  };
}
exports.async = async;
var Event = exports.Event = function(type, options) {
  this.type = type;
  for (var option in options) {
    if (!options.hasOwnProperty(option)) { continue; }
    this[option] = options[option];
  }
};
var indexOf = function(callbacks, callback) {
  for (var i=0, l=callbacks.length; i<l; i++) {
    if (callbacks[i][0] === callback) { return i; }
  }
  return -1;
};
var callbacksFor = function(object) {
  var callbacks = object._promiseCallbacks;
  if (!callbacks) {
    callbacks = object._promiseCallbacks = {};
  }
  return callbacks;
};
var EventTarget = exports.EventTarget = {
  mixin: function(object) {
    object.on = this.on;
    object.off = this.off;
    object.trigger = this.trigger;
    return object;
  },
  on: function(eventName, callback, binding) {
    var allCallbacks = callbacksFor(this), callbacks;
    binding = binding || this;
    callbacks = allCallbacks[eventName];
    if (!callbacks) {
      callbacks = allCallbacks[eventName] = [];
    }
    if (indexOf(callbacks, callback) === -1) {
      callbacks.push([callback, binding]);
    }
  },
  off: function(eventName, callback) {
    var allCallbacks = callbacksFor(this), callbacks;
    if (!callback) {
      allCallbacks[eventName] = [];
      return;
    }
    callbacks = allCallbacks[eventName];
    var index = indexOf(callbacks, callback);
    if (index !== -1) { callbacks.splice(index, 1); }
  },
  trigger: function(eventName, options) {
    var allCallbacks = callbacksFor(this),
        callbacks, callbackTuple, callback, binding, event;
    if (callbacks = allCallbacks[eventName]) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        callbackTuple = callbacks[i];
        callback = callbackTuple[0];
        binding = callbackTuple[1];
        if (typeof options !== 'object') {
          options = { detail: options };
        }
        event = new Event(eventName, options);
        callback.call(binding, event);
      }
    }
  }
};
var Promise = exports.Promise = function() {
  this.on('promise:resolved', function(event) {
    this.trigger('success', { detail: event.detail });
  }, this);
  this.on('promise:failed', function(event) {
    this.trigger('error', { detail: event.detail });
  }, this);
};
var noop = function() {};
var invokeCallback = function(type, promise, callback, event) {
  var value, error;
  if (callback) {
    try {
      value = callback(event.detail);
    } catch(e) {
      error = e;
    }
  } else {
    value = event.detail;
  }
  if (value instanceof Promise) {
    value.then(function(value) {
      promise.resolve(value);
    }, function(error) {
      promise.reject(error);
    });
  } else if (callback && value) {
    promise.resolve(value);
  } else if (error) {
    promise.reject(error);
  } else {
    promise[type](value);
  }
};
Promise.prototype = {
  then: function(done, fail) {
    var thenPromise = new Promise();
    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });
    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });
    return thenPromise;
  },
  resolve: function(value) {
    exports.async(function() {
      this.trigger('promise:resolved', { detail: value });
      this.isResolved = value;
    }, this);
    this.resolve = noop;
    this.reject = noop;
  },
  reject: function(value) {
    exports.async(function() {
      this.trigger('promise:failed', { detail: value });
      this.isRejected = value;
    }, this);
    this.resolve = noop;
    this.reject = noop;
  }
};
EventTarget.mixin(Promise.prototype);
    }
  };
});
asyncmachineTest.pkg(1, function(parents){
  return {
    'id':7,
    'name':'sinon',
    'main':undefined,
    'mainModuleId':'lib/sinon',
    'modules':[],
    'parents':parents
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
var sinon = (function (buster) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;
    function isDOMNode(obj) {
        var success = false;
        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }
        return success;
    }
    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }
    function isFunction(obj) {
        return !!(obj && obj.AsyncMachine && obj.call && obj.apply);
    }
    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }
            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }
            var wrappedMethod = object[property];
            if (!isFunction(wrappedMethod)) {
                throw new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            }
            if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                throw new TypeError("Attempted to wrap " + property + " which is already wrapped");
            }
            if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                throw new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }
            // IE 8 does not support hasOwnProperty on the window object.
            var owned = hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };
            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);
            return method;
        },
        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }
                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }
            return target;
        },
        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },
        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }
            if (typeof a != "object" || typeof b != "object") {
                return a === b;
            }
            if (isElement(a) || isElement(b)) {
                return a === b;
            }
            if (a === b) {
                return true;
            }
            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }
            if (aString == "[object Array]") {
                if (a.length !== b.length) {
                    return false;
                }
                for (var i = 0, l = a.length; i < l; i += 1) {
                    if (!deepEqual(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            }
            var prop, aLength = 0, bLength = 0;
            for (prop in a) {
                aLength += 1;
                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }
            for (prop in b) {
                bLength += 1;
            }
            if (aLength != bLength) {
                return false;
            }
            return true;
        },
        functionName: function functionName(func) {
            var name = func.displayName || func.name;
            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }
            return name;
        },
        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;
                while (i--) {
                    thisValue = this.getCall(i).thisValue;
                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }
            return this.displayName || "sinon fake";
        },
        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;
            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }
            return config;
        },
        format: function (val) {
            return "" + val;
        },
        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },
        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },
        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i])) {
                    return false;
                }
            }
            return true;
        },
        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;
                return aId < bId ? -1 : 1;
            });
        },
        log: function () {},
        logError: function (label, err) {
            var msg = label + " threw exception: "
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }
            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },
        typeOf: function (value) {
            if (value === null) {
              return "null";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        }
    };
    var isNode = typeof module == "object" && typeof require == "function";
    if (isNode) {
        try {
            buster = { format: require("buster-format") };
        } catch (e) {}
        module.exports = sinon;
        module.exports.spy = require("./sinon/spy");
        module.exports.stub = require("./sinon/stub");
        module.exports.mock = require("./sinon/mock");
        module.exports.collection = require("./sinon/collection");
        module.exports.assert = require("./sinon/assert");
        module.exports.sandbox = require("./sinon/sandbox");
        module.exports.test = require("./sinon/test");
        module.exports.testCase = require("./sinon/test_case");
        module.exports.assert = require("./sinon/assert");
        module.exports.match = require("./sinon/match");
    }
    if (buster) {
        var formatter = sinon.create(buster.format);
        formatter.quoteStrings = false;
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }
    return sinon;
}(typeof buster == "object" && buster));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
var sinon = (function (buster) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;
    function isDOMNode(obj) {
        var success = false;
        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }
        return success;
    }
    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }
    function isFunction(obj) {
        return !!(obj && obj.AsyncMachine && obj.call && obj.apply);
    }
    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }
            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }
            var wrappedMethod = object[property];
            if (!isFunction(wrappedMethod)) {
                throw new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            }
            if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                throw new TypeError("Attempted to wrap " + property + " which is already wrapped");
            }
            if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                throw new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }
            // IE 8 does not support hasOwnProperty on the window object.
            var owned = hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };
            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);
            return method;
        },
        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }
                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }
            return target;
        },
        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },
        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }
            if (typeof a != "object" || typeof b != "object") {
                return a === b;
            }
            if (isElement(a) || isElement(b)) {
                return a === b;
            }
            if (a === b) {
                return true;
            }
            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }
            if (aString == "[object Array]") {
                if (a.length !== b.length) {
                    return false;
                }
                for (var i = 0, l = a.length; i < l; i += 1) {
                    if (!deepEqual(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            }
            var prop, aLength = 0, bLength = 0;
            for (prop in a) {
                aLength += 1;
                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }
            for (prop in b) {
                bLength += 1;
            }
            if (aLength != bLength) {
                return false;
            }
            return true;
        },
        functionName: function functionName(func) {
            var name = func.displayName || func.name;
            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }
            return name;
        },
        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;
                while (i--) {
                    thisValue = this.getCall(i).thisValue;
                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }
            return this.displayName || "sinon fake";
        },
        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;
            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }
            return config;
        },
        format: function (val) {
            return "" + val;
        },
        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },
        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },
        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i])) {
                    return false;
                }
            }
            return true;
        },
        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;
                return aId < bId ? -1 : 1;
            });
        },
        log: function () {},
        logError: function (label, err) {
            var msg = label + " threw exception: "
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }
            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },
        typeOf: function (value) {
            if (value === null) {
              return "null";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        }
    };
    var isNode = typeof module == "object" && typeof require == "function";
    if (isNode) {
        try {
            buster = { format: require("buster-format") };
        } catch (e) {}
        module.exports = sinon;
        module.exports.spy = require("./sinon/spy");
        module.exports.stub = require("./sinon/stub");
        module.exports.mock = require("./sinon/mock");
        module.exports.collection = require("./sinon/collection");
        module.exports.assert = require("./sinon/assert");
        module.exports.sandbox = require("./sinon/sandbox");
        module.exports.test = require("./sinon/test");
        module.exports.testCase = require("./sinon/test_case");
        module.exports.assert = require("./sinon/assert");
        module.exports.match = require("./sinon/match");
    }
    if (buster) {
        var formatter = sinon.create(buster.format);
        formatter.quoteStrings = false;
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }
    return sinon;
}(typeof buster == "object" && buster));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/assert',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon, global) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var slice = Array.prototype.slice;
    var assert;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function verifyIsStub() {
        var method;
        for (var i = 0, l = arguments.length; i < l; ++i) {
            method = arguments[i];
            if (!method) {
                assert.fail("fake is not a spy");
            }
            if (typeof method != "function") {
                assert.fail(method + " is not a function");
            }
            if (typeof method.getCall != "function") {
                assert.fail(method + " is not stubbed");
            }
        }
    }
    function failAssertion(object, msg) {
        object = object || global;
        var failMethod = object.fail || assert.fail;
        failMethod.call(object, msg);
    }
    function mirrorPropAsAssertion(name, method, message) {
        if (arguments.length == 2) {
            message = method;
            method = name;
        }
        assert[name] = function (fake) {
            verifyIsStub(fake);
            var args = slice.call(arguments, 1);
            var failed = false;
            if (typeof method == "function") {
                failed = !method(fake);
            } else {
                failed = typeof fake[method] == "function" ?
                    !fake[method].apply(fake, args) : !fake[method];
            }
            if (failed) {
                failAssertion(this, fake.printf.apply(fake, [message].concat(args)));
            } else {
                assert.pass(name);
            }
        };
    }
    function exposedName(prefix, prop) {
        return !prefix || /^fail/.test(prop) ? prop :
            prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
    };
    assert = {
        failException: "AssertError",
        fail: function fail(message) {
            var error = new Error(message);
            error.name = this.failException || assert.failException;
            throw error;
        },
        pass: function pass(assertion) {},
        callOrder: function assertCallOrder() {
            verifyIsStub.apply(null, arguments);
            var expected = "", actual = "";
            if (!sinon.calledInOrder(arguments)) {
                try {
                    expected = [].join.call(arguments, ", ");
                    actual = sinon.orderByFirstCall(slice.call(arguments)).join(", ");
                } catch (e) {
                    // If this fails, we'll just fall back to the blank string
                }
                failAssertion(this, "expected " + expected + " to be " +
                              "called in order but were called as " + actual);
            } else {
                assert.pass("callOrder");
            }
        },
        callCount: function assertCallCount(method, count) {
            verifyIsStub(method);
            if (method.callCount != count) {
                var msg = "expected %n to be called " + sinon.timesInWords(count) +
                    " but was called %c%C";
                failAssertion(this, method.printf(msg));
            } else {
                assert.pass("callCount");
            }
        },
        expose: function expose(target, options) {
            if (!target) {
                throw new TypeError("target is null or undefined");
            }
            var o = options || {};
            var prefix = typeof o.prefix == "undefined" && "assert" || o.prefix;
            var includeFail = typeof o.includeFail == "undefined" || !!o.includeFail;
            for (var method in this) {
                if (method != "export" && (includeFail || !/^(fail)/.test(method))) {
                    target[exposedName(prefix, method)] = this[method];
                }
            }
            return target;
        }
    };
    mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
    mirrorPropAsAssertion("notCalled", function (spy) { return !spy.called; },
                          "expected %n to not have been called but was called %c%C");
    mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
    mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
    mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
    mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("alwaysCalledOn", "expected %n to always be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
    mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
    mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
    mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
    mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
    mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
    mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
    mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
    mirrorPropAsAssertion("threw", "%n did not throw exception%C");
    mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");
    if (commonJSModule) {
        module.exports = assert;
    } else {
        sinon.assert = assert;
    }
}(typeof sinon == "object" && sinon || null, typeof window != "undefined" ? window : global));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/collection',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true*/
/*global module, require, sinon*/
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }
        return fakeCollection.fakes;
    }
    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);
        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] == "function") {
                fakes[i][method]();
            }
        }
    }
    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
          fakes.splice(i, 1);
        }
    }
    var collection = {
        verify: function resolve() {
            each(this, "verify");
        },
        restore: function restore() {
            each(this, "restore");
            compact(this);
        },
        verifyAndRestore: function verifyAndRestore() {
            var exception;
            try {
                this.verify();
            } catch (e) {
                exception = e;
            }
            this.restore();
            if (exception) {
                throw exception;
            }
        },
        add: function add(fake) {
            push.call(getFakes(this), fake);
            return fake;
        },
        spy: function spy() {
            return this.add(sinon.spy.apply(sinon, arguments));
        },
        stub: function stub(object, property, value) {
            if (property) {
                var original = object[property];
                if (typeof original != "function") {
                    if (!hasOwnProperty.call(object, property)) {
                        throw new TypeError("Cannot stub non-existent own property " + property);
                    }
                    object[property] = value;
                    return this.add({
                        restore: function () {
                            object[property] = original;
                        }
                    });
                }
            }
            if (!property && !!object && typeof object == "object") {
                var stubbedObj = sinon.stub.apply(sinon, arguments);
                for (var prop in stubbedObj) {
                    if (typeof stubbedObj[prop] === "function") {
                        this.add(stubbedObj[prop]);
                    }
                }
                return stubbedObj;
            }
            return this.add(sinon.stub.apply(sinon, arguments));
        },
        mock: function mock() {
            return this.add(sinon.mock.apply(sinon, arguments));
        },
        inject: function inject(obj) {
            var col = this;
            obj.spy = function () {
                return col.spy.apply(col, arguments);
            };
            obj.stub = function () {
                return col.stub.apply(col, arguments);
            };
            obj.mock = function () {
                return col.mock.apply(col, arguments);
            };
            return obj;
        }
    };
    if (commonJSModule) {
        module.exports = collection;
    } else {
        sinon.collection = collection;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/match',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /* @depend ../sinon.js */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function assertType(value, type, name) {
        var actual = sinon.typeOf(value);
        if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
                type + ", but was " + actual);
        }
    }
    var matcher = {
        toString: function () {
            return this.message;
        }
    };
    function isMatcher(object) {
        return matcher.isPrototypeOf(object);
    }
    function matchObject(expectation, actual) {
        if (actual === null || actual === undefined) {
            return false;
        }
        for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
                var exp = expectation[key];
                var act = actual[key];
                if (match.isMatcher(exp)) {
                    if (!exp.test(act)) {
                        return false;
                    }
                } else if (sinon.typeOf(exp) === "object") {
                    if (!matchObject(exp, act)) {
                        return false;
                    }
                } else if (!sinon.deepEqual(exp, act)) {
                    return false;
                }
            }
        }
        return true;
    }
    matcher.or = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var or = sinon.create(matcher);
        or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
        };
        or.message = m1.message + ".or(" + m2.message + ")";
        return or;
    };
    matcher.and = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var and = sinon.create(matcher);
        and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
        };
        and.message = m1.message + ".and(" + m2.message + ")";
        return and;
    };
    var match = function (expectation, message) {
        var m = sinon.create(matcher);
        var type = sinon.typeOf(expectation);
        switch (type) {
        case "object":
            if (typeof expectation.test === "function") {
                m.test = function (actual) {
                    return expectation.test(actual) === true;
                };
                m.message = "match(" + sinon.functionName(expectation.test) + ")";
                return m;
            }
            var str = [];
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    str.push(key + ": " + expectation[key]);
                }
            }
            m.test = function (actual) {
                return matchObject(expectation, actual);
            };
            m.message = "match(" + str.join(", ") + ")";
            break;
        case "number":
            m.test = function (actual) {
                return expectation == actual;
            };
            break;
        case "string":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return actual.indexOf(expectation) !== -1;
            };
            m.message = "match(\"" + expectation + "\")";
            break;
        case "regexp":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return expectation.test(actual);
            };
            break;
        case "function":
            m.test = expectation;
            if (message) {
                m.message = message;
            } else {
                m.message = "match(" + sinon.functionName(expectation) + ")";
            }
            break;
        default:
            m.test = function (actual) {
              return sinon.deepEqual(expectation, actual);
            };
        }
        if (!m.message) {
            m.message = "match(" + expectation + ")";
        }
        return m;
    };
    match.isMatcher = isMatcher;
    match.any = match(function () {
        return true;
    }, "any");
    match.defined = match(function (actual) {
        return actual !== null && actual !== undefined;
    }, "defined");
    match.truthy = match(function (actual) {
        return !!actual;
    }, "truthy");
    match.falsy = match(function (actual) {
        return !actual;
    }, "falsy");
    match.same = function (expectation) {
        return match(function (actual) {
            return expectation === actual;
        }, "same(" + expectation + ")");
    };
    match.typeOf = function (type) {
        assertType(type, "string", "type");
        return match(function (actual) {
            return sinon.typeOf(actual) === type;
        }, "typeOf(\"" + type + "\")");
    };
    match.instanceOf = function (type) {
        assertType(type, "function", "type");
        return match(function (actual) {
            return actual instanceof type;
        }, "instanceOf(" + sinon.functionName(type) + ")");
    };
    function createPropertyMatcher(propertyTest, messagePrefix) {
        return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
                message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
                if (actual === undefined || actual === null ||
                        !propertyTest(actual, property)) {
                    return false;
                }
                return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
        };
    }
    match.has = createPropertyMatcher(function (actual, property) {
        if (typeof actual === "object") {
            return property in actual;
        }
        return actual[property] !== undefined;
    }, "has");
    match.hasOwn = createPropertyMatcher(function (actual, property) {
        return actual.hasOwnProperty(property);
    }, "hasOwn");
    match.bool = match.typeOf("boolean");
    match.number = match.typeOf("number");
    match.string = match.typeOf("string");
    match.object = match.typeOf("object");
    match.func = match.typeOf("function");
    match.array = match.typeOf("array");
    match.regexp = match.typeOf("regexp");
    match.date = match.typeOf("date");
    if (commonJSModule) {
        module.exports = match;
    } else {
        sinon.match = match;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/mock',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false*/
/*global module, require, sinon*/
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var push = [].push;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function mock(object) {
        if (!object) {
            return sinon.expectation.create("Anonymous mock");
        }
        return mock.create(object);
    }
    sinon.mock = mock;
    sinon.extend(mock, (function () {
        function each(collection, callback) {
            if (!collection) {
                return;
            }
            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }
        return {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }
                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;
                return mockObject;
            },
            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }
                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }
                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;
                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });
                    push.call(this.proxies, method);
                }
                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);
                return expectation;
            },
            restore: function restore() {
                var object = this.object;
                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore == "function") {
                        object[proxy].restore();
                    }
                });
            },
            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [], met = [];
                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });
                this.restore();
                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }
                return true;
            },
            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method];
                var length = expectations && expectations.length || 0, i;
                for (i = 0; i < length; i += 1) {
                    if (!expectations[i].met() &&
                        expectations[i].allowsCall(thisValue, args)) {
                        return expectations[i].apply(thisValue, args);
                    }
                }
                var messages = [], available, exhausted = 0;
                for (i = 0; i < length; i += 1) {
                    if (expectations[i].allowsCall(thisValue, args)) {
                        available = available || expectations[i];
                    } else {
                        exhausted += 1;
                    }
                    push.call(messages, "    " + expectations[i].toString());
                }
                if (exhausted === 0) {
                    return available.apply(thisValue, args);
                }
                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));
                sinon.expectation.fail(messages.join("\n"));
            }
        };
    }()));
    var times = sinon.timesInWords;
    sinon.expectation = (function () {
        var slice = Array.prototype.slice;
        var _invoke = sinon.spy.invoke;
        function callCountInWords(callCount) {
            if (callCount == 0) {
                return "never called";
            } else {
                return "called " + times(callCount);
            }
        }
        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;
            if (typeof min == "number" && typeof max == "number") {
                var str = times(min);
                if (min != max) {
                    str = "at least " + str + " and at most " + times(max);
                }
                return str;
            }
            if (typeof min == "number") {
                return "at least " + times(min);
            }
            return "at most " + times(max);
        }
        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls == "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }
        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls != "number") {
                return false;
            }
            return expectation.callCount == expectation.maxCalls;
        }
        return {
            minCalls: 1,
            maxCalls: 1,
            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;
                return expectation;
            },
            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);
                return _invoke.apply(this, arguments);
            },
            atLeast: function atLeast(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }
                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }
                this.minCalls = num;
                return this;
            },
            atMost: function atMost(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }
                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }
                this.maxCalls = num;
                return this;
            },
            never: function never() {
                return this.exactly(0);
            },
            once: function once() {
                return this.exactly(1);
            },
            twice: function twice() {
                return this.exactly(2);
            },
            thrice: function thrice() {
                return this.exactly(3);
            },
            exactly: function exactly(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }
                this.atLeast(num);
                return this.atMost(num);
            },
            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },
            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }
                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }
                if (!("expectedArguments" in this)) {
                    return;
                }
                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        this.expectedArguments.join());
                }
                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + args.join() +
                        "), expected " + this.expectedArguments.join());
                }
                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + args.join() +
                        "), expected " + this.expectedArguments.join());
                }
                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments (" + args.join() +
                            "), expected " + this.expectedArguments.join());
                    }
                }
            },
            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }
                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }
                if (!("expectedArguments" in this)) {
                    return true;
                }
                args = args || [];
                if (args.length < this.expectedArguments.length) {
                    return false;
                }
                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    return false;
                }
                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }
                return true;
            },
            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },
            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },
            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },
            toString: function () {
                var args = (this.expectedArguments || []).slice();
                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }
                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method, args: args
                });
                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);
                if (this.met()) {
                    return "Expectation met: " + message;
                }
                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },
            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }
                return true;
            },
            pass: function(message) {
              sinon.assert.pass(message);
            },
            fail: function (message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";
                throw exception;
            }
        };
    }());
    if (commonJSModule) {
        module.exports = mock;
    } else {
        sinon.mock = mock;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/sandbox',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global require, module*/
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
if (typeof module == "object" && typeof require == "function") {
    var sinon = require("../sinon");
    sinon.extend(sinon, require("./util/fake_timers"));
}
(function () {
    var push = [].push;
    function exposeValue(sandbox, config, key, value) {
        if (!value) {
            return;
        }
        if (config.injectInto) {
            config.injectInto[key] = value;
        } else {
            push.call(sandbox.args, value);
        }
    }
    function prepareSandboxFromConfig(config) {
        var sandbox = sinon.create(sinon.sandbox);
        if (config.useFakeServer) {
            if (typeof config.useFakeServer == "object") {
                sandbox.serverPrototype = config.useFakeServer;
            }
            sandbox.useFakeServer();
        }
        if (config.useFakeTimers) {
            if (typeof config.useFakeTimers == "object") {
                sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
            } else {
                sandbox.useFakeTimers();
            }
        }
        return sandbox;
    }
    sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
        useFakeTimers: function useFakeTimers() {
            this.clock = sinon.useFakeTimers.apply(sinon, arguments);
            return this.add(this.clock);
        },
        serverPrototype: sinon.fakeServer,
        useFakeServer: function useFakeServer() {
            var proto = this.serverPrototype || sinon.fakeServer;
            if (!proto || !proto.create) {
                return null;
            }
            this.server = proto.create();
            return this.add(this.server);
        },
        inject: function (obj) {
            sinon.collection.inject.call(this, obj);
            if (this.clock) {
                obj.clock = this.clock;
            }
            if (this.server) {
                obj.server = this.server;
                obj.requests = this.server.requests;
            }
            return obj;
        },
        create: function (config) {
            if (!config) {
                return sinon.create(sinon.sandbox);
            }
            var sandbox = prepareSandboxFromConfig(config);
            sandbox.args = sandbox.args || [];
            var prop, value, exposed = sandbox.inject({});
            if (config.properties) {
                for (var i = 0, l = config.properties.length; i < l; i++) {
                    prop = config.properties[i];
                    value = exposed[prop] || prop == "sandbox" && sandbox;
                    exposeValue(sandbox, config, prop, value);
                }
            } else {
                exposeValue(sandbox, config, "sandbox", value);
            }
            return sandbox;
        }
    });
    sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;
    if (typeof module == "object" && typeof require == "function") {
        module.exports = sinon.sandbox;
    }
}());
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/spy',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend match.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Spy functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var spyCall;
    var callId = 0;
    var push = [].push;
    var slice = Array.prototype.slice;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function spy(object, property) {
        if (!property && typeof object == "function") {
            return spy.create(object);
        }
        if (!object && !property) {
            return spy.create(function () {});
        }
        var method = object[property];
        return sinon.wrapMethod(object, property, spy.create(method));
    }
    sinon.extend(spy, (function () {
        function delegateToCalls(api, method, matchAny, actual, notCalled) {
            api[method] = function () {
                if (!this.called) {
                    if (notCalled) {
                        return notCalled.apply(this, arguments);
                    }
                    return false;
                }
                var currentCall;
                var matches = 0;
                for (var i = 0, l = this.callCount; i < l; i += 1) {
                    currentCall = this.getCall(i);
                    if (currentCall[actual || method].apply(currentCall, arguments)) {
                        matches += 1;
                        if (matchAny) {
                            return true;
                        }
                    }
                }
                return matches === this.callCount;
            };
        }
        function matchingFake(fakes, args, strict) {
            if (!fakes) {
                return;
            }
            var alen = args.length;
            for (var i = 0, l = fakes.length; i < l; i++) {
                if (fakes[i].matches(args, strict)) {
                    return fakes[i];
                }
            }
        }
        function incrementCallCount() {
            this.called = true;
            this.callCount += 1;
            this.notCalled = false;
            this.calledOnce = this.callCount == 1;
            this.calledTwice = this.callCount == 2;
            this.calledThrice = this.callCount == 3;
        }
        function createCallProperties() {
            this.firstCall = this.getCall(0);
            this.secondCall = this.getCall(1);
            this.thirdCall = this.getCall(2);
            this.lastCall = this.getCall(this.callCount - 1);
        }
        var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
        function createProxy(func) {
            // Retain the function length:
            if (func.length) {
                return eval("(function proxy(" + vars.substring(0, func.length * 2 - 1) +
                  ") { return proxy.invoke(func, this, slice.call(arguments)); })");
            }
            return function proxy() {
                return proxy.invoke(func, this, slice.call(arguments));
            };
        }
        var uuid = 0;
        // Public API
        var spyApi = {
            reset: function () {
                this.called = false;
                this.notCalled = true;
                this.calledOnce = false;
                this.calledTwice = false;
                this.calledThrice = false;
                this.callCount = 0;
                this.firstCall = null;
                this.secondCall = null;
                this.thirdCall = null;
                this.lastCall = null;
                this.args = [];
                this.returnValues = [];
                this.thisValues = [];
                this.exceptions = [];
                this.callIds = [];
                if (this.fakes) {
                    for (var i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].reset();
                    }
                }
            },
            create: function create(func) {
                var name;
                if (typeof func != "function") {
                    func = function () {};
                } else {
                    name = sinon.functionName(func);
                }
                var proxy = createProxy(func);
                sinon.extend(proxy, spy);
                delete proxy.create;
                sinon.extend(proxy, func);
                proxy.reset();
                proxy.prototype = func.prototype;
                proxy.displayName = name || "spy";
                proxy.toString = sinon.functionToString;
                proxy._create = sinon.spy.create;
                proxy.id = "spy#" + uuid++;
                return proxy;
            },
            invoke: function invoke(func, thisValue, args) {
                var matching = matchingFake(this.fakes, args);
                var exception, returnValue;
                incrementCallCount.call(this);
                push.call(this.thisValues, thisValue);
                push.call(this.args, args);
                push.call(this.callIds, callId++);
                try {
                    if (matching) {
                        returnValue = matching.invoke(func, thisValue, args);
                    } else {
                        returnValue = (this.func || func).apply(thisValue, args);
                    }
                } catch (e) {
                    push.call(this.returnValues, undefined);
                    exception = e;
                    throw e;
                } finally {
                    push.call(this.exceptions, exception);
                }
                push.call(this.returnValues, returnValue);
                createCallProperties.call(this);
                return returnValue;
            },
            getCall: function getCall(i) {
                if (i < 0 || i >= this.callCount) {
                    return null;
                }
                return spyCall.create(this, this.thisValues[i], this.args[i],
                                      this.returnValues[i], this.exceptions[i],
                                      this.callIds[i]);
            },
            calledBefore: function calledBefore(spyFn) {
                if (!this.called) {
                    return false;
                }
                if (!spyFn.called) {
                    return true;
                }
                return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
            },
            calledAfter: function calledAfter(spyFn) {
                if (!this.called || !spyFn.called) {
                    return false;
                }
                return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
            },
            withArgs: function () {
                var args = slice.call(arguments);
                if (this.fakes) {
                    var match = matchingFake(this.fakes, args, true);
                    if (match) {
                        return match;
                    }
                } else {
                    this.fakes = [];
                }
                var original = this;
                var fake = this._create();
                fake.matchingAguments = args;
                push.call(this.fakes, fake);
                fake.withArgs = function () {
                    return original.withArgs.apply(original, arguments);
                };
                for (var i = 0; i < this.args.length; i++) {
                    if (fake.matches(this.args[i])) {
                        incrementCallCount.call(fake);
                        push.call(fake.thisValues, this.thisValues[i]);
                        push.call(fake.args, this.args[i]);
                        push.call(fake.returnValues, this.returnValues[i]);
                        push.call(fake.exceptions, this.exceptions[i]);
                        push.call(fake.callIds, this.callIds[i]);
                    }
                }
                createCallProperties.call(fake);
                return fake;
            },
            matches: function (args, strict) {
                var margs = this.matchingAguments;
                if (margs.length <= args.length &&
                    sinon.deepEqual(margs, args.slice(0, margs.length))) {
                    return !strict || margs.length == args.length;
                }
            },
            printf: function (format) {
                var spy = this;
                var args = slice.call(arguments, 1);
                var formatter;
                return (format || "").replace(/%(.)/g, function (match, specifyer) {
                    formatter = spyApi.formatters[specifyer];
                    if (typeof formatter == "function") {
                        return formatter.call(null, spy, args);
                    } else if (!isNaN(parseInt(specifyer), 10)) {
                        return sinon.format(args[specifyer - 1]);
                    }
                    return "%" + specifyer;
                });
            }
        };
        delegateToCalls(spyApi, "calledOn", true);
        delegateToCalls(spyApi, "alwaysCalledOn", false, "calledOn");
        delegateToCalls(spyApi, "calledWith", true);
        delegateToCalls(spyApi, "calledWithMatch", true);
        delegateToCalls(spyApi, "alwaysCalledWith", false, "calledWith");
        delegateToCalls(spyApi, "alwaysCalledWithMatch", false, "calledWithMatch");
        delegateToCalls(spyApi, "calledWithExactly", true);
        delegateToCalls(spyApi, "alwaysCalledWithExactly", false, "calledWithExactly");
        delegateToCalls(spyApi, "neverCalledWith", false, "notCalledWith",
            function () { return true; });
        delegateToCalls(spyApi, "neverCalledWithMatch", false, "notCalledWithMatch",
            function () { return true; });
        delegateToCalls(spyApi, "threw", true);
        delegateToCalls(spyApi, "alwaysThrew", false, "threw");
        delegateToCalls(spyApi, "returned", true);
        delegateToCalls(spyApi, "alwaysReturned", false, "returned");
        delegateToCalls(spyApi, "calledWithNew", true);
        delegateToCalls(spyApi, "alwaysCalledWithNew", false, "calledWithNew");
        delegateToCalls(spyApi, "callArg", false, "callArgWith", function () {
            throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
        });
        spyApi.callArgWith = spyApi.callArg;
        delegateToCalls(spyApi, "yield", false, "yield", function () {
            throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
        });
        // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
        spyApi.invokeCallback = spyApi.yield;
        delegateToCalls(spyApi, "yieldTo", false, "yieldTo", function (property) {
            throw new Error(this.toString() + " cannot yield to '" + property +
                "' since it was not yet invoked.");
        });
        spyApi.formatters = {
            "c": function (spy) {
                return sinon.timesInWords(spy.callCount);
            },
            "n": function (spy) {
                return spy.toString();
            },
            "C": function (spy) {
                var calls = [];
                for (var i = 0, l = spy.callCount; i < l; ++i) {
                    push.call(calls, "    " + spy.getCall(i).toString());
                }
                return calls.length > 0 ? "\n" + calls.join("\n") : "";
            },
            "t": function (spy) {
                var objects = [];
                for (var i = 0, l = spy.callCount; i < l; ++i) {
                    push.call(objects, sinon.format(spy.thisValues[i]));
                }
                return objects.join(", ");
            },
            "*": function (spy, args) {
                var formatted = [];
                for (var i = 0, l = args.length; i < l; ++i) {
                    push.call(formatted, sinon.format(args[i]));
                }
                return formatted.join(", ");
            }
        };
        return spyApi;
    }()));
    spyCall = (function () {
        function throwYieldError(proxy, text, args) {
            var msg = sinon.functionName(proxy) + text;
            if (args.length) {
                msg += " Received [" + slice.call(args).join(", ") + "]";
            }
            throw new Error(msg);
        }
        var callApi = {
            create: function create(spy, thisValue, args, returnValue, exception, id) {
                var proxyCall = sinon.create(spyCall);
                delete proxyCall.create;
                proxyCall.proxy = spy;
                proxyCall.thisValue = thisValue;
                proxyCall.args = args;
                proxyCall.returnValue = returnValue;
                proxyCall.exception = exception;
                proxyCall.callId = typeof id == "number" && id || callId++;
                return proxyCall;
            },
            calledOn: function calledOn(thisValue) {
                if (sinon.match && sinon.match.isMatcher(thisValue)) {
                    return thisValue.test(this.thisValue);
                }
                return this.thisValue === thisValue;
            },
            calledWith: function calledWith() {
                for (var i = 0, l = arguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(arguments[i], this.args[i])) {
                        return false;
                    }
                }
                return true;
            },
            calledWithMatch: function calledWithMatch() {
              for (var i = 0, l = arguments.length; i < l; i += 1) {
                  var actual = this.args[i];
                  var expectation = arguments[i];
                  if (!sinon.match || !sinon.match(expectation).test(actual)) {
                      return false;
                  }
              }
              return true;
            },
            calledWithExactly: function calledWithExactly() {
                return arguments.length == this.args.length &&
                    this.calledWith.apply(this, arguments);
            },
            notCalledWith: function notCalledWith() {
                return !this.calledWith.apply(this, arguments);
            },
            notCalledWithMatch: function notCalledWithMatch() {
              return !this.calledWithMatch.apply(this, arguments);
            },
            returned: function returned(value) {
                return sinon.deepEqual(value, this.returnValue);
            },
            threw: function threw(error) {
                if (typeof error == "undefined" || !this.exception) {
                    return !!this.exception;
                }
                if (typeof error == "string") {
                    return this.exception.name == error;
                }
                return this.exception === error;
            },
            calledWithNew: function calledWithNew(thisValue) {
                return this.thisValue instanceof this.proxy;
            },
            calledBefore: function (other) {
                return this.callId < other.callId;
            },
            calledAfter: function (other) {
                return this.callId > other.callId;
            },
            callArg: function (pos) {
                this.args[pos]();
            },
            callArgWith: function (pos) {
                var args = slice.call(arguments, 1);
                this.args[pos].apply(null, args);
            },
            "yield": function () {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (typeof args[i] === "function") {
                        args[i].apply(null, slice.call(arguments));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
            },
            yieldTo: function (prop) {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (args[i] && typeof args[i][prop] === "function") {
                        args[i][prop].apply(null, slice.call(arguments, 1));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield to '" + prop +
                    "' since no callback was passed.", args);
            },
            toString: function () {
                var callStr = this.proxy.toString() + "(";
                var args = [];
                for (var i = 0, l = this.args.length; i < l; ++i) {
                    push.call(args, sinon.format(this.args[i]));
                }
                callStr = callStr + args.join(", ") + ")";
                if (typeof this.returnValue != "undefined") {
                    callStr += " => " + sinon.format(this.returnValue);
                }
                if (this.exception) {
                    callStr += " !" + this.exception.name;
                    if (this.exception.message) {
                        callStr += "(" + this.exception.message + ")";
                    }
                }
                return callStr;
            }
        };
        callApi.invokeCallback = callApi.yield;
        return callApi;
    }());
    spy.spyCall = spyCall;
    // This steps outside the module sandbox and will be removed
    sinon.spyCall = spyCall;
    if (commonJSModule) {
        module.exports = spy;
    } else {
        sinon.spy = spy;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/stub',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend spy.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon*/
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function stub(object, property, func) {
        if (!!func && typeof func != "function") {
            throw new TypeError("Custom stub should be function");
        }
        var wrapper;
        if (func) {
            wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
        } else {
            wrapper = stub.create();
        }
        if (!object && !property) {
            return sinon.stub.create();
        }
        if (!property && !!object && typeof object == "object") {
            for (var prop in object) {
                if (typeof object[prop] === "function") {
                    stub(object, prop);
                }
            }
            return object;
        }
        return sinon.wrapMethod(object, property, wrapper);
    }
    function getChangingValue(stub, property) {
        var index = stub.callCount - 1;
        var prop = index in stub[property] ? stub[property][index] : stub[property + "Last"];
        stub[property + "Last"] = prop;
        return prop;
    }
    function getCallback(stub, args) {
        var callArgAt = getChangingValue(stub, "callArgAts");
        if (callArgAt < 0) {
            var callArgProp = getChangingValue(stub, "callArgProps");
            for (var i = 0, l = args.length; i < l; ++i) {
                if (!callArgProp && typeof args[i] == "function") {
                    return args[i];
                }
                if (callArgProp && args[i] &&
                    typeof args[i][callArgProp] == "function") {
                    return args[i][callArgProp];
                }
            }
            return null;
        }
        return args[callArgAt];
    }
    var join = Array.prototype.join;
    function getCallbackError(stub, func, args) {
        if (stub.callArgAtsLast < 0) {
            var msg;
            if (stub.callArgPropsLast) {
                msg = sinon.functionName(stub) +
                    " expected to yield to '" + stub.callArgPropsLast +
                    "', but no object with such a property was passed."
            } else {
                msg = sinon.functionName(stub) +
                            " expected to yield, but no callback was passed."
            }
            if (args.length > 0) {
                msg += " Received [" + join.call(args, ", ") + "]";
            }
            return msg;
        }
        return "argument at index " + stub.callArgAtsLast + " is not a function: " + func;
    }
    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        } else if (typeof msSetImmediate === "function") {
            return msSetImmediate.bind(window);
        } else if (typeof setImmediate === "function") {
            return setImmediate;
        } else {
            return function (callback) {
                setTimeout(callback, 0);
            };
        }
    })();
    function callCallback(stub, args) {
        if (stub.callArgAts.length > 0) {
            var func = getCallback(stub, args);
            if (typeof func != "function") {
                throw new TypeError(getCallbackError(stub, func, args));
            }
            var index = stub.callCount - 1;
            var callbackArguments = getChangingValue(stub, "callbackArguments");
            var callbackContext = getChangingValue(stub, "callbackContexts");
            if (stub.callbackAsync) {
                nextTick(function() {
                    func.apply(callbackContext, callbackArguments);
                });
            } else {
                func.apply(callbackContext, callbackArguments);
            }
        }
    }
    var uuid = 0;
    sinon.extend(stub, (function () {
        var slice = Array.prototype.slice, proto;
        function throwsException(error, message) {
            if (typeof error == "string") {
                this.exception = new Error(message || "");
                this.exception.name = error;
            } else if (!error) {
                this.exception = new Error("Error");
            } else {
                this.exception = error;
            }
            return this;
        }
        proto = {
            create: function create() {
                var functionStub = function () {
                    callCallback(functionStub, arguments);
                    if (functionStub.exception) {
                        throw functionStub.exception;
                    } else if (typeof functionStub.returnArgAt == 'number') {
                        return arguments[functionStub.returnArgAt];
                    } else if (functionStub.returnThis) {
                        return this;
                    }
                    return functionStub.returnValue;
                };
                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub);
                functionStub.func = orig;
                functionStub.callArgAts = [];
                functionStub.callbackArguments = [];
                functionStub.callbackContexts = [];
                functionStub.callArgProps = [];
                sinon.extend(functionStub, stub);
                functionStub._create = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;
                return functionStub;
            },
            returns: function returns(value) {
                this.returnValue = value;
                return this;
            },
            returnsArg: function returnsArg(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                this.returnArgAt = pos;
                return this;
            },
            returnsThis: function returnsThis() {
                this.returnThis = true;
                return this;
            },
            "throws": throwsException,
            throwsException: throwsException,
            callsArg: function callsArg(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                this.callArgAts.push(pos);
                this.callbackArguments.push([]);
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);
                return this;
            },
            callsArgOn: function callsArgOn(pos, context) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }
                this.callArgAts.push(pos);
                this.callbackArguments.push([]);
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);
                return this;
            },
            callsArgWith: function callsArgWith(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                this.callArgAts.push(pos);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);
                return this;
            },
            callsArgOnWith: function callsArgWith(pos, context) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }
                this.callArgAts.push(pos);
                this.callbackArguments.push(slice.call(arguments, 2));
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);
                return this;
            },
            yields: function () {
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 0));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);
                return this;
            },
            yieldsOn: function (context) {
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);
                return this;
            },
            yieldsTo: function (prop) {
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(prop);
                return this;
            },
            yieldsToOn: function (prop, context) {
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 2));
                this.callbackContexts.push(context);
                this.callArgProps.push(prop);
                return this;
            }
        };
        // create asynchronous versions of callsArg* and yields* methods
        for (var method in proto) {
            // need to avoid creating anotherasync versions of the newly added async methods
            if (proto.hasOwnProperty(method) &&
                method.match(/^(callsArg|yields|thenYields$)/) &&
                !method.match(/Async/)) {
                proto[method + 'Async'] = (function (syncFnName) {
                    return function () {
                        this.callbackAsync = true;
                        return this[syncFnName].apply(this, arguments);
                    };
                })(method);
            }
        }
        return proto;
    }()));
    if (commonJSModule) {
        module.exports = stub;
    } else {
        sinon.stub = stub;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/test',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 * @depend sandbox.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true, plusplus: false*/
/*global module, require, sinon*/
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon) {
        return;
    }
    function test(callback) {
        var type = typeof callback;
        if (type != "function") {
            throw new TypeError("sinon.test needs to wrap a test function, got " + type);
        }
        return function () {
            var config = sinon.getConfig(sinon.config);
            config.injectInto = config.injectIntoThis && this || config.injectInto;
            var sandbox = sinon.sandbox.create(config);
            var exception, result;
            var args = Array.prototype.slice.call(arguments).concat(sandbox.args);
            try {
                result = callback.apply(this, args);
            } catch (e) {
                exception = e;
            }
            if (typeof exception !== "undefined") {
                sandbox.restore();
                throw exception;
            }
            else {
                sandbox.verifyAndRestore();
            }
            return result;
        };
    }
    test.config = {
        injectIntoThis: true,
        injectInto: null,
        properties: ["spy", "stub", "mock", "clock", "server", "requests"],
        useFakeTimers: true,
        useFakeServer: true
    };
    if (commonJSModule) {
        module.exports = test;
    } else {
        sinon.test = test;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/test_case',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../sinon.js
 * @depend test.js
 */
/*jslint eqeqeq: false, onevar: false, eqeqeq: false*/
/*global module, require, sinon*/
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }
    if (!sinon || !Object.prototype.hasOwnProperty) {
        return;
    }
    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }
            var exception, result;
            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }
            if (tearDown) {
                tearDown.apply(this, arguments);
            }
            if (exception) {
                throw exception;
            }
            return result;
        };
    }
    function testCase(tests, prefix) {
        /*jsl:ignore*/
        if (!tests || typeof tests != "object") {
            throw new TypeError("sinon.testCase needs an object with test functions");
        }
        /*jsl:end*/
        prefix = prefix || "test";
        var rPrefix = new RegExp("^" + prefix);
        var methods = {}, testName, property, method;
        var setUp = tests.setUp;
        var tearDown = tests.tearDown;
        for (testName in tests) {
            if (tests.hasOwnProperty(testName)) {
                property = tests[testName];
                if (/^(setUp|tearDown)$/.test(testName)) {
                    continue;
                }
                if (typeof property == "function" && rPrefix.test(testName)) {
                    method = property;
                    if (setUp || tearDown) {
                        method = createTest(property, setUp, tearDown);
                    }
                    methods[testName] = sinon.test(method);
                } else {
                    methods[testName] = tests[testName];
                }
            }
        }
        return methods;
    }
    if (commonJSModule) {
        module.exports = testCase;
    } else {
        sinon.testCase = testCase;
    }
}(typeof sinon == "object" && sinon || null));
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/event',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*jslint eqeqeq: false, onevar: false*/
/*global sinon, module, require, ActiveXObject, XMLHttpRequest, DOMParser*/
/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */
"use strict";
if (typeof sinon == "undefined") {
    this.sinon = {};
}
(function () {
    var push = [].push;
    sinon.Event = function Event(type, bubbles, cancelable) {
        this.initEvent(type, bubbles, cancelable);
    };
    sinon.Event.prototype = {
        initEvent: function(type, bubbles, cancelable) {
            this.type = type;
            this.bubbles = bubbles;
            this.cancelable = cancelable;
        },
        stopPropagation: function () {},
        preventDefault: function () {
            this.defaultPrevented = true;
        }
    };
    sinon.EventTarget = {
        addEventListener: function addEventListener(event, listener, useCapture) {
            this.eventListeners = this.eventListeners || {};
            this.eventListeners[event] = this.eventListeners[event] || [];
            push.call(this.eventListeners[event], listener);
        },
        removeEventListener: function removeEventListener(event, listener, useCapture) {
            var listeners = this.eventListeners && this.eventListeners[event] || [];
            for (var i = 0, l = listeners.length; i < l; ++i) {
                if (listeners[i] == listener) {
                    return listeners.splice(i, 1);
                }
            }
        },
        dispatchEvent: function dispatchEvent(event) {
            var type = event.type;
            var listeners = this.eventListeners && this.eventListeners[type] || [];
            for (var i = 0; i < listeners.length; i++) {
                if (typeof listeners[i] == "function") {
                    listeners[i].call(this, event);
                } else {
                    listeners[i].handleEvent(event);
                }
            }
            return !!event.defaultPrevented;
        }
    };
}());
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/fake_server',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend fake_xml_http_request.js
 */
/*jslint eqeqeq: false, onevar: false, regexp: false, plusplus: false*/
/*global module, require, window*/
/**
 * The Sinon "server" mimics a web server that receives requests from
 * sinon.FakeXMLHttpRequest and provides an API to respond to those requests,
 * both synchronously and asynchronously. To respond synchronuously, canned
 * answers have to be provided upfront.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
if (typeof sinon == "undefined") {
    var sinon = {};
}
sinon.fakeServer = (function () {
    var push = [].push;
    function F() {}
    function create(proto) {
        F.prototype = proto;
        return new F();
    }
    function responseArray(handler) {
        var response = handler;
        if (Object.prototype.toString.call(handler) != "[object Array]") {
            response = [200, {}, handler];
        }
        if (typeof response[2] != "string") {
            throw new TypeError("Fake server response body should be string, but was " +
                                typeof response[2]);
        }
        return response;
    }
    var wloc = typeof window !== "undefined" ? window.location : {};
    var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);
    function matchOne(response, reqMethod, reqUrl) {
        var rmeth = response.method;
        var matchMethod = !rmeth || rmeth.toLowerCase() == reqMethod.toLowerCase();
        var url = response.url;
        var matchUrl = !url || url == reqUrl || (typeof url.test == "function" && url.test(reqUrl));
        return matchMethod && matchUrl;
    }
    function match(response, request) {
        var requestMethod = this.getHTTPMethod(request);
        var requestUrl = request.url;
        if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
            requestUrl = requestUrl.replace(rCurrLoc, "");
        }
        if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
            if (typeof response.response == "function") {
                var ru = response.url;
                var args = [request].concat(!ru ? [] : requestUrl.match(ru).slice(1));
                return response.response.apply(response, args);
            }
            return true;
        }
        return false;
    }
    return {
        create: function () {
            var server = create(this);
            this.xhr = sinon.useFakeXMLHttpRequest();
            server.requests = [];
            this.xhr.onCreate = function (xhrObj) {
                server.addRequest(xhrObj);
            };
            return server;
        },
        addRequest: function addRequest(xhrObj) {
            var server = this;
            push.call(this.requests, xhrObj);
            xhrObj.onSend = function () {
                server.handleRequest(this);
            };
            if (this.autoRespond && !this.responding) {
                setTimeout(function () {
                    server.responding = false;
                    server.respond();
                }, this.autoRespondAfter || 10);
                this.responding = true;
            }
        },
        getHTTPMethod: function getHTTPMethod(request) {
            if (this.fakeHTTPMethods && /post/i.test(request.method)) {
                var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
                return !!matches ? matches[1] : request.method;
            }
            return request.method;
        },
        handleRequest: function handleRequest(xhr) {
            if (xhr.async) {
                if (!this.queue) {
                    this.queue = [];
                }
                push.call(this.queue, xhr);
            } else {
                this.processRequest(xhr);
            }
        },
        respondWith: function respondWith(method, url, body) {
            if (arguments.length == 1 && typeof method != "function") {
                this.response = responseArray(method);
                return;
            }
            if (!this.responses) { this.responses = []; }
            if (arguments.length == 1) {
                body = method;
                url = method = null;
            }
            if (arguments.length == 2) {
                body = url;
                url = method;
                method = null;
            }
            push.call(this.responses, {
                method: method,
                url: url,
                response: typeof body == "function" ? body : responseArray(body)
            });
        },
        respond: function respond() {
            if (arguments.length > 0) this.respondWith.apply(this, arguments);
            var queue = this.queue || [];
            var request;
            while(request = queue.shift()) {
                this.processRequest(request);
            }
        },
        processRequest: function processRequest(request) {
            try {
                if (request.aborted) {
                    return;
                }
                var response = this.response || [404, {}, ""];
                if (this.responses) {
                    for (var i = 0, l = this.responses.length; i < l; i++) {
                        if (match.call(this, this.responses[i], request)) {
                            response = this.responses[i].response;
                            break;
                        }
                    }
                }
                if (request.readyState != 4) {
                    request.respond(response[0], response[1], response[2]);
                }
            } catch (e) {
                sinon.logError("Fake server request processing", e);
            }
        },
        restore: function restore() {
            return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
        }
    };
}());
if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/fake_server_with_clock',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/*jslint browser: true, eqeqeq: false, onevar: false*/
/*global sinon*/
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
(function () {
    function Server() {}
    Server.prototype = sinon.fakeServer;
    sinon.fakeServerWithClock = new Server();
    sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
        if (xhr.async) {
            if (typeof setTimeout.clock == "object") {
                this.clock = setTimeout.clock;
            } else {
                this.clock = sinon.useFakeTimers();
                this.resetClock = true;
            }
            if (!this.longestTimeout) {
                var clockSetTimeout = this.clock.setTimeout;
                var clockSetInterval = this.clock.setInterval;
                var server = this;
                this.clock.setTimeout = function (fn, timeout) {
                    server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);
                    return clockSetTimeout.apply(this, arguments);
                };
                this.clock.setInterval = function (fn, timeout) {
                    server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);
                    return clockSetInterval.apply(this, arguments);
                };
            }
        }
        return sinon.fakeServer.addRequest.call(this, xhr);
    };
    sinon.fakeServerWithClock.respond = function respond() {
        var returnVal = sinon.fakeServer.respond.apply(this, arguments);
        if (this.clock) {
            this.clock.tick(this.longestTimeout || 0);
            this.longestTimeout = 0;
            if (this.resetClock) {
                this.clock.restore();
                this.resetClock = false;
            }
        }
        return returnVal;
    };
    sinon.fakeServerWithClock.restore = function restore() {
        if (this.clock) {
            this.clock.restore();
        }
        return sinon.fakeServer.restore.apply(this, arguments);
    };
}());
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/fake_timers',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*jslint eqeqeq: false, plusplus: false, evil: true, onevar: false, browser: true, forin: false*/
/*global module, require, window*/
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
if (typeof sinon == "undefined") {
    var sinon = {};
}
(function (global) {
    var id = 1;
    function addTimer(args, recurring) {
        if (args.length === 0) {
            throw new Error("Function requires at least 1 parameter");
        }
        var toId = id++;
        var delay = args[1] || 0;
        if (!this.timeouts) {
            this.timeouts = {};
        }
        this.timeouts[toId] = {
            id: toId,
            func: args[0],
            callAt: this.now + delay,
            invokeArgs: Array.prototype.slice.call(args, 2)
        };
        if (recurring === true) {
            this.timeouts[toId].interval = delay;
        }
        return toId;
    }
    function parseTime(str) {
        if (!str) {
            return 0;
        }
        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;
        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }
        while (i--) {
            parsed = parseInt(strings[i], 10);
            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }
            ms += parsed * Math.pow(60, (l - i - 1));
        }
        return ms * 1000;
    }
    function createObject(object) {
        var newObject;
        if (Object.create) {
            newObject = Object.create(object);
        } else {
            var F = function () {};
            F.prototype = object;
            newObject = new F();
        }
        newObject.Date.clock = newObject;
        return newObject;
    }
    sinon.clock = {
        now: 0,
        create: function create(now) {
            var clock = createObject(this);
            if (typeof now == "number") {
                clock.now = now;
            }
            if (!!now && typeof now == "object") {
                throw new TypeError("now should be milliseconds since UNIX epoch");
            }
            return clock;
        },
        setTimeout: function setTimeout(callback, timeout) {
            return addTimer.call(this, arguments, false);
        },
        clearTimeout: function clearTimeout(timerId) {
            if (!this.timeouts) {
                this.timeouts = [];
            }
            if (timerId in this.timeouts) {
                delete this.timeouts[timerId];
            }
        },
        setInterval: function setInterval(callback, timeout) {
            return addTimer.call(this, arguments, true);
        },
        clearInterval: function clearInterval(timerId) {
            this.clearTimeout(timerId);
        },
        tick: function tick(ms) {
            ms = typeof ms == "number" ? ms : parseTime(ms);
            var tickFrom = this.now, tickTo = this.now + ms, previous = this.now;
            var timer = this.firstTimerInRange(tickFrom, tickTo);
            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (this.timeouts[timer.id]) {
                    tickFrom = this.now = timer.callAt;
                    try {
                      this.callTimer(timer);
                    } catch (e) {
                      firstException = firstException || e;
                    }
                }
                timer = this.firstTimerInRange(previous, tickTo);
                previous = tickFrom;
            }
            this.now = tickTo;
            if (firstException) {
              throw firstException;
            }
        },
        firstTimerInRange: function (from, to) {
            var timer, smallest, originalTimer;
            for (var id in this.timeouts) {
                if (this.timeouts.hasOwnProperty(id)) {
                    if (this.timeouts[id].callAt < from || this.timeouts[id].callAt > to) {
                        continue;
                    }
                    if (!smallest || this.timeouts[id].callAt < smallest) {
                        originalTimer = this.timeouts[id];
                        smallest = this.timeouts[id].callAt;
                        timer = {
                            func: this.timeouts[id].func,
                            callAt: this.timeouts[id].callAt,
                            interval: this.timeouts[id].interval,
                            id: this.timeouts[id].id,
                            invokeArgs: this.timeouts[id].invokeArgs
                        };
                    }
                }
            }
            return timer || null;
        },
        callTimer: function (timer) {
            if (typeof timer.interval == "number") {
                this.timeouts[timer.id].callAt += timer.interval;
            } else {
                delete this.timeouts[timer.id];
            }
            try {
                if (typeof timer.func == "function") {
                    timer.func.apply(null, timer.invokeArgs);
                } else {
                    eval(timer.func);
                }
            } catch (e) {
              var exception = e;
            }
            if (!this.timeouts[timer.id]) {
                if (exception) {
                  throw exception;
                }
                return;
            }
            if (exception) {
              throw exception;
            }
        },
        reset: function reset() {
            this.timeouts = {};
        },
        Date: (function () {
            var NativeDate = Date;
            function ClockDate(year, month, date, hour, minute, second, ms) {
                // Defensive and verbose to avoid potential harm in passing
                // explicit undefined when user does not pass argument
                switch (arguments.length) {
                case 0:
                    return new NativeDate(ClockDate.clock.now);
                case 1:
                    return new NativeDate(year);
                case 2:
                    return new NativeDate(year, month);
                case 3:
                    return new NativeDate(year, month, date);
                case 4:
                    return new NativeDate(year, month, date, hour);
                case 5:
                    return new NativeDate(year, month, date, hour, minute);
                case 6:
                    return new NativeDate(year, month, date, hour, minute, second);
                default:
                    return new NativeDate(year, month, date, hour, minute, second, ms);
                }
            }
            return mirrorDateProperties(ClockDate, NativeDate);
        }())
    };
    function mirrorDateProperties(target, source) {
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }
        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }
        target.toString = function toString() {
            return source.toString();
        };
        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;
        return target;
    }
    var methods = ["Date", "setTimeout", "setInterval",
                   "clearTimeout", "clearInterval"];
    function restore() {
        var method;
        for (var i = 0, l = this.methods.length; i < l; i++) {
            method = this.methods[i];
            if (global[method].hadOwnProperty) {
                global[method] = this["_" + method];
            } else {
                delete global[method];
            }
        }
        // Prevent multiple executions which will completely remove these props
        this.methods = [];
    }
    function stubGlobal(method, clock) {
        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(global, method);
        clock["_" + method] = global[method];
        if (method == "Date") {
            var date = mirrorDateProperties(clock[method], global[method]);
            global[method] = date;
        } else {
            global[method] = function () {
                return clock[method].apply(clock, arguments);
            };
            for (var prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    global[method][prop] = clock[method][prop];
                }
            }
        }
        global[method].clock = clock;
    }
    sinon.useFakeTimers = function useFakeTimers(now) {
        var clock = sinon.clock.create(now);
        clock.restore = restore;
        clock.methods = Array.prototype.slice.call(arguments,
                                                   typeof now == "number" ? 1 : 0);
        if (clock.methods.length === 0) {
            clock.methods = methods;
        }
        for (var i = 0, l = clock.methods.length; i < l; i++) {
            stubGlobal(clock.methods[i], clock);
        }
        return clock;
    };
}(typeof global != "undefined" && typeof global !== "function" ? global : this));
sinon.timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};
if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/fake_xml_http_request',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /**
 * @depend ../../sinon.js
 * @depend event.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global sinon, module, require, ActiveXObject, XMLHttpRequest, DOMParser*/
/**
 * Fake XMLHttpRequest object
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
"use strict";
if (typeof sinon == "undefined") {
    this.sinon = {};
}
sinon.xhr = { XMLHttpRequest: this.XMLHttpRequest };
// wrapper for global
(function(global) {
    var xhr = sinon.xhr;
    xhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
    xhr.GlobalActiveXObject = global.ActiveXObject;
    xhr.supportsActiveX = typeof xhr.GlobalActiveXObject != "undefined";
    xhr.supportsXHR = typeof xhr.GlobalXMLHttpRequest != "undefined";
    xhr.workingXHR = xhr.supportsXHR ? xhr.GlobalXMLHttpRequest : xhr.supportsActiveX
                                     ? function() { return new xhr.GlobalActiveXObject("MSXML2.XMLHTTP.3.0") } : false;
    /*jsl:ignore*/
    var unsafeHeaders = {
        "Accept-Charset": true,
        "Accept-Encoding": true,
        "Connection": true,
        "Content-Length": true,
        "Cookie": true,
        "Cookie2": true,
        "Content-Transfer-Encoding": true,
        "Date": true,
        "Expect": true,
        "Host": true,
        "Keep-Alive": true,
        "Referer": true,
        "TE": true,
        "Trailer": true,
        "Transfer-Encoding": true,
        "Upgrade": true,
        "User-Agent": true,
        "Via": true
    };
    /*jsl:end*/
    function FakeXMLHttpRequest() {
        this.readyState = FakeXMLHttpRequest.UNSENT;
        this.requestHeaders = {};
        this.requestBody = null;
        this.status = 0;
        this.statusText = "";
        if (typeof FakeXMLHttpRequest.onCreate == "function") {
            FakeXMLHttpRequest.onCreate(this);
        }
    }
    function verifyState(xhr) {
        if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
            throw new Error("INVALID_STATE_ERR");
        }
        if (xhr.sendFlag) {
            throw new Error("INVALID_STATE_ERR");
        }
    }
    // filtering to enable a white-list version of Sinon FakeXhr,
    // where whitelisted requests are passed through to real XHR
    function each(collection, callback) {
        if (!collection) return;
        for (var i = 0, l = collection.length; i < l; i += 1) {
            callback(collection[i]);
        }
    }
    function some(collection, callback) {
        for (var index = 0; index < collection.length; index++) {
            if(callback(collection[index]) === true) return true;
        };
        return false;
    }
    // largest arity in XHR is 5 - XHR#open
    var apply = function(obj,method,args) {
        switch(args.length) {
        case 0: return obj[method]();
        case 1: return obj[method](args[0]);
        case 2: return obj[method](args[0],args[1]);
        case 3: return obj[method](args[0],args[1],args[2]);
        case 4: return obj[method](args[0],args[1],args[2],args[3]);
        case 5: return obj[method](args[0],args[1],args[2],args[3],args[4]);
        };
    };
    FakeXMLHttpRequest.filters = [];
    FakeXMLHttpRequest.addFilter = function(fn) {
        this.filters.push(fn)
    };
    var IE6Re = /MSIE 6/;
    FakeXMLHttpRequest.defake = function(fakeXhr,xhrArgs) {
        var xhr = new sinon.xhr.workingXHR();
        each(["open","setRequestHeader","send","abort","getResponseHeader",
              "getAllResponseHeaders","addEventListener","overrideMimeType","removeEventListener"],
             function(method) {
                 fakeXhr[method] = function() {
                   return apply(xhr,method,arguments);
                 };
             });
        var copyAttrs = function(args) {
            each(args, function(attr) {
              try {
                fakeXhr[attr] = xhr[attr]
              } catch(e) {
                if(!IE6Re.test(navigator.userAgent)) throw e;
              }
            });
        };
        var stateChange = function() {
            fakeXhr.readyState = xhr.readyState;
            if(xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
                copyAttrs(["status","statusText"]);
            }
            if(xhr.readyState >= FakeXMLHttpRequest.LOADING) {
                copyAttrs(["responseText"]);
            }
            if(xhr.readyState === FakeXMLHttpRequest.DONE) {
                copyAttrs(["responseXML"]);
            }
            if(fakeXhr.onreadystatechange) fakeXhr.onreadystatechange.call(fakeXhr);
        };
        if(xhr.addEventListener) {
          for(var event in fakeXhr.eventListeners) {
              if(fakeXhr.eventListeners.hasOwnProperty(event)) {
                  each(fakeXhr.eventListeners[event],function(handler) {
                      xhr.addEventListener(event, handler);
                  });
              }
          }
          xhr.addEventListener("readystatechange",stateChange);
        } else {
          xhr.onreadystatechange = stateChange;
        }
        apply(xhr,"open",xhrArgs);
    };
    FakeXMLHttpRequest.useFilters = false;
    function verifyRequestSent(xhr) {
        if (xhr.readyState == FakeXMLHttpRequest.DONE) {
            throw new Error("Request done");
        }
    }
    function verifyHeadersReceived(xhr) {
        if (xhr.async && xhr.readyState != FakeXMLHttpRequest.HEADERS_RECEIVED) {
            throw new Error("No headers received");
        }
    }
    function verifyResponseBodyType(body) {
        if (typeof body != "string") {
            var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                                 body + ", which is not a string.");
            error.name = "InvalidBodyException";
            throw error;
        }
    }
    sinon.extend(FakeXMLHttpRequest.prototype, sinon.EventTarget, {
        async: true,
        open: function open(method, url, async, username, password) {
            this.method = method;
            this.url = url;
            this.async = typeof async == "boolean" ? async : true;
            this.username = username;
            this.password = password;
            this.responseText = null;
            this.responseXML = null;
            this.requestHeaders = {};
            this.sendFlag = false;
            if(sinon.FakeXMLHttpRequest.useFilters === true) {
                var xhrArgs = arguments;
                var defake = some(FakeXMLHttpRequest.filters,function(filter) {
                    return filter.apply(this,xhrArgs)
                });
                if (defake) {
                  return sinon.FakeXMLHttpRequest.defake(this,arguments);
                }
            }
            this.readyStateChange(FakeXMLHttpRequest.OPENED);
        },
        readyStateChange: function readyStateChange(state) {
            this.readyState = state;
            if (typeof this.onreadystatechange == "function") {
                try {
                    this.onreadystatechange();
                } catch (e) {
                    sinon.logError("Fake XHR onreadystatechange handler", e);
                }
            }
            this.dispatchEvent(new sinon.Event("readystatechange"));
        },
        setRequestHeader: function setRequestHeader(header, value) {
            verifyState(this);
            if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
                throw new Error("Refused to set unsafe header \"" + header + "\"");
            }
            if (this.requestHeaders[header]) {
                this.requestHeaders[header] += "," + value;
            } else {
                this.requestHeaders[header] = value;
            }
        },
        // Helps testing
        setResponseHeaders: function setResponseHeaders(headers) {
            this.responseHeaders = {};
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    this.responseHeaders[header] = headers[header];
                }
            }
            if (this.async) {
                this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
            }
        },
        // Currently treats ALL data as a DOMString (i.e. no Document)
        send: function send(data) {
            verifyState(this);
            if (!/^(get|head)$/i.test(this.method)) {
                if (this.requestHeaders["Content-Type"]) {
                    var value = this.requestHeaders["Content-Type"].split(";");
                    this.requestHeaders["Content-Type"] = value[0] + ";charset=utf-8";
                } else {
                    this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
                }
                this.requestBody = data;
            }
            this.errorFlag = false;
            this.sendFlag = this.async;
            this.readyStateChange(FakeXMLHttpRequest.OPENED);
            if (typeof this.onSend == "function") {
                this.onSend(this);
            }
        },
        abort: function abort() {
            this.aborted = true;
            this.responseText = null;
            this.errorFlag = true;
            this.requestHeaders = {};
            if (this.readyState > sinon.FakeXMLHttpRequest.UNSENT && this.sendFlag) {
                this.readyStateChange(sinon.FakeXMLHttpRequest.DONE);
                this.sendFlag = false;
            }
            this.readyState = sinon.FakeXMLHttpRequest.UNSENT;
        },
        getResponseHeader: function getResponseHeader(header) {
            if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                return null;
            }
            if (/^Set-Cookie2?$/i.test(header)) {
                return null;
            }
            header = header.toLowerCase();
            for (var h in this.responseHeaders) {
                if (h.toLowerCase() == header) {
                    return this.responseHeaders[h];
                }
            }
            return null;
        },
        getAllResponseHeaders: function getAllResponseHeaders() {
            if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                return "";
            }
            var headers = "";
            for (var header in this.responseHeaders) {
                if (this.responseHeaders.hasOwnProperty(header) &&
                    !/^Set-Cookie2?$/i.test(header)) {
                    headers += header + ": " + this.responseHeaders[header] + "\r\n";
                }
            }
            return headers;
        },
        setResponseBody: function setResponseBody(body) {
            verifyRequestSent(this);
            verifyHeadersReceived(this);
            verifyResponseBodyType(body);
            var chunkSize = this.chunkSize || 10;
            var index = 0;
            this.responseText = "";
            do {
                if (this.async) {
                    this.readyStateChange(FakeXMLHttpRequest.LOADING);
                }
                this.responseText += body.substring(index, index + chunkSize);
                index += chunkSize;
            } while (index < body.length);
            var type = this.getResponseHeader("Content-Type");
            if (this.responseText &&
                (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
                try {
                    this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
                } catch (e) {
                    // Unable to parse XML - no biggie
                }
            }
            if (this.async) {
                this.readyStateChange(FakeXMLHttpRequest.DONE);
            } else {
                this.readyState = FakeXMLHttpRequest.DONE;
            }
        },
        respond: function respond(status, headers, body) {
            this.setResponseHeaders(headers || {});
            this.status = typeof status == "number" ? status : 200;
            this.statusText = FakeXMLHttpRequest.statusCodes[this.status];
            this.setResponseBody(body || "");
        }
    });
    sinon.extend(FakeXMLHttpRequest, {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    });
    // Borrowed from JSpec
    FakeXMLHttpRequest.parseXML = function parseXML(text) {
        var xmlDoc;
        if (typeof DOMParser != "undefined") {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(text, "text/xml");
        } else {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(text);
        }
        return xmlDoc;
    };
    FakeXMLHttpRequest.statusCodes = {
        100: "Continue",
        101: "Switching Protocols",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        300: "Multiple Choice",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported"
    };
    sinon.useFakeXMLHttpRequest = function () {
        sinon.FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
            if (xhr.supportsXHR) {
                global.XMLHttpRequest = xhr.GlobalXMLHttpRequest;
            }
            if (xhr.supportsActiveX) {
                global.ActiveXObject = xhr.GlobalActiveXObject;
            }
            delete sinon.FakeXMLHttpRequest.restore;
            if (keepOnCreate !== true) {
                delete sinon.FakeXMLHttpRequest.onCreate;
            }
        };
        if (xhr.supportsXHR) {
            global.XMLHttpRequest = sinon.FakeXMLHttpRequest;
        }
        if (xhr.supportsActiveX) {
            global.ActiveXObject = function ActiveXObject(objId) {
                if (objId == "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {
                    return new sinon.FakeXMLHttpRequest();
                }
                return new xhr.GlobalActiveXObject(objId);
            };
        }
        return sinon.FakeXMLHttpRequest;
    };
    sinon.FakeXMLHttpRequest = FakeXMLHttpRequest;
})(this);
if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/timers_ie',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*global sinon, setTimeout, setInterval, clearTimeout, clearInterval, Date*/
/**
 * Helps IE run the fake timers. By defining global functions, IE allows
 * them to be overwritten at a later point. If these are not defined like
 * this, overwriting them will result in anything from an exception to browser
 * crash.
 *
 * If you don't require fake timers to work in IE, don't include this file.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
function setTimeout() {}
function clearTimeout() {}
function setInterval() {}
function clearInterval() {}
function Date() {}
// Reassign the original functions. Now their writable attribute
// should be true. Hackish, I know, but it works.
setTimeout = sinon.timers.setTimeout;
clearTimeout = sinon.timers.clearTimeout;
setInterval = sinon.timers.setInterval;
clearInterval = sinon.timers.clearInterval;
Date = sinon.timers.Date;
    }
  };
});
asyncmachineTest.module(7, function(/* parent */){
  return {
    'id': 'lib/sinon/util/xhr_ie',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      /*global sinon*/
/**
 * Helps IE run the fake XMLHttpRequest. By defining global functions, IE allows
 * them to be overwritten at a later point. If these are not defined like
 * this, overwriting them will result in anything from an exception to browser
 * crash.
 *
 * If you don't require fake XHR to work in IE, don't include this file.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2011 Christian Johansen
 */
function XMLHttpRequest() {}
// Reassign the original function. Now its writable attribute
// should be true. Hackish, I know, but it works.
XMLHttpRequest = sinon.xhr.XMLHttpRequest || undefined;
    }
  };
});
if(typeof module != 'undefined' && module.exports ){
  module.exports = asyncmachineTest;
  if( !module.parent ){
    asyncmachineTest.main();
  }
}asyncmachineTest.main()