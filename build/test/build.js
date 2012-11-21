/*global require:false, Buffer:false, process:false, module:false */
var multistatemachineTest = (function(unused, undefined){
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
    'name'       : 'multistatemachineTest',
    'module'     : module,
    'pkg'        : pkg,
    'packages'   : pkgmap,
    'stderr'     : stderr,
    'stdin'      : stdin,
    'stdout'     : stdout,
    'require'    : mainRequire
});
}(this));
multistatemachineTest.pkg(8, function(parents){
  return {
    'id':9,
    'name':'buster-core',
    'main':undefined,
    'mainModuleId':'lib/buster-core',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(9, function(/* parent */){
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
multistatemachineTest.module(9, function(/* parent */){
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
multistatemachineTest.module(9, function(/* parent */){
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
multistatemachineTest.module(9, function(/* parent */){
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
multistatemachineTest.pkg(7, function(parents){
  return {
    'id':8,
    'name':'buster-format',
    'main':undefined,
    'mainModuleId':'lib/buster-format',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(8, function(/* parent */){
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
        var name = buster.functionName(object && object.constructor);
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
multistatemachineTest.module(8, function(/* parent */){
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
        var name = buster.functionName(object && object.constructor);
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
multistatemachineTest.pkg(1, function(parents){
  return {
    'id':2,
    'name':'chai',
    'main':undefined,
    'mainModuleId':'index',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
      !(value.constructor && value.constructor.prototype === value)) {
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.module(2, function(/* parent */){
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
multistatemachineTest.pkg(3, function(parents){
  return {
    'id':4,
    'name':'es5-shim',
    'main':undefined,
    'mainModuleId':'es5-shim',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(4, function(/* parent */){
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
multistatemachineTest.pkg(3, function(parents){
  return {
    'id':6,
    'name':'lucidjs',
    'main':undefined,
    'mainModuleId':'lucid',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(6, function(/* parent */){
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
multistatemachineTest.pkg(1, function(parents){
  return {
    'id':3,
    'name':'multistatemachine',
    'main':undefined,
    'mainModuleId':'build/lib/multistatemachine',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(3, function(/* parent */){
  return {
    'id': 'build/lib/multistatemachine',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      ///<reference path="../headers/node.d.ts" />
///<reference path="../headers/lucidjs.d.ts" />
///<reference path="../headers/rsvp.d.ts" />
///<reference path="../headers/es5-shim.d.ts" />
var rsvp = require('rsvp')
var Promise = rsvp.Promise;
var LucidJS = require('lucidjs')
require('es5-shim');
//autostart: bool;
//export class MultiStateMachine extends Eventtriggerter2.Eventtriggerter2 {
var MultiStateMachine = (function () {
    function MultiStateMachine(state, config) {
        this.config = config;
        this.disabled = false;
        LucidJS.emitter(this);
        if(config && config.debug) {
            this.debug();
        }
        state = Array.isArray(state) ? state : [
            state
        ];
        this.prepareStates();
        this.setState(state);
    }
    MultiStateMachine.prototype.debug = function (prefix) {
        if(this.debug_) {
            // OFF
            this.trigger = this.debug_;
            delete this.debug_;
        } else {
            // ON
            this.debug_ = this.trigger;
            this.trigger = function (event) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                prefix = prefix || '';
                console.log(prefix + event);
                this.debug_.apply(this, [].concat([
                    event
                ], args));
            };
        }
    }// Tells if a state is active now.
    ;
    MultiStateMachine.prototype.state = function (name) {
        if(name) {
            return ~this.states.indexOf(name);
        }
        return this.states_active;
    }// Activate certain states and deactivate the current ones.
    ;
    MultiStateMachine.prototype.setState = function (states) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var states = Array.isArray(states) ? states : [
            states
        ];
        if(this.selfTransitionExec_(states, args) === false) {
            return false;
        }
        states = this.setupTargetStates_(states);
        var ret = this.transition_(states, args);
        return ret === false ? false : this.allStatesSet(states);
    }// Curried version of setState.
    ;
    MultiStateMachine.prototype.setStateLater = function (states) {
        var _this = this;
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            rest[_i] = arguments[_i + 1];
        }
        var promise = new Promise();
        promise.then(function () {
            _this.setState.apply(_this, [].concat(states, rest));
        });
        return this.last_promise = promise;
    }// Deactivate certain states.
    ;
    MultiStateMachine.prototype.dropState = function (states) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var states_to_drop = Array.isArray(states) ? states : [
            states
        ];
        // Remove duplicate states.
        states = this.states_active.filter(function (state) {
            return !~states_to_drop.indexOf(state);
        });
        states = this.setupTargetStates_(states);
        this.transition_(states, args);
        return this.allStatesNotSet(states);
    }// Deactivate certain states.
    ;
    MultiStateMachine.prototype.dropStateLater = function (states) {
        var _this = this;
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            rest[_i] = arguments[_i + 1];
        }
        var promise = new Promise();
        promise.then(function () {
            _this.dropState.apply(_this, [].concat(states, rest));
        });
        return this.last_promise = promise;
    }// Activate certain states and keem the current ones.
    // TODO Maybe avoid double concat of states_active
    ;
    MultiStateMachine.prototype.pushState = function (states) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var states = Array.isArray(states) ? states : [
            states
        ];
        if(this.selfTransitionExec_(states, args) === false) {
            return false;
        }
        states = this.setupTargetStates_(this.states_active.concat(states));
        var ret = this.transition_(states, args);
        return ret === false ? false : this.allStatesSet(states);
    }// Curried version of pushState
    ;
    MultiStateMachine.prototype.pushStateLater = function (states) {
        var _this = this;
        var rest = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            rest[_i] = arguments[_i + 1];
        }
        var promise = new Promise();
        promise.then(function () {
            _this.pushState.apply(_this, [].concat(states, rest));
        });
        return this.last_promise = promise;
        //    private trasitions: string[];
            };
    MultiStateMachine.prototype.pipeForward = function (state, machine, target_state) {
        var _this = this;
        if(state instanceof MultiStateMachine) {
            target_state = machine;
            machine = state;
            state = this.states;
        }
        [].concat(state).forEach(function (state) {
            var new_state = target_state || state;
            state = _this.namespaceStateName(state);
            _this.on(state + '.enter', function () {
                return machine.pushState(new_state);
            });
            _this.on(state + '.exit', function () {
                return machine.dropState(new_state);
            });
        });
    };
    MultiStateMachine.prototype.pipeInvert = function (state, machine, target_state) {
        state = this.namespaceStateName(state);
        this.on(state + '.enter', function () {
            machine.dropState(target_state);
        });
        this.on(state + '.exit', function () {
            machine.pushState(target_state);
        });
    };
    MultiStateMachine.prototype.pipeOff = function () {
    }// TODO use a regexp lib for IE8's 'g' flag compat?
    ;
    MultiStateMachine.prototype.namespaceStateName = function (state) {
        // CamelCase to Camel.Case
        return state.replace(/([a-zA-Z])([A-Z])/g, '$1.$2');
    }/*
    // Events as states feature
    on(event_name: string, listener: Function) {
    
    }
    
    many(event_name: string, times_to_listen: number, listener: Function) {
    
    }
    
    onAny(listener: Function) {
    
    }
    */
    ////////////////////////////
    // PRIVATES
    ////////////////////////////
    ;
    MultiStateMachine.prototype.allStatesSet = function (states) {
        var _this = this;
        return !states.reduce(function (ret, state) {
            return ret || !_this.state(state);
        }, false);
    };
    MultiStateMachine.prototype.allStatesNotSet = function (states) {
        var _this = this;
        return !states.reduce(function (ret, state) {
            return ret || _this.state(state);
        }, false);
    };
    MultiStateMachine.prototype.namespaceTransition_ = function (transition) {
        // CamelCase to Camel.Case
        return this.namespaceStateName(transition).replace(// A_exit -> A.exit
        /_([a-z]+)$/, '.$1').replace(// A_B -> A._.B
        '_', '._.');
    };
    MultiStateMachine.prototype.prepareStates = function () {
        var states = [];
        for(var name in this) {
            var match = name.match(/^state_(.+)/);
            if(match) {
                states.push(match[1]);
            }
        }
        this.states = states;
        this.states_active = [];
    };
    MultiStateMachine.prototype.getState_ = function (name) {
        return this['state_' + name];
    }// Executes self transitions (eg ::A_A) based on active states.
    ;
    MultiStateMachine.prototype.selfTransitionExec_ = function (states, args) {
        var _this = this;
        var ret = states.some(function (state) {
            var ret;
            var name = state + '_' + state;

            var method = _this[name];
            if(method && ~_this.states_active.indexOf(state)) {
                ret = method();
                if(ret === false) {
                    return true;
                }
                var event = _this.namespaceTransition_(name);
                return _this.trigger(event, args) === false;
            }
        });
        return ret === true ? false : true;
    };
    MultiStateMachine.prototype.setupTargetStates_ = function (states, exclude) {
        if (typeof exclude === "undefined") { exclude = []; }
        var _this = this;
        // Remove non existing states
        states = states.filter(function (name) {
            return ~_this.states.indexOf(name);
        });
        states = this.parseImplies_(states);
        states = this.removeDuplicateStates_(states);
        // Check if state is blocked or excluded
        states = states.filter(function (name) {
            var blocked = _this.isStateBlocked_(states, name);
            return !blocked && !~exclude.indexOf(name);
        });
        return this.parseRequires_(states);
    }// Collect implied states
    ;
    MultiStateMachine.prototype.parseImplies_ = function (states) {
        var _this = this;
        states.forEach(function (name) {
            var state = _this.getState_(name);
            if(!state.implies) {
                return;
            }
            states = states.concat(state.implies);
        });
        return states;
    }// Check required states (until no change happens)
    ;
    MultiStateMachine.prototype.parseRequires_ = function (states) {
        var _this = this;
        var missing = true;
        while(missing) {
            missing = false;
            states = states.filter(function (name) {
                var state = _this.getState_(name);
                missing = (state.requires || []).reduce(function (memo, req) {
                    return memo || !~states.indexOf(req);
                }, false);
                return !missing;
            });
        }
        return states;
    };
    MultiStateMachine.prototype.removeDuplicateStates_ = function (states) {
        // Remove duplicates.
        var states2 = [];
        states.forEach(function (name) {
            if(!~states2.indexOf(name)) {
                states2.push(name);
            }
        });
        return states2;
    };
    MultiStateMachine.prototype.isStateBlocked_ = function (states, name) {
        var _this = this;
        var blocked = false;
        states.forEach(function (name2) {
            var state = _this.getState_(name2);
            if(state.blocks && ~state.blocks.indexOf(name)) {
                blocked = true;
            }
        });
        return blocked;
    };
    MultiStateMachine.prototype.transition_ = function (to, args) {
        var _this = this;
        // TODO handle args
        if(!to.length) {
            return true;
        }
        // Collect states to drop, based on the target states.
        var from = this.states_active.filter(function (state) {
            return !~to.indexOf(state);
        });
        this.orderStates_(to);
        this.orderStates_(from);
        // var wait = <Function[]>[]
        var ret = from.some(function (state) {
            return _this.transitionExit_(state, to) === false;
        });
        if(ret === true) {
            return false;
        }
        ret = to.some(function (state) {
            // Skip transition if state is already active.
            if(~_this.states_active.indexOf(state)) {
                return false;
            }
            return _this.transitionEnter_(state, to) === false;
        });
        if(ret === true) {
            return false;
        }
        this.states_active = to;
        return true;
    }// Exit transition handles state-to-state methods.
    ;
    MultiStateMachine.prototype.transitionExit_ = function (from, to) {
        var _this = this;
        var method;
        var callbacks = [];

        if(this.transitionExec_(from + '_exit', to) === false) {
            return false;
        }
        // Duplicate event for namespacing.
        var ret = this.transitionExec_('exit.' + this.namespaceStateName(from), to);
        if(ret === false) {
            return false;
        }
        ret = to.some(function (state) {
            return _this.transitionExec_(from + '_' + state, to) === false;
        });
        if(ret === true) {
            return false;
        }
        // TODO trigger the exit transitions (all of them) after all other middle
        // transitions (_any etc)
        ret = this.transitionExec_(from + '_any', to) === false;
        return ret === true ? false : true;
    };
    MultiStateMachine.prototype.transitionEnter_ = function (to, target_states) {
        var method;
        var callbacks = [];

        //      from.forEach( (state: string) => {
        //        this.transitionExec_( state + '_' + to )
        //      })
        if(this.transitionExec_('any_' + to, target_states) === false) {
            return false;
        }
        // TODO trigger the enter transitions (all of them) after all other middle
        // transitions (any_ etc)
        if(ret = this.transitionExec_(to + '_enter', target_states) === false) {
            return false;
        }
        // Duplicate event for namespacing.
        var ret = this.trigger('enter.' + this.namespaceStateName(to), target_states);
        return ret === false ? false : true;
    };
    MultiStateMachine.prototype.transitionExec_ = function (method, target_states, args) {
        if (typeof args === "undefined") { args = []; }
        args = [].concat([
            target_states
        ], args);
        var ret;
        if(this[method] instanceof Function) {
            ret = this[method].apply(this, args);
            if(ret === false) {
                return false;
            }
        }
        return this.trigger(this.namespaceTransition_(method), args);
    }// is_exit tells that the order is exit transitions
    ;
    MultiStateMachine.prototype.orderStates_ = function (states) {
        var _this = this;
        states.sort(function (e1, e2) {
            var state1 = _this.getState_(e1);
            var state2 = _this.getState_(e2);
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
    MultiStateMachine.prototype.on = function (event, VarArgsBoolFn) {
    };
    MultiStateMachine.prototype.once = function (event, VarArgsBoolFn) {
    };
    MultiStateMachine.prototype.trigger = function (event) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        return true;
    };
    MultiStateMachine.prototype.set = function (event) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        return true;
    };
    return MultiStateMachine;
})();
exports.MultiStateMachine = MultiStateMachine;

//@ sourceMappingURL=multistatemachine.js.map
    }
  };
});
multistatemachineTest.pkg(function(parents){
  return {
    'id':1,
    'name':'multistatemachine-test',
    'main':undefined,
    'mainModuleId':'test',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(1, function(/* parent */){
  return {
    'id': 'test',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, Buffer,process,require, undefined){
      // Generated by CoffeeScript 1.4.0
(function() {
  var Promise, expect, multistatemachine, sinon,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  multistatemachine = require('multistatemachine');
  expect = require('chai').expect;
  sinon = require('sinon');
  Promise = require('rsvp').Promise;
  describe("multistatemachine", function() {
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
    })(multistatemachine.MultiStateMachine);
    mock_states = function(instance, states) {
      var inner, state, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = states.length; _i < _len; _i++) {
        state = states[_i];
        instance["" + state + "_" + state] = sinon.spy();
        instance["" + state + "_enter"] = sinon.spy();
        instance["" + state + "_exit"] = sinon.spy();
        instance["" + state + "_any"] = sinon.spy();
        instance["any_" + state] = sinon.spy();
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = states.length; _j < _len1; _j++) {
            inner = states[_j];
            if (inner === state) {
              continue;
            }
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
    it("should allow for a delayed start");
    it("should accept the starting state", function() {
      return expect(this.machine.state()).to.eql(["A"]);
    });
    it("should allow to set the state", function() {
      this.machine.setState("B");
      return expect(this.machine.state()).to.eql(["B"]);
    });
    it("should allow to add a state", function() {
      this.machine.pushState("B");
      return expect(this.machine.state()).to.eql(["A", "B"]);
    });
    it("should allow to drop a state", function() {
      this.machine.setState(["B", "C"]);
      this.machine.dropState('C');
      return expect(this.machine.state()).to.eql(["B"]);
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
        this.machine = new FooMachine(['A', 'B']);
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
          return expect(this.machine.state()).to.eql(['C']);
        });
        return afterEach(function() {
          return delete this.ret;
        });
      });
      return describe('and blocking one is added', function() {
        return it('should unset the blocked one', function() {
          this.machine.pushState(['C']);
          return expect(this.machine.state()).to.eql(['C']);
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
      it('should be set when required state is active', function() {
        this.machine.setState(['C', 'D']);
        return expect(this.machine.state()).to.eql(['C', 'D']);
      });
      return it('should\'t be set when required state isn\'t active', function() {
        this.machine.setState(['C', 'A']);
        return expect(this.machine.state()).to.eql(['A']);
      });
    });
    describe('when state is changed', function() {
      beforeEach(function() {
        this.machine = new FooMachine('A');
        return mock_states(this.machine, ['A', 'B', 'C', 'D']);
      });
      describe('and transition is canceled', function() {
        beforeEach(function() {
          return this.machine.D_enter = function() {
            return false;
          };
        });
        describe('when setting a new state', function() {
          beforeEach(function() {
            return this.ret = this.machine.setState('D');
          });
          it('should return false', function() {
            return expect(this.machine.setState('D')).not.to.be.ok;
          });
          return it('should not change the previous state', function() {
            return expect(this.machine.state()).to.eql(['A']);
          });
        });
        return describe('when pushing an additional state', function() {
          beforeEach(function() {
            return this.ret = this.machine.pushState('D');
          });
          it('should return false', function() {
            return expect(this.ret).not.to.be.ok;
          });
          return it('should not change the previous state', function() {
            return expect(this.machine.state()).to.eql(['A']);
          });
        });
      });
      describe('and transition is successful', function() {
        return it('should return true', function() {
          return expect(this.machine.setState('D')).to.be.ok;
        });
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
        describe('and synchronous', function() {
          beforeEach(function() {
            this.machine.setState('A', 'C');
            this.machine.setState('D', 'foo', 2);
            return this.machine.dropState('C', 'foo', 2);
          });
          describe('and is explicit', function() {
            it('should forward arguments to exit states', function() {
              return expect(this.machine.C_exit.calledWith('foo', 2)).to.be.ok;
            });
            return it('should forward arguments to enter states', function() {
              return expect(this.machine.D_enter.calledWith('foo', 2)).to.be.ok;
            });
          });
          return describe('and is non-explicit', function() {
            it('should not forward arguments to exit states', function() {
              return expect(this.machine.A_exit.calledWith('foo', 2)).not.to.be.ok;
            });
            return it('should not forward arguments to enter states', function() {
              return expect(this.machine.B_enter.calledWith('foo', 2)).not.to.be.ok;
            });
          });
        });
        return describe('and delayed', function() {
          beforeEach(function(done) {
            var _this = this;
            return setTimeout(function() {
              _this.machine.setStateLater('A', 'C');
              _this.machine.setStateLater('D', 'foo', 2);
              _this.machine.dropStateLater('C', 'foo', 2);
              return done();
            }, 0);
          });
          describe('and is explicit', function() {
            it('should forward arguments to exit states', function() {
              return expect(this.machine.C_exit.calledWith('foo', 2)).to.be.ok;
            });
            return it('should forward arguments to enter states', function() {
              return expect(this.machine.D_enter.calledWith('foo', 2)).to.be.ok;
            });
          });
          return describe('and is non-explicit', function() {
            it('should not forward arguments to exit states', function() {
              return expect(this.machine.A_exit.calledWith('foo', 2)).not.to.be.ok;
            });
            return it('should not forward arguments to enter states', function() {
              return expect(this.machine.B_enter.calledWith('foo', 2)).not.to.be.ok;
            });
          });
        });
      });
      describe('and delayed', function() {
        beforeEach(function() {
          return this.ret = this.machine.setStateLater('D');
        });
        it('should return a promise', function() {
          return expect(this.ret instanceof Promise).to.be.ok;
        });
        it('should execute the change', function(done) {
          var _this = this;
          this.ret.resolve();
          return this.ret.then(function() {
            expect(_this.machine.any_D.calledOnce).to.be.ok;
            expect(_this.machine.D_enter.calledOnce).to.be.ok;
            return done();
          });
        });
        it('should expose a ref to the last promise', function() {
          return expect(this.machine.last_promise).to.equal(this.ret);
        });
        return describe('and then canceled', function() {
          beforeEach(function() {
            return this.ret.reject();
          });
          return it('should not execute the change', function() {
            expect(this.machine.any_D.called).not.to.be.ok;
            return expect(this.machine.D_enter.called).not.to.be.ok;
          });
        });
      });
      describe('and active state is also the target one', function() {
        it('should trigger self transition at the very beggining', function() {
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
          this.machine.on('setState', this.setState = sinon.spy());
          this.machine.on('cancelTransition', this.cancelTransition = sinon.spy());
          this.machine.on('pushState', this.pushState = sinon.spy());
          return this.machine.setState(['A', 'B']);
        });
        afterEach(function() {
          delete this.C_exit;
          delete this.A_A;
          delete this.B_enter;
          delete this.pushState;
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
        it('for pushing a new state', function() {
          return expect(this.pushState.called).to.be.ok;
        });
        return it('for cancelling the transition', function() {
          return expect(this.cancelTransition.called).to.be.ok;
        });
      });
    });
    return describe('Events', function() {
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
        return it('by triggering the listener at once for active states', function() {
          var l1;
          l1 = sinon.stub();
          this.machine.on('A', l1);
          return expect(l1.calledOnce).to.be.ok;
        });
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
          return expect(emitter.state()).to.eql(['A', 'C']);
        });
        it('should invert a specific state as a different one', function() {
          var emitter;
          emitter = new EventMachine('A');
          this.machine.pipeInvert('A', emitter, 'C');
          this.machine.setState('B');
          return expect(emitter.state()).to.eql(['A', 'C']);
        });
        it('should forward a whole machine', function() {
          var machine2;
          machine2 = new EventMachine(['A', 'D']);
          expect(machine2.state()).to.eql(['A', 'D']);
          this.machine.pipeForward(machine2);
          this.machine.setState(['B', 'C']);
          return expect(machine2.state()).to.eql(['D', 'B', 'C']);
        });
        return it('can be turned off');
      });
    });
  });
}).call(this);
    }
  };
});
multistatemachineTest.pkg(3, function(parents){
  return {
    'id':5,
    'name':'rsvp',
    'main':undefined,
    'mainModuleId':'rsvp',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(5, function(/* parent */){
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
multistatemachineTest.pkg(1, function(parents){
  return {
    'id':7,
    'name':'sinon',
    'main':undefined,
    'mainModuleId':'lib/sinon',
    'modules':[],
    'parents':parents
  };
});
multistatemachineTest.module(7, function(/* parent */){
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
        return !!(obj && obj.constructor && obj.call && obj.apply);
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
multistatemachineTest.module(7, function(/* parent */){
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
        return !!(obj && obj.constructor && obj.call && obj.apply);
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
multistatemachineTest.module(7, function(/* parent */){
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
  module.exports = multistatemachineTest;
  if( !module.parent ){
    multistatemachineTest.main();
  }
}multistatemachineTest.main()