var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

// ======================================================
// MAIN

function Store(args){
  if (!args.data){
    throw new Error('missing data');
  }
  this._data = _.extend({}, args.data);
  if (typeof args.init === 'function'){
    args.init.call(this);
  }
  this._emitter = new EventEmitter();
}

var immutableTypes = {
  'boolean':true,
  'string':true,
  'number':true,
  'function':true,
  'undefined': true
};

_.extend(Store.prototype, {

  set: function(prop, newVal){
    var oldVal = this._data[prop];
    var isImmut = newVal === null || immutableTypes.hasOwnProperty(typeof newVal);
    var shouldChange = !isImmut || oldVal !== newVal;
    if (shouldChange){
      this._data[prop] = newVal;
      this._emitter.emit('change', prop, newVal, oldVal);
    }
  },

  get: function(prop){
    return this._data[prop];
  },

  clone: function(prop){
    var val = this._data[prop];
    if (!immutableTypes.hasOwnProperty(typeof val) || val === null){
      return _.cloneDeep(val);
    } else {
      return val;
    }
  },

  dispatcher: function(args){
    return new Dispatcher(this, args);
  },

  emitter: function(args){
    return new Emitter(this, args);
  }
});

// ======================================================
// DISPATCHER

function Dispatcher(store, args){
  this._ctx = _.extend({}, args);
  this._ctx.store = store;
  if (typeof this._ctx.init === 'function'){
    this._ctx.init.call(this._ctx);
  }
  this._defaultCommands = {};
  _.each(store._data, function(value, prop){
    this._defaultCommands['change:'+prop] = prop;
  }, this);
}

_.extend(Dispatcher.prototype, {
  command: function(command, firstArg){
    var hasDefault = this._defaultCommands.hasOwnProperty(command);
    var retVal;
    if (!this._ctx.hasOwnProperty(command)){
      if (!hasDefault){
        throw new Error(util.format('%s is not a command', command));
      }
    } else {
      var args = Array.prototype.slice.call(arguments);
      args.shift();
      retVal = this._ctx[command].apply(this._ctx, args);
    }
    if (hasDefault && (retVal === undefined || retVal)){
      var prop = this._defaultCommands[command];
      this._ctx.store.set(prop, firstArg);
    }
  }
});

// ======================================================
// EMITTER

function EmitterContext(store, args){
  _.extend(this, args);
  this.store = store;
}

function Emitter(store, args){
  var self = this;
  EventEmitter.call(this);
  this._ctx = new EmitterContext(store, args);
  this._ctx._emitter = this;
  if (typeof this._ctx.init === 'function'){
    this._ctx.init.call(this._ctx);
  }
  store._emitter.on('change', function(prop, val, old){
    var events = ['change','change:' + prop];
    for (var i=0; i<events.length; i++){
      var changeEv = events[i];
      var isJustChange = changeEv === 'change';
      var func = self._ctx[changeEv];
      var retVal;
      if (typeof func === 'function'){
        retVal = isJustChange
          ? func.call(self._ctx, prop, val, old)
          : func.call(self._ctx, val, old)
      }
      if (retVal === undefined || retVal){
        isJustChange
          ? self.emit(changeEv, prop, val, old)
          : self.emit(changeEv, val, old)
      } else {
        break;
      }
    }
  });
}

util.inherits(Emitter, EventEmitter);

_.extend(EmitterContext.prototype, {
  emit: function(){
    return this._emitter.emit.apply(this._emitter, arguments);
  }
});

// ======================================================
// DONE

module.exports = Store;
