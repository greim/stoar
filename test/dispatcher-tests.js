/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

// http://visionmedia.github.com/mocha/

var assert = require('assert');
//var await = require('await');
var Stoar = require('../index');

describe('dispatcher', function() {

  it('should work', function() {
    var dsp = Stoar.dispatcher()
    assert.ok(dsp)
  })

  it('should dispatch', function(done) {
    var dsp = Stoar.dispatcher()
    dsp.store({foo:1}, function(action, payload) {
      assert.strictEqual(action, 'foo')
      assert.strictEqual(payload, 'bar')
      done()
    })
    dsp._dispatch('foo','bar')
  })

  it('should run in order', function() {
    var order = ''
    var dsp = Stoar.dispatcher()
    dsp.store({foo:1}, function() {
      order += 'a'
    })
    dsp.store({bar:1}, function() {
      order += 'b'
    })
    dsp._dispatch('foo','bar')
    assert.strictEqual(order, 'ab')
  })

  it('should waitFor', function() {
    var order = ''
    var dsp = Stoar.dispatcher()
    dsp.store({foo:1}, function() {
      dsp.waitFor(barStore)
      order += 'a'
    })
    var barStore = dsp.store({bar:1}, function() {
      order += 'b'
    })
    dsp._dispatch('foo','bar')
    assert.strictEqual(order, 'ba')
  })

  it('should fail on cyclic dependencies', function() {
    var dsp = Stoar.dispatcher()
    var fooStore = dsp.store({foo:1}, function() {
      dsp.waitFor(barStore)
    })
    var barStore = dsp.store({bar:1}, function() {
      dsp.waitFor(fooStore)
    })
    assert.throws(function() {
      dsp._dispatch('foo','bar')
    }, /cycle/)
  })

  it('should fail on indirect cyclic dependencies', function() {
    var dsp = Stoar.dispatcher()
    var fooStore = dsp.store({foo:1}, function() {
      dsp.waitFor(barStore)
    })
    var barStore = dsp.store({bar:1}, function() {
      dsp.waitFor(bazStore)
    })
    var bazStore = dsp.store({baz:1}, function() {
      dsp.waitFor(fooStore)
    })
    assert.throws(function() {
      dsp._dispatch('foo','bar')
    }, /cycle/)
  })
})











