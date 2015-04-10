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

describe('commander', function() {

  it('should work', function() {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander()
    assert.ok(cdr)
  })

  it('should not work twice', function() {
    var dsp = Stoar.dispatcher()
    dsp.commander()
    assert.throws(function() {
      dsp.commander()
    })
  })

  it('should send', function(done) {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander()
    dsp.store({foo:1}, function(action, payload) {
      assert.strictEqual(action, 'foo')
      assert.strictEqual(payload, 'bar')
      done()
    })
    cdr.send('foo','bar')
  })

  it('should accept custom methods', function(done) {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander({
      foo: function() {
        this.send('x','y')
      }
    })
    dsp.store({foo:1}, function(action, payload) {
      assert.strictEqual(action, 'x')
      assert.strictEqual(payload, 'y')
      done()
    })
    cdr.foo()
  })

  it('should be this in itself', function() {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander({
      foo: function() {
        assert.strictEqual(this, cdr)
      }
    })
    cdr.foo()
  })

  it('should proxy store mutators', function() {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander()
    var store = dsp.store({foo:1}, function(action, payload) {
      if (action === 'mutate') {
        this.absorb(payload)
      }
    })
    cdr.set(store, 'foo', 2)
    assert.strictEqual(store.get('foo'), 2)
  })

  it('should proxy store mutators only to the given store', function(done) {
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander()
    var store1 = dsp.store({foo:1}, function() {})
    dsp.store({foo:1}, function() {
      done(new Error('wrong store'))
    })
    cdr.set(store1, 'foo', 2)
    done()
  })
})











