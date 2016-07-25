/**
 * Representation of a single EventEmitter function.
 */
class EE {
  constructor(
    public fn: Function, 
    public context: Object, 
    public once: Boolean = false) {
      // empty
  }
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 */
export default class EventEmitter {
  private _events: {
    [index: string]: EE[] | EE
  };
  
  /**
   * Return a list of assigned event listeners.
   */
  listeners(event: string): Function[] {
    if (!this._events || !this._events[event])
      return [];
    
    let listeners = this._events[event]
    if (listeners instanceof EE) 
      return [listeners.fn];
    else {
      for (var i = 0, l = listeners.length, ee = new Array(l); i < l; i++) {
        ee[i] = listeners[i].fn;
      }

      return ee;
    }
  }
  
  /**
   * Emit an event to all registered event listeners.
   */
  emit(event: string, ...args: any[]): boolean {
    if (!this._events || !this._events[event])
      return true;

    let listeners = this._events[event]
    if (listeners instanceof EE) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, true);

      return this.callListener(listeners.fn, listeners.context, args)
    } else {
      for (let listener of listeners) {
        if (listener.once)
          this.removeListener(event, listener.fn, true);

        if (false === this.callListener(listener.fn, listener.context, args))
          return false
      }
    }

    return true;
  }
  
  /**
   * Callback executor for overridding.
   */
  protected callListener(listener: Function, context: Object, params: any[]) {
    return listener.apply(context, params)
  }
  
  
  /**
   * Remove event listeners.
   */
  removeListener(event: string, fn: Function, once: boolean = false): this {
    if (!this._events || !this._events[event]) return this;

    var listeners = this._events[event]
        , events = [];

    if (fn) {
      if (listeners instanceof EE) {
        if (listeners.fn !== fn || (once && !listeners.once))
          events.push(listeners);
      } else {
        for (var i = 0, length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
            events.push(listeners[i]);
          }
        }
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) {
      this._events[event] = events.length === 1 ? events[0] : events;
    } else {
      delete this._events[event];
    }

    return this;
  }
  
  /**
   * Register a new EventListener for the given event.
   */
  on(event: string, fn: Function, context?: Object): this {
    var listener = new EE(fn, context || this);

    if (!this._events)
      this._events = {};
    if (!this._events[event])
      this._events[event] = listener;
    else {
      let listeners = this._events[event] 
      if (listeners instanceof Array)
        listeners.push(listener);
      else {
        this._events[event] = [
          listeners, listener
        ]
      }
    }

    return this;
  }
  
  /**
   * Add an EventListener that's only called once.
   */
  once(event: string, fn: Function, context?: Object): this {
    var listener = new EE(fn, context || this, true);

    if (!this._events)
      this._events = {};
    if (!this._events[event])
      this._events[event] = listener;
    else {
      let listeners = this._events[event]
      if (listeners instanceof Array)
        listeners.push(listener);
      else
        this._events[event] = [
          listeners, listener
        ];
    }

    return this;
  }
  
    
  /**
   * Remove all listeners or only the listeners for the specified event.
   */
  removeAllListeners(event: string): this {
    if (!this._events) return this;

    if (event) delete this._events[event];
    else this._events = {};

    return this;
  }
  
// class end
}

// TODO aliases
// //
// // Alias methods names because people roll like that.
// //
// EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
// EventEmitter.prototype.addListener = EventEmitter.prototype.on;

// //
// // This function doesn't apply anymore.
// //
// EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
//   return this;
// };

// //
// // Expose the module.
// //
// EventEmitter.EventEmitter = EventEmitter;
// EventEmitter.EventEmitter2 = EventEmitter;
// EventEmitter.EventEmitter3 = EventEmitter;

// //
// // Expose the module.
// //
// module.exports = {EventEmitter: EventEmitter};
