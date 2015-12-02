/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

var _ = require('lodash')

module.exports = {

  mutators: {
    set: function(def, key, val) {
      def.validate(val)
      var oldVal = _.cloneDeep(def.value[key]);
      if (!def.value[key]) { def.value[key] = [] }
      def.value[key] = val
      this._change(def, {
        key: key,
        newVal: def.value[key],
        oldVal: oldVal
      })
    },

    setDeep: function(def, key, idx, val) {
      def.validate(val)
      var oldVal = _.cloneDeep(def.value[key]);
      if (!def.value[key]) { def.value[key] = [] }
      def.value[key][idx] = val
      this._change(def, {
        key: key,
        newVal: def.value[key],
        oldVal: oldVal
      })
    },

    unset: function(def, key) {
      var oldVal = def.value[key]
      delete def.value[key]
      this._change(def, {
        key: key,
        newVal: undefined,
        oldVal: oldVal
      })
    },

    splice: function(def, key) {
      var args = Array.prototype.slice.call(arguments)
      args.shift()
      var oldList = def.value[key].slice()
        ,newList = def.value[key].slice()
      Array.prototype.splice.apply(newList, args)
      var max = Math.max(oldList.length, newList.length)
      def.value[key] = newList
      for (var idx=0; idx<max; idx++) {
        if (newList[idx] !== oldList[idx]) {
          this._change(def, {
            key: key,
            newVal: newList,
            oldVal: oldList
          })
        }
      }
    },

    push: function(def, key, val) {
      def.validate(val)
      var oldList = _.cloneDeep(def.value[key])
      def.value[key].push(val)
      this._change(def, {
        key: key,
        newVal: def.value[key],
        oldVal: oldList
      })
    },

    unshift: function(def, key, val) {
      def.validate(val)
      var newList = def.value[key].slice()
      newList.unshift(val)
      var oldList = def.value
      def.value = newList
      this._change(def, {
        key: key,
        newVal: newList,
        oldVal: oldList
      })
    },

    pop: function(def, key) {
      var oldList = _.cloneDeep(def.value[key])
      var result = def.value[key].pop()
      this._change(def, {
        key: key,
        newVal: def.value[key],
        oldVal: oldList
      })
      return result
    },

    shift: function(def, key) {
      var newList = def.value[key].slice()
        ,result = newList.shift()
        ,oldList = def.value[key]
      def.value[key] = newList
      this._change(def, {
        key: key,
        newVal: newList,
        oldVal: oldList
      })
      return result
    },

    setAll: function(def, newMap) {
      _.each(newMap, function(val) {
        def.validate(val)
      })
      var oldMap = def.value
        ,merged = _.extend({}, oldMap, newMap)
      def.value = merged
      _.each(newMap, function(val, key) {
        if (newMap[key] !== oldMap[key]) {
          this._change(def, {
            key: key,
            newVal: newMap[key],
            oldVal: oldMap[key]
          })
        }
      },this)
    },

    resetAll: function(def, newMap) {
      newMap = _.extend({}, newMap)
      _.each(newMap, function(val) {
        def.validate(val)
      })
      var oldMap = def.value
        ,merged = _.extend({}, newMap, oldMap)
      def.value = newMap
      _.each(merged, function(val, key) {
        if (newMap[key] !== oldMap[key]) {
          this._change(def, {
            key: key,
            newVal: newMap[key],
            oldVal: oldMap[key]
          })
        }
      },this)
    },

    setExistingValuesTo: function(def, val) {
      var newMap = {}
      _.each(def.value, function(value, name) {
        newMap[name] = val
      })
      this.resetAll(def.prop, newMap)
    },

    clear: function(def) {
      var oldMap = def.value
      def.value = {}
      _.each(oldMap, function(val, key) {
        this._change(def, {
          key: key,
          newVal: undefined,
          oldVal: oldMap[key]
        })
      },this)
    },

    truncateLengthAtKey: function (def, key, len) {
      if (!def.value[key]) { def.value[key] = [] }
      if (len >= def.value[key].length) {
        return;
      }
      var newList = def.value[key].slice(0, len)
        ,oldList = def.value[key]
      def.value[key] = newList
      for (var idx=newList.length; idx<oldList.length; idx++) {
        this._change(def, {
          key: key,
          newVal: newList[idx],
          oldVal: oldList[idx]
        })
      }
    }
  },

  accessors: {
    get: function(def, key) {
      return def.value[key]
    },

    getDeep: function(def, key, idx) {
      return def.value[key] && def.value[key][idx]
    },

    getLoadable: function(def, key, idx) {
      return {
        value: this.getDeep(def.prop, key, idx),
        loading: this.getDeep(def.prop + ':loading', key, idx),
        status: this.getDeep(def.prop + ':status', key, idx),
        timestamp: this.getDeep(def.prop + ':timestamp', key, idx),
        code: this.getDeep(def.prop + ':code', key, idx)
      }
    },

    clone: function(def, key, idx, deep) {
      return def.value[key] && _.clone(def.value[key][idx], deep)
    },

    has: function(def, key) {
      return def.value.hasOwnProperty(key)
    },

    getAll: function(def) {
      var copy = {}
      for (var x in def.value) {
        if (def.value.hasOwnProperty(x)) {
          copy[x] = ((def.value[x].slice) ? def.value[x].slice() : _.clone(def.value[x]))
        }
      }
      return copy;
    },

    getAllLoadables: function(def) {
      var result = {}
      var mapLoadables = function (key) {
        result[key] = def.value[key].map(function (item, idx) {
          return this.getLoadable(def.prop, key, idx)
        }, this)
      }.bind(this)
      for (var key in def.value) {
        if (def.value.hasOwnProperty(key)) {
          mapLoadables(key)
        }
      }
      return result
    },

    keys: function(def) {
      return _.keys(def.value)
    },

    values: function(def) {
      return _.values(def.value)
    },

    forEach: function(def, cb, ctx) {
      return _.each(def.value, cb, ctx)
    },

    isIdentical: function(def, otherMap) {
      var name
      function checkItems(map1, map2) {
        var matches = true;
        map1[name].forEach(function (item, idx) {
          if (item !== map2[name][idx]) {
            matches = false
          }
        })
        return matches;
      }
      for (name in def.value) {
        if (def.value.hasOwnProperty(name)) {
          if (!otherMap.hasOwnProperty(name) || def.value[name].length !== otherMap[name].length) {
            return false
          } else if (!checkItems(def.value, otherMap)) {
            return false
          }
        }
      }
      for (name in otherMap) {
        if (otherMap.hasOwnProperty(name)) {
          if (!def.value.hasOwnProperty(name) || def.value[name].length !== otherMap[name].length) {
            return false
          } else if (!checkItems(otherMap, def.value)) {
            return false
          }
        }
      }
      return true
    }
  }
}
