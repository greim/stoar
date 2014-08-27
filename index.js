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
    if (isDifferent){
      this._data[prop] = newVal;
      this._emitter.emit('change', prop, newVal, oldVal);
    }
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
  if (!args.hasOwnProperty('commands')){
    args.commands = {};
  }
  _.extend(this, args);
  this.store = store;
  if (typeof this.init === 'function'){
    this.init.call(this);
  }
  this._directCommands = {};
  _.each(this.store._data, function(value, prop){
    this._directCommands['change:'+prop] = prop;
  }, this);
  _.each(this.commands, function(methods, command){
    if (!Array.isArray(methods)){
      methods = this.commands[command] = [methods];
    }
    _.each(methods, function(method){
      if (typeof this[method] !== 'function'){
        throw new Error(util.format('%s is not a function', method));
      }
    }, this);
  }, this);
}

_.extend(Dispatcher.prototype, {
  command: function(command, firstArg){
    if (!this.commands.hasOwnProperty(command)){
      if (this._directCommands.hasOwnProperty(command)){
        var prop = this._directCommands[command];
        this.store.set(prop, firstArg);
      } else {
        throw new Error(util.format('%s is not a command', command));
      }
    } else {
      var methods = this.commands[command];
      var args = Array.prototype.slice.call(arguments);
      args.shift();
      methods.forEach(function(name){
        this[name].apply(this, args);
      }, this);
    }
  }
});

// ======================================================
// EMITTER

function Emitter(store, args){
  EventEmitter.call(this);
  if (!args.hasOwnProperty('events')){
    args.events = {};
  }
  _.extend(this, args);
  this.store = store;
  if (typeof this.init === 'function'){
    this.init.call(this);
  }
  _.each(this.events, function(methods, event){
    if (!Array.isArray(methods)){
      methods = this.events[event] = [methods];
    }
    _.each(methods, function(method){
      var methodFunc = this[method];
      if (typeof methodFunc !== 'function'){
        throw new Error(util.format('%s is not a function', method));
      } else {
        this.on(event, methodFunc);
      }
    }, this);
  }, this);
  var self = this;
  this.store._emitter.on('change', function(eventName, newValue, oldValue){
    self.emit('change:'+eventName, newValue, oldValue);
  });
}

util.inherits(Emitter, EventEmitter);

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
