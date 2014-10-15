var _ = require('lodash')
  ,EventEmitter = require('events').EventEmitter
  ,util = require('util')
  ,itemFuncs = require('./lib/item-functions')
  ,mapFuncs = require('./lib/map-functions')
  ,listFuncs = require('./lib/list-functions')
  ,accFuncNames = _.keys(_.extend({}, itemFuncs.accessors, mapFuncs.accessors, listFuncs.accessors))
  ,mutFuncNames = _.keys(_.extend({}, itemFuncs.mutators, mapFuncs.mutators, listFuncs.mutators))
  ,funcsByType = {item:itemFuncs,map:mapFuncs,list:listFuncs}
  ,isImmutable = require('./lib/is-immutable')

// ======================================================
// Store

var makeDef = (function(){
  var validTypes = {item:1,map:1,list:1}
  function getDefault(type){
    if (type === 'item'){
      return undefined
    } else if (type === 'map'){
      return {}
    } else if (type === 'list'){
      return []
    }
  }
  return function(prop, def){
    if (!def.hasOwnProperty('value') && !def.hasOwnProperty('type') && !def.hasOwnProperty('validate')){
      throw new Error('invalid property definition')
    }
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

function Store(args){
  EventEmitter.call(this)
  var defs = this._defs = {}
  _.each(args, function(def, prop){
    if (isImmutable(def)){
      def = {type:'item',value:def}
    }
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
      this.emit('change', def.prop, change)
    }
  },

  hasProperty: function(prop){
    return this._defs.hasOwnProperty(prop)
  },

  absorb: function(payload){
    this[payload.method].apply(this, payload.args)
  }
})

_.each(accFuncNames, function(funcName){
  var isLoadable = /Loadables?$/.test(funcName)
  Store.prototype[funcName] = function(prop){
    if (!this._defs.hasOwnProperty(prop)){
      throw new Error(util.format('no property in store: %s', prop))
    }
    if (isLoadable && !this._defs[prop].loadable){
      throw new Error(util.format('not loadable: %s', prop))
    }
    var def = this._defs[prop]
      ,type = def.type
      ,funcs = funcsByType[type].accessors
    if (!funcs[funcName]){
      throw new Error(util.format('no such method "%s" for %s types', funcName, type))
    } else {
      var args = Array.prototype.slice.call(arguments)
      args[0] = def
      return funcs[funcName].apply(this, args)
    }
  }
})

_.each(mutFuncNames, function(funcName){
  Store.prototype[funcName] = function(prop){
    if (!this._defs.hasOwnProperty(prop)){
      throw new Error(util.format('no property in store: %s', prop))
    }
    if (this._dispatcher && this._dispatcher._activeStore !== this){
      throw new Error('cannot mutate a store outside a dispatcher cycle')
    }
    var def = this._defs[prop]
      ,type = def.type
      ,funcs = funcsByType[type].mutators
    if (!funcs[funcName]){
      throw new Error(util.format('no such method "%s" for %s types', funcName, type))
    } else {
      var args = Array.prototype.slice.call(arguments)
      args[0] = def
      return funcs[funcName].apply(this, args)
    }
  }
})

// ======================================================
// Dispatcher

function Dispatcher(){
  this._jobs = []
}

_.extend(Dispatcher.prototype, {

  store: function(args, callback){
    var store = new Store(args)
    if (typeof callback !== 'function'){
      var callbacks = callback
        ,self = this
      callback = function(action, payload){
        if (callbacks.hasOwnProperty(action)){
          return callbacks[action].call(self, payload)
        }
      }
    }
    var name = '_' + this._jobs.length
    store._name = name
    this._jobs.push({
      name: name,
      store: store,
      callback: callback
    })
    store.on('change', _.bind(function(prop, change){
      this._propChange(store, prop, change)
    }, this))
    store._dispatcher = this
    return store
  },

  commander: function(methods){
    if (this._createdCommander){
      throw new Error('a dispatcher cant create two commanders')
    }
    this._createdCommander = true
    var commander = new Commander(methods)
    commander.on('action', _.bind(function(action, payload){
      this._dispatch(action, payload)
    }, this))
    commander.on('_mutate', _.bind(function(args, store){
      this._dispatch('mutate', args, store)
    }, this))
    return commander
  },

  notifier: function(){
    if (this._notifier){
      throw new Error('a dispatcher cant create two commanders')
    }
    this._notifier = new Notifier()
    return this._notifier
  },

  waitFor: function(store){
    var name = store._name
    var pendingActiveStore = this._activeStore
    for (var i=0; i<this._jobs.length; i++){
      var job = this._jobs[i]
      if (job.name === name){
        this._activeStore = job.store
        this._run(job)
        this._activeStore = pendingActiveStore
      }
    }
  },

  _propChange: function(store, prop, change){
    if (this._notifier){
      this._notifier.emit('change', store, prop, change)
    }
  },

  _dispatch: function(action, payload, targetStore){
    this._action = action
    this._payload = payload
    this._running = {}
    this._ran = {}
    for (var i=0; i<this._jobs.length; i++){
      var job = this._jobs[i]
      if (!targetStore || targetStore === job.store){
        this._activeStore = job.store
        this._run(job)
        delete this._activeStore
      }
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
      job.callback.call(job.store, this._action, this._payload)
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

_.each(mutFuncNames, function(funcName){
  Commander.prototype[funcName] = function(store){
    var args = Array.prototype.slice.call(arguments)
    args.shift()
    this.emit('_mutate', {
      method: funcName,
      args: args
    }, store)
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
  dispatcher: function(){
    return new Dispatcher()
  }
})








