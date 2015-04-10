/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

var immuts = {
  'string': 1,
  'number': 1,
  'function': 1,
  'boolean': 1,
  'undefined': 1
}

module.exports = function(val) {
  if (val === null) {
    return true
  }
  return immuts.hasOwnProperty(typeof val)
}
