var immuts = {
  'string': 1,
  'number': 1,
  'function': 1,
  'boolean': 1,
  'undefined': 1
}

module.exports = function(val){
  if (val === null){
    return true
  }
  return immuts.hasOwnProperty(typeof val)
}
