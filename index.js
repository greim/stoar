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

_.extend(Store.prototype, {

  set: function(prop, newVal){
    var oldVal = this._data[prop];
    var isDifferent = oldVal !== newVal;
    this._data[prop] = newVal;
    this._emitter.emit('change', prop, newVal, oldVal);
  },

  get: function(prop){
    return this._data[prop];
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
    var changeEv = 'change:' + prop;
    var func = self._ctx[changeEv];
    var retVal;
    if (typeof func === 'function'){
      retVal = func.call(self._ctx, val, old);
    }
    if (retVal === undefined || retVal){
      self.emit(changeEv, val, old);
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

/*

var myStore = new Store({
  init: function(){},
  data: {
    foo: null,
    bar: null,
    baz: null
  }
});

var myStoreDispatcher = myStore.dispatcher({
  init: function(){},
  commands: {
    // implicit
    // 'change:foo': ...
    // 'change:bar': ...

    // explicit but no-op
    'change:baz': 'changeBaz'

    // something more customized
    'doFunkyThing': 'funky'
  },
  changeBaz: function(value){
    this.store.set('baz', value);
  },
  funky: function(whatever){
    // do stuff
  }
});

var myStoreEmitter = myStore.emitter({
  init: function(){},
  events: {
    'change:baz': 'bazChange'
  },
  bazChange: function(){
    this.emit('zup');
  }
});

myStoreDispatcher.command('change:baz', blah);
myStoreDispatcher.command('doFunkyThing', {});
myStoreEmitter.on('zup', function(){...});

*/
