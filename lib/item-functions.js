var _ = require('lodash')

module.exports = {

  set: function(def, val){
    def.validate(val)
    var oldVal = def.value
    def.value = val
    this._change(def, {
      newVal: val,
      oldVal: oldVal
    })
  },

  unset: function(def){
    def.validate(undefined)
    var oldVal = def.value
    def.value = undefined
    this._change(def, {
      newVal: undefined,
      oldVal: oldVal
    })
  },

  get: function(def){
    return def.value
  },

  clone: function(def, deep){
    return _.clone(def.value, deep)
  }
}
