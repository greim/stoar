
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
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
    testStore({
      foo:{
        type: 'item',
        value: fn
      }
    }, function(store){
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











