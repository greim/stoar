
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
var await = require('await');
var Stoar = require('../index');
var disp

beforeEach(function(){
  disp = Stoar.dispatcher()
})

function testStore(defs, cb){
  var commander = disp.commander()
  var store = disp.store(defs, function(action, payload){
    cb(store)
  })
  commander.send('foo','bar')
}

describe('maps', function(){

  it('should validate at start', function(){
    assert.throws(function(){
      var store = disp.store({
        counts:{
          type: 'map',
          value: {a:-1},
          validate: function(count){
            if (count < 0) throw new Error('bad')
          }
        }
      })
    })
  })

  describe('accessors', function(){

    it('should get', function(){
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:1}
        }
      })
      assert.strictEqual(store.get('foo', 'a'), 1)
    })

    it('should get loadable', function(){
      var st = disp.store({
        numbers: {type:'map',value:{foo:1,bar:2},loadable:true}
      })
      var loadable = st.getLoadable('numbers', 'foo')
      assert.deepEqual(loadable, {value:1,status:undefined,timestamp:undefined,loading:undefined})
    })

    it('should get loadable only on loadables', function(){
      var st = disp.store({
        numbers: {type:'map',value:{foo:1,bar:2}}
      })
      assert.throws(function(){
        st.getLoadable('numbers', 'foo')
      }, /loadable/)
    })

    it('should get undefined', function(){
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:1}
        }
      })
      assert.strictEqual(store.get('foo', 'b'), undefined)
    })

    it('should clone', function(){
      var obj = {blah:3}
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:obj}
        }
      })
      var obj2 = store.clone('foo', 'a')
      assert.ok(obj !== obj2)
      assert.deepEqual(obj, obj2)
    })

    it('should clone undefined', function(){
      var store = disp.store({
        foo:{
          type: 'map',
          value: {}
        }
      })
      var obj = store.clone('foo', 'a')
      assert.deepEqual(obj, undefined)
    })

    it('should clone null', function(){
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:null}
        }
      })
      var obj = store.clone('foo', 'a')
      assert.deepEqual(obj, null)
    })

    it('should shallow clone', function(){
      var obj = {blah:{blah:2}}
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:obj}
        }
      })
      var obj2 = store.clone('foo', 'a')
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function(){
      var obj = {blah:{blah:2}}
      var store = disp.store({
        foo:{
          type: 'map',
          value: {a:obj}
        }
      })
      var obj2 = store.clone('foo', 'a', true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should getAll', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      })
      assert.deepEqual(store.getAll('flags'),{foo:true})
    })

    it('should getAllLoadables', function(){
      var st = disp.store({
        names: {type:'map',value:{foo:1,bar:2},loadable:true}
      })
      var loadables = st.getAllLoadables('names')
      assert.deepEqual(loadables, {
        foo:{value:1,loading:undefined,timestamp:undefined,status:undefined},
        bar:{value:2,loading:undefined,timestamp:undefined,status:undefined}
      })
    })

    it('should getAllLoadables only on loadables', function(){
      var st = disp.store({
        names: {type:'map',value:{}}
      })
      assert.throws(function(){
        st.getAllLoadables('names')
      }, /loadable/)
    })

    it('getAll should copy', function(){
      var flags = {foo:true}
      var store = disp.store({
        flags: {
          type: 'map',
          value: flags
        }
      })
      var flags2 = store.getAll('flags')
      assert.deepEqual(flags,flags2)
      assert.ok(flags !== flags2)
    })

    it('should has', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            baz:undefined
          }
        }
      })
      assert.ok(store.has('flags','foo'))
      assert.ok(!store.has('flags','bar'))
      assert.ok(store.has('flags','baz'))
    })

    it('should keys', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      assert.deepEqual(store.keys('flags'),['foo','bar'])
    })

    it('should values', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      assert.deepEqual(store.values('flags'),[true,false])
    })

    it('should forEach', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      var count = 0
      store.forEach('flags',function(val, key){
        if (count === 0){
          assert.strictEqual(val, true)
          assert.strictEqual(key, 'foo')
        } else if (count === 1){
          assert.strictEqual(val, false)
          assert.strictEqual(key, 'bar')
        }
        count++
      })
      assert.strictEqual(count, 2)
    })

    it('should forEach with ctx', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            bar:false
          }
        }
      })
      var that = {}
      store.forEach('flags',function(val, key){
        assert.strictEqual(that, this)
      }, that)
    })

    it('should test if a map is identical', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      assert.strictEqual(store.isIdentical('flags', store.getAll('flags')), true)
    })

    it('should test if a map is not identical', function(){
      var store = disp.store({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      })
      assert.strictEqual(store.isIdentical('flags', {foo:true,bar:false,baz:true}), false, 'superset failed')
      assert.strictEqual(store.isIdentical('flags', {foo:true}), false, 'subset failed')
      assert.strictEqual(store.isIdentical('flags', {foo:true,bar:true}), false, 'differing set')
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1}
        }
      }, function(store){
        store.set('foo', 'a', 2)
        assert.strictEqual(store.get('foo', 'a'), 2)
      })
    })

    it('should change on set', function(done){
      testStore({
        foo:{
          type: 'map',
          value: {a:1}
        }
      }, function(store){
        store.on('change',function(prop, ch){
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(ch.oldVal, 1)
          assert.strictEqual(ch.newVal, 2)
          assert.strictEqual(ch.key, 'a')
          done()
        })
        store.set('foo', 'a', 2)
      })
    })

    it('should validate set', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }
      }, function(store){
        assert.throws(function(){
          store.set('foo', 'a', -1)
        }, /bad/)
      })
    })

    it('should unset', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1}
        }
      }, function(store){
        assert.ok(store.has('foo','a'))
        store.unset('foo', 'a')
        assert.strictEqual(store.get('foo','a'), undefined)
        assert.ok(!store.has('foo','a'))
      })
    })

    it('should change on unset', function(done){
      testStore({
        foo:{
          type: 'map',
          value: {a:1}
        }
      }, function(store){
        store.on('change',function(prop, ch){
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(ch.oldVal, 1)
          assert.strictEqual(ch.newVal, undefined)
          assert.strictEqual(ch.key, 'a')
          done()
        })
        store.unset('foo', 'a')
      })
    })

    it('should setAll', function(){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }, function(store){
        store.setAll('flags', {bar:false,baz:true})
        assert.deepEqual(store.getAll('flags'),{foo:true,bar:false,baz:true})
      })
    })

    it('should change on setAll', function(done){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }, function(store){
        var pr = await('baz','bar').onkeep(function(){done()})
        store.on('change',function(prop, ch){
          assert.strictEqual(prop, 'flags')
          if (ch.key === 'baz'){
            assert.strictEqual(ch.oldVal, undefined)
            assert.strictEqual(ch.newVal, true)
            pr.keep('baz')
          } else if (ch.key === 'bar'){
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

    it('should validate setAll', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }
      }, function(store){
        assert.throws(function(){
          store.setAll('foo', {x:-1})
        }, /bad/)
      })
    })

    it('should resetAll', function(){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }, function(store){
        store.resetAll('flags', {bar:false,baz:true})
        assert.deepEqual(store.getAll('flags'),{bar:false,baz:true})
      })
    })

    it('should change on resetAll', function(done){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }, function(store){
        var pr = await('baz','foo').onkeep(function(){done()})
        store.on('change',function(prop, ch){
          assert.strictEqual(prop, 'flags')
          if (ch.key === 'baz'){
            assert.strictEqual(ch.oldVal, undefined)
            assert.strictEqual(ch.newVal, true)
            pr.keep('baz')
          } else if (ch.key === 'foo'){
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

    it('should validate resetAll', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }
      }, function(store){
        assert.throws(function(){
          store.resetAll('foo', {x:-1})
        })
      })
    })

    it('should not corrupt value on resetAll', function(){
      testStore({
        foo:{
          type: 'map',
          value: {a:1}
        }
      }, function(store){
        store.resetAll('foo', null)
        store.set('foo','x',3)
        assert.strictEqual(store.get('foo','x'), 3)
      })
    })

    it('should setExistingValuesTo', function(){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }, function(store){
        store.setExistingValuesTo('flags', 1)
        assert.deepEqual(store.getAll('flags'),{foo:1,bar:1})
      })
    })

    it('should clear', function(){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }, function(store){
        store.clear('flags')
        assert.deepEqual(store.getAll('flags'),{})
      })
    })

    it('should change on clear', function(done){
      testStore({
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }, function(store){
        store.on('change',function(prop, ch){
          assert.strictEqual(prop, 'flags')
          assert.strictEqual(ch.key, 'foo')
          assert.strictEqual(ch.oldVal, true)
          assert.strictEqual(ch.newVal, undefined)
          done()
        })
        store.clear('flags')
      })
    })

    it('should toggle', function(){
      testStore({
        isFoo:{
          type: 'map',
          value: {}
        }
      }, function(store){
        assert.strictEqual(store.get('isFoo', 'a'), undefined)
        store.toggle('isFoo', 'a')
        assert.strictEqual(store.get('isFoo', 'a'), true)
        store.toggle('isFoo', 'a')
        assert.strictEqual(store.get('isFoo', 'a'), false)
      })
    })

    it('should toggle non-boolean', function(){
      testStore({
        isFoo:{
          type: 'map',
          value: {a:'dfgdf'}
        }
      }, function(store){
        store.toggle('isFoo','a')
        assert.strictEqual(store.get('isFoo','a'), false)
      })
    })

    it('should validate toggle', function(){
      testStore({
        isFoo:{
          type: 'map',
          value: {a:'dfgdf'},
          validate: function(val){
            if (typeof val === 'boolean'){
              throw new Error('foo')
            }
          }
        }
      }, function(store){
        assert.throws(function(){
          store.toggle('isFoo','a')
        }, /foo/)
      })
    })

    it('should change on toggle', function(done){
      testStore({
        isFoo: {
          type: 'map',
          value: {a:'dfgdf'}
        }
      }, function(store){
        store.on('change', function(prop, change){
          assert.strictEqual(prop, 'isFoo')
          assert.strictEqual(change.key, 'a')
          assert.strictEqual(change.oldVal, 'dfgdf')
          assert.strictEqual(change.newVal, false)
          done()
        })
        store.toggle('isFoo', 'a')
      })
    })
  })
})
