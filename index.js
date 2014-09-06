var _ = require('lodash')
  ,EventEmitter = require('events').EventEmitter
  ,util = require('util')
  ,itemFuncs = require('./lib/item-functions')
  ,mapFuncs = require('./lib/map-functions')
  ,listFuncs = require('./lib/list-functions')
  ,funcNames = _.keys(_.extend({}, itemFuncs, mapFuncs, listFuncs))
  ,funcsByType = {item:itemFuncs,map:mapFuncs,list:listFuncs}

// ======================================================

var isImmutable = (function(){
  var immuts = {
    'string': 1,
    'number': 1,
    'function': 1,
    'boolean': 1,
    'undefined': 1
  }
  return function(val){
    if (val === null){
      return true
    }
    return immuts.hasOwnProperty(typeof val)
  }
})()

var makeDef = (function(){
  var validTypes = {item:1,map:1,list:1}
  return function(prop, def){
    def = _.extend({
      type: 'item', // 'item', 'map', 'list'
      validate: function(){}
    }, def)
    if (!def.hasOwnProperty('value')){
      def.value = getDefault(def.type)
    }
    if (!validTypes.hasOwnProperty(def.type)){
      throw new Error(util.format('invalid type: %s', def.type))
    }
    def.prop = prop
    if (def.type === 'item'){
      def.validate(def.value)
    } else {
      _.each(def.value, function(val){
        def.validate(val)
      })
    }
    return def
  }
})()

function getDefault(type){
  if (type === 'item'){
    return undefined
  } else if (type === 'map'){
    return {}
  } else if (type === 'list'){
    return []
  }
}

// ======================================================

function Store(args){
  EventEmitter.call(this)
  var defs = this._defs = {}
  _.each(args.data, function(val, prop){
    defs[prop] = makeDef(prop, {value:val})
  })
  _.each(args.defs, function(def, prop){
    defs[prop] = makeDef(prop, def)
  })
  _.each(_.keys(defs), function(prop){
    var def = defs[prop]
    if (def.loadable){
      _.each([
        prop+':loading',
        prop+':status',
        prop+':timestamp'
      ], function(extraProp){
        defs[extraProp] = makeDef(extraProp, {type:def.type})
      })
    }
  })
}

util.inherits(Store, EventEmitter);

_.extend(Store.prototype, {

  _change: function(def, change){
    var same = change.oldVal === change.newVal
      ,isMut = !isImmutable(change.newVal)
      ,allowMut = def.allowMutableValues
    if (same && isMut && !allowMut){
      throw new Error('cannot set a mutable value to itself')
    }
    if (!same || (isMut && allowMut)){
      this.emit('propChange', def.prop, change)
      this.emit('change', def.prop, change.newVal, change.oldVal)
    }
  },

  dispatcher: function(args){
    return new Dispatcher(this, args)
  },

  emitter: function(args){
    return new Emitter(this, args)
  }
})

_.each(funcNames, function(funcName){
  Store.prototype[funcName] = function(prop){
    if (!this._defs.hasOwnProperty(prop)){
      throw new Error(util.format('no property in store: %s', prop))
    }
    var def = this._defs[prop]
      ,type = def.type
      ,funcs = funcsByType[type]
    if (!funcs){
      throw new Error(util.format('no such method for %s types', type))
    } else {
      var args = Array.prototype.slice.call(arguments)
      args[0] = def
      return funcs[funcName].apply(this, args)
    }
  }
})

// ======================================================
// DISPATCHER

function Dispatcher(store, args){
  this._ctx = _.extend({}, args);
  this._ctx.store = store;
  this._defaultCommands = {};
  _.each(store._defs, function(def, prop){
    this._defaultCommands['change:'+prop] = prop;
  }, this);
}

_.extend(Dispatcher.prototype, {
  command: function(){
    var args = Array.prototype.slice.call(arguments)
      ,command = args.shift()
      ,defaultProp = this._defaultCommands[command]
      ,customCommand = this._ctx[command]
      ,retVal
    if (!customCommand && !defaultProp){
      throw new Error(util.format('%s is not a command', command));
    }
    if (customCommand){
      retVal = customCommand.apply(this._ctx, args);
    }
    if (defaultProp && (retVal === undefined || retVal)){
      args.unshift(defaultProp)
      this._ctx.store.set.apply(this._ctx.store, args);
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
  store.on('change', function(prop, val, old){
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
