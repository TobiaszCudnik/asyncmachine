!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.asyncmachine=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __extends=this.__extends||function(t,e){function n(){this.constructor=t}for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r]);n.prototype=e.prototype,t.prototype=new n},__indexOf=[].indexOf||function(t){for(var e=0,n=this.length;n>e;e++)if(e in this&&this[e]===t)return e;return-1},eventemitter=require("eventemitter3-abortable"),promise=require("es6-promise");exports.STATE_CHANGE={DROP:0,ADD:1,SET:2},exports.STATE_CHANGE_LABELS={0:"Drop",1:"Add",2:"Set"},exports.QUEUE={STATE_CHANGE:0,STATES:1,PARAMS:2,TARGET:3};var Deferred=function(){function t(){var t=this;this.promise=null,this.resolve=null,this.reject=null,this.promise=new promise.Promise(function(e,n){t.resolve=e,t.reject=n})}return t}();exports.Deferred=Deferred;var AsyncMachine=function(t){function e(e,n){void 0===e&&(e=null),void 0===n&&(n=!1),t.call(this),this.states_all=null,this.states_active=null,this.queue=null,this.lock=!1,this.last_promise=null,this.debug_prefix="",this.debug_level=1,this.clock_={},this.internal_fields=[],this.target=null,this.transition_events=[],this.debug_=!1,this.Exception={},this.queue=[],this.states_all=[],this.states_active=[],this.clock_={},this.setTarget(e||this),n?this.registerAll():this.register("Exception"),this.internal_fields=["_events","states_all","states_active","queue","lock","last_promise","debug_prefix","debug_level","clock_","debug_","target","internal_fields"]}return __extends(e,t),e.factory=function(t){null==t&&(t=[]);var n=new e;return t.forEach(function(t){return n[t]={},n.register(t)}),n},e.prototype.Exception_state=function(t,e,n,r){return console.log("EXCEPTION from AsyncMachine"),null!=(null!=n?n.length:void 0)&&this.log('Exception "'+e+'" when setting the following states:\n    '+n.join(", ")),null!=(null!=r?r.length:void 0)&&this.log("Next states were supposed to be (add/drop/set):\n    "+n.join(", ")),console.dir(e),this.setImmediate(function(){throw e})},e.prototype.setTarget=function(t){return this.target=t},e.prototype.registerAll=function(){var t,n="",r=null;for(n in this)r=this[n],this.hasOwnProperty(n)&&__indexOf.call(this.internal_fields,n)<0&&this.register(n);var i=this.getInstance().constructor.prototype;for(t=[];;){for(n in i)r=i[n],i.hasOwnProperty(n)&&__indexOf.call(this.internal_fields,n)<0&&this.register(n);if(i=Object.getPrototypeOf(i),i===e.prototype)break;t.push(void 0)}return t},e.prototype.is=function(t,e){if(!t)return[].concat(this.states_active);var n=Boolean(~this.states_active.indexOf(t));return n?void 0===e?!0:this.clock(t)===e:!1},e.prototype.any=function(){for(var t=this,e=[],n=0;n<arguments.length;n++)e[n-0]=arguments[n];return e.some(function(e){return Array.isArray(e)?t.every(e):t.is(e)})},e.prototype.every=function(){for(var t=this,e=[],n=0;n<arguments.length;n++)e[n-0]=arguments[n];return e.every(function(e){return!!~t.states_active.indexOf(e)})},e.prototype.futureQueue=function(){return this.queue},e.prototype.register=function(){for(var t=this,e=[],n=0;n<arguments.length;n++)e[n-0]=arguments[n];return e.map(function(e){return t.states_all.push(e),t.clock_[e]=0})},e.prototype.get=function(t){return this[t]},e.prototype.set=function(t,n){for(var r=[],i=2;i<arguments.length;i++)r[i-2]=arguments[i];return t instanceof e?this.duringTransition()?(this.log("Queued SET state(s) "+n+" for an external machine",2),this.queue.push([exports.STATE_CHANGE.SET,n,r,t]),!0):t.add(n,r):(n&&(r=[n].concat(r)),n=t,this.processStateChange_(exports.STATE_CHANGE.SET,n,r))},e.prototype.setByCallback=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createCallback(this.createDeferred(this.set.bind(this),t,e,n))},e.prototype.setByListener=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createListener(this.createDeferred(this.set.bind(this),t,e,n))},e.prototype.setNext=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i=this.set.bind(this);return this.setImmediate(i,t,e,n)},e.prototype.add=function(t,n){for(var r=[],i=2;i<arguments.length;i++)r[i-2]=arguments[i];return t instanceof e?this.duringTransition()?(this.log("Queued ADD state(s) "+n+" for an external machine",2),this.queue.push([exports.STATE_CHANGE.ADD,n,r,t]),!0):t.add(n,r):(n&&(r=[n].concat(r)),n=t,this.processStateChange_(exports.STATE_CHANGE.ADD,n,r))},e.prototype.addByCallback=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createCallback(this.createDeferred(this.add.bind(this),t,e,n))},e.prototype.addByListener=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createListener(this.createDeferred(this.add.bind(this),t,e,n))},e.prototype.addNext=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i=this.add.bind(this);return this.setImmediate(i,t,e,n)},e.prototype.drop=function(t,n){for(var r=[],i=2;i<arguments.length;i++)r[i-2]=arguments[i];return t instanceof e?this.duringTransition()?(this.log("Queued DROP state(s) "+n+" for an external machine",2),this.queue.push([exports.STATE_CHANGE.DROP,n,r,t]),!0):t.drop(n,r):(n&&(r=[n].concat(r)),n=t,this.processStateChange_(exports.STATE_CHANGE.DROP,n,r))},e.prototype.dropByCallback=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createCallback(this.createDeferred(this.drop.bind(this),t,e,n))},e.prototype.dropByListener=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];return this.createListener(this.createDeferred(this.drop.bind(this),t,e,n))},e.prototype.dropNext=function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i=this.drop.bind(this);return this.setImmediate(i,t,e,n)},e.prototype.pipe=function(t,e,n,r){var i={state:"add",end:"drop"};return this.pipeBind(t,e,n,r,i)},e.prototype.pipeInverted=function(t,e,n,r){var i={state:"drop",end:"add"};return this.pipeBind(t,e,n,r,i)},e.prototype.pipeNegotiation=function(t,e,n,r){var i={enter:"add",exit:"drop"};return this.pipeBind(t,e,n,r,i)},e.prototype.pipeNegotiationInverted=function(t,e,n,r){var i={enter:"drop",exit:"add"};return this.pipeBind(t,e,n,r,i)},e.prototype.pipeOff=function(){throw new Error("not implemented yet")},e.prototype.clock=function(t){return this.clock_[t]},e.prototype.createChild=function(){var t=Object.create(this);return t.clock={},this.states_all.forEach(function(e){return t.clock[e]=0}),t},e.prototype.duringTransition=function(){return this.lock},e.prototype.getAbort=function(t,e){var n=this.clock(t);return this.getAbortFunction(t,n,e)},e.prototype.getAbortEnter=function(t,e){var n=this.clock(t);return n++,this.getAbortFunction(t,n,e)},e.prototype.when=function(t,e){var n=this;return t=[].concat(t),new promise.Promise(function(r){return n.bindToStates(t,r,e)})},e.prototype.whenOnce=function(t,e){var n=this;return t=[].concat(t),new promise.Promise(function(r){return n.bindToStates(t,r,e,!0)})},e.prototype.debug=function(t,e){return void 0===t&&(t=""),void 0===e&&(e=1),this.debug_=!0,this.debug_prefix=t,this.debug_level=e,null},e.prototype.debugOff=function(){return this.debug_=!1,null},e.prototype.log=function(t,e){return null==e&&(e=1),!this.debug_||e>this.debug_level?void 0:console.log(this.debug_prefix+t)},e.prototype.on=function(e,n,r){return"_state"===e.slice(-6)&&this.is(e.slice(0,-6))&&this.catchPromise(n.call(r)),t.prototype.on.call(this,e,n,r),this},e.prototype.once=function(e,n,r){return"_state"===e.slice(-6)&&this.is(e.slice(0,-6))?this.catchPromise(n.call(r)):t.prototype.once.call(this,e,n,r),this},e.prototype.catchPromise=function(t,e){var n=this;return(null!=t?t.then:void 0)&&(null!=t?t["catch"]:void 0)&&t["catch"](function(t){return n.add("Exception",t,e)}),t},e.prototype.pipeBind=function(t,n,r,i,o){var s=this;return t instanceof e?(null==r&&(r=!0),this.pipeBind(this.states_all,t,n,r,o)):(null==i&&(i=!0),this.log("Piping state "+t,3),[].concat(t).forEach(function(t){var e=r||t;return Object.keys(o).forEach(function(r){var a=o[r];return s.on(t+"_"+r,function(){return i?s[a](n,e):n[a](e)})})}))},e.prototype.callListener=function(t,e,n){var r=t.apply(e,n);return this.catchPromise(r,n[0])},e.prototype.getInstance=function(){return this},e.prototype.setImmediate=function(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];return setImmediate?setImmediate.apply(null,[t].concat(e)):setTimeout(t.apply(null,e),0)},e.prototype.processAutoStates=function(t){var e=this,n=[];return this.states_all.forEach(function(t){var r=function(){return e.is(t)},i=function(){return e.is().some(function(n){return e.get(n).blocks?Boolean(~e.get(n).blocks.indexOf(t)):!1})};return!e[t].auto||r()||i()?void 0:n.push(t)}),this.processStateChange_(exports.STATE_CHANGE.ADD,n,[],!0,t)},e.prototype.hasStateChanged=function(t){var e=this.is().length===t.length;return!e||this.diffStates(t,this.is()).length},e.prototype.processStateChange_=function(t,e,n,r,i){var o=this;if(e=[].concat(e),e=e.filter(function(t){if("string"!=typeof t||!o.get(t))throw new Error("Non existing state: "+t);return!0}),e.length){try{var s=exports.STATE_CHANGE_LABELS[t].toLowerCase();if(this.lock)return this.log("Queued "+s+" state(s) "+e.join(", "),2),void this.queue.push([t,e,n]);this.lock=!0;var a=this.queue;this.queue=[];var u=this.is();r?this.log("["+s+"] AUTO state "+e.join(", "),3):this.log("["+s+"] state "+e.join(", "),2);var c=this.selfTransitionExec_(e,n);if(c!==!1){var h=function(){switch(t){case exports.STATE_CHANGE.DROP:return this.states_active.filter(function(t){return!~e.indexOf(t)});case exports.STATE_CHANGE.ADD:return e.concat(this.states_active);case exports.STATE_CHANGE.SET:return e}}.call(this);if(h=this.setupTargetStates_(h),t!==exports.STATE_CHANGE.DROP&&!r){var l=e.every(function(t){return~h.indexOf(t)});l||(this.log("Cancelled the transition, as not all target states were accepted",3),c=!1)}}c!==!1&&(c=this.transition_(h,e,n)),this.queue=c===!1?a:a.concat(this.queue),this.lock=!1}catch(p){var f=p;return this.queue=a,this.lock=!1,void this.add("Exception",f,e)}return c===!1?this.emit("cancelled"):this.hasStateChanged(u)&&!r&&this.processAutoStates(i),i||this.duringTransition()||this.processQueue_(),t===exports.STATE_CHANGE.DROP?this.allStatesNotSet(e):this.allStatesSet(e)}},e.prototype.processQueue_=function(){for(var t=[],e=void 0;e=this.queue.shift();){var n=e[exports.QUEUE.TARGET]||this,r=[e[exports.QUEUE.STATE_CHANGE],e[exports.QUEUE.STATES],e[exports.QUEUE.PARAMS],!1,n===this];t.push(n.processStateChange_.apply(n,r))}return!~t.indexOf(!1)},e.prototype.allStatesSet=function(t){var e=this;return t.every(function(t){return e.is(t)})},e.prototype.allStatesNotSet=function(t){var e=this;return t.every(function(t){return!e.is(t)})},e.prototype.createDeferred=function(t,n,r,i){var o=this,s=this.is(),a=[n];r&&a.push(r),i.length&&a.push.apply(a,i);var u=new Deferred;return u.promise.then(function(e){return t.apply(null,a.concat(e))})["catch"](function(t){var n=[].concat(a[0]instanceof e?a[1]:a[0]);return o.add("Exception",t,s,n)}),this.last_promise=u.promise,u},e.prototype.createCallback=function(t){return function(e){void 0===e&&(e=null);for(var n=[],r=1;r<arguments.length;r++)n[r-1]=arguments[r];return e?t.reject(e):t.resolve(n)}},e.prototype.createListener=function(t){return function(){for(var e=[],n=0;n<arguments.length;n++)e[n-0]=arguments[n];return t.resolve(e)}},e.prototype.selfTransitionExec_=function(t,e){var n=this;null==e&&(e=[]);var r=t.some(function(i){r=void 0;var o=i+"_"+i;if(~n.states_active.indexOf(i)){var s=[t].concat(e),a=n.getMethodContext(o);return a?(n.log("[transition] "+o,2),r=a[o].apply(a,s),n.catchPromise(r,t)):n.log("[transition] "+o,3),r===!1?(n.log("Self transition for "+i+" cancelled",2),!0):(r=n.emit.apply(n,[o].concat(s)),r!==!1&&n.transition_events.push([o,s]),r===!1)}});return!r},e.prototype.setupTargetStates_=function(t,e){var n=this;null==e&&(e=[]),t=t.filter(function(t){var e=~n.states_all.indexOf(t);return e||n.log("State "+t+" doesn't exist",2),Boolean(e)}),t=this.parseImplies_(t),t=this.removeDuplicateStates_(t);var r=[];return t=this.parseRequires_(t),t=t.reverse().filter(function(i){var o=n.isStateBlocked_(t,i);return o=o.filter(function(t){return!~r.indexOf(t)}),o.length&&(r.push(i),n.is(i)?n.log("State "+i+" dropped by "+o.join(", "),2):n.log("State "+i+" ignored because of "+o.join(", "),3)),!o.length&&!~e.indexOf(i)}),this.parseRequires_(t.reverse())},e.prototype.parseImplies_=function(t){var e=this;return t.forEach(function(n){var r=e.get(n);if(r.implies)return t=t.concat(r.implies)}),t},e.prototype.parseRequires_=function(t){for(var e=this,n=0,r={};n!==t.length;)n=t.length,t=t.filter(function(n){var i=e.get(n),o=[];return!(null!=i.requires?i.requires.forEach(function(e){var n=~t.indexOf(e);return n?void 0:o.push(e)}):void 0),o.length&&(r[n]=o),!o.length});if(Object.keys(r).length){var i="",o=[],s=function(){var t;t=[];for(i in r)o=r[i],t.push(i+"(-"+o.join(" -")+")");return t}();this.log("Can't set the following states "+s.join(", "),2)}return t},e.prototype.removeDuplicateStates_=function(t){var e=[];return t.forEach(function(t){return~e.indexOf(t)?void 0:e.push(t)}),e},e.prototype.isStateBlocked_=function(t,e){var n=this,r=[];return t.forEach(function(t){var i=n.get(t);return i.blocks&&~i.blocks.indexOf(e)?r.push(t):void 0}),r},e.prototype.transition_=function(t,e,n){var r=this;null==n&&(n=[]),this.transition_events=[];var i=this.states_active.filter(function(e){return!~t.indexOf(e)});this.orderStates_(t),this.orderStates_(i);var o=i.some(function(i){return!1===r.transitionExit_(i,t,e,n)});return o===!0?!1:(o=t.some(function(i){if(~r.states_active.indexOf(i))return!1;if(~e.indexOf(i))var s=n;else s=[];return o=r.transitionEnter_(i,t,s),o===!1}),o===!0?!1:(this.setActiveStates_(t),!0))},e.prototype.setActiveStates_=function(t){var e=this,n=this.states_active,r=this.diffStates(t,this.states_active),i=this.diffStates(this.states_active,t),o=this.diffStates(t,r);this.states_active=t,t.forEach(function(t){return~n.indexOf(t)?void 0:e.clock_[t]++});var s=[];return r.length&&s.push("+"+r.join(" +")),i.length&&s.push("-"+i.join(" -")),o.length&&this.debug_level>2&&((r.length||i.length)&&s.push("\n    "),s.push(o.join(", "))),s.length&&this.log("[states] "+s.join(" "),1),this.processPostTransition(),this.emit("change",n)},e.prototype.processPostTransition=function(){var t,e=this;return this.transition_events.forEach(function(n){var r=n[0],i=n[1];if("_exit"===r.slice(-5))var o=r.slice(0,-5),s=o+"_end";else"_enter"===r.slice(-6)&&(o=r.slice(0,-6),s=o+"_state");var a=e.getMethodContext(s);if(a){e.log("[transition] "+s,2);try{var u=null!=(t=a[s])?t.apply(a,i):void 0}catch(c){var h=c;throw e.drop(o),h}e.catchPromise(u,e.is())}else e.log("[transition] "+s,3);return e.emit.apply(e,[s].concat(i))}),this.transition_events=[]},e.prototype.getMethodContext=function(t){return this.target[t]?this.target:this[t]?this:void 0},e.prototype.diffStates=function(t,e){return t.filter(function(t){return __indexOf.call(e,t)<0}).map(function(t){return t})},e.prototype.transitionExit_=function(t,e,n,r){var i=this;if(~n.indexOf(t))var o=r;null==o&&(o=[]);var s=this.transitionExec_(t+"_exit",e,o);return s===!1?!1:(s=e.some(function(a){var u=t+"_"+a;return~n.indexOf(a)&&(o=r),null==o&&(o=[]),s=i.transitionExec_(u,e,o),s===!1}),s===!0?!1:(s=this.transitionExec_(t+"_any",e)===!1,!s))},e.prototype.transitionEnter_=function(t,e,n){var r=this.transitionExec_("any_"+t,e,n);return r===!1?!1:this.transitionExec_(t+"_enter",e,n)},e.prototype.transitionExec_=function(t,e,n){var r;null==n&&(n=[]);var i=[e].concat(n),o=void 0,s=this.getMethodContext(t);if(s?(this.log("[transition] "+t,2),o=null!=(r=s[t])&&"function"==typeof r.apply?r.apply(s,i):void 0,this.catchPromise(o,e)):this.log("[transition] "+t,3),o!==!1){var a="_exit"===t.slice(-5),u=!a&&"_enter"===t.slice(-6);(a||u)&&this.transition_events.push([t,i]),o=this.emit.apply(this,[t].concat(i)),o===!1&&this.log("Cancelled transition to "+e.join(", ")+" by the event "+t,2)}else this.log("Cancelled transition to "+e.join(", ")+" by the method "+t,2);return o},e.prototype.orderStates_=function(t){var e=this;return t.sort(function(t,n){var r=e.get(t),i=e.get(n),o=0;return r.depends&&~r.depends.indexOf(n)?o=1:i.depends&&~i.depends.indexOf(t)&&(o=-1),o}),null},e.prototype.bindToStates=function(t,e,n,r){function i(){return s-=1}var o=this,s=0,a=function(){return s+=1,("function"==typeof n?n():void 0)||s!==t.length||e(),r||("function"==typeof n?n():void 0)?t.map(function(t){return o.removeListener(t+"_state",a),o.removeListener(t+"_end",i)}):void 0};return t.map(function(t){return o.log("Binding to event "+t,3),o.on(t+"_state",a),o.on(t+"_end",i)})},e.prototype.getAbortFunction=function(t,e,n){var r=this;return function(){return("function"==typeof n?n():void 0)?!0:r.is(t)?r.is(t,e)?!1:(r.log("Aborted "+t+" listener as the tick changed. Current states:"+("\n    ("+r.is().join(", ")+")"),1),!0):(r.log("Aborted "+t+" listener as the state is not set. "+("Current states:\n    ("+r.is().join(", ")+")"),1),!0)}},e}(eventemitter.EventEmitter);exports.AsyncMachine=AsyncMachine,module.exports.AsyncMachine=AsyncMachine;
},{"es6-promise":2,"eventemitter3-abortable":3}],2:[function(require,module,exports){
(function (process,global){
(function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){return"object"==typeof t&&null!==t}function r(){}function o(){return function(){process.nextTick(c)}}function i(){var t=0,e=new F(c),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function s(){var t=new MessageChannel;return t.port1.onmessage=c,function(){t.port2.postMessage(0)}}function u(){return function(){setTimeout(c,1)}}function c(){for(var t=0;D>t;t+=2){var e=N[t],n=N[t+1];e(n),N[t]=void 0,N[t+1]=void 0}D=0}function a(){}function f(){return new TypeError("You cannot resolve a promise with itself")}function l(){return new TypeError("A promises callback cannot return that same promise.")}function h(t){try{return t.then}catch(e){return z.error=e,z}}function p(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function _(t,e,n){Y(function(t){var r=!1,o=p(n,e,function(n){r||(r=!0,e!==n?m(t,n):w(t,n))},function(e){r||(r=!0,g(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,g(t,o))},t)}function d(t,e){e._state===W?w(t,e._result):t._state===q?g(t,e._result):b(e,void 0,function(e){m(t,e)},function(e){g(t,e)})}function v(t,n){if(n.constructor===t.constructor)d(t,n);else{var r=h(n);r===z?g(t,z.error):void 0===r?w(t,n):e(r)?_(t,n,r):w(t,n)}}function m(e,n){e===n?g(e,f()):t(n)?v(e,n):w(e,n)}function y(t){t._onerror&&t._onerror(t._result),A(t)}function w(t,e){t._state===U&&(t._result=e,t._state=W,0===t._subscribers.length||Y(A,t))}function g(t,e){t._state===U&&(t._state=q,t._result=e,Y(y,t))}function b(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+W]=n,o[i+q]=r,0===i&&t._state&&Y(A,t)}function A(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r,o,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?P(n,r,o,i):o(i);t._subscribers.length=0}}function j(){this.error=null}function E(t,e){try{return t(e)}catch(n){return B.error=n,B}}function P(t,n,r,o){var i,s,u,c,a=e(r);if(a){if(i=E(r,o),i===B?(c=!0,s=i.error,i=null):u=!0,n===i)return void g(n,l())}else i=o,u=!0;n._state!==U||(a&&u?m(n,i):c?g(n,s):t===W?w(n,i):t===q&&g(n,i))}function T(t,e){try{e(function(e){m(t,e)},function(e){g(t,e)})}catch(n){g(t,n)}}function S(t,e,n,r){this._instanceConstructor=t,this.promise=new t(a,r),this._abortOnReject=n,this._validateInput(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._init(),0===this.length?w(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&w(this.promise,this._result))):g(this.promise,this._validationError())}function k(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function M(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function O(t){this._id=V++,this._state=void 0,this._result=void 0,this._subscribers=[],a!==t&&(e(t)||k(),this instanceof O||M(),T(this,t))}var C;C=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var R,x=C,D=(Date.now||function(){return(new Date).getTime()},Object.create||function(t){if(arguments.length>1)throw new Error("Second argument not supported");if("object"!=typeof t)throw new TypeError("Argument must be an object");return r.prototype=t,new r},0),Y=function(t,e){N[D]=t,N[D+1]=e,D+=2,2===D&&R()},I="undefined"!=typeof window?window:{},F=I.MutationObserver||I.WebKitMutationObserver,K="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,N=new Array(1e3);R="undefined"!=typeof process&&"[object process]"==={}.toString.call(process)?o():F?i():K?s():u();var U=void 0,W=1,q=2,z=new j,B=new j;S.prototype._validateInput=function(t){return x(t)},S.prototype._validationError=function(){return new Error("Array Methods must be provided an Array")},S.prototype._init=function(){this._result=new Array(this.length)};var G=S;S.prototype._enumerate=function(){for(var t=this.length,e=this.promise,n=this._input,r=0;e._state===U&&t>r;r++)this._eachEntry(n[r],r)},S.prototype._eachEntry=function(t,e){var r=this._instanceConstructor;n(t)?t.constructor===r&&t._state!==U?(t._onerror=null,this._settledAt(t._state,e,t._result)):this._willSettleAt(r.resolve(t),e):(this._remaining--,this._result[e]=this._makeResult(W,e,t))},S.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===U&&(this._remaining--,this._abortOnReject&&t===q?g(r,n):this._result[e]=this._makeResult(t,e,n)),0===this._remaining&&w(r,this._result)},S.prototype._makeResult=function(t,e,n){return n},S.prototype._willSettleAt=function(t,e){var n=this;b(t,void 0,function(t){n._settledAt(W,e,t)},function(t){n._settledAt(q,e,t)})};var H=function(t,e){return new G(this,t,!0,e).promise},J=function(t,e){function n(t){m(i,t)}function r(t){g(i,t)}var o=this,i=new o(a,e);if(!x(t))return g(i,new TypeError("You must pass an array to race.")),i;for(var s=t.length,u=0;i._state===U&&s>u;u++)b(o.resolve(t[u]),void 0,n,r);return i},L=function(t,e){var n=this;if(t&&"object"==typeof t&&t.constructor===n)return t;var r=new n(a,e);return m(r,t),r},Q=function(t,e){var n=this,r=new n(a,e);return g(r,t),r},V=0,X=O;O.all=H,O.race=J,O.resolve=L,O.reject=Q,O.prototype={constructor:O,then:function(t,e){var n=this,r=n._state;if(r===W&&!t||r===q&&!e)return this;var o=new this.constructor(a),i=n._result;if(r){var s=arguments[r-1];Y(function(){P(r,o,s,i)})}else b(n,o,t,e);return o},"catch":function(t){return this.then(null,t)}};var Z=function(){var t;t="undefined"!=typeof global?global:"undefined"!=typeof window&&window.document?window:self;var n="Promise"in t&&"resolve"in t.Promise&&"reject"in t.Promise&&"all"in t.Promise&&"race"in t.Promise&&function(){var n;return new t.Promise(function(t){n=t}),e(n)}();n||(t.Promise=X)},$={Promise:X,polyfill:Z};"function"==typeof define&&define.amd?define(function(){return $}):"undefined"!=typeof module&&module.exports?module.exports=$:"undefined"!=typeof this&&(this.ES6Promise=$)}).call(this);
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4}],3:[function(require,module,exports){
"use strict";function EE(t,e,n){this.fn=t,this.context=e,this.once=n||!1}function EventEmitter(){}EventEmitter.prototype._events=void 0,EventEmitter.prototype.listeners=function(t){if(!this._events||!this._events[t])return[];if(this._events[t].fn)return[this._events[t].fn];for(var e=0,n=this._events[t].length,s=new Array(n);n>e;e++)s[e]=this._events[t][e].fn;return s},EventEmitter.prototype.emit=function(t){if(!this._events||!this._events[t])return!0;var e,n,s=this._events[t],i=arguments.length;for(n=1,e=new Array(i-1);i>n;n++)e[n-1]=arguments[n];if("function"==typeof s.fn)return s.once&&this.removeListener(t,s.fn,!0),this.callListener(s.fn,s.context,e);var r=s.length;for(s=[].concat(s),n=0;r>n;n++){s[n].once&&this.removeListener(t,s[n].fn,!0);var v=this.callListener(s[n].fn,s[n].context,e);if(v===!1)return!1}return!0},EventEmitter.prototype.callListener=function(t,e,n){return t.apply(e,n)},EventEmitter.prototype.on=function(t,e,n){var s=new EE(e,n||this);return this._events||(this._events={}),this._events[t]?this._events[t].fn?this._events[t]=[this._events[t],s]:this._events[t].push(s):this._events[t]=s,this},EventEmitter.prototype.once=function(t,e,n){var s=new EE(e,n||this,!0);return this._events||(this._events={}),this._events[t]?this._events[t].fn?this._events[t]=[this._events[t],s]:this._events[t].push(s):this._events[t]=s,this},EventEmitter.prototype.removeListener=function(t,e,n){if(!this._events||!this._events[t])return this;var s=this._events[t],i=[];if(e&&(s.fn&&(s.fn!==e||n&&!s.once)&&i.push(s),!s.fn))for(var r=0,v=s.length;v>r;r++)(s[r].fn!==e||n&&!s[r].once)&&i.push(s[r]);return i.length?this._events[t]=1===i.length?i[0]:i:delete this._events[t],this},EventEmitter.prototype.removeAllListeners=function(t){return this._events?(t?delete this._events[t]:this._events={},this):this},EventEmitter.prototype.off=EventEmitter.prototype.removeListener,EventEmitter.prototype.addListener=EventEmitter.prototype.on,EventEmitter.prototype.setMaxListeners=function(){return this},EventEmitter.EventEmitter=EventEmitter,EventEmitter.EventEmitter2=EventEmitter,EventEmitter.EventEmitter3=EventEmitter,module.exports={EventEmitter:EventEmitter};
},{}],4:[function(require,module,exports){
function drainQueue(){if(!draining){draining=!0;for(var e,o=queue.length;o;){e=queue,queue=[];for(var r=-1;++r<o;)e[r]();o=queue.length}draining=!1}}function noop(){}var process=module.exports={},queue=[],draining=!1;process.nextTick=function(e){queue.push(e),draining||setTimeout(drainQueue,0)},process.title="browser",process.browser=!0,process.env={},process.argv=[],process.version="",process.on=noop,process.addListener=noop,process.once=noop,process.off=noop,process.removeListener=noop,process.removeAllListeners=noop,process.emit=noop,process.binding=function(){throw new Error("process.binding is not supported")},process.cwd=function(){return"/"},process.chdir=function(){throw new Error("process.chdir is not supported")},process.umask=function(){return 0};
},{}]},{},[1])(1)
});