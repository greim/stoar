/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

var _ = require('lodash')

module.exports = {

  accessors: {

    get: function(def) {
      return def.value
    },

    getLoadable: function(def) {
      return {
        value: this.get(def.prop),
        loading: this.get(def.prop + ':loading'),
        status: this.get(def.prop + ':status'),
        timestamp: this.get(def.prop + ':timestamp')
      }
    },

    clone: function(def, deep) {
      return _.clone(def.value, deep)
    }
  },

  mutators: {

    set: function(def, val) {
      def.validate(val)
      var oldVal = def.value
      def.value = val
      this._change(def, {
        newVal: val,
        oldVal: oldVal
      })
    },

    unset: function(def) {
      def.validate(undefined)
      var oldVal = def.value
      def.value = undefined
      this._change(def, {
        newVal: undefined,
        oldVal: oldVal
      })
    },

    toggle: function(def) {
      var oldVal = def.value
      var newVal = !oldVal
      def.validate(newVal)
      def.value = newVal
      this._change(def, {
        newVal: newVal,
        oldVal: oldVal
      })
    }
  }
}
