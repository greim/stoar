var _ = require('lodash')

module.exports = {

  set: function(def, key, val){
    def.validate(val)
    var oldVal = def.value[key]
    def.value[key] = val
    this._change(def, {
      key: key,
      newVal: val,
      oldVal: oldVal
    })
  },

  unset: function(def, key){
    var oldVal = def.value[key]
    delete def.value[key]
    this._change(def, {
      key: key,
      newVal: undefined,
      oldVal: oldVal
    })
  },

  setAll: function(def, newMap){
    _.each(newMap, function(val, key){
      def.validate(val)
    })
    var oldMap = def.value
      ,merged = _.extend({}, oldMap, newMap)
    def.value = merged
    _.each(newMap, function(val, key){
      this._change(def, {
        key: key,
        newVal: newMap[key],
        oldVal: oldMap[key]
      })
    },this)
  },

  resetAll: function(def, newMap){
    _.each(newMap, function(val, key){
      def.validate(val)
    })
    var oldMap = def.value
      ,merged = _.extend({}, newMap, oldMap)
    def.value = newMap
    _.each(merged, function(val, key){
      this._change(def, {
        key: key,
        newVal: newMap[key],
        oldVal: oldMap[key]
      })
    },this)
  },

  clear: function(def){
    var oldMap = def.value
    def.value = {}
    _.each(oldMap, function(val, key){
      this._change(def, {
        key: key,
        newVal: undefined,
        oldVal: oldMap[key]
      })
    },this)
  },

  get: function(def, key){
    return def.value[key]
  },

  clone: function(def, key, deep){
    return _.clone(def.value[key], deep)
  },

  has: function(def, key){
    var def = def
    return def.value.hasOwnProperty(key)
  },

  getAll: function(def){
    return _.extend({}, def.value)
  },

  keys: function(def){
    return _.keys(def.value)
  },

  values: function(def){
    return _.values(def.value)
  },

  forEach: function(def, cb, ctx){
    return _.each(def.value, cb, ctx)
  }
}
