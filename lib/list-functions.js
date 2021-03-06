/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

var _ = require('lodash')

var listFuncs = module.exports = {

  accessors: {

    get: function(def, idx) {
      return def.value[idx]
    },

    getLoadable: function(def, idx) {
      return {
        value: this.get(def.prop, idx),
        loading: this.get(def.prop + ':loading', idx),
        status: this.get(def.prop + ':status', idx),
        timestamp: this.get(def.prop + ':timestamp', idx),
        code: this.get(def.prop + ':code', idx)
      }
    },

    clone: function(def, idx, deep) {
      return _.clone(def.value[idx], deep)
    },

    length: function(def) {
      return def.value.length
    },

    getAll: function(def) {
      return def.value.slice()
    },

    getAllLoadables: function(def) {
      return def.value.map(function(item, idx) {
        return this.getLoadable(def.prop, idx)
      }, this)
    },

    isIdentical: function(def, otherList) {
      var len = Math.max(def.value.length, otherList.length)
      for (var i=0; i<len; i++) {
        if (def.value[i] !== otherList[i]) {
          return false
        }
      }
      return true
    }
  },

  mutators: {

    set: function(def, idx, val) {
      def.validate(val)
      var oldVal = def.value[idx]
      def.value[idx] = val
      this._change(def, {
        index: idx,
        newVal: val,
        oldVal: oldVal
      })
    },

    splice: function(def) {
      var args = Array.prototype.slice.call(arguments)
      args.shift()
      var oldList = def.value.slice()
        ,newList = def.value.slice()
      Array.prototype.splice.apply(newList, args)
      var max = Math.max(oldList.length, newList.length)
      def.value = newList
      for (var idx=0; idx<max; idx++) {
        if (newList[idx] !== oldList[idx]) {
          this._change(def, {
            index: idx,
            newVal: newList[idx],
            oldVal: oldList[idx]
          })
        }
      }
    },

    resetAll: function(def, newList) {
      if (!_.isArray(newList)) {
        throw new Error('reset list must be an array')
      }
      newList = newList.slice()
      _.each(newList, function(val) {
        def.validate(val)
      })
      var oldList = def.value
        ,len = Math.max(oldList.length, newList.length)
      def.value = newList
      for (var idx=0; idx<len; idx++) {
        if (newList[idx] !== oldList[idx]) {
          this._change(def, {
            index: idx,
            newVal: newList[idx],
            oldVal: oldList[idx]
          })
        }
      }
    },

    populate: function(def, val, len) {
      if (len === undefined) {
        len = def.value.length
      }
      var newList = new Array(len)
      for (var i=0; i<len; i++) {
        newList[i] = val
      }
      this.resetAll(def.prop, newList)
    },

    clear: function(def) {
      var oldList = def.value
        ,len = oldList.length
      def.value = []
      for (var idx=0; idx<len; idx++) {
        this._change(def, {
          index: idx,
          newVal: undefined,
          oldVal: oldList[idx]
        })
      }
    },

    push: function(def, val) {
      def.validate(val)
      def.value.push(val)
      this._change(def, {
        index: def.value.length - 1,
        newVal: val,
        oldVal: undefined
      })
    },

    unshift: function(def, val) {
      def.validate(val)
      var newList = def.value.slice()
      newList.unshift(val)
      var oldList = def.value
      def.value = newList
      for (var idx=0; idx<newList.length; idx++) {
        this._change(def, {
          index: idx,
          newVal: newList[idx],
          oldVal: oldList[idx]
        })
      }
    },

    pop: function(def) {
      var result = def.value.pop()
      this._change(def, {
        index: def.value.length,
        newVal: undefined,
        oldVal: result
      })
      return result
    },

    shift: function(def) {
      var newList = def.value.slice()
        ,result = newList.shift()
        ,oldList = def.value
      def.value = newList
      for (var idx=0; idx<oldList.length; idx++) {
        this._change(def, {
          index: idx,
          newVal: newList[idx],
          oldVal: oldList[idx]
        })
      }
      return result
    },

    truncateLength: function(def, len) {
      if (len >= def.value.length) {
        return;
      }
      var newList = def.value.slice(0, len)
        ,oldList = def.value
      def.value = newList
      for (var idx=newList.length; idx<oldList.length; idx++) {
        this._change(def, {
          index: idx,
          newVal: newList[idx],
          oldVal: oldList[idx]
        })
      }
    },

    toggle: function(def, idx) {
      var oldVal = def.value[idx]
      var newVal = !oldVal
      def.validate(newVal)
      def.value[idx] = newVal
      this._change(def, {
        index: idx,
        newVal: newVal,
        oldVal: oldVal
      })
    }
  }
}

// non-mutator array methods
_.each([
  'filter',
  'map',
  'some',
  'every',
  'forEach',
  'reduce',
  'reduceRight',
  'join',
  'slice',
  'concat',
  'indexOf',
  'lastIndexOf',
], function(funcName) {
  listFuncs.accessors[funcName] = function(def) {
    var args = Array.prototype.slice.call(arguments)
    args.shift()
    return Array.prototype[funcName].apply(def.value, args)
  }
})

