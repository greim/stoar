
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
var await = require('await');
var Stoar = require('../index');
var disp, noti

beforeEach(function(){
  disp = Stoar.dispatcher()
  noti = disp.notifier()
})

function testStore(defs, cb){
  var commander = disp.commander()
  var store = disp.store(defs, function(action, payload){
    cb(store)
  })
  commander.send('foo','bar')
}

describe('stoar', function(){

  it('should construct', function(){
    disp.store({});
  });

  it('should get data', function(){
    var store = disp.store({foo:null});
    assert.strictEqual(store.get('foo'), null);
  });

  it('should hasProperty', function(){
    var store = disp.store({foo:null});
    assert.ok(store.hasProperty('foo'));
  });

  it('should not hasProperty', function(){
    var store = disp.store({foo:null});
    assert.ok(!store.hasProperty('bar'));
  });

  it('should clone', function(){
    var foo = {bar:'a'};
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
  });

  it('should shallow clone', function(){
    var foo = {bar:{bar:'baz'}};
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
    assert.ok(foo.bar === clonedFoo.bar);
  });

  it('should deep clone', function(){
    var foo = {bar:{baz:'a'}};
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo.bar !== clonedFoo.bar);
  });

  it('deep cloning should allow non-json types', function(){
    var func = function(){}
    var foo = {bar:{baz:func}};
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.strictEqual(func, clonedFoo.bar.baz);
  });

  it('clone doesnt break on immutables', function(){
    var store = disp.store({foo:'foo'});
    var clonedFoo = store.clone('foo');
    assert.strictEqual('foo', clonedFoo);
  });

  it('deep clone doesnt break on immutables', function(){
    var store = disp.store({foo:'foo'});
    var clonedFoo = store.clone('foo', true);
    assert.strictEqual('foo', clonedFoo);
  });

  it('should clone arrays', function(){
    var foo = ['a','b','c'];
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
  });

  it('should shallow clone arrays', function(){
    var foo = ['a','b',{x:'y'}];
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo[2] === clonedFoo[2]);
  });

  it('should deep clone arrays', function(){
    var foo = ['a','b',{x:'y'}];
    var store = disp.store({foo:{value:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.deepEqual(foo[2], clonedFoo[2]);
    assert.ok(foo[2] !== clonedFoo[2]);
  });

  it('should not emit when immutables are set to the same value', function(){
    testStore({foo:1}, function(store){
      store.on('change', function(){
        throw new Error('change event on immutable sameness');
      });
      store.set('foo', 1);
    })
  });

  it('should throw when mutables are set to same value', function(){
    var mut = {}
    testStore({foo:{value:mut}}, function(store){
      assert.throws(function(){
        store.set('foo', mut);
      })
    })
  });

  it('should emit when undefined is set to null', function(done){
    testStore({foo:{value:undefined}}, function(store){
      store.on('change', function(){
        done()
      })
      store.set('foo', null);
    })
  });

  it('should emit when null is set to undefined', function(done){
    testStore({foo:{value:null}}, function(store){
      store.on('change', function(){
        done()
      })
      store.set('foo', undefined);
    })
  });
});

describe('items', function(){

  it('should validate at start', function(){
    assert.throws(function(){
      var store = disp.store({
        count:{
          value: -1,
          validate: function(count){
            if (count < 0) throw 'bad'
          }
        }
      })
    }, /bad/)
  })

  describe('accessors', function(){

    it('should get', function(){
      var store = disp.store({ foo:'bar' })
      assert.strictEqual(store.get('foo'), 'bar')
    })

    it('should clone', function(){
      var obj = {blah:3}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.deepEqual(obj, obj2)
    })

    it('should shallow clone', function(){
      var obj = {blah:{blah:2}}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function(){
      var obj = {blah:{blah:2}}
      var store = disp.store({ foo:{value:obj} })
      var obj2 = store.clone('foo', true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      testStore({ foo:'bar' }, function(store){
        store.set('foo', 'baz')
        assert.strictEqual(store.get('foo'), 'baz')
      })
    })

    it('should not set unknown prop', function(){
      testStore({ foo:'bar' }, function(store){
        assert.throws(function(){
          store.set('x', 'baz')
        })
      })
    })

    it('should change on set', function(done){
      testStore({ foo:'bar' }, function(store){
        store.on('change', function(prop, change){
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(change.oldVal, 'bar')
          assert.strictEqual(change.newVal, 'baz')
          done()
        })
        store.set('foo', 'baz')
      })
    })

    it('should unset', function(){
      testStore({ foo:'bar' }, function(store){
        assert.strictEqual(store.get('foo'), 'bar')
        store.unset('foo')
        assert.strictEqual(store.get('foo'), undefined)
      })
    })

    it('should change on unset', function(done){
      testStore({ foo:'bar' }, function(store){
        store.on('change', function(prop, change){
          assert.strictEqual(prop, 'foo')
          assert.strictEqual(change.oldVal, 'bar')
          assert.strictEqual(change.newVal, undefined)
          done()
        })
        store.unset('foo')
      })
    })

    it('should validate on set', function(){
      testStore({
        count:{
          value: 0,
          validate: function(count){
            if (count < 0) throw 'bad'
          }
        }
      }, function(store){
        store.set('count', 1)
        assert.throws(function(){
          store.set('count', -1)
        }, /bad/)
      })
    })
  })
})

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
  })
})

