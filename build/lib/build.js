/*global require:false, Buffer:false, process:false, module:false */
var multistatemachine = (function(unused, undefined){
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
    'name'       : 'multistatemachine',
    'module'     : module,
    'pkg'        : pkg,
    'packages'   : pkgmap,
    'stderr'     : stderr,
    'stdin'      : stdin,
    'stdout'     : stdout,
    'require'    : mainRequire
});
}(this));
multistatemachine.pkg(function(parents){
  return {
    'id':1,
    'name':'multistatemachine',
    'main':undefined,
    'mainModuleId':'build/multistatemachine',
    'modules':[],
    'parents':parents
  };
});
multistatemachine.module(1, function(/* parent */){
  return {
    'id': 'build/multistatemachine',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      //autostart: bool;
//export class MultiStateMachine extends EventEmitter2.EventEmitter2 {
var MultiStateMachine = (function () {
    function MultiStateMachine(state, config) {
        this.config = config;
        this.disabled = false;
        // super()
        state = Array.isArray(state) ? state : [
            state
        ];
        this.prepareStates();
        this.setState(state);
    }
    MultiStateMachine.prototype.prepareStates = function () {
        var states = [];
        for(var name in this) {
            var match = name.match(/^state_(.+)/);
            if(match) {
                states.push(match[1]);
            }
        }
        this.states = states;
    }// Tells if a state is active now.
    ;
    MultiStateMachine.prototype.state = function (name) {
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states_active;
    };
    MultiStateMachine.prototype.getState = function (name) {
        return this['state_' + name];
    };
    MultiStateMachine.prototype.setState = function (states) {
        var _this = this;
        var states = Array.isArray(states) ? states : [
            states
        ];
        var current_states = this.state();
        // Remove duplicate states.
        states = states.filter(function (state) {
            return !~current_states.indexOf(state);
        });
        // TODO honor dependant states
        // TODO honor implied states
        this.transition_(current_states, states);
        // Mark new states as active
        states.forEach(function (name) {
            _this.states_active.push(name);
        });
    };
    MultiStateMachine.prototype.transition_ = function (from, to) {
        var _this = this;
        // var wait = <Function[]>[]
        from.forEach(function (state) {
            _this.transitionExit_(state, to);
        });
        to.forEach(function (state) {
            _this.transitionEnter_(from, state);
        });
        // set new states as active ones
        this.states_active = to;
    };
    MultiStateMachine.prototype.transitionEnter_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        from.forEach(function (state) {
            _this.transitionExec_(state + '_' + to);
        });
        this.transitionExec_('any_' + to);
        // TODO trigger the enter transitions (all of them) after all other middle
        // transitions (any_ etc)
        this.transitionExec_(to + 'enter');
    };
    MultiStateMachine.prototype.transitionExit_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        this.transitionExec_(from + '_exit');
        to.forEach(function (state) {
            _this.transitionExec_(from + '_' + state);
        });
        // TODO trigger the exit transitions (all of them) after all other middle
        // transitions (_any etc)
        this.transitionExec_(from + '_any');
    };
    MultiStateMachine.prototype.transitionExec_ = function (method) {
        // TODO refactor to event, return async callback
        if(typeof (this[method]) === 'Function') {
            this[method]();
        }
    };
    return MultiStateMachine;
})();
exports.MultiStateMachine = MultiStateMachine;
/*
class Foo extends MultiStateMachine {
state_A = {
depends: [],
implies: ['B']
};
state_B: { };
B_enter() { };
A_exit() { };
A_B() { };
Any_B() { };
B_Any() { };
}
*/

//@ sourceMappingURL=multistatemachine.js.map
    }
  };
});
if(typeof module != 'undefined' && module.exports ){
  module.exports = multistatemachine;
  if( !module.parent ){
    multistatemachine.main();
  }
}