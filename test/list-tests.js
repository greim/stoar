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

describe('lists', function() {

  it('should validate on start', function() {
    assert.throws(function() {
      disp.store({
        names: {type:'list',value:[false],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      })
    },/bad/)
  })

  describe('accessors', function() {

    it('should get', function() {
      var st = disp.store({
        names: {type:'list',value:['zz']}
      })
      assert.strictEqual(st.get('names', 0), 'zz')
    })

    it('should get loadable', function() {
      var st = disp.store({
        names: {type:'list',value:['a','b'],loadable:true}
      })
      var loadable = st.getLoadable('names', 0)
      assert.deepEqual(loadable, {value:'a',status:undefined,timestamp:undefined,loading:undefined})
    })

    it('should get loadable only on loadables', function() {
      var st = disp.store({
        names: {type:'list',value:['a','b']}
      })
      assert.throws(function() {
        st.getLoadable('names', 0)
      }, /loadable/)
    })

    it('should get undefined', function() {
      var st = disp.store({
        names: {type:'list',value:[]}
      })
      assert.strictEqual(st.get('names', 0), undefined)
    })

    it('should clone', function() {
      var ob1 = {x:1}
      var st = disp.store({
        names: {type:'list',value:[ob1]}
      })
      var ob2 = st.clone('names',0)
      assert.deepEqual(ob1,ob2)
      assert.ok(ob1!==ob2)
    })

    it('should length', function() {
      var st = disp.store({
        names: {type:'list',value:[1,2,3]}
      })
      assert.strictEqual(st.length('names'),3)
    })

    it('should getAll', function() {
      var st = disp.store({
        names: {type:'list',value:[2,3,4]}
      })
      assert.deepEqual(st.getAll('names'),[2,3,4])
    })

    it('should getAllLoadables', function() {
      var st = disp.store({
        names: {type:'list',value:[2,3],loadable:true}
      })
      var loadables = st.getAllLoadables('names')
      assert.deepEqual(loadables, [
        {value:2,loading:undefined,timestamp:undefined,status:undefined},
        {value:3,loading:undefined,timestamp:undefined,status:undefined}
      ])
    })

    it('should getAllLoadables only on loadables', function() {
      var st = disp.store({
        names: {type:'list',value:['a','b']}
      })
      assert.throws(function() {
        st.getAllLoadables('names')
      }, /loadable/)
    })

    it('should getAll copy', function() {
      var names1 = [3,4,5]
      var st = disp.store({
        names: {type:'list',value:names1}
      })
      var names2 = st.getAll('names')
      assert.deepEqual(names1,names2)
      assert.ok(names1!==names2)
    })

    it('should filter', function() {
      var st = disp.store({
        names: {type:'list',value:[1,2,3,4]}
      })
      var odds = st.filter('names',function(x) {
        return x%2
      })
      assert.deepEqual(odds,[1,3])
    })

    it('should filter with context', function() {
      var st = disp.store({
        names: {type:'list',value:[1,2,3,4]}
      })
      var that = {}
      st.filter('names',function() {
        assert.strictEqual(that,this)
      }, that)
    })

    it('should map', function() {
      var st = disp.store({
        names: {type:'list',value:[0,1,2]}
      })
      var dubs = st.map('names',function(x) {
        return x*2
      })
      assert.deepEqual(dubs,[0,2,4])
    })

    it('should some', function() {
      var st = disp.store({
        names: {type:'list',value:[true,false]}
      })
      assert.strictEqual(st.some('names',function(x) {return x}),true)
    })

    it('should some false', function() {
      var st = disp.store({
        names: {type:'list',value:[false,false]}
      })
      assert.strictEqual(st.some('names',function(x) {return x}),false)
    })

    it('should every', function() {
      var st = disp.store({
        names: {type:'list',value:[true,true]}
      })
      assert.strictEqual(st.every('names',function(x) {return x}),true)
    })

    it('should every false', function() {
      var st = disp.store({
        names: {type:'list',value:[true,false]}
      })
      assert.strictEqual(st.every('names',function(x) {return x}),false)
    })

    it('should join', function() {
      var st = disp.store({
        names: {type:'list',value:[1,2,3]}
      })
      assert.strictEqual(st.join('names','-'),'1-2-3')
    })

    it('should slice', function() {
      var st = disp.store({
        names: {type:'list',value:[6,7,8]}
      })
      assert.deepEqual(st.slice('names'),st.getAll('names'))
    })

    it('should concat', function() {
      var st = disp.store({
        names: {type:'list',value:[2,3,4]}
      })
      assert.deepEqual(st.concat('names', [5,6]),[2,3,4,5,6])
    })

    it('should indexOf', function() {
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.indexOf('names',3), 1)
    })

    it('should test if a list is identical', function() {
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.isIdentical('names', st.getAll('names')), true)
    })

    it('should test if a list is not identical', function() {
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.isIdentical('names', [4,3,2,1]), false, 'superset failed')
      assert.strictEqual(st.isIdentical('names', [4,3]), false, 'subset failed')
      assert.strictEqual(st.isIdentical('names', [4,3,1]), false, 'differing set failed')
    })
  })

  describe('mutators', function() {

    it('should set', function() {
      testStore({
        names: {type:'list',value:[]}
      }, function(store) {
        store.set('names',0,4)
        assert.strictEqual(store.get('names',0),4)
      })
    })

    it('should change on set', function(done) {
      testStore({
        names: {type:'list',value:[]}
      }, function(store) {
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          assert.strictEqual(ch.oldVal,undefined)
          assert.strictEqual(ch.newVal,4)
          assert.strictEqual(ch.index,0)
          done()
        })
        store.set('names',0,4)
      })
    })

    it('should set validate', function() {
      testStore({
        names: {type:'list',value:[],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      }, function(store) {
        store.set('names',0,true)
        assert.throws(function() {
          store.set('names',0,false)
        },/bad/)
      })
    })

    it('should splice', function() {
      testStore({
        names: {type:'list',value:[0,1,2,3,4,5]}
      }, function(store) {
        store.splice('names', 1, 2)
        assert.deepEqual(store.getAll('names'),[0,3,4,5])
      })
    })

    it('should change on splice', function() {
      testStore({
        names: {type:'list',value:[0,1,2,3]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.splice('names',2,1)
        assert.deepEqual(r,[
          2,3,2,
          3,undefined,3
        ])
      })
    })

    it('should resetAll', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        store.resetAll('names',[3,4])
        assert.deepEqual(store.getAll('names'),[3,4])
      })
    })

    it('should change on resetAll', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.resetAll('names',[3])
        assert.deepEqual(r,[1,3,0,2,undefined,1])
      })
    })

    it('should not enforce no mutable sameness on resetAll', function() {
      testStore({
        names: {type:'list',value:[{},{}]}
      }, function(store) {
        store.resetAll('names', store.getAll('names'))
      })
    })

    it('should resetAll validate', function() {
      testStore({
        names: {type:'list',value:[],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      }, function(store) {
        store.resetAll('names',[3,4])
        assert.throws(function() {
          store.resetAll('names',[3,false])
        },/bad/)
      })
    })

    it('resetAll should reject non-arrays', function() {
      testStore({
        names: {type:'list',value:[],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      }, function(store) {
        assert.throws(function() {
          store.resetAll('names','foo')
        }, /reset list must be an array/)
      })
    })

    it('should populate', function() {
      testStore({
        flags: {
          type: 'list',
          value: [
            true,
            false
          ]
        }
      }, function(store) {
        store.populate('flags', 1)
        assert.deepEqual(store.getAll('flags'),[1,1])
      })
    })

    it('should populate bigger length', function() {
      testStore({
        flags: {
          type: 'list',
          value: [
            true,
            false
          ]
        }
      }, function(store) {
        store.populate('flags', 1, 3)
        assert.deepEqual(store.getAll('flags'),[1,1,1])
      })
    })

    it('should populate smaller length', function() {
      testStore({
        flags: {
          type: 'list',
          value: [
            true,
            false
          ]
        }
      }, function(store) {
        store.populate('flags', 1, 1)
        assert.deepEqual(store.getAll('flags'),[1])
      })
    })

    it('should clear', function() {
      testStore({
        names: {type:'list',value:[2,3,4]}
      }, function(store) {
        store.clear('names')
        assert.deepEqual(store.getAll('names'),[])
      })
    })

    it('should change on clear', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.clear('names')
        assert.deepEqual(r,[1,undefined,0,2,undefined,1])
      })
    })

    it('should push', function() {
      testStore({
        names: {type:'list',value:[1]}
      }, function(store) {
        store.push('names','d')
        assert.deepEqual(store.getAll('names'),[1,'d'])
      })
    })

    it('should change on push', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.push('names','d')
        assert.deepEqual(r,[undefined,'d',2])
      })
    })

    it('should push validate', function() {
      testStore({
        names: {type:'list',value:[],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      }, function(store) {
        store.push('names','d')
        assert.throws(function() {
          store.push('names',false)
        },/bad/)
      })
    })

    it('should unshift', function() {
      testStore({
        names: {type:'list',value:[1]}
      }, function(store) {
        store.unshift('names','d')
        assert.deepEqual(store.getAll('names'),['d',1])
      })
    })

    it('should change on unshift', function() {
      testStore({
        names: {type:'list',value:[1]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.unshift('names','d')
        assert.deepEqual(r,[1,'d',0,undefined,1,1])
      })
    })

    it('should unshift validate', function() {
      testStore({
        names: {type:'list',value:[],validate:function(x) {
          if (!x) {
            throw 'bad'
          }
        }}
      }, function(store) {
        store.unshift('names','d')
        assert.throws(function() {
          store.unshift('names',false)
        },/bad/)
      })
    })

    it('should pop', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        assert.strictEqual(store.pop('names'),2)
        assert.deepEqual(store.getAll('names'),[1])
      })
    })

    it('should change on pop', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.pop('names')
        assert.deepEqual(r,[2,undefined,1])
      })
    })

    it('should shift', function() {
      testStore({
        names: {type:'list',value:[3,4]}
      }, function(store) {
        assert.strictEqual(store.shift('names'),3)
        assert.deepEqual(store.getAll('names'),[4])
      })
    })

    it('should change on shift', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        var r = []
        store.on('change',function(prop,ch) {
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.shift('names')
        assert.deepEqual(r,[1,2,0,2,undefined,1])
      })
    })

    it('should truncate length', function() {
      testStore({
        names: {type:'list',value:[1,2,3]}
      }, function(store) {
        store.truncateLength('names', 2)
        assert.deepEqual(store.getAll('names'), [1,2])
      })
    })

    it('should ignore too-high truncation lengths', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        store.truncateLength('names', 5)
        assert.deepEqual(store.getAll('names'), [1,2])
      })
    })

    it('should not trigger change for too-high truncation lengths', function() {
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store) {
        store.on('change', function() {
          throw new Error('invalid change event')
        })
        store.truncateLength('names', 5)
      })
    })

    it('should truncate length using mutables', function() {
      var o1 = {}
        ,o2 = {}
        ,o3 = {}
      testStore({
        names: {type:'list',value:[o1,o2,o3]}
      }, function(store) {
        store.truncateLength('names', 2)
      })
    })

    it('should change on truncating length', function(done) {
      testStore({
        names: {type:'list',value:[1,2,3]}
      }, function(store) {
        store.on('change', function(prop, ch) {
          assert.strictEqual(ch.oldVal, 3)
          assert.strictEqual(ch.newVal, undefined)
          done()
        })
        store.truncateLength('names', 2)
      })
    })

    it('should toggle', function() {
      testStore({
        isFoo:{
          type: 'list',
          value: []
        }
      }, function(store) {
        assert.strictEqual(store.get('isFoo', 0), undefined)
        store.toggle('isFoo', 0)
        assert.strictEqual(store.get('isFoo', 0), true)
        store.toggle('isFoo', 0)
        assert.strictEqual(store.get('isFoo', 0), false)
      })
    })

    it('should toggle at any index', function() {
      testStore({
        isFoo:{
          type: 'list',
          value: []
        }
      }, function(store) {
        store.toggle('isFoo', 3)
        assert.strictEqual(store.length('isFoo'), 4)
        assert.strictEqual(store.get('isFoo', 3), true)
      })
    })

    it('should toggle non-boolean', function() {
      testStore({
        isFoo:{
          type: 'list',
          value: ['sdfsdf']
        }
      }, function(store) {
        store.toggle('isFoo',0)
        assert.strictEqual(store.get('isFoo',0), false)
      })
    })

    it('should validate toggle', function() {
      testStore({
        isFoo:{
          type: 'list',
          value: [],
          validate: function(val) {
            if (typeof val === 'boolean') {
              throw new Error('foo')
            }
          }
        }
      }, function(store) {
        assert.throws(function() {
          store.toggle('isFoo',0)
        }, /foo/)
      })
    })

    it('should change on toggle', function(done) {
      testStore({
        isFoo: {
          type: 'list',
          value: []
        }
      }, function(store) {
        store.on('change', function(prop, change) {
          assert.strictEqual(prop, 'isFoo')
          assert.strictEqual(change.index, 0)
          assert.strictEqual(change.oldVal, undefined)
          assert.strictEqual(change.newVal, true)
          done()
        })
        store.toggle('isFoo', 0)
      })
    })
  })
})