describe('lists', function(){

  it('should validate on start', function(){
    assert.throws(function(){
      var st = disp.store({
        names: {type:'list',value:[false],validate:function(x){if(!x)throw 'bad'}}
      })
    },/bad/)
  })

  describe('accessors', function(){

    it('should get', function(){
      var st = disp.store({
        names: {type:'list',value:['zz']}
      })
      assert.strictEqual(st.get('names', 0), 'zz')
    })

    it('should get undefined', function(){
      var st = disp.store({
        names: {type:'list',value:[]}
      })
      assert.strictEqual(st.get('names', 0), undefined)
    })

    it('should clone', function(){
      var ob1 = {x:1}
      var st = disp.store({
        names: {type:'list',value:[ob1]}
      })
      var ob2 = st.clone('names',0)
      assert.deepEqual(ob1,ob2)
      assert.ok(ob1!==ob2)
    })

    it('should length', function(){
      var st = disp.store({
        names: {type:'list',value:[1,2,3]}
      })
      assert.strictEqual(st.length('names'),3)
    })

    it('should getAll', function(){
      var st = disp.store({
        names: {type:'list',value:[2,3,4]}
      })
      assert.deepEqual(st.getAll('names'),[2,3,4])
    })

    it('should getAll copy', function(){
      var names1 = [3,4,5]
      var st = disp.store({
        names: {type:'list',value:names1}
      })
      var names2 = st.getAll('names')
      assert.deepEqual(names1,names2)
      assert.ok(names1!==names2)
    })

    it('should filter', function(){
      var st = disp.store({
        names: {type:'list',value:[1,2,3,4]}
      })
      var odds = st.filter('names',function(x){
        return x%2
      })
      assert.deepEqual(odds,[1,3])
    })

    it('should filter with context', function(){
      var st = disp.store({
        names: {type:'list',value:[1,2,3,4]}
      })
      var that = {}
      var odds = st.filter('names',function(x){
        assert.strictEqual(that,this)
      }, that)
    })

    it('should map', function(){
      var st = disp.store({
        names: {type:'list',value:[0,1,2]}
      })
      var dubs = st.map('names',function(x){
        return x*2
      })
      assert.deepEqual(dubs,[0,2,4])
    })

    it('should some', function(){
      var st = disp.store({
        names: {type:'list',value:[true,false]}
      })
      assert.strictEqual(st.some('names',function(x){return x}),true)
    })

    it('should some false', function(){
      var st = disp.store({
        names: {type:'list',value:[false,false]}
      })
      assert.strictEqual(st.some('names',function(x){return x}),false)
    })

    it('should every', function(){
      var st = disp.store({
        names: {type:'list',value:[true,true]}
      })
      assert.strictEqual(st.every('names',function(x){return x}),true)
    })

    it('should every false', function(){
      var st = disp.store({
        names: {type:'list',value:[true,false]}
      })
      assert.strictEqual(st.every('names',function(x){return x}),false)
    })

    it('should join', function(){
      var st = disp.store({
        names: {type:'list',value:[1,2,3]}
      })
      assert.strictEqual(st.join('names','-'),'1-2-3')
    })

    it('should slice', function(){
      var st = disp.store({
        names: {type:'list',value:[6,7,8]}
      })
      assert.deepEqual(st.slice('names'),st.getAll('names'))
    })

    it('should concat', function(){
      var st = disp.store({
        names: {type:'list',value:[2,3,4]}
      })
      assert.deepEqual(st.concat('names', [5,6]),[2,3,4,5,6])
    })

    it('should indexOf', function(){
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.indexOf('names',3), 1)
    })

    it('should test if a list is identical', function(){
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.isIdentical('names', st.getAll('names')), true)
    })

    it('should test if a list is not identical', function(){
      var st = disp.store({
        names: {type:'list',value:[4,3,2]}
      })
      assert.strictEqual(st.isIdentical('names', [4,3,2,1]), false, 'superset failed')
      assert.strictEqual(st.isIdentical('names', [4,3]), false, 'subset failed')
      assert.strictEqual(st.isIdentical('names', [4,3,1]), false, 'differing set failed')
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      testStore({
        names: {type:'list',value:[]}
      }, function(store){
        store.set('names',0,4)
        assert.strictEqual(store.get('names',0),4)
      })
    })

    it('should change on set', function(done){
      testStore({
        names: {type:'list',value:[]}
      }, function(store){
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          assert.strictEqual(ch.oldVal,undefined)
          assert.strictEqual(ch.newVal,4)
          assert.strictEqual(ch.index,0)
          done()
        })
        store.set('names',0,4)
      })
    })

    it('should set validate', function(){
      testStore({
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }, function(store){
        store.set('names',0,true)
        assert.throws(function(){
          store.set('names',0,false)
        },/bad/)
      })
    })

    it('should resetAll', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        store.resetAll('names',[3,4])
        assert.deepEqual(store.getAll('names'),[3,4])
      })
    })

    it('should change on resetAll', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.resetAll('names',[3])
        assert.deepEqual(r,[1,3,0,2,undefined,1])
      })
    })

    it('should resetAll validate', function(){
      testStore({
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }, function(store){
        store.resetAll('names',[3,4])
        assert.throws(function(){
          store.resetAll('names',[3,false])
        },/bad/)
      })
    })

    it('should clear', function(){
      testStore({
        names: {type:'list',value:[2,3,4]}
      }, function(store){
        store.clear('names')
        assert.deepEqual(store.getAll('names'),[])
      })
    })

    it('should change on clear', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.clear('names')
        assert.deepEqual(r,[1,undefined,0,2,undefined,1])
      })
    })

    it('should push', function(){
      testStore({
        names: {type:'list',value:[1]}
      }, function(store){
        store.push('names','d')
        assert.deepEqual(store.getAll('names'),[1,'d'])
      })
    })

    it('should change on push', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.push('names','d')
        assert.deepEqual(r,[undefined,'d',2])
      })
    })

    it('should push validate', function(){
      testStore({
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }, function(store){
        store.push('names','d')
        assert.throws(function(){
          store.push('names',false)
        },/bad/)
      })
    })

    it('should unshift', function(){
      testStore({
        names: {type:'list',value:[1]}
      }, function(store){
        store.unshift('names','d')
        assert.deepEqual(store.getAll('names'),['d',1])
      })
    })

    it('should change on unshift', function(){
      testStore({
        names: {type:'list',value:[1]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.unshift('names','d')
        assert.deepEqual(r,[1,'d',0,undefined,1,1])
      })
    })

    it('should unshift validate', function(){
      testStore({
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }, function(store){
        store.unshift('names','d')
        assert.throws(function(){
          store.unshift('names',false)
        },/bad/)
      })
    })

    it('should pop', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        assert.strictEqual(store.pop('names'),2)
        assert.deepEqual(store.getAll('names'),[1])
      })
    })

    it('should change on pop', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.pop('names')
        assert.deepEqual(r,[2,undefined,1])
      })
    })

    it('should shift', function(){
      testStore({
        names: {type:'list',value:[3,4]}
      }, function(store){
        assert.strictEqual(store.shift('names'),3)
        assert.deepEqual(store.getAll('names'),[4])
      })
    })

    it('should change on shift', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        var r = []
        store.on('change',function(prop,ch){
          assert.strictEqual(prop,'names')
          r.push(ch.oldVal,ch.newVal,ch.index)
        })
        store.shift('names')
        assert.deepEqual(r,[1,2,0,2,undefined,1])
      })
    })

    it('should truncate length', function(){
      testStore({
        names: {type:'list',value:[1,2,3]}
      }, function(store){
        store.truncateLength('names', 2)
        assert.deepEqual(store.getAll('names'), [1,2])
      })
    })

    it('should ignore too-high truncation lengths', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        store.truncateLength('names', 5)
        assert.deepEqual(store.getAll('names'), [1,2])
      })
    })

    it('should not trigger change for too-high truncation lengths', function(){
      testStore({
        names: {type:'list',value:[1,2]}
      }, function(store){
        store.on('change', function(){
          throw new Error('invalid change event')
        })
        store.truncateLength('names', 5)
      })
    })

    it('should truncate length using mutables', function(){
      var o1 = {}
        ,o2 = {}
        ,o3 = {}
      testStore({
        names: {type:'list',value:[o1,o2,o3]}
      }, function(store){
        store.truncateLength('names', 2)
      })
    })

    it('should change on truncating length', function(done){
      testStore({
        names: {type:'list',value:[1,2,3]}
      }, function(store){
        store.on('change', function(prop, ch){
          assert.strictEqual(ch.oldVal, 3)
          assert.strictEqual(ch.newVal, undefined)
          done()
        })
        store.truncateLength('names', 2)
      })
    })
  })
})

