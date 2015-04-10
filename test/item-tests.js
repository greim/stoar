/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

// http://visionmedia.github.com/mocha/

var assert = require('assert');
var Stoar = require('../index');
var disp

beforeEach(function() {
  disp = Stoar.dispatcher()
})

function testStore(defs, cb) {
  var commander = disp.commander()
  var store = disp.store(defs, function() {
    cb(store)
  })
  commander.send('foo','bar')
}

describe('items', function() {

  it('should validate at start', function() {
    assert.throws(function() {
      disp.store({
        count:{
          value: -1,
          validate: function(count) {
            if (count < 0) {
              throw 'bad'
            }
          }
        }
      })
    }, /bad/)
  })

  describe('accessors', function() {

    it('should get', function() {
      var store = disp.store({ foo:'bar' })
      assert.strictEqual(store.get('foo'), 'bar')
    })

    it('should clone', function() {
      var obj = {blah:3}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.deepEqual(obj, obj2)
    })

    it('should shallow clone', function() {
      var obj = {blah:{blah:2}}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function() {
      var obj = {blah:{blah:2}}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo', true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should get loadable', function() {
      var store = disp.store({ foo:{value:1,loadable:true} })
      var loadable = store.getLoadable('foo')
      assert.deepEqual(loadable, {value:1,status:undefined,timestamp:undefined,loading:undefined})
    })

    it('should get loadable only on loadables', function() {
      var store = disp.store({ foo:{value:1} })
      assert.throws(function() {
        store.getLoadable('foo')
      }, /loadable/)
    })
  })

  describe('mutators', function() {

    it('should set', function() {
      testStore({ foo:'bar' }, function(store) {
        store.set('foo', 'baz')
        assert.strictEqual(store.get('foo'), 'baz')
      })
    })

    it('should not set unknown prop', function() {
      testStore({ foo:'bar' }, function(store) {
        assert.throws(function() {
          store.set('x', 'baz')
        })
      })
    })

    it('should change on set', function(done) {
      testStore({ foo:'bar' }, function(store) {
        store.on('change', function(prop, change) {
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(change.oldVal, 'bar')
          assert.strictEqual(change.newVal, 'baz')
          done()
        })
        store.set('foo', 'baz')
      })
    })

    it('should unset', function() {
      testStore({ foo:'bar' }, function(store) {
        assert.strictEqual(store.get('foo'), 'bar')
        store.unset('foo')
        assert.strictEqual(store.get('foo'), undefined)
      })
    })

    it('should change on unset', function(done) {
      testStore({ foo:'bar' }, function(store) {
        store.on('change', function(prop, change) {
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(change.oldVal, 'bar')
          assert.strictEqual(change.newVal, undefined)
          done()
        })
        store.unset('foo')
      })
    })

    it('should validate on set', function() {
      testStore({
        count:{
          value: 0,
          validate: function(count) {
            if (count < 0) {
              throw 'bad'
            }
          }
        }
      }, function(store) {
        store.set('count', 1)
        assert.throws(function() {
          store.set('count', -1)
        }, /bad/)
      })
    })

    it('should toggle', function() {
      testStore({
        isFoo:{
          value: false
        }
      }, function(store) {
        store.toggle('isFoo')
        assert.strictEqual(store.get('isFoo'), true)
        store.toggle('isFoo')
        assert.strictEqual(store.get('isFoo'), false)
      })
    })

    it('should toggle non-boolean', function() {
      testStore({
        isFoo:{
          value: 'yes'
        }
      }, function(store) {
        store.toggle('isFoo')
        assert.strictEqual(store.get('isFoo'), false)
      })
    })

    it('should validate toggle', function() {
      testStore({
        isFoo:{
          value: 'yes',
          validate: function(val) {
            if (typeof val === 'boolean') {
              throw new Error('foo')
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.toggle('isFoo')
        }, /foo/)
      })
    })

    it('should change on toggle', function(done) {
      testStore({ foo:'bar' }, function(store) {
        store.on('change', function(prop, change) {
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(change.oldVal, 'bar')
          assert.strictEqual(change.newVal, false)
          done()
        })
        store.toggle('foo')
      })
    })
  })
})











