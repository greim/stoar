/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

// http://visionmedia.github.com/mocha/

var assert = require('assert')
  ,Stoar = require('../index')
  ,disp

beforeEach(function() {
  disp = Stoar.dispatcher()
})

describe('methods', function() {

  it('have methods', function() {
    var store = disp.store({
      foo: {
        type: 'list',
        value: [0,1,2,3]
      },
      squares: function() {
        return this.map('foo', function(x) {
          return x * x
        })
      }
    })
    assert.deepEqual(store.squares(), [0,1,4,9])
  })
})