describe('immutable', function(){

  it('should not set mutable to self', function(){
    var obj = {}
    testStore({foo:{value:obj}}, function(store){
      assert.throws(function(){
        store.set('foo',obj)
      })
    })
  })

  it('should not change on immutable sameness', function(){
    testStore({foo:'w'}, function(store){
      store.on('change', function(){
        throw new Error('oops')
      })
      store.set('foo','w')
    })
  })

  it('should not change on immutable sameness null', function(){
    testStore({foo:null}, function(store){
      store.on('change', function(){
        throw new Error('oops')
      })
      store.set('foo',null)
    })
  })

  it('should not change on immutable sameness undefined', function(){
    testStore({foo:undefined}, function(store){
      store.on('change', function(){
        throw new Error('oops')
      })
      store.set('foo',undefined)
    })
  })

  it('should not change on immutable sameness function', function(){
    var fn = function(){}
    testStore({foo:fn}, function(store){
      store.on('change', function(){
        throw new Error('oops')
      })
      store.set('foo',fn)
    })
  })
})

describe('loadables', function(){

  it('should allow loadable', function(){
    var store = disp.store({
      foo: {
        type: 'item',
        value: 4,
        loadable: true
      }
    })
  })

  it('should allow loadable :loading', function(){
    testStore({
      foo: {
        type: 'item',
        value: 4,
        loadable: true
      }
    }, function(store){
      store.set('foo:loading', true)
      assert.strictEqual(store.get('foo:loading'), true)
    })
  })

  it('should allow loadable :status', function(){
    testStore({
      foo: {
        type: 'item',
        value: 4,
        loadable: true
      }
    }, function(store){
      store.set('foo:status', 'currently loading')
      assert.strictEqual(store.get('foo:status'), 'currently loading')
    })
  })

  it('should allow loadable :timestamp', function(){
    testStore({
      foo: {
        type: 'item',
        value: 4,
        loadable: true
      }
    }, function(store){
      var time = Date.now()
      store.set('foo:timestamp', time)
      assert.strictEqual(store.get('foo:timestamp'), time)
    })
  })
})











