var _ = require('lodash')

module.exports = {

  mutators: {

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
      newMap = _.extend({}, newMap)
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

    setExistingValuesTo: function(def, val){
      var newMap = {}
      _.each(def.value, function(value, name){
        newMap[name] = val
      })
      this.resetAll(def.prop, newMap)
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

    toggle: function(def, key){
      var oldVal = def.value[key]
      var newVal = !oldVal
      def.validate(newVal)
      def.value[key] = newVal
      this._change(def, {
        key: key,
        newVal: newVal,
        oldVal: oldVal
      })
    }
  },

  accessors: {

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
    },

    isIdentical: function(def, otherMap){
      for (var name in def.value){
        if (def.value.hasOwnProperty(name)){
          if (!otherMap.hasOwnProperty(name) || def.value[name] !== otherMap[name]){
            return false
          }
        }
      }
      for (var name in otherMap){
        if (otherMap.hasOwnProperty(name)){
          if (!def.value.hasOwnProperty(name) || def.value[name] !== otherMap[name]){
            return false
          }
        }
      }
      return true
    }
  }
}




