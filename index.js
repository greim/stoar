var _ = require('lodash')
  ,EventEmitter = require('events').EventEmitter
  ,util = require('util')
  ,itemFuncs = require('./lib/item-functions')
  ,mapFuncs = require('./lib/map-functions')
  ,listFuncs = require('./lib/list-functions')
  ,accFuncNames = _.keys(_.extend({}, itemFuncs.accessors, mapFuncs.accessors, listFuncs.accessors))
  ,mutFuncNames = _.keys(_.extend({}, itemFuncs.mutators, mapFuncs.mutators, listFuncs.mutators))
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

function Stoar(args){
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

util.inherits(Stoar, EventEmitter);

_.extend(Stoar.prototype, {

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
    return new OldDispatcher(this, args)
  },

  emitter: function(args){
    return new Emitter(this, args)
  }
})

_.each(accFuncNames, function(funcName){
  Stoar.prototype[funcName] = function(prop){
    if (!this._defs.hasOwnProperty(prop)){
      throw new Error(util.format('no property in store: %s', prop))
    }
    var def = this._defs[prop]
      ,type = def.type
      ,funcs = funcsByType[type].accessors
    if (!funcs){
      throw new Error(util.format('no such method for %s types', type))
    } else {
      var args = Array.prototype.slice.call(arguments)
      args[0] = def
      return funcs[funcName].apply(this, args)
    }
  }
})

_.each(mutFuncNames, function(funcName){
  Stoar.prototype[funcName] = function(prop){
    if (!this._defs.hasOwnProperty(prop)){
      throw new Error(util.format('no property in store: %s', prop))
    }
    if (this._locked){
      throw new Error('cannot mutate the store outside a dispatcher cycle')
    }
    var def = this._defs[prop]
      ,type = def.type
      ,funcs = funcsByType[type].mutators
    if (!funcs){
      throw new Error(util.format('no such method for %s types', type))
    } else {
      var args = Array.prototype.slice.call(arguments)
      args[0] = def
      return funcs[funcName].apply(this, args)
    }
  }
})

Stoar.registry = function(info){
  return new Dispatcher(info)
}

// ======================================================
// DISPATCHER

function OldDispatcher(store, args){
  this._ctx = _.extend({}, args);
  this._ctx.store = store;
  this._defaultCommands = {};
  _.each(store._defs, function(def, prop){
    this._defaultCommands['change:'+prop] = prop;
  }, this);
}

_.extend(OldDispatcher.prototype, {
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
// Dispatcher

function Dispatcher(){
  this._jobs = []
  this._notifiers = []
  var self = this
    ,deferred = false
  this._propChange = function(store, prop, change){
    if (!deferred){
      deferred = true
      _.defer(function(){
        deferred = false
        for (var i=0; i<self._notifiers.length; i++){
          self._notifiers[i].emit('change')
        }
      })
    }
  }
}

_.extend(Dispatcher.prototype, {

  commander: function(methods){
    if (this._createdCommander){
      throw new Error('a dispatcher cant create two commanders')
    }
    this._createdCommander = true
    var commander = new Commander(methods)
    commander.on('action', _.bind(function(action, payload){
      this._send(action, payload)
    }, this))
    return commander
  },

  notifier: function(){
    if (this._createdNotifier){
      throw new Error('a dispatcher cant create two commanders')
    }
    this._createdNotifier = true
    var notifier = new Notifier()
    this._notifiers.push(notifier)
    return notifier
  },

  registerStore: function(store, callback){
    if (store._name){
      throw new Error('already registered')
    }
    var name = '_' + this._jobs.length
    store._name = name
    this._jobs.push({
      name: name,
      store: store,
      callback: callback
    })
    store.on('propChange', _.bind(function(prop, change){
      this._propChange(store, prop, change)
    }, this))
    store._locked = true
  },

  waitFor: function(store){
    var name = store._name
    for (var i=0; i<this._jobs.length; i++){
      var job = this._jobs[i]
      if (job.name === name){
        this._run(job)
      }
    }
  },

  _send: function(action, payload){
    this._action = action
    this._payload = payload
    this._running = {}
    this._ran = {}
    for (var i=0; i<this._jobs.length; i++){
      var job = this._jobs[i]
      this._run(job)
    }
    delete this._action
    delete this._payload
    delete this._running
    delete this._ran
  },

  _run: function(job){
    if (this._running[job.name]){
      throw new Error(util.format('waitFor cycle in dispatcher'))
    }
    if (!this._ran[job.name]){
      this._running[job.name] = true
      job.store._locked = false
      job.callback.call(this, this._action, this._payload)
      job.store._locked = true
      delete this._running[job.name]
    }
    this._ran[job.name] = true
  }
})

// ======================================================
// Commander

function Commander(methods){
  EventEmitter.call(this)
  _.extend(this, methods)
}

util.inherits(Commander, EventEmitter)

_.extend(Commander.prototype, {
  send: function(action, payload){
    this.emit('action', action, payload)
  }
})

// ======================================================
// Notifier

function Notifier(){
  EventEmitter.call(this)
}

util.inherits(Notifier, EventEmitter)

_.extend(Notifier.prototype, {
})

// ======================================================
// Export

_.extend(module.exports, {
  store: function(args){
    return new Stoar(args)
  },
  dispatcher: function(){
    return new Dispatcher()
  }
})








