/*global require:false, Buffer:false, process:false, module:false */
var asyncmachine = (function(unused, undefined){
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
    'name'       : 'asyncmachine',
    'module'     : module,
    'pkg'        : pkg,
    'packages'   : pkgmap,
    'stderr'     : stderr,
    'stdin'      : stdin,
    'stdout'     : stdout,
    'require'    : mainRequire
});
}(this));
asyncmachine.pkg(function(parents){
  return {
    'id':1,
    'name':'asyncmachine',
    'main':undefined,
    'mainModuleId':'build/lib/asyncmachine',
    'modules':[],
    'parents':parents
  };
});
asyncmachine.module(1, function(/* parent */){
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
            this.debug_ = false;
            this.queue = [];
            this.states = [];
            this.states_active = [];
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
            this.debug_ = !this.debug_;
            if(this.debug_) {
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
            if(!this.debug_) {
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
asyncmachine.pkg(1, function(parents){
  return {
    'id':2,
    'name':'es5-shim',
    'main':undefined,
    'mainModuleId':'es5-shim',
    'modules':[],
    'parents':parents
  };
});
asyncmachine.module(2, function(/* parent */){
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
function Empty() {}
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
        var args = _Array_slice_.call(arguments, 1); // for normal call
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
                    args.concat(_Array_slice_.call(arguments))
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
                    args.concat(_Array_slice_.call(arguments))
                );
            }
        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
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
var _Array_slice_ = prototypeOfArray.slice;
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
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = [];
            while (l--) {
                a.unshift(l)
            }
            return a
        }
        var array = []
            , lengthBefore
        ;
        array.splice.bind(array, 0, 0).apply(null, makeArray(20));
        array.splice.bind(array, 0, 0).apply(null, makeArray(26));
        lengthBefore = array.length; //20
        array.splice(5, 0, "XXX"); // add one element
        if(lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
        // else {
        //    IE8 bug
        // }
    }()) {//IE 6/7
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(_Array_slice_.call(arguments, 2)))
            }
        };
    }
    else {//IE8
        Array.prototype.splice = function(start, deleteCount) {
            var result
                , args = _Array_slice_.call(arguments, 2)
                , addElementsCount = args.length
            ;
            if(!arguments.length) {
                return [];
            }
            if(start === void 0) { // default
                start = 0;
            }
            if(deleteCount === void 0) { // default
                deleteCount = this.length - start;
            }
            if(addElementsCount > 0) {
                if(deleteCount <= 0) {
                    if(start == this.length) { // tiny optimisation #1
                        this.push.apply(this, args);
                        return [];
                    }
                    if(start == 0) { // tiny optimisation #2
                        this.unshift.apply(this, args);
                        return [];
                    }
                }
                // Array.prototype.splice implementation
                result = _Array_slice_.call(this, start, start + deleteCount);// delete part
                args.push.apply(args, _Array_slice_.call(this, start + deleteCount, this.length));// right part
                args.unshift.apply(args, _Array_slice_.call(this, 0, start));// left part
                // delete all items from this array and replace it to 'left part' + _Array_slice_.call(arguments, 2) + 'right part'
                args.unshift(0, this.length);
                array_splice.apply(this, args);
                return result;
            }
            return array_splice.call(this, start, deleteCount);
        }
    }
}
// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) == undefined but should be "1"
if ([].unshift(0) != 1) {
    var array_unshift = Array.prototype.unshift;
    Array.prototype.unshift = function() {
        array_unshift.apply(this, arguments);
        return this.length;
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
            "constructor"
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
        function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
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
                date.constructor = Date;
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
                    "(?:(\\.\\d{1,}))?" + // milliseconds capture
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
            Date[key] = NativeDate[key];
        }
        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;
        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
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
                    millisecond = Math.floor(Number(match[7] || 0) * 1000),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    offset = !match[4] || match[8] ?
                        0 : Number(new NativeDate(1970, 0)),
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
        return Date;
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
// Number
// ======
//
// ES5.1 15.7.4.5
// http://es5.github.com/#x15.7.4.5
if (!Number.prototype.toFixed || (0.00008).toFixed(3) !== '0.000' || (0.9).toFixed(0) === '0' || (1.255).toFixed(2) !== '1.25' || (1000000000000000128).toFixed(0) !== "1000000000000000128") {
    // Hide these variables and functions
    (function () {
        var base, size, data, i;
        base = 1e7;
        size = 6;
        data = [0, 0, 0, 0, 0, 0];
        function multiply(n, c) {
            var i = -1;
            while (++i < size) {
                c += n * data[i];
                data[i] = c % base;
                c = Math.floor(c / base);
            }
        }
        function divide(n) {
            var i = size, c = 0;
            while (--i >= 0) {
                c += data[i];
                data[i] = Math.floor(c / n);
                c = (c % n) * base;
            }
        }
        function toString() {
            var i = size;
            var s = '';
            while (--i >= 0) {
                if (s !== '' || i === 0 || data[i] !== 0) {
                    var t = String(data[i]);
                    if (s === '') {
                        s = t;
                    } else {
                        s += '0000000'.slice(0, 7 - t.length) + t;
                    }
                }
            }
            return s;
        }
        function pow(x, n, acc) {
            return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
        }
        function log(x) {
            var n = 0;
            while (x >= 4096) {
                n += 12;
                x /= 4096;
            }
            while (x >= 2) {
                n += 1;
                x /= 2;
            }
            return n;
        }
        Number.prototype.toFixed = function (fractionDigits) {
            var f, x, s, m, e, z, j, k;
            // Test for NaN and round fractionDigits down
            f = Number(fractionDigits);
            f = f !== f ? 0 : Math.floor(f);
            if (f < 0 || f > 20) {
                throw new RangeError("Number.toFixed called with invalid number of decimals");
            }
            x = Number(this);
            // Test for NaN
            if (x !== x) {
                return "NaN";
            }
            // If it is too big or small, return the string value of the number
            if (x <= -1e21 || x >= 1e21) {
                return String(x);
            }
            s = "";
            if (x < 0) {
                s = "-";
                x = -x;
            }
            m = "0";
            if (x > 1e-21) {
                // 1e-21 < x < 1e21
                // -70 < log2(x) < 70
                e = log(x * pow(2, 69, 1)) - 69;
                z = (e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1));
                z *= 0x10000000000000; // Math.pow(2, 52);
                e = 52 - e;
                // -18 < e < 122
                // x = z / 2 ^ e
                if (e > 0) {
                    multiply(0, z);
                    j = f;
                    while (j >= 7) {
                        multiply(1e7, 0);
                        j -= 7;
                    }
                    multiply(pow(10, j, 1), 0);
                    j = e - 1;
                    while (j >= 23) {
                        divide(1 << 23);
                        j -= 23;
                    }
                    divide(1 << j);
                    multiply(1, 1);
                    divide(2);
                    m = toString();
                } else {
                    multiply(0, z);
                    multiply(1 << (-e), 0);
                    m = toString() + '0.00000000000000000000'.slice(2, 2 + f);
                }
            }
            if (f > 0) {
                k = m.length;
                if (k <= f) {
                    m = s + '0.0000000000000000000'.slice(0, f - k + 2) + m;
                } else {
                    m = s + m.slice(0, k - f) + '.' + m.slice(k - f);
                }
            } else {
                m = s + m;
            }
            return m;
        }
    }());
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
            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,
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
asyncmachine.pkg(1, function(parents){
  return {
    'id':4,
    'name':'lucidjs',
    'main':undefined,
    'mainModuleId':'lucid',
    'modules':[],
    'parents':parents
  };
});
asyncmachine.module(4, function(/* parent */){
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
	} else if((typeof module == 'object' || typeof module == 'function') && module.exports) {
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
		var emitter = object || {}, listeners = {}, setEvents = {}, pipes = [];
		//augment an object if it isn't already an emitter
		if(
			!emitter.on &&
			!emitter.once &&
			!emitter.trigger &&
			!emitter.set &&
			!emitter.pipe &&
			!emitter.listeners
		) {
			emitter.on = on;
			emitter.off = off;
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
			var args, binding = {}, aI, sI;
			args = Array.prototype.slice.apply(arguments, [1]);
			//recurse over a batch of events
			if(typeof event === 'object' && typeof event.push === 'function') { return batchOn(event, args); }
			//trigger the listener event
			if(event.slice(0, 7) !== 'emitter' && (listeners['emitter'] || listeners['emitter.listener'])) {
				for(aI = 0; aI < args.length; aI += 1) {
					trigger('emitter.listener', event, args[aI]);
				}
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
		 * Unbinds listeners to events.
		 * @param event
		 * @return {Object}
		 */
		function off(event     ) {
			var args = Array.prototype.slice.apply(arguments, [1]), aI, sI;
			//recurse over a batch of events
			if(typeof event === 'object' && typeof event.push === 'function') {
				for(sI = 0; sI < event.length; sI += 1) {
					off.apply(null, [event[sI]].concat(args));
				}
				return;
			}
			if(!listeners[event]) { throw new Error('Tried to remove an event from a non-existant event of type "'+event+'".'); }
			//remove each callback
			for(aI = 0; aI < args.length; aI += 1) {
				if(typeof args[aI] !== 'function') { throw new Error('Tried to remove a non-function.'); }
				var listenerIndex = listeners[event].indexOf(args[aI]);
				listeners[event].splice(listenerIndex, 1);
			}
		}
		/**
		 * Binds listeners to events. Once an event is fired the binding is cleared automatically.
		 * @param event
		 * @return {Object}
		 */
		function once(event     ) {
			var binding, args = Array.prototype.slice.apply(arguments, [1]), result = true, cleared = false;
			binding = on(event, function(    ) {
				var aI, eventArgs = Array.prototype.slice.apply(arguments);
				if(!binding) {
					if(cleared) { return; }
					cleared = true;
					setTimeout(function(){ binding.clear(); }, 0);
				} else {
					binding.clear();
				}
				for(aI = 0; aI < args.length; aI += 1) {
					if(args[aI].apply(this, eventArgs) === false) {
						result = false;
					}
				}
				return result;
			});
			return binding;
		}
		/**
		 * Triggers events. Passes listeners any additional arguments.
		 *  Optimized for 6 arguments.
		 * @param event
		 * @return {Boolean}
		 */
		function trigger(event, a1, a2, a3, a4, a5, a6, a7, a8, a9, la) {
			var longArgs, lI, eventListeners, result = true;
			if(typeof la !== 'undefined') {
				longArgs = Array.prototype.slice.apply(arguments, [1]);
			}
			if(typeof event === 'object' && typeof event.push === 'function') {
				if(longArgs) {
					return batchTrigger.apply(null, arguments);
				} else {
					return batchTrigger(event, a1, a2, a3, a4, a5, a6, a7, a8, a9);
				}
			}
			event = event.split('.');
			while(event.length) {
				eventListeners = listeners[event.join('.')];
				if(event[0] !== 'emitter' && (listeners['emitter'] || listeners['emitter.event'])) {
					if(longArgs) {
						trigger.apply(this, [].concat('emitter.event', event.join('.'), longArgs));
					} else {
						trigger('emitter.event', event.join('.'), a1, a2, a3, a4, a5, a6, a7, a8, a9);
					}
				}
				if(eventListeners) {
					eventListeners = [].concat(eventListeners);
					for(lI = 0; lI < eventListeners.length; lI += 1) {
						if(longArgs) {
							if(eventListeners[lI].apply(this, longArgs) === false) {
								result = false;
							}
						} else {
							if(eventListeners[lI](a1, a2, a3, a4, a5, a6, a7, a8, a9) === false) {
								result = false;
							}
						}
					}
				}
				event.pop();
			}
			return result;
		}
		/**
		 * Triggers a batch of events. Passes listeners any additional arguments.
		 *  Optimized for 6 arguments.
		 */
		function batchTrigger(events, a1, a2, a3, a4, a5, a6, a7, a8, a9, la) {
			var longArgs, eI, result = true;
			if(typeof la !== 'undefined') {
				longArgs = Array.prototype.slice.apply(arguments, [1]);
			}
			for(eI = 0; eI < events.length; eI += 1) {
				if(longArgs) {
					args.unshift(events[eI]);
					if(trigger.apply(this, args) === false) { result = false; }
					args.shift();
				} else {
					if(trigger(events[eI], a1, a2, a3, a4, a5, a6, a7, a8, a9) === false) { result = false; }
				}
			}
			return result;
		}
		/**
		 * Sets events. Passes listeners any additional arguments.
		 *  Optimized for 6 arguments.
		 */
		function set(event, a1, a2, a3, a4, a5, a6, a7, a8, a9, la) {
			var args, binding, _clear;
			if(la) { args = Array.prototype.slice.apply(arguments, [1]); }
			if(typeof event === 'object' && event.push) {
				if(args) { return batchSet.apply(null, args); }
				else { return batchSet(event, a1, a2, a3, a4, a5, a6, a7, a8, a9); }
			}
			binding = on(['emitter.listener', 'pipe.listener'], function(_event, listener) {
				var lI;
				if(event === _event) {
					if(args) { listener.apply(null, args); }
					else { listener(a1, a2, a3, a4, a5, a6, a7, a8, a9); }
				}
			});
			if(args) { trigger.apply(null, arguments); }
			else { trigger(event, a1, a2, a3, a4, a5, a6, a7, a8, a9); }
			if(!setEvents[event]) { setEvents[event] = []; }
			setEvents[event].push(binding);
			_clear = binding.clear;
			binding.clear = clear;
			return binding;
			function clear() {
				trigger('emitter.unset', event);
				setEvents[event].splice(setEvents[event].indexOf(binding), 1);
				_clear();
			}
		}
		function batchSet(events, a1, a2, a3, a4, a5, a6, a7, a8, a9, la) {
			var binding = {}, args, eI, bindings = [];
			if(la) { args = Array.prototype.slice.apply(arguments, [1]); }
			for(eI = 0; eI < events.length; eI += 1) {
				if(args) {
					bindings.push(set.apply(null, [events[eI]].concat(args)));
				} else {
					bindings.push(set(events[eI], a1, a2, a3, a4, a5, a6, a7, a8, a9));
				}
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
		/**
		 * Clears a set event, or all set events.
		 * @param event
		 */
		function clearSet(event) {
			var bI;
			if(event && setEvents[event]) {
				for(bI = 0; bI < setEvents[event].length; bI += 1) {
					setEvents[event][bI].clear();
				}
				delete setEvents[event];
			} else if (!event) {
				for(event in setEvents) {
					if(!setEvents.hasOwnProperty(event)) { continue; }
					clearSet(event);
				}
			}
		}
		/**
		 * Pipes events from another emitter.
		 * @param event [optional]
		 * @return {Object}
		 */
		function pipe(event    ) {
			var binding = {}, emitters, eI, emitter, bindings = [],
			setEvents = [], eventCaptures = [], sendListeners = [];
			emitters = Array.prototype.slice.apply(arguments, [1]);
			if(typeof event === 'object') {
				if(event.on) { emitters.unshift(event); event = false; }
				else { return batchPipe.apply(null, arguments); }
			}
			for(eI = 0; eI < emitters.length; eI += 1) {
				emitter = emitters[eI];
				eventCaptures.push(emitter.on('emitter.event', captureEvent));
				sendListeners.push(on('emitter.listener', sendListener));
			}
			binding.clear = clear;
			return binding;
			function captureEvent(event     ) {
				var setEvent = false, args;
				args = Array.prototype.slice.apply(arguments, [1]);
				emitter.once(event, function() { setEvent = true; });
				if(event.substr(0, 4) !== 'pipe' && (listeners['pipe'] || listeners['pipe.event'])) {
					trigger('pipe.event', event, args);
				}
				if(setEvent) { setEvents.push(set.apply(null, [event].concat(args))); }
				else { trigger.apply(null, [event].concat(args)); }
			}
			function sendListener(event, listener) {
				emitter.trigger('pipe.listener', event, listener);
			}
			function clear() {
				var bI, sI, eI, sII;
				for(bI = 0; bI < bindings.length; bI += 1) {
					bindings[bI].clear();
				}
				for(sI = 0; sI < bindings.length; sI += 1) {
					setEvents[sI].clear();
				}
				for(eI = 0; eI < eventListeners.length; eI += 1) {
					bindings[eI].clear();
				}
				for(sII = 0; sII < sendListeners.length; sII += 1) {
					setEvents[sII].clear();
				}
			}
		}
		function batchPipe(events    ) {
			var binding = {}, eI, bindings = [], emitters;
			emitters = Array.prototype.slice.apply(arguments, [1]);
			for(eI = 0; eI < events.length; eI += 1) {
				bindings.push(pipe.apply(null, [events[eI]].concat(emitters)));
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
		/**
		 * Clears pipes based on the events they transport.
		 * @param event
		 */
		function clearPipes(event) {
			var pI, bI, binding;
			for(pI = 0; pI < pipes.length; pI += 1) {
				if(event) {
					if(pipes[pI].type === 2) { continue; }
					if(pipes[pI].events.indexOf(event) === -1) { continue; }
					pipes[pI].events.splice(pipes[pI].events.indexOf(event), 1);
				}
				if(pipes[pI].type === 2) { pipes[pI].listenerBinding.clear(); }
				for(bI = 0; bI < pipes[pI].bindings.length; bI += 1) {
					if(event && pipes[pI].bindings[bI].event !== event) { continue; }
					pipes[pI].bindings[bI].clear();
					pipes[pI].bindings.splice(bI, 1);
					bI -= 1;
				}
				if(pipes[pI].bindings.length < 1) {
					pipes.splice(pI, 1);
					pI -= 1;
				}
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
			if(listeners['emitter'] || listeners['emitter.clear']) {
				trigger('emitter.clear');
			}
			listeners = {};
			clearSet();
			clearPipes();
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
asyncmachine.pkg(1, function(parents){
  return {
    'id':3,
    'name':'rsvp',
    'main':undefined,
    'mainModuleId':'node/rsvp',
    'modules':[],
    'parents':parents
  };
});
asyncmachine.module(3, function(/* parent */){
  return {
    'id': 'node/rsvp',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      "use strict";
var config = {};
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var MutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var RSVP;
if (typeof process !== 'undefined' &&
  {}.toString.call(process) === '[object process]') {
  config.async = function(callback, binding) {
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
  // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
  window.addEventListener('unload', function(){
    observer.disconnect();
    observer = null;
  });
  config.async = function(callback, binding) {
    queue.push([callback, binding]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
} else {
  config.async = function(callback, binding) {
    setTimeout(function() {
      callback.call(binding);
    }, 1);
  };
}
var Event = function(type, options) {
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
var EventTarget = {
  mixin: function(object) {
    object.on = this.on;
    object.off = this.off;
    object.trigger = this.trigger;
    return object;
  },
  on: function(eventNames, callback, binding) {
    var allCallbacks = callbacksFor(this), callbacks, eventName;
    eventNames = eventNames.split(/\s+/);
    binding = binding || this;
    while (eventName = eventNames.shift()) {
      callbacks = allCallbacks[eventName];
      if (!callbacks) {
        callbacks = allCallbacks[eventName] = [];
      }
      if (indexOf(callbacks, callback) === -1) {
        callbacks.push([callback, binding]);
      }
    }
  },
  off: function(eventNames, callback) {
    var allCallbacks = callbacksFor(this), callbacks, eventName, index;
    eventNames = eventNames.split(/\s+/);
    while (eventName = eventNames.shift()) {
      if (!callback) {
        allCallbacks[eventName] = [];
        continue;
      }
      callbacks = allCallbacks[eventName];
      index = indexOf(callbacks, callback);
      if (index !== -1) { callbacks.splice(index, 1); }
    }
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
var Promise = function() {
  this.on('promise:resolved', function(event) {
    this.trigger('success', { detail: event.detail });
  }, this);
  this.on('promise:failed', function(event) {
    this.trigger('error', { detail: event.detail });
  }, this);
};
var noop = function() {};
var invokeCallback = function(type, promise, callback, event) {
  var hasCallback = typeof callback === 'function',
      value, error, succeeded, failed;
  if (hasCallback) {
    try {
      value = callback(event.detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = event.detail;
    succeeded = true;
  }
  if (value && typeof value.then === 'function') {
    value.then(function(value) {
      promise.resolve(value);
    }, function(error) {
      promise.reject(error);
    });
  } else if (hasCallback && succeeded) {
    promise.resolve(value);
  } else if (failed) {
    promise.reject(error);
  } else {
    promise[type](value);
  }
};
Promise.prototype = {
  then: function(done, fail) {
    var thenPromise = new Promise();
    if (this.isResolved) {
      config.async(function() {
        invokeCallback('resolve', thenPromise, done, { detail: this.resolvedValue });
      }, this);
    }
    if (this.isRejected) {
      config.async(function() {
        invokeCallback('reject', thenPromise, fail, { detail: this.rejectedValue });
      }, this);
    }
    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });
    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });
    return thenPromise;
  },
  resolve: function(value) {
    resolve(this, value);
    this.resolve = noop;
    this.reject = noop;
  },
  reject: function(value) {
    reject(this, value);
    this.resolve = noop;
    this.reject = noop;
  }
};
function resolve(promise, value) {
  config.async(function() {
    promise.trigger('promise:resolved', { detail: value });
    promise.isResolved = true;
    promise.resolvedValue = value;
  });
}
function reject(promise, value) {
  config.async(function() {
    promise.trigger('promise:failed', { detail: value });
    promise.isRejected = true;
    promise.rejectedValue = value;
  });
}
function all(promises) {
  var i, results = [];
  var allPromise = new Promise();
  var remaining = promises.length;
  if (remaining === 0) {
    allPromise.resolve([]);
  }
  var resolver = function(index) {
    return function(value) {
      resolve(index, value);
    };
  };
  var resolve = function(index, value) {
    results[index] = value;
    if (--remaining === 0) {
      allPromise.resolve(results);
    }
  };
  var reject = function(error) {
    allPromise.reject(error);
  };
  for (i = 0; i < remaining; i++) {
    promises[i].then(resolver(i), reject);
  }
  return allPromise;
}
EventTarget.mixin(Promise.prototype);
function configure(name, value) {
  config[name] = value;
}
exports.Promise = Promise;
exports.Event = Event;
exports.EventTarget = EventTarget;
exports.all = all;
exports.configure = configure;
    }
  };
});
if(typeof module != 'undefined' && module.exports ){
  module.exports = asyncmachine;
  if( !module.parent ){
    asyncmachine.main();
  }
}