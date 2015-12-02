/* ----------------------------------------------------------
 * @license
 * Copyright (c) 2014-2015 Greg Reimer <gregreimer@gmail.com>
 * Available under MIT license (see LICENSE in repo)
 * ----------------------------------------------------------
 */

'use strict'

// http://visionmedia.github.com/mocha/

var assert = require('assert');
var await = require('await');
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

describe('keyed-list', function() {

  it('should validate at start', function() {
    assert.throws(function() {
      disp.store({
        counts:{
          type: 'keyed-list',
          value: {
            a:[],
            b: 1
          },
          validate: function(val) {
            if (!(val instanceof Array)) {
              throw new Error('bad')
            }
          }
        }
      })
    },/bad/)
  })

  describe('accessors', function() {

    it('should get', function() {
      var val = ['blip']
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {
            a: val
          }
        }
      })
      assert.strictEqual(store.get('foo', 'a'), val)
    })

    it('should getDeep', function() {
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {
            a:['blip']
          }
        }
      })
      assert.strictEqual(store.getDeep('foo', 'a', 0), 'blip')
    })

    it('should get loadable', function() {
      var st = disp.store({
        numbers: {
          type:'keyed-list',
          value:{
            foo:[{},'blip'],
            bar:[{},{}]
          },
          loadable:true
        }
      })
      var loadable = st.getLoadable('numbers', 'foo', 1)
      assert.deepEqual(loadable, {
        value: 'blip',
        status:undefined,
        timestamp:undefined,
        loading:undefined,
        code:undefined
      })
    })

    it('should get loadable only on loadables', function() {
      var st = disp.store({
        numbers: {
          type:'keyed-list',
          value:{
            foo: [{},{}],
            bar: ['a','b']
          }
        }
      })
      assert.throws(function() {
        st.getLoadable('numbers', 'foo')
      }, /loadable/)
    })

    it('should get undefined', function() {
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {
            a: []
          }
        }
      })
      assert.strictEqual(store.get('foo', 'b', 1), undefined)
    })

    it('should clone', function() {
      var obj1 = {blah:3}
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {
            a:[obj1]
          }
        }
      })
      var obj2 = store.clone('foo', 'a', 0)
      assert.ok(obj1 !== obj2)
      assert.deepEqual(obj1, obj2)
    })

    it('should clone undefined', function() {
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {}
        }
      })
      var obj = store.clone('foo', 'a', 0)
      assert.deepEqual(obj, undefined)
    })

    it('should clone null', function() {
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {
            a:[null]
          }
        }
      })
      var obj = store.clone('foo', 'a', 0)
      assert.deepEqual(obj, null)
    })

    it('should shallow clone', function() {
      var obj = {blah:{blah:2}}
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {a:[obj]}
        }
      })
      var obj2 = store.clone('foo', 'a', 0)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function() {
      var obj = {blah:{blah:2}}
      var store = disp.store({
        foo:{
          type: 'keyed-list',
          value: {a:[obj]}
        }
      })
      var obj2 = store.clone('foo', 'a', 0, true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should getAll', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:['blip'],
            blort: ['blop']
          }
        }
      })
      assert.deepEqual(store.getAll('flags'), {
        foo: ['blip'],
        blort: ['blop']
      })
    })

    it('should getAllLoadables', function() {
      var st = disp.store({
        names: {
          type:'keyed-list',
          value:{
            foo:[{},'blop'],
            bar:[2]
          },
          loadable:true
        }
      })
      var loadables = st.getAllLoadables('names')
      assert.deepEqual(loadables, {
        foo:[{value:{},loading:undefined,timestamp:undefined,status:undefined,code:undefined},{value:'blop',loading:undefined,timestamp:undefined,status:undefined,code:undefined}],
        bar:[{value:2,loading:undefined,timestamp:undefined,status:undefined,code:undefined}]
      })
    })

    it('should getAllLoadables only on loadables', function() {
      var st = disp.store({
        names: {
          type:'keyed-list',
          value:{}
        }
      })
      assert.throws(function() {
        st.getAllLoadables('names')
      }, /loadable/)
    })

    it('getAll should copy', function() {
      var obj = {a: 'blip'}
      var flags = {foo:[obj]}
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: flags
        }
      })
      var flags2 = store.getAll('flags')
      assert.deepEqual(flags,flags2)
      assert.ok(flags !== flags2)
      assert.ok(flags.foo !== flags2.foo)
    })

    it('should has', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:[],
            baz:undefined
          }
        }
      })
      assert.ok(store.has('flags','foo'))
      assert.ok(!store.has('flags','bar'))
      assert.ok(store.has('flags','baz'))
    })

    it('should keys', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      assert.deepEqual(store.keys('flags'),['foo','bar'])
    })

    it('should values', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:['blop'],
            bar:false
          }
        }
      })
      assert.deepEqual(store.values('flags'),[['blop'],false])
    })

    it('should forEach', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:['flim'],
            bar:['flam']
          }
        }
      })
      var count = 0
      store.forEach('flags',function(val, key) {
        if (count === 0) {
          assert.deepEqual(val, ['flim'])
          assert.strictEqual(key, 'foo')
        } else if (count === 1) {
          assert.deepEqual(val, ['flam'])
          assert.strictEqual(key, 'bar')
        }
        count++
      })
      assert.strictEqual(count, 2)
    })

    it('should forEach with ctx', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            bar:false
          }
        }
      })
      var that = {}
      store.forEach('flags',function() {
        assert.strictEqual(that, this)
      }, that)
    })

    it('should test if a keyed-list is identical', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:[1,3],
            bar:[1]
          }
        }
      })
      assert.strictEqual(store.isIdentical('flags', store.getAll('flags')), true)
    })

    it('should test if a map is not identical', function() {
      var store = disp.store({
        flags: {
          type: 'keyed-list',
          value: {
            foo:['blort'],
            bar:[{}, 4]
          }
        }
      })
      assert.strictEqual(store.isIdentical('flags', {
        foo:['blort'],
        bar:[{}, 4, 9],
        blip: []
      }), false, 'superset failed')
      assert.strictEqual(store.isIdentical('flags', {
        foo:['blort'],
        bar:[4]
      }), false, 'subset failed')
      assert.strictEqual(store.isIdentical('flags', {
        foo:['blim'],
        bar:[1,4,5]
      }), false, 'differing set')
    })
  })

  describe('mutators', function() {

    it('should set', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:['blam','blat']
          }
        }
      }, function(store) {
        var val = ['blort'];
        store.set('foo', 'a', val)
        assert.strictEqual(store.get('foo', 'a'), val)
      })
    })

    it('should change on set', function(done) {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {a:['blink','blim']}
        }
      }, function(store) {
        var val = ['blam'];
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'foo')
          assert.deepEqual(ch.oldVal, ['blink','blim'])
          assert.deepEqual(ch.newVal, val)
          assert.strictEqual(ch.key, 'a')
          done()
        })
        store.set('foo', 'a', val)
      })
    })

    it('should validate set', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:[1,2]
          },
          validate: function(val) {
            if (val < 0) {
              throw 'bad'
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.set('foo', 'a', -1)
        }, /bad/)
      })
    })

    it('should setDeep', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:['blam','blat']
          }
        }
      }, function(store) {
        store.setDeep('foo', 'a', 0, 'blort')
        assert.strictEqual(store.getDeep('foo', 'a', 0), 'blort')
      })
    })

    it('should change on setDeep', function(done) {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {a:['blink','blim']}
        }
      }, function(store) {
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'foo')
          assert.deepEqual(ch.oldVal, ['blink','blim'])
          assert.deepEqual(ch.newVal, ['blink','blam'])
          assert.strictEqual(ch.key, 'a')
          done()
        })
        store.setDeep('foo', 'a', 1, 'blam')
      })
    })

    it('should validate setDeep', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:[1,2]
          },
          validate: function(val) {
            if (val < 0) {
              throw 'bad'
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.setDeep('foo', 'a', 0, -1)
        }, /bad/)
      })
    })

    it('should unset', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:[1,2],
            b: ['happy']
          }
        }
      }, function(store) {
        assert.ok(store.has('foo','a'))
        store.unset('foo', 'a')
        assert.strictEqual(store.get('foo','a'), undefined)
        assert.ok(!store.has('foo','a'))
        assert.ok(store.has('foo', 'b'))
      })
    })

    it('should change on unset', function(done) {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:['blim','blam']
          }
        }
      }, function(store) {
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'foo')
          assert.deepEqual(ch.oldVal, ['blim', 'blam'])
          assert.strictEqual(ch.newVal, undefined)
          assert.strictEqual(ch.key, 'a')
          done()
        })
        store.unset('foo', 'a')
      })
    })

    it('should setAll', function() {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:[]
          }
        }
      }, function(store) {
        store.setAll('flags', {bar:false,baz:true})
        assert.deepEqual(store.getAll('flags'),{foo:[],bar:false,baz:true})
      })
    })

    it('should change on setAll', function(done) {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true,
            bar:false
          }
        }
      }, function(store) {
        var pr = await('baz','bar').onkeep(function() {done()})
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'flags')
          if (ch.key === 'baz') {
            assert.strictEqual(ch.oldVal, undefined)
            assert.strictEqual(ch.newVal, true)
            pr.keep('baz')
          } else if (ch.key === 'bar') {
            assert.strictEqual(ch.oldVal, false)
            assert.strictEqual(ch.newVal, true)
            pr.keep('bar')
          } else {
            done('bad key')
          }
        })
        store.setAll('flags', {baz:true,bar:true})
      })
    })

    it('should validate setAll', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {a:1},
          validate: function(val) {
            if (val < 0) {
              throw 'bad'
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.setAll('foo', {x:-1})
        }, /bad/)
      })
    })

    it('should resetAll', function() {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true
          }
        }
      }, function(store) {
        store.resetAll('flags', {bar:false,baz:true})
        assert.deepEqual(store.getAll('flags'),{bar:false,baz:true})
      })
    })

    it('should change on resetAll', function(done) {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true
          }
        }
      }, function(store) {
        var pr = await('baz','foo').onkeep(function() {done()})
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'flags')
          if (ch.key === 'baz') {
            assert.strictEqual(ch.oldVal, undefined)
            assert.strictEqual(ch.newVal, true)
            pr.keep('baz')
          } else if (ch.key === 'foo') {
            assert.strictEqual(ch.oldVal, true)
            assert.strictEqual(ch.newVal, undefined)
            pr.keep('foo')
          } else {
            done('bad key')
          }
        })
        store.resetAll('flags', {baz:true})
      })
    })

    it('should validate resetAll', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {a:1},
          validate: function(val) {
            if (val < 0) {
              throw 'bad'
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.resetAll('foo', {x:-1})
        })
      })
    })

    it('should not corrupt value on resetAll', function() {
      testStore({
        foo:{
          type: 'keyed-list',
          value: {
            a:[2,4]
          }
        }
      }, function(store) {
        store.resetAll('foo', null)
        store.setDeep('foo','x', 1, 3)
        assert.strictEqual(store.getDeep('foo','x', 1), 3)
      })
    })

    it('should setExistingValuesTo', function() {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true,
            bar:false
          }
        }
      }, function(store) {
        store.setExistingValuesTo('flags', 1)
        assert.deepEqual(store.getAll('flags'),{foo:1,bar:1})
      })
    })

    it('should clear', function() {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true
          }
        }
      }, function(store) {
        store.clear('flags')
        assert.deepEqual(store.getAll('flags'),{})
      })
    })

    it('should change on clear', function(done) {
      testStore({
        flags: {
          type: 'keyed-list',
          value: {
            foo:true
          }
        }
      }, function(store) {
        store.on('change',function(prop, ch) {
          assert.strictEqual(prop, 'flags')
          assert.strictEqual(ch.key, 'foo')
          assert.strictEqual(ch.oldVal, true)
          assert.strictEqual(ch.newVal, undefined)
          done()
        })
        store.clear('flags')
      })
    })
  })
})
