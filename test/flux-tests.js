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

describe('flux', function() {

  it('should allow store mutation in callback', function(done) {
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s = d.store({ foo: 1 }, function() {
      s.set('foo', 2)
      assert.strictEqual(s.get('foo'), 2)
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow other store mutation in callback', function(done) {
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ foo: 1 }, function() {})
    var s1 = d.store({ bar: 1 }, function() {
      s1.set('bar', 2)
      assert.strictEqual(s1.get('bar'), 2)
      assert.throws(function() {
        s2.set('foo',2)
      })
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow store mutation outside callback', function() {
    var d = Stoar.dispatcher()
    d.commander()
    var s = d.store({ foo: 1 }, function() {})
    assert.throws(function() {
      s.set('foo',2)
    })
  })

  it('should allow other store mutation with waitFor', function(done) {
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function() {
      s2.set('bar',3)
      done()
    })
    var s1 = d.store({ foo: 1 }, function() {
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      d.waitFor(s2)
    })
    c.send('foo','bar')
  })

  it('should allow other store mutation with waitFor first', function(done) {
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function() {})
    var s1 = d.store({ foo: 1 }, function() {
      d.waitFor(s2)
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      done()
    })
    c.send('foo','bar')
  })

  it('should allow other store mutation with waitFor last', function(done) {
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function() {})
    var s1 = d.store({ foo: 1 }, function() {
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      d.waitFor(s2)
      done()
    })
    c.send('foo','bar')
  })
})











